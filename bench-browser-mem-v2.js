// Browser Memory Benchmark Lab - v2.1

/**
 * Browser Memory Benchmark v2.1
 * Ubuntu / Linux
 * - Soma RSS real por process tree
 * - Baseline automático (0 abas)
 * - RAM por aba correta
 * - Exporta JSON + CSV
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retorna todos os PIDs da árvore de processos
 */
function getProcessTree(rootPid) {
  const visited = new Set();
  const stack = [rootPid];

  while (stack.length > 0) {
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

/**
 * Soma RSS (KB) de uma lista de PIDs
 */
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

/**
 * Executa medição real
 */
async function measure(browserType, browserName, tabs) {
  // Launch com controle total de processo
  const browserServer = await browserType.launchServer({
    headless: false
  });

  const rootPid = browserServer.process().pid;
  const browser = await browserType.connect(browserServer.wsEndpoint());

  // Baseline (0 abas)
  await sleep(5000);
  const baselineRssKb = sumRssKb(getProcessTree(rootPid));

  const context = await browser.newContext();
  const pages = [];

  for (let i = 0; i < tabs; i++) {
    const page = await context.newPage();
    await page.goto(URLS[i % URLS.length], { waitUntil: 'load' });
    pages.push(page);
    await sleep(1000);
  }

  // Aguarda estabilização
  await sleep(10000);

  const totalRssKb = sumRssKb(getProcessTree(rootPid));

  await browser.close();
  await browserServer.close();

  return {
    browser: browserName,
    tabs,
    baseline_mb: +(baselineRssKb / 1024).toFixed(1),
    total_mb: +(totalRssKb / 1024).toFixed(1),
    per_tab_mb: +((totalRssKb - baselineRssKb) / 1024 / tabs).toFixed(1)
  };
}

(async () => {
  const results = [];

  for (const tabs of TABS_SET) {
    console.log(`\n▶ Benchmark: ${tabs} abas`);
    results.push(await measure(chromium, 'chromium', tabs));
    results.push(await measure(firefox, 'firefox', tabs));
  }

  // Export JSON
  const jsonFile = `results-${RUN_ID}.json`;
  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));

  // Export CSV
  const csvFile = `results-${RUN_ID}.csv`;
  const csv = [
    'browser,tabs,baseline_mb,total_mb,per_tab_mb',
    ...results.map(r =>
      `${r.browser},${r.tabs},${r.baseline_mb},${r.total_mb},${r.per_tab_mb}`
    )
  ].join('\n');

  fs.writeFileSync(csvFile, csv);

  console.table(results);

  console.log('\n✔ Benchmark finalizado');
  console.log(`📄 JSON: ${jsonFile}`);
  console.log(`📄 CSV : ${csvFile}`);
})();

