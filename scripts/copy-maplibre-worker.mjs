import { copyFileSync, mkdirSync } from 'node:fs';

const SOURCE_DIR = 'node_modules/maplibre-gl/dist';
const TARGET_DIR = 'public/maplibre';
const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

mkdirSync(TARGET_DIR, { recursive: true });
for (const file of FILES) {
  copyFileSync(`${SOURCE_DIR}/${file}`, `${TARGET_DIR}/${file}`);
}
