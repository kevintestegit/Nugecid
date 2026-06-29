import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const limits = {
  js: 900_000, // 0.9 MB por asset JS
  css: 250_000, // 0.25 MB por asset CSS
  image: 1_500_000, // 1.5 MB por imagem
  total: 8_000_000, // 8 MB total sem sourcemaps
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

const oversized = files.filter((entry) => {
  if (entry.type === "other") return false;
  return entry.size > limits[entry.type];
});
const total = files.reduce((acc, entry) => acc + entry.size, 0);
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
  console.error("[bundle-size] Assets acima do limite por tipo:");
  oversized.forEach((entry) => {
    const typeLimit = limits[entry.type];
    console.error(
      ` - ${entry.file} [${entry.type}]: ${fmt(entry.size)} (limite ${fmt(typeLimit)})`,
    );
  });
  process.exit(1);
}

if (total > limits.total) {
  console.error(
    `[bundle-size] Tamanho total acima do limite: ${fmt(total)} (limite ${fmt(limits.total)})`,
  );
  process.exit(1);
}

console.log(
  `[bundle-size] OK - ${files.length} assets, total ${fmt(total)} | js ${fmt(totalsByType.js)} | css ${fmt(totalsByType.css)} | image ${fmt(totalsByType.image)}`,
);
