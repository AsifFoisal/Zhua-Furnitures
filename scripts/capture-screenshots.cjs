/* Capture viewport-stepped screenshots of the redesigned pages.
 * Full-page capture is unreliable (100svh hero + stitcher artifacts), so we
 * scroll step-by-step at real viewport sizes and save one PNG per step.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:4321';
const OUT = path.join(__dirname, '..', '.screenshots', 'steps');

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'furniture', path: '/furniture' },
  { name: 'curtains', path: '/curtains-blinds' },
  { name: 'wallz', path: '/wallz' },
  { name: 'deckz', path: '/deckz' },
  { name: 'projects', path: '/projects' },
];

const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 1800 },
  { tag: 'mobile', width: 390, height: 1400 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();

    for (const p of PAGES) {
      await page.goto(BASE + p.path, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);

      // scroll through once to trigger every scroll-reveal observer
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= height; y += Math.floor(vp.height * 0.8)) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(600);

      // second pass: capture at each step
      let index = 0;
      for (let y = 0; y < height; y += vp.height) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(400);
        const file = path.join(OUT, `${p.name}-${vp.tag}-${String(index).padStart(2, '0')}.png`);
        await page.screenshot({ path: file });
        index++;
      }
      console.log(`${p.name}-${vp.tag}: ${index} shots (page height ${height}px)`);
    }

    await ctx.close();
  }

  await browser.close();
})();
