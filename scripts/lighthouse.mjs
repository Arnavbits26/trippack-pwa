// Runs Lighthouse (mobile and desktop) against the production build and writes
// results/lighthouse-summary.json. Usage: CHROME_PATH=/path/to/chrome npm run lighthouse
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';

const PORT = 4173;
const URL = `http://localhost:${PORT}/`;
const RUNS = 3;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(URL)).ok) break; } catch { /* not up yet */ }
  await sleep(250);
}

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const summary = { url: URL, runs: RUNS, note: 'Local production preview; Lighthouse simulated throttling.' };

for (const [label, config] of [['mobile', undefined], ['desktop', desktopConfig]]) {
  const scores = Object.fromEntries(CATEGORIES.map((c) => [c, []]));
  const metrics = { fcp: [], lcp: [], tbt: [], cls: [] };
  for (let i = 0; i < RUNS; i++) {
    const { lhr } = await lighthouse(URL, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: CATEGORIES }, config);
    for (const c of CATEGORIES) scores[c].push(Math.round(lhr.categories[c].score * 100));
    metrics.fcp.push(lhr.audits['first-contentful-paint'].numericValue);
    metrics.lcp.push(lhr.audits['largest-contentful-paint'].numericValue);
    metrics.tbt.push(lhr.audits['total-blocking-time'].numericValue);
    metrics.cls.push(lhr.audits['cumulative-layout-shift'].numericValue);
  }
  summary[label] = {
    scores: Object.fromEntries(CATEGORIES.map((c) => [c, { median: median(scores[c]), all: scores[c] }])),
    metrics: {
      fcp_ms: Math.round(median(metrics.fcp)),
      lcp_ms: Math.round(median(metrics.lcp)),
      tbt_ms: Math.round(median(metrics.tbt)),
      cls: Number(median(metrics.cls).toFixed(3)),
    },
  };
}

await chrome.kill();
server.kill();
mkdirSync('results', { recursive: true });
writeFileSync('results/lighthouse-summary.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(0);
