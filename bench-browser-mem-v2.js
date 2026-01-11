/**
 * Browser Memory Benchmark Lab - v2.2 (Hardened)
 * - Safe cleanup on Ctrl+C
 * - Timeouts and progress logs
 * - Prevent orphan browsers
 */

const { chromium, firefox } = require('playwright');
const fs = require('fs');

const URLS = [
  'about:blank',
  'https://www.wikipedia.org/',
  'https://news.ycombinator.com/',
  'https://www.example.com/'
];

const TABS_SET = [1, 5, 10, 20];
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');

let activeBrowser = null;
let activeBrowserServer = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* === Graceful shutdown === */
async function cleanupAndExit(code = 0) {
  console.log('\n🧹 Cleaning up browsers...');
  try {
    if (activeBrowser) await activeBrowser.close();
    if (activeBrowserServer) await activeBrowserServer.close();
  } catch (_) {}
  process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(1));
process.on('SIGTERM', () => cleanupAndExit(1));

/* === Process tree helpers === */
function getProcessTree(rootPid) {
  const visited = new Set();
  const stack = [rootPid];

  while (stack.length) {
    const pid = stack.pop();
    if (visited.has(pid)) continue;
    visited.add(pid);

    try {
      const children = fs
        .readFileSync(`/proc/${pid}/task/${pid}/children`, 'utf8')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map(Number);
      stack.push(...children);
    } catch (_) {}
  }

  return [...visited];
}

function sumRssKb(pids) {
  let total = 0;
  for (const pid of pids) {
    try {
      const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
      const match = status.match(/^VmRSS:\s+(\d+)/m);
      if (match) total += parseInt(match[1], 10);
    } catch (_) {}
  }
  return total;
}

/* === Benchmark === */
async function measure(browserType, browserName, tabs) {
  console.log(`\n▶ ${browserName} | ${tabs} abas`);

  activeBrowserServer = await browserType.launchServer({
    headless: false
  });

  const rootPid = activeBrowserServer.process().pid;
  activeBrowser = await browserType.connect(activeBrowserServer.wsEndpoint());

  try {
    // Baseline
    await sleep(5000);
    const baselineRssKb = sumRssKb(getProcessTree(rootPid));

    const context = await activeBrowser.newContext();
    const pages = [];

    for (let i = 0; i < tabs; i++) {
      console.log(`  • Abrindo aba ${i + 1}/${tabs}`);
      const page = await context.newPage();
      await page.goto(URLS[i % URLS.length], {
        waitUntil: 'load',
        timeout: 30000
      });
      pages.push(page);
      await sleep(1000);
    }

    console.log('  ⏳ Estabilizando...');
    await sleep(8000);

    const totalRssKb = sumRssKb(getProcessTree(rootPid));

    return {
      browser: browserName,
      tabs,
      baseline_mb: +(baselineRssKb / 1024).toFixed(1),
      total_mb: +(totalRssKb / 1024).toFixed(1),
      per_tab_mb: +((totalRssKb - baselineRssKb) / 1024 / tabs).toFixed(1)
    };
  } finally {
    await activeBrowser.close();
    await activeBrowserServer.close();
    activeBrowser = null;
    activeBrowserServer = null;
  }
}

/* === Main === */
(async () => {
  const results = [];

  for (const tabs of TABS_SET) {
    results.push(await measure(chromium, 'chromium', tabs));
    results.push(await measure(firefox, 'firefox', tabs));
  }

  const jsonFile = `results-${RUN_ID}.json`;
  const csvFile = `results-${RUN_ID}.csv`;

  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));

  fs.writeFileSync(
    csvFile,
    [
      'browser,tabs,baseline_mb,total_mb,per_tab_mb',
      ...results.map(r =>
        `${r.browser},${r.tabs},${r.baseline_mb},${r.total_mb},${r.per_tab_mb}`
      )
    ].join('\n')
  );

  console.table(results);
  console.log('\n✔ Benchmark finalizado');
  await cleanupAndExit(0);
})();

