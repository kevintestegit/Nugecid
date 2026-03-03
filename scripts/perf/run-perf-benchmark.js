#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.PERF_BASE_URL || "http://127.0.0.1:8080";
const USERNAME = process.env.PERF_USERNAME || "__MUST_BE_SET__";
const PASSWORD = process.env.PERF_PASSWORD || "__MUST_BE_SET__";
const LOGIN_FORWARDED_FOR =
  process.env.PERF_LOGIN_FORWARDED_FOR || "127.0.0.1";
const CONCURRENCY = Number(process.env.PERF_CONCURRENCY || 20);
const REQUESTS_PER_SCENARIO = Number(process.env.PERF_REQUESTS || 300);
const TIMEOUT_MS = Number(process.env.PERF_TIMEOUT_MS || 10000);

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function toJson(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function normalizeError(err) {
  if (!err) {
    return "unknown error";
  }
  if (typeof err === "string") {
    return err;
  }
  if (err.name === "AbortError") {
    return "request timeout";
  }
  if (err.cause && err.cause.message) {
    return `${err.message || "fetch error"}: ${err.cause.message}`;
  }
  return err.message || String(err);
}

async function httpRequest({ method, pathname, headers, body }) {
  const url = new URL(pathname, BASE_URL);
  const startedAt = process.hrtime.bigint();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers: headers || {},
      body,
      signal: controller.signal,
    });
    const raw = await response.text();
    const endedAt = process.hrtime.bigint();
    const latencyMs = Number(endedAt - startedAt) / 1e6;
    return {
      ok: true,
      statusCode: response.status || 0,
      latencyMs,
      body: raw,
    };
  } catch (err) {
    const endedAt = process.hrtime.bigint();
    const latencyMs = Number(endedAt - startedAt) / 1e6;
    return {
      ok: false,
      statusCode: 0,
      latencyMs,
      error: normalizeError(err),
      body: "",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function login() {
  const body = JSON.stringify({
    usuario: USERNAME,
    senha: PASSWORD,
  });

  const result = await httpRequest({
    method: "POST",
    pathname: "/api/auth/login",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-forwarded-for": LOGIN_FORWARDED_FOR,
    },
    body,
  });

  if (!result.ok || result.statusCode !== 200) {
    throw new Error(
      `Falha no login HTTP (${result.statusCode}): ${result.error || result.body}`,
    );
  }

  const parsed = toJson(result.body);
  const token = parsed?.data?.accessToken;
  if (!token) {
    throw new Error("Login sem accessToken no payload.");
  }

  return token;
}

function buildForwardedFor(seed, requestIndex) {
  const oct2 = ((seed + requestIndex) % 250) + 1;
  const oct3 = ((seed * 7 + requestIndex) % 250) + 1;
  const oct4 = ((seed * 13 + requestIndex) % 250) + 1;
  return `10.${oct2}.${oct3}.${oct4}`;
}

async function runScenario(name, pathname, token, forwardedForSeed) {
  const latencies = [];
  const statusCounts = new Map();
  let requestCount = 0;
  let errorCount = 0;
  const startedAt = Date.now();
  let cursor = 0;

  const worker = async () => {
    while (true) {
      if (cursor >= REQUESTS_PER_SCENARIO) {
        return;
      }
      cursor += 1;
      const currentRequest = cursor;
      const res = await httpRequest({
        method: "GET",
        pathname,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
          "x-forwarded-for": buildForwardedFor(
            forwardedForSeed,
            currentRequest,
          ),
        },
      });

      requestCount += 1;
      latencies.push(res.latencyMs);

      const statusKey = String(res.statusCode || "ERR");
      statusCounts.set(statusKey, (statusCounts.get(statusKey) || 0) + 1);

      if (!res.ok || res.statusCode >= 400) {
        errorCount += 1;
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const totalDurationMs = Date.now() - startedAt;
  const sorted = [...latencies].sort((a, b) => a - b);
  const durationSec = totalDurationMs / 1000;
  const rps = durationSec > 0 ? requestCount / durationSec : 0;

  const status = {};
  for (const [k, v] of statusCounts.entries()) {
    status[k] = v;
  }

  return {
    name,
    pathname,
    concurrency: CONCURRENCY,
    totalRequestsTarget: REQUESTS_PER_SCENARIO,
    requests: requestCount,
    errors: errorCount,
    errorRatePct: requestCount ? (errorCount / requestCount) * 100 : 0,
    rps,
    latencyMs: {
      min: sorted[0] || 0,
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      max: sorted[sorted.length - 1] || 0,
      avg:
        sorted.length > 0
          ? sorted.reduce((acc, n) => acc + n, 0) / sorted.length
          : 0,
    },
    status,
  };
}

function printResult(runLabel, result) {
  const l = result.latencyMs;
  console.log(
    [
      `[${runLabel}] ${result.name}`,
      `req=${result.requests}`,
      `rps=${result.rps.toFixed(1)}`,
      `err=${result.errorRatePct.toFixed(2)}%`,
      `p50=${l.p50.toFixed(1)}ms`,
      `p95=${l.p95.toFixed(1)}ms`,
      `p99=${l.p99.toFixed(1)}ms`,
    ].join(" | "),
  );
}

async function main() {
  const token = await login();
  const scenarios = [
    {
      name: "health",
      pathname: "/health",
    },
    {
      name: "nugecid-list",
      pathname:
        "/api/nugecid?page=1&limit=20&sortBy=dataSolicitacao&sortOrder=DESC",
    },
    {
      name: "pastas-list",
      pathname: "/api/pastas",
    },
    {
      name: "notificacoes-list",
      pathname: "/api/notificacoes?page=1&limit=20",
    },
    {
      name: "global-search",
      pathname: "/api/search?query=pro&limit=20&offset=0",
    },
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    concurrency: CONCURRENCY,
    requestsPerScenario: REQUESTS_PER_SCENARIO,
    cold: [],
    warm: [],
  };

  for (let i = 0; i < scenarios.length; i += 1) {
    const scenario = scenarios[i];
    const cold = await runScenario(
      scenario.name,
      scenario.pathname,
      token,
      100 + i,
    );
    printResult("cold", cold);
    report.cold.push(cold);
  }

  for (let i = 0; i < scenarios.length; i += 1) {
    const scenario = scenarios[i];
    const warm = await runScenario(
      scenario.name,
      scenario.pathname,
      token,
      200 + i,
    );
    printResult("warm", warm);
    report.warm.push(warm);
  }

  const outDir = path.join(process.cwd(), "docs", "perf");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const outFile = path.join(outDir, `benchmark-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\nRelatório salvo em: ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
