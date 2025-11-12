/**
 * Script de Verificação do Docker (modo enxuto)
 * Exibe apenas informações essenciais.
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Função para log simples
function log(message) {
  console.log(message);
}

async function findDockerCommand() {
  const possiblePaths = [
    'docker',
    '/usr/bin/docker',
    '/usr/local/bin/docker',
    '/snap/bin/docker',
    '/home/linuxbrew/.linuxbrew/bin/docker',
  ];
  
  for (const path of possiblePaths) {
    try {
      await execAsync(`${path} --version`);
      return path;
    } catch {
      continue;
    }
  }
  return null;
}

async function checkDockerInstalled() {
  const dockerCmd = await findDockerCommand();
  if (dockerCmd) {
    global.DOCKER_CMD = dockerCmd;
    return true;
  }
  log('Erro: Docker não instalado ou fora do PATH.');
  return false;
}

async function checkDockerRunning() {
  try {
    const cmd = global.DOCKER_CMD || 'docker';
    await execAsync(`${cmd} info`);
    return true;
  } catch {
    log('Erro: Docker não está rodando.');
    return false;
  }
}

async function checkContainersRunning() {
  try {
    const cmd = global.DOCKER_CMD || 'docker';
    const composeCmd = `${cmd} compose`;
    const { stdout } = await execAsync(`${composeCmd} ps --services --filter "status=running"`);
    const runningServices = stdout.trim().split('\n').filter(Boolean);
    const requiredServices = ['postgres', 'redis', 'pgadmin'];
    const missingServices = requiredServices.filter(s => !runningServices.includes(s));
    if (missingServices.length === 0) {
      return true;
    } else {
      log(`Aviso: Serviços ausentes: ${missingServices.join(', ')}`);
      return false;
    }
  } catch {
    log('Erro ao verificar containers Docker.');
    return false;
  }
}

async function checkPostgresConnection() {
  try {
    const cmd = global.DOCKER_CMD || 'docker';
    const composeCmd = `${cmd} compose`;
    const { stdout } = await execAsync(`${composeCmd} exec -T postgres pg_isready -U postgres -d sgc_itep`);
    return stdout.includes('accepting connections');
  } catch {
    return false;
  }
}

async function checkRedisConnection() {
  try {
    const cmd = global.DOCKER_CMD || 'docker';
    const composeCmd = `${cmd} compose`;
    const { stdout } = await execAsync(`${composeCmd} exec -T redis redis-cli ping`);
    return stdout.trim() === 'PONG';
  } catch {
    return false;
  }
}

async function checkDockerServices() {
  log('Iniciando verificação de dependências...');

  if (!(await checkDockerInstalled())) process.exit(1);
  if (!(await checkDockerRunning())) process.exit(1);

  const containersOK = await checkContainersRunning();
  if (!containersOK) {
    log('Subindo serviços Docker necessários...');
    try {
      const cmd = global.DOCKER_CMD || 'docker';
      const composeCmd = `${cmd} compose`;
      await execAsync(`${composeCmd} up -d`);
    } catch (e) {
      log('Falha ao subir serviços Docker.');
      process.exit(1);
    }
  }

  const pgOK = await checkPostgresConnection();
  const redisOK = await checkRedisConnection();

  if (pgOK && redisOK) {
    log('Dependências OK.');
  } else {
    log(`Aviso: PostgreSQL: ${pgOK ? 'OK' : 'NOK'} | Redis: ${redisOK ? 'OK' : 'NOK'}`);
  }
}

if (require.main === module) {
  checkDockerServices().catch(() => {
    log('Erro inesperado na verificação de dependências.');
    process.exit(1);
  });
}

module.exports = {
  checkDockerServices,
  checkDockerInstalled,
  checkDockerRunning,
  checkContainersRunning,
  checkPostgresConnection,
  checkRedisConnection,
  findDockerCommand,
};