const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const VIEWPORTS = [
  { name: 'Desktop (1440x900)', width: 1440, height: 900 },
  { name: 'Laptop (1366x768)', width: 1366, height: 768 },
  { name: 'Tablet (768x1024)', width: 768, height: 1024 },
  { name: 'Mobile (390x844)', width: 390, height: 844 },
  { name: 'Small Mobile (360x800)', width: 360, height: 800 },
];

const PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Public Disaster Map', path: '/map' },
  { name: 'SIAGA PERSONAL', path: '/preparedness' },
];

async function runResponsiveCloseoutAudit() {
  console.log('================================================================');
  console.log('   SENTRAVAX PHASE 2B.4C: COMPREHENSIVE RESPONSIVE AUDIT        ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  const testResults = [];

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${name} ${extra ? `(${extra})` : ''}`);
      testResults.push({ name, pass: true, extra });
    } else {
      console.error(`  ✗ FAIL: ${name} ${extra ? `(${extra})` : ''}`);
      testResults.push({ name, pass: false, error: extra });
    }
  }

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- TESTING VIEWPORT: ${vp.name} ---`);
      await page.setViewport({ width: vp.width, height: vp.height });

      for (const p of PAGES) {
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle2' });

        // Wait for main content or map
        if (p.path === '/map') {
          await page.waitForSelector('.leaflet-container', { timeout: 15000 });
        } else if (p.path === '/preparedness') {
          await page.waitForSelector('main', { timeout: 10000 });
        } else {
          await page.waitForSelector('main', { timeout: 10000 });
        }

        // 1. Check Horizontal Overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert(
          `[${vp.name}] ${p.name}: No Horizontal Overflow`,
          !overflow,
          `ScrollWidth: ${scrollWidth}px vs ViewportWidth: ${vp.width}px`
        );

        // 2. Specific Page Integrity Checks
        if (p.path === '/') {
          // Check Hero & Action Buttons
          const hasHero = await page.evaluate(() => !!document.querySelector('h1'));
          assert(`[${vp.name}] Homepage: Hero Heading Rendered`, hasHero);
          // Check Recent Events section
          const hasEvents = await page.evaluate(() => !!document.querySelector('section[aria-labelledby="recent-events-heading"]'));
          assert(`[${vp.name}] Homepage: Recent Events Section Intact`, hasEvents);
        } else if (p.path === '/map') {
          // Check Leaflet Map Dimensions & Controls
          const mapBox = await page.evaluate(() => {
            const el = document.querySelector('.leaflet-container');
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          });
          assert(
            `[${vp.name}] Map: Leaflet Container Properly Sized`,
            mapBox && mapBox.width > 0 && mapBox.height >= 400,
            `Dimensions: ${mapBox?.width}x${mapBox?.height}`
          );
        } else if (p.path === '/preparedness') {
          // Check SIAGA PERSONAL Checklist Items (13 items)
          const checklistCount = await page.evaluate(() => {
            return document.querySelectorAll('div.p-3.rounded-xl.border.transition-all.cursor-pointer').length;
          });
          assert(
            `[${vp.name}] SIAGA PERSONAL: 13 Go-Bag Checklist Items Rendered`,
            checklistCount === 13,
            `Count: ${checklistCount}`
          );
        }
      }
    }
  } catch (err) {
    console.error('Audit Exception:', err);
    assert('Execution Exception', false, err.message);
  } finally {
    await browser.close();

    const passed = testResults.filter((r) => r.pass).length;
    const total = testResults.length;
    console.log('\n================================================================');
    console.log(`   RESPONSIVE AUDIT COMPLETE: ${passed}/${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
    console.log('================================================================\n');

    if (passed < total) {
      process.exit(1);
    }
  }
}

runResponsiveCloseoutAudit();
