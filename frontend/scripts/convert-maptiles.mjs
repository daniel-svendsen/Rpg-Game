import sharp from "sharp";
import { readdir, unlink } from "fs/promises";
import { join, extname, basename } from "path";

const TILES_DIR = new URL("../public/assets/maptiles", import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, "$1")
  .replace(/%20/g, " ");
const QUALITY = 82;

const files = await readdir(TILES_DIR);
const pngs = files.filter(f => extname(f).toLowerCase() === ".png");

if (pngs.length === 0) {
  console.log("No PNG files found in", TILES_DIR);
  process.exit(0);
}

for (const file of pngs) {
  const src = join(TILES_DIR, file);
  const name = basename(file, ".png");
  const dest = join(TILES_DIR, `${name}.webp`);

  const { size: sizeBefore } = await (await import("fs/promises")).stat(src);
  await sharp(src).webp({ quality: QUALITY }).toFile(dest);
  const { size: sizeAfter } = await (await import("fs/promises")).stat(dest);

  const pct = Math.round((1 - sizeAfter / sizeBefore) * 100);
  console.log(`${file}  →  ${name}.webp  (${(sizeBefore / 1024 / 1024).toFixed(1)} MB → ${(sizeAfter / 1024 / 1024).toFixed(1)} MB, -${pct}%)`);
}

console.log("\nKlar. Ta bort PNG-filerna manuellt när du verifierat resultatet,");
console.log("uppdatera sedan spriteConfig.ts: ändra MAP_TILE_THEMES att peka på .webp");
