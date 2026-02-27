// scripts/generate-apple-icons.mjs
import sharp from 'sharp';
import { resolve } from 'path';

const source = resolve('public/icons/icon-512x512.png');
const BG_COLOR = { r: 15, g: 15, b: 15, alpha: 1 }; // #0F0F0F

const targets = [
  { size: 180, out: 'public/icons/apple-touch-icon-180.png' },
  { size: 120, out: 'public/icons/apple-touch-icon-120.png' },
  { size: 152, out: 'public/icons/apple-touch-icon-152.png' },
  { size: 180, out: 'public/apple-touch-icon.png' }, // fallback na raiz
];

for (const { size, out } of targets) {
  const padding = Math.round(size * 0.10);
  const iconSize = size - padding * 2;

  await sharp(source)
    .resize(iconSize, iconSize, { kernel: sharp.kernel.lanczos3, fit: 'contain', background: BG_COLOR })
    .extend({ top: padding, bottom: padding, left: padding, right: padding, background: BG_COLOR })
    .flatten({ background: BG_COLOR })
    .toFormat('png')
    .toFile(resolve(out));

  console.log(`✅ Gerado: ${out} (${size}x${size})`);
}
