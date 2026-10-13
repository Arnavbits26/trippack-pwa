import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Static files copied from /public that the service worker should precache.
const PUBLIC_FILES = [
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

/**
 * Emits dist/sw.js from src/sw.template.js, injecting the list of built assets and a
 * content hash. Any change to the app changes the hash, so the browser installs a new
 * service worker and old caches are deleted on activation.
 */
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'trippack-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle);
      const digest = createHash('sha256');
      for (const name of built) {
        const item = bundle[name] as { code?: string; source?: string | Uint8Array };
        digest.update(name);
        digest.update(item.code ?? Buffer.from(item.source ?? ''));
      }
      for (const file of PUBLIC_FILES) {
        digest.update(fs.readFileSync(path.join(here, 'public', file)));
      }
      const version = digest.digest('hex').slice(0, 10);
      const assets = ['./', ...built, ...PUBLIC_FILES];
      const template = fs.readFileSync(path.join(here, 'src/sw.template.js'), 'utf8');
      const source = template
        .replace('__VERSION__', version)
        .replace('__ASSETS__', JSON.stringify(assets));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), serviceWorkerPlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
