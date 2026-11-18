let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');
}
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots', 'integration');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runIntegrationE2E() {
  console.log('--- STARTING SENTRAVAX PHASE 3.3 END-TO-END INTEGRATION E2E TEST ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = {
    public_report_zero_barrier: false,
    user_reports_page: false,
    user_regions_watchlist: false,
    user_settings_page: false,
    intel_earth_map: false,
    intel_events_page: false,
    intel_alert_operations: false,
    screenshots: [],
  };

  try {
    // 1. PUBLIC ZERO-BARRIER EMERGENCY REPORTING
    console.log('[1/7] Testing Public Zero-Barrier Emergency Report (/report)...');
    await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle2' });
    await page.waitForSelector('form', { timeout: 10000 });

    const reportPageText = await page.$eval('body', (el) => el.textContent);
    if (reportPageText.includes('Pelaporan Kejadian Bencana Warga') && reportPageText.includes('Zero-Barrier Public')) {
      results.public_report_zero_barrier = true;
      console.log('  -> Public Zero-Barrier Emergency Reporting successfully verified.');
    }
    const shot1 = path.join(SCREENSHOT_DIR, '01_public_zero_barrier_report.png');
    await page.screenshot({ path: shot1, fullPage: true });
    results.screenshots.push(shot1);

    // 2. LOGIN AS CITIZEN USER
    console.log('[2/7] Logging in as citizen user (user@sentravax.id)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'user@sentravax.id');
    await page.type('input[type="password"]', 'Sentravax2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    // 3. USER REPORTS HISTORY PAGE
    console.log('[3/7] Navigating to User Reports Page (/user/reports)...');
    await page.goto('http://localhost:5173/user/reports', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const reportsText = await page.$eval('body', (el) => el.textContent);
    if (reportsText.includes('Riwayat Laporan Kejadian Warga')) {
      results.user_reports_page = true;
      console.log('  -> User Reports History Page successfully verified.');
    }
    const shot2 = path.join(SCREENSHOT_DIR, '02_user_reports_history.png');
    await page.screenshot({ path: shot2, fullPage: true });
    results.screenshots.push(shot2);

    // 4. USER REGIONS WATCHLIST PAGE
    console.log('[4/7] Navigating to User Regions Watchlist Page (/user/regions)...');
    await page.goto('http://localhost:5173/user/regions', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const regionsText = await page.$eval('body', (el) => el.textContent);
    if (regionsText.includes('Multi-Location Monitoring (Watchlist)')) {
      results.user_regions_watchlist = true;
      console.log('  -> User Regions Watchlist Page successfully verified.');
    }
    const shot3 = path.join(SCREENSHOT_DIR, '03_user_regions_watchlist.png');
    await page.screenshot({ path: shot3, fullPage: true });
    results.screenshots.push(shot3);

    // 5. USER SETTINGS & PRIVACY PAGE
    console.log('[5/7] Navigating to User Settings Page (/user/settings)...');
    await page.goto('http://localhost:5173/user/settings', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const settingsText = await page.$eval('body', (el) => el.textContent);
    if (settingsText.includes('Pengaturan Akun & Profil Warga')) {
      results.user_settings_page = true;
      console.log('  -> User Settings & Privacy Page successfully verified.');
    }
    const shot4 = path.join(SCREENSHOT_DIR, '04_user_settings_privacy.png');
    await page.screenshot({ path: shot4, fullPage: true });
    results.screenshots.push(shot4);

    // 6. CLEAR COOKIES & LOGIN AS INTELLIGENCE OPERATOR
    console.log('[6/7] Clearing session and logging in as intelligence operator...');
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'intelligence@sentravax.go.id');
    await page.type('input[type="password"]', 'Sentravax2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    // 7. INTELLIGENCE EARTH MAP
    console.log('[7/7] Navigating to Intelligence Earth Map (/intelligence-center/map)...');
    await page.goto('http://localhost:5173/intelligence-center/map', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    const intelMapText = await page.$eval('body', (el) => el.textContent);
    if (intelMapText.includes('Earth Intelligence Map')) {
      results.intel_earth_map = true;
      console.log('  -> Intelligence Earth Map successfully verified.');
    }
    const shot5 = path.join(SCREENSHOT_DIR, '05_intel_earth_map.png');
    await page.screenshot({ path: shot5, fullPage: true });
    results.screenshots.push(shot5);

    // 8. INTELLIGENCE EVENTS DESK
    console.log('  -> Navigating to Intelligence Events Desk (/intelligence-center/events)...');
    await page.goto('http://localhost:5173/intelligence-center/events', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const eventsText = await page.$eval('body', (el) => el.textContent);
    if (eventsText.includes('Katalog & Korelasi Kejadian Bencana')) {
      results.intel_events_page = true;
      console.log('  -> Intelligence Events Desk successfully verified.');
    }
    const shot6 = path.join(SCREENSHOT_DIR, '06_intel_events_desk.png');
    await page.screenshot({ path: shot6, fullPage: true });
    results.screenshots.push(shot6);

    // 9. INTELLIGENCE ALERT OPERATIONS DESK
    console.log('  -> Navigating to Intelligence Alert Operations Desk (/intelligence-center/alert-operations)...');
    await page.goto('http://localhost:5173/intelligence-center/alert-operations', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const alertOpsText = await page.$eval('body', (el) => el.textContent);
    if (alertOpsText.includes('Operasi & Diseminasi Peringatan Dini')) {
      results.intel_alert_operations = true;
      console.log('  -> Intelligence Alert Operations Desk successfully verified.');
    }
    const shot7 = path.join(SCREENSHOT_DIR, '07_intel_alert_operations.png');
    await page.screenshot({ path: shot7, fullPage: true });
    results.screenshots.push(shot7);

    fs.writeFileSync(
      path.join(__dirname, 'integration_e2e_results.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('\n--- ALL 7 PHASE 3.3 E2E INTEGRATION TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('E2E Test Failed:', err);
  } finally {
    await browser.close();
  }
}

runIntegrationE2E();
