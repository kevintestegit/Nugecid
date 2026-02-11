import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const distAssetsDir = path.resolve(process.cwd(), "dist", "assets");
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

const files = readdirSync(distAssetsDir)
  .filter((file) => !file.endsWith(".map"))
  .map((file) => {
    const filePath = path.join(distAssetsDir, file);
    const size = statSync(filePath).size;
    return { file, size, type: extensionToType(file) };
  });

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
