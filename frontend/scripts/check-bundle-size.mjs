import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const limits = {
  js: 900_000,
  css: 250_000,
  image: 1_500_000,
  initialTotal: 2_000_000,
};

const extensionToType = (filename) => {
  if (filename.endsWith(".js")) return "js";
  if (filename.endsWith(".css")) return "css";
  if (
    filename.endsWith(".png") ||
    filename.endsWith(".jpg") ||
    filename.endsWith(".jpeg") ||
    filename.endsWith(".webp") ||
    filename.endsWith(".gif") ||
    filename.endsWith(".svg")
  ) {
    return "image";
  }
  return "other";
};

const walk = (dir) => {
  let entries = [];
  let nested;
  try {
    nested = readdirSync(dir);
  } catch {
    return entries;
  }
  for (const name of nested) {
    const full = path.join(dir, name);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      entries = entries.concat(walk(full));
    } else {
      entries.push(full);
    }
  }
  return entries;
};

const files = walk(distDir)
  .filter((filePath) => !filePath.endsWith(".map"))
  .map((filePath) => {
    const size = statSync(filePath).size;
    return {
      file: path.relative(distDir, filePath),
      size,
      type: extensionToType(filePath),
    };
  });

if (files.length === 0) {
  console.error(
    `[bundle-size] Nenhum asset encontrado em ${distDir}. Rode \`npm run build\` antes.`,
  );
  process.exit(1);
}

const indexHtml = readFileSync(path.join(distDir, "index.html"), "utf8");
const initialAssetNames = new Set(
  [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((assetPath) => assetPath.startsWith("/"))
    .map((assetPath) => assetPath.replace(/^\//, "")),
);

const initialFiles = files.filter((entry) => initialAssetNames.has(entry.file));
const oversized = initialFiles.filter((entry) => {
  if (entry.type === "other") return false;
  return entry.size > limits[entry.type];
});
const total = files.reduce((acc, entry) => acc + entry.size, 0);
const initialTotal = initialFiles.reduce((acc, entry) => acc + entry.size, 0);
const totalsByType = files.reduce(
  (acc, entry) => {
    if (!acc[entry.type]) acc[entry.type] = 0;
    acc[entry.type] += entry.size;
    return acc;
  },
  { js: 0, css: 0, image: 0, other: 0 },
);

const fmt = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

if (oversized.length > 0) {
  console.error("[bundle-size] Assets iniciais acima do limite por tipo:");
  oversized.forEach((entry) => {
    const typeLimit = limits[entry.type];
    console.error(
      ` - ${entry.file} [${entry.type}]: ${fmt(entry.size)} (limite ${fmt(typeLimit)})`,
    );
  });
  process.exit(1);
}

if ([...initialAssetNames].some((assetPath) => /(^|\/)charts-.*\.js$/.test(assetPath))) {
  console.error("[bundle-size] charts apareceu no preload inicial");
  process.exit(1);
}

if (initialTotal > limits.initialTotal) {
  console.error(
    `[bundle-size] Carga inicial acima do limite: ${fmt(initialTotal)} (limite ${fmt(limits.initialTotal)})`,
  );
  process.exit(1);
}

console.log(
  `[bundle-size] OK - inicial ${fmt(initialTotal)} em ${initialFiles.length} assets | deploy ${fmt(total)} em ${files.length} assets | js ${fmt(totalsByType.js)} | css ${fmt(totalsByType.css)} | image ${fmt(totalsByType.image)}`,
);
