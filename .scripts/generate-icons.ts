import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const sourceSvg = path.resolve(
  process.argv[2] ?? path.join(repoRoot, 'assets/logo.svg'),
);
const outputDir = path.resolve(
  process.argv[3] ?? path.join(repoRoot, 'public/icon'),
);
const sizes = [16, 32, 48, 96, 128];

await access(sourceSvg);
await mkdir(outputDir, { recursive: true });

await Promise.all(
  sizes.map((size) =>
    sharp(sourceSvg, { density: 384 })
      .resize(size, size, { fit: 'fill' })
      .png({ adaptiveFiltering: true, compressionLevel: 9 })
      .toFile(path.join(outputDir, `${size}.png`)),
  ),
);

console.log(`Generated extension icons in ${outputDir}:`);
for (const size of sizes) {
  console.log(`  ${size}x${size}: ${path.join(outputDir, `${size}.png`)}`);
}
