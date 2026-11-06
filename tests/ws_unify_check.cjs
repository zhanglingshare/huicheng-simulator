const { chromium } = require('playwright');
const fs = require('fs');
const CHROME = '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome';
const URL = 'http://127.0.0.1:8891/holo-workspace.html';
const TAG = process.argv[2] || 'base';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = { tag: TAG, errors: [], sizes: {} };
  for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2500);
    const kpi = await page.evaluate(() => {
      const g = id => { const el = document.getElementById(id); return el ? el.textContent.trim() : null; };
      return {
        nodes: g('kpiNodes'), edges: g('kpiEdges'), changes: g('kpiChanges'),
        cGrade: g('kpiReview'), date: g('kpiDate'), status: g('dataStatus')
      };
    });
    out.sizes[name] = kpi;
    out.errors = out.errors.concat(errs.map(e => name + ' ' + e));
    await page.screenshot({ path: `/tmp/${TAG}-${name}.png`, fullPage: false });
    await page.close();
  }
  fs.writeFileSync(`/tmp/${TAG}-report.json`, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
