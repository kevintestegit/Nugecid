/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Verifica dependências Docker necessárias para desenvolvimento local.
 * O fluxo local depende apenas de db + redis; frontend/backend containerizados
 * e serviços por profile não são pré-requisitos do `npm run dev`.
 */

const { exec } = require("child_process");
const util = require("util");

const execAsync = util.promisify(exec);
const REQUIRED_SERVICES = ["db", "redis"];

function log(message) {
  console.log(message);
}

async function findDockerCommand() {
  const possiblePaths = [
    "docker",
    "/usr/bin/docker",
    "/usr/local/bin/docker",
    "/snap/bin/docker",
    "/home/linuxbrew/.linuxbrew/bin/docker",
  ];

  for (const commandPath of possiblePaths) {
    try {
      await execAsync(`${commandPath} --version`);
      return commandPath;
    } catch {
      continue;
    }
  }

  return null;
}

function getDockerCmd() {
  return global.DOCKER_CMD || "docker";
}

function getComposeCmd() {
  return `${getDockerCmd()} compose`;
}

async function checkDockerInstalled() {
  const dockerCmd = await findDockerCommand();
  if (!dockerCmd) {
    log("Erro: Docker não instalado ou fora do PATH.");
    return false;
  }

  global.DOCKER_CMD = dockerCmd;
  return true;
}

async function checkDockerRunning() {
  try {
    await execAsync(`${getDockerCmd()} info`);
    return true;
  } catch {
    log("Erro: Docker não está rodando.");
    return false;
  }
}

async function listRunningServices() {
  const { stdout } = await execAsync(
    `${getComposeCmd()} ps --services --filter "status=running"`,
  );
  return stdout
    .trim()
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function checkContainersRunning() {
  try {
    const runningServices = await listRunningServices();
    const missingServices = REQUIRED_SERVICES.filter(
      (service) => !runningServices.includes(service),
    );

    if (missingServices.length === 0) {
      return true;
    }

    log(`Aviso: Serviços ausentes: ${missingServices.join(", ")}`);
    return false;
  } catch {
    log("Erro ao verificar containers Docker.");
    return false;
  }
}

async function checkPostgresConnection() {
  try {
    const { stdout } = await execAsync(
      `${getComposeCmd()} exec -T db sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`,
    );
    return stdout.includes("accepting connections");
  } catch {
    return false;
  }
}

async function checkRedisConnection() {
  try {
    const { stdout } = await execAsync(
      `${getComposeCmd()} exec -T redis sh -lc 'if [ -n "$REDIS_PASSWORD" ]; then redis-cli -a "$REDIS_PASSWORD" ping; else redis-cli ping; fi'`,
    );
    return stdout.trim().endsWith("PONG");
  } catch {
    return false;
  }
}

async function ensureRequiredServices() {
  await execAsync(`${getComposeCmd()} up -d ${REQUIRED_SERVICES.join(" ")}`);
}

async function checkDockerServices() {
  log("Iniciando verificação de dependências...");

  if (!(await checkDockerInstalled())) {
    process.exit(1);
  }

  if (!(await checkDockerRunning())) {
    process.exit(1);
  }

  const containersOK = await checkContainersRunning();
  if (!containersOK) {
    log("Subindo serviços Docker necessários...");

    try {
      await ensureRequiredServices();
    } catch {
      log("Falha ao subir serviços Docker.");
      process.exit(1);
    }
  }

  const pgOK = await checkPostgresConnection();
  const redisOK = await checkRedisConnection();

  if (pgOK && redisOK) {
    log("Dependências OK.");
    return;
  }

  log(
    `Aviso: PostgreSQL: ${pgOK ? "OK" : "NOK"} | Redis: ${
      redisOK ? "OK" : "NOK"
    }`,
  );
}

if (require.main === module) {
  checkDockerServices().catch(() => {
    log("Erro inesperado na verificação de dependências.");
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
  ensureRequiredServices,
  findDockerCommand,
  listRunningServices,
};
