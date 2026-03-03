import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * Benchmark de API - Testa endpoints individuais para identificar gargalos
 * 
 * Uso: k6 run --env BASE_URL=http://localhost:3000 api-benchmark.js
 */

const errorRate = new Rate('error_rate');

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    error_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
};

// Endpoints a serem testados
const endpoints = [
  { name: 'Health', method: 'GET', path: '/api/health', weight: 0.05 },
  { name: 'Ready', method: 'GET', path: '/api/ready', weight: 0.05 },
  { name: 'Desarquivamentos List', method: 'GET', path: '/api/nugecid?page=1&limit=20', weight: 0.25 },
  { name: 'Desarquivamentos Search', method: 'GET', path: '/api/nugecid?search=test&page=1&limit=20', weight: 0.15 },
  { name: 'Dashboard Stats', method: 'GET', path: '/api/nugecid/dashboard/stats', weight: 0.15 },
  { name: 'Tarefas List', method: 'GET', path: '/api/tarefas?limit=50', weight: 0.15 },
  { name: 'Usuarios List', method: 'GET', path: '/api/users?page=1&limit=20', weight: 0.1 },
  { name: 'Audit Logs', method: 'GET', path: '/api/auditoria?page=1&limit=20', weight: 0.05 },
  { name: 'Notificacoes', method: 'GET', path: '/api/notificacoes?page=1&limit=20', weight: 0.05 },
];

// Selecionar endpoint baseado em peso
function selectEndpoint() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const endpoint of endpoints) {
    cumulative += endpoint.weight;
    if (rand <= cumulative) {
      return endpoint;
    }
  }
  
  return endpoints[endpoints.length - 1];
}

export default function () {
  const endpoint = selectEndpoint();
  const url = `${BASE_URL}${endpoint.path}`;
  
  let response;
  const start = Date.now();
  
  switch (endpoint.method) {
    case 'GET':
      response = http.get(url, { headers });
      break;
    case 'POST':
      response = http.post(url, '{}', { headers });
      break;
  }
  
  const duration = Date.now() - start;
  
  const success = check(response, {
    [`${endpoint.name} status 200`]: (r) => r.status === 200,
    [`${endpoint.name} response time < 200ms`]: (r) => r.timings.duration < 200,
  });
  
  if (!success) {
    errorRate.add(1);
    console.log(`[FAIL] ${endpoint.name}: ${response.status} - ${duration}ms`);
  } else {
    errorRate.add(0);
  }
}

// Sumário customizado
export function handleSummary(data) {
  const results = [];
  
  // Analisar cada endpoint
  const metrics = data.metrics;
  
  console.log('\n=== API BENCHMARK RESULTS ===\n');
  
  endpoints.forEach((endpoint) => {
    const metricName = `http_req_duration{method:${endpoint.method},url:${endpoint.path}}`;
    const metric = metrics[metricName];
    
    if (metric) {
      results.push({
        endpoint: endpoint.name,
        avg: metric.avg,
        p95: metric['p(95)'],
        p99: metric['p(99)'],
        count: metric.count,
      });
    }
  });
  
  // Ordenar por P95 (mais lentos primeiro)
  results.sort((a, b) => b.p95 - a.p95);
  
  console.log('Rank by P95 latency:');
  console.log('-'.repeat(80));
  console.log(`${'Endpoint'.padEnd(30)} ${'Avg (ms)'.padStart(10)} ${'P95 (ms)'.padStart(10)} ${'P99 (ms)'.padStart(10)} ${'Count'.padStart(10)}`);
  console.log('-'.repeat(80));
  
  results.forEach((r) => {
    console.log(
      `${r.endpoint.padEnd(30)} ${r.avg.toFixed(2).padStart(10)} ${r.p95.toFixed(2).padStart(10)} ${r.p99.toFixed(2).padStart(10)} ${r.count.toString().padStart(10)}`
    );
  });
  
  console.log('\n=== RECOMMENDATIONS ===\n');
  
  const slowEndpoints = results.filter((r) => r.p95 > 200);
  if (slowEndpoints.length > 0) {
    console.log('⚠️ Endpoints que precisam de otimização (P95 > 200ms):');
    slowEndpoints.forEach((r) => {
      console.log(`  - ${r.endpoint}: ${r.p95.toFixed(2)}ms`);
    });
  } else {
    console.log('✅ Todos os endpoints estão dentro do SLA (P95 < 200ms)');
  }
  
  return {
    'benchmark-results.json': JSON.stringify(data, null, 2),
  };
}
