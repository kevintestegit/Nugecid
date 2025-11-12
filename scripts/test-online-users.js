#!/usr/bin/env node

/**
 * Script de teste para verificar a funcionalidade de usuários online
 * Uso: node scripts/test-online-users.js
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'YOUR_JWT_TOKEN_HERE';

async function makeRequest(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SGC-ITEP-Test-Script/1.0'
      },
      timeout: 5000
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testOnlineUsers() {
  console.log('🧪 Iniciando testes da funcionalidade de usuários online...\n');

  try {
    // Teste 1: Verificar se o endpoint responde
    console.log('📡 Teste 1: Verificando conectividade com o endpoint...');
    const response = await makeRequest(`${API_BASE_URL}/api/auth/online-users`, TEST_USER_TOKEN);

    console.log('✅ Endpoint responde corretamente');
    console.log(`📊 Status: ${response.status}`);
    console.log(`👥 Usuários online encontrados: ${Array.isArray(response.data) ? response.data.length : 0}`);

    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('\n📋 Lista de usuários online:');
      response.data.forEach((user, index) => {
        if (user.lastActivity) {
          const lastActivity = new Date(user.lastActivity);
          const minutesAgo = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60));
          console.log(`  ${index + 1}. ${user.nome} (${user.usuario}) - ${user.role} - Ativo há ${minutesAgo}min`);
        } else {
          console.log(`  ${index + 1}. ${user.nome} (${user.usuario}) - ${user.role}`);
        }
      });
    }

    // Teste 2: Verificar endpoint de debug
    console.log('\n🔍 Teste 2: Verificando endpoint de debug...');
    const debugResponse = await makeRequest(`${API_BASE_URL}/api/auth/online-users/debug`, TEST_USER_TOKEN);

    console.log('✅ Endpoint de debug responde corretamente');
    console.log(`📊 Total de usuários no Map: ${debugResponse.data?.mapSize || 0}`);
    console.log(`👥 Usuários retornados: ${debugResponse.data?.totalUsers || 0}`);

    if (debugResponse.data?.users && debugResponse.data.users.length > 0) {
      console.log('\n📋 Detalhes dos usuários:');
      debugResponse.data.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.nome} (${user.usuario})`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Última atividade: ${new Date(user.lastActivity).toLocaleString()}`);
        console.log(`     Minutos desde atividade: ${user.minutesSinceActivity}`);
      });
    }

    console.log('\n✅ Todos os testes passaram! A funcionalidade está funcionando corretamente.');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:');

    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      console.error('🔌 Servidor não está respondendo. Verifique se o backend está rodando.');
    } else if (error.message?.includes('timeout')) {
      console.error('⏰ Timeout na requisição. O servidor pode estar lento ou indisponível.');
    } else {
      console.error(`Erro: ${error.message}`);
    }

    console.log('\n💡 Dicas para resolução:');
    console.log('1. Verifique se o backend está rodando: npm run start:backend');
    console.log('2. Configure um token JWT válido na variável TEST_USER_TOKEN');
    console.log('3. Verifique os logs do backend para mais detalhes');
    console.log('4. Teste o endpoint manualmente via curl ou Postman');
    console.log('5. Verifique se a porta 3000 está liberada no firewall');

    process.exit(1);
  }
}

// Executar testes
testOnlineUsers().catch(error => {
  console.error('Erro inesperado:', error);
  process.exit(1);
});
