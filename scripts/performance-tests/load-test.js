import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Métricas customizadas
const httpErrors = new Counter('http_errors');
const errorRate = new Rate('error_rate');
const responseTimeP95 = new Trend('response_time_p95');

// Configurações base
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// Opções de teste
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up
    { duration: '5m', target: 50 },   // Steady state
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stress test
    { duration: '2m', target: 200 },   // Spike test
    { duration: '5m', target: 200 },   // Spike sustained
    { duration: '3m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% < 200ms, 99% < 500ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
    http_reqs: ['rate>100'],                       // Throughput > 100 req/s
    error_rate: ['rate<0.01'],
  },
};

// Função auxiliar para fazer requests
function makeRequest(method, endpoint, body = null, params = {}) {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  let response;
  const start = Date.now();

  switch (method) {
    case 'GET':
      response = http.get(url, { headers });
      break;
    case 'POST':
      response = http.post(url, JSON.stringify(body), { headers });
      break;
    case 'PATCH':
      response = http.patch(url, JSON.stringify(body), { headers });
      break;
    case 'DELETE':
      response = http.del(url, null, { headers });
      break;
  }

  const duration = Date.now() - start;
  responseTimeP95.add(duration);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (!success) {
    httpErrors.add(1);
    errorRate.add(1);
    console.log(`Error: ${method} ${endpoint} - Status: ${response.status}, Duration: ${response.timings.duration}ms`);
  } else {
    errorRate.add(0);
  }

  return response;
}

// Simular usuário autenticado
function getAuthToken() {
  // Em produção, isso seria um login real
  // Para testes, você pode usar um token fixo ou implementar login
  return __ENV.AUTH_TOKEN || 'test-token';
}

// Cenário principal
export default function () {
  const authToken = getAuthToken();
  const headers = {
    Authorization: `Bearer ${authToken}`,
  };

  group('Health Checks', () => {
    makeRequest('GET', '/health');
    sleep(1);
  });

  group('Auth Operations', () => {
    // Login (simulado - não faça em produção com dados reais)
    const loginRes = makeRequest('POST', '/auth/login', {
      username: `user_${__VU}`,
      password: 'test123',
    });
    sleep(1);
  });

  group('Desarquivamentos - List', () => {
    // Lista paginada
    makeRequest('GET', '/nugecid?page=1&limit=20', null, { headers });
    sleep(2);

    // Busca com filtros
    makeRequest('GET', '/nugecid?search=test&status=ativo&page=1&limit=20', null, { headers });
    sleep(2);
  });

  group('Desarquivamentos - CRUD', () => {
    // Create
    const createRes = makeRequest('POST', '/nugecid', {
      numeroProcesso: `PROC-${Date.now()}-${__VU}`,
      requerente: 'Teste Performance',
      institutoId: 1,
      dataInicio: new Date().toISOString(),
    }, { headers });
    sleep(1);

    // Get by ID
    if (createRes.status === 201) {
      const id = JSON.parse(createRes.body).data?.id || 1;
      makeRequest('GET', `/nugecid/${id}`, null, { headers });
      sleep(1);

      // Update
      makeRequest('PATCH', `/nugecid/${id}`, {
        status: 'em_andamento',
      }, { headers });
      sleep(1);
    }
  });

  group('Tarefas - Kanban', () => {
    // Lista de tarefas
    makeRequest('GET', '/tarefas?limit=50', null, { headers });
    sleep(2);

    // Tarefas por projeto
    makeRequest('GET', '/tarefas?projetoId=1&limit=30', null, { headers });
    sleep(2);
  });

  group('Dashboard Stats', () => {
    makeRequest('GET', '/nugecid/dashboard/stats', null, { headers });
    sleep(3);
  });

  group('Static Assets', () => {
    // Testar cache de assets
    http.get(`${BASE_URL}/public/favicon.ico`);
    sleep(0.5);
  });
}

// Configuração para teste de fumaça (smoke test)
export function smokeTest() {
  return {
    vus: 1,
    duration: '1m',
    thresholds: {
      http_req_duration: ['p(95)<500'],
    },
  };
}

// Configuração para teste de stress
export function stressTest() {
  return {
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 300 },
      { duration: '5m', target: 300 },
      { duration: '3m', target: 0 },
    ],
  };
}

// Configuração para teste de spike
export function spikeTest() {
  return {
    stages: [
      { duration: '10s', target: 100 },
      { duration: '1m', target: 100 },
      { duration: '10s', target: 1000 }, // Spike!
      { duration: '3m', target: 1000 },  // Sustained
      { duration: '10s', target: 100 },  // Recovery
      { duration: '3m', target: 100 },     // Verify recovery
      { duration: '10s', target: 0 },
    ],
  };
}
