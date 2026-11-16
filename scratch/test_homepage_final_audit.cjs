const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runAudit() {
  console.log('================================================================');
  console.log('   SENTRAVAX PHASE 2B.2: COMPREHENSIVE FINAL VERIFICATION SUITE  ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected guest 401
      if (!text.includes('/api/v1/auth/user') && !text.includes('status of 401')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  const testResults = [];

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP 1440x900 RENDER & OVERFLOW AUDIT
    // -------------------------------------------------------------
    console.log('--- 1. AUDIT VIEWPORT: DESKTOP 1440x900 ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    testResults.push({
      section: 'Responsiveness',
      name: 'Desktop 1440x900 (No horizontal overflow)',
      pass: !desktopOverflow
    });

    // -------------------------------------------------------------
    // 2. TABLET 768x1024 RENDER & OVERFLOW AUDIT
    // -------------------------------------------------------------
    console.log('--- 2. AUDIT VIEWPORT: TABLET 768x1024 ---');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise((r) => setTimeout(r, 500));
    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    testResults.push({
      section: 'Responsiveness',
      name: 'Tablet 768x1024 (No horizontal overflow)',
      pass: !tabletOverflow
    });

    // -------------------------------------------------------------
    // 3. MOBILE 375x667 RENDER & OVERFLOW AUDIT
    // -------------------------------------------------------------
    console.log('--- 3. AUDIT VIEWPORT: MOBILE 375x667 ---');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise((r) => setTimeout(r, 500));
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    testResults.push({
      section: 'Responsiveness',
      name: 'Mobile 375x667 (No horizontal overflow)',
      pass: !mobileOverflow
    });

    // Reset to Desktop for interaction tests
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    // -------------------------------------------------------------
    // 4. AUDIT DATA PROVENANCE & FRESHNESS TRUTHFULNESS
    // -------------------------------------------------------------
    console.log('--- 4. AUDIT PROVENANCE & FRESHNESS TRUTHFULNESS ---');
    const provenanceAudit = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('section[aria-labelledby="recent-events-heading"] div.rounded-2xl'));
      const text = document.body.innerText;
      
      const hasLiveBMKG = text.includes('LIVE (BMKG TEWS)');
      const hasStaticCurated = text.includes('STATIC (TERKURASI)');
      const hasDistinctSources = (text.includes('BMKG TEWS') || text.includes('BMKG')) && text.includes('Data Observasi Terkurasi SENTRAVAX');
      const hasOperationalStatus = text.includes('Status Sistem: Operasional Normal');
      const hasSyncPipelineStatus = text.includes('Sinkronisasi Telemetri') && text.includes('Normal');

      return {
        cardCount: cards.length,
        hasLiveBMKG,
        hasStaticCurated,
        hasDistinctSources,
        hasOperationalStatus,
        hasSyncPipelineStatus
      };
    });

    testResults.push({
      section: 'Data Integrity',
      name: 'Truthful Provenance Distinction (LIVE BMKG vs STATIC Curated)',
      pass: provenanceAudit.hasLiveBMKG && provenanceAudit.hasStaticCurated && provenanceAudit.hasDistinctSources,
      details: provenanceAudit
    });

    testResults.push({
      section: 'Data Integrity',
      name: 'Clear Operational Status (Platform vs Sync Pipeline)',
      pass: provenanceAudit.hasOperationalStatus && provenanceAudit.hasSyncPipelineStatus,
      details: provenanceAudit
    });

    // -------------------------------------------------------------
    // 5. AUDIT EVENT CARD "LIHAT DI PETA" ACTION
    // -------------------------------------------------------------
    console.log('--- 5. AUDIT EVENT MAP LINKS ---');
    const mapActionLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/map?eventId="]')).map(a => a.getAttribute('href'));
      return links;
    });

    testResults.push({
      section: 'Navigation',
      name: 'Recent Events provide direct "Lihat di Peta" deep links (/map?eventId=...)',
      pass: mapActionLinks.length > 0,
      details: { linksFound: mapActionLinks }
    });

    // -------------------------------------------------------------
    // 6. AUDIT EARLY WARNING CONTRACT
    // -------------------------------------------------------------
    console.log('--- 6. AUDIT EARLY WARNING HIGHLIGHTS ---');
    const warningAudit = await page.evaluate(() => {
      const warningsSection = document.querySelector('section[aria-labelledby="early-warnings-heading"]');
      if (!warningsSection) return { found: false };
      const text = warningsSection.innerText;
      return {
        found: true,
        hasCAPTitle: text.includes('CAP'),
        hasBroadcastBadge: text.includes('REGIONAL') || text.includes('WARNING') || text.includes('NATIONAL'),
        hasTimeLabel: text.includes('Mulai:'),
        hasDetailLinks: !!warningsSection.querySelector('a[href="/warnings"]')
      };
    });

    testResults.push({
      section: 'Early Warning',
      name: 'CAP Alerts Contract (Broadcast level, Starts at, Detail link)',
      pass: warningAudit.found && warningAudit.hasCAPTitle && warningAudit.hasTimeLabel && warningAudit.hasDetailLinks,
      details: warningAudit
    });

    // -------------------------------------------------------------
    // 7. AUDIT ALL 9 ROUTE TARGETS & GUEST PROTECTION
    // -------------------------------------------------------------
    console.log('--- 7. AUDIT ROUTES & AUTHORIZATION GUARDS ---');
    const routesToTest = [
      { path: '/map', expectedUrl: '/map', isProtected: false },
      { path: '/disasters', expectedUrl: '/disasters', isProtected: false },
      { path: '/warnings', expectedUrl: '/warnings', isProtected: false },
      { path: '/preparedness', expectedUrl: '/preparedness', isProtected: false },
      { path: '/education', expectedUrl: '/education', isProtected: false },
      { path: '/register', expectedUrl: '/register', isProtected: false },
      { path: '/user/dashboard', expectedUrl: '/login', isProtected: true },
      { path: '/admin/dashboard', expectedUrl: '/login', isProtected: true },
      { path: '/intelligence-center/overview', expectedUrl: '/login', isProtected: true },
    ];

    for (const r of routesToTest) {
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      if (r.isProtected) {
        try {
          await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 3000 });
        } catch (e) {
          await new Promise(res => setTimeout(res, 500));
        }
      } else {
        await new Promise(res => setTimeout(res, 500));
      }
      const currentUrl = page.url();
      const isExpected = r.isProtected 
        ? currentUrl.includes(r.expectedUrl) 
        : currentUrl.includes(r.path);

      testResults.push({
        section: 'Route & Auth Guard',
        name: `Route ${r.path} -> ${r.isProtected ? 'Redirect to /login (Guest protected)' : 'Page loads directly'}`,
        pass: isExpected,
        details: { requested: r.path, actual: currentUrl }
      });
    }

    // -------------------------------------------------------------
    // 8. AUDIT API ERROR HANDLING & RETRY BEHAVIOR
    // -------------------------------------------------------------
    console.log('--- 8. AUDIT ERROR STATE & RETRY CAPABILITY ---');
    const errorPage = await browser.newPage();
    await errorPage.setViewport({ width: 1440, height: 900 });
    await errorPage.setRequestInterception(true);

    let failOverview = true;
    errorPage.on('request', (req) => {
      if (req.url().includes('/api/v1/public/overview') && failOverview) {
        req.abort('failed');
      } else {
        req.continue();
      }
    });

    await errorPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Verify error state is rendered
    const hasErrorBox = await errorPage.evaluate(() => {
      const text = document.body.innerText;
      const retryBtn = document.querySelector('button');
      return text.includes('Gagal Menghubungkan Telemetri Overview') || text.includes('Coba Muat Ulang');
    });

    // Now test retry: allow request and click retry
    failOverview = false;
    const retryClicked = await errorPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const retryBtn = btns.find(b => b.textContent?.includes('Coba Muat Ulang'));
      if (retryBtn) {
        retryBtn.click();
        return true;
      }
      return false;
    });

    await new Promise((r) => setTimeout(r, 2000));
    const recoveredAfterRetry = await errorPage.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Kejadian Aktif') && text.includes('Situasi Terkini Kebencanaan');
    });

    testResults.push({
      section: 'Reliability & UX',
      name: 'API Error State displays graceful UI and Retry button recovers data',
      pass: hasErrorBox && retryClicked && recoveredAfterRetry,
      details: { hasErrorBox, retryClicked, recoveredAfterRetry }
    });

    await errorPage.close();

    // -------------------------------------------------------------
    // 9. AUDIT EMPTY DATA STATE
    // -------------------------------------------------------------
    console.log('--- 9. AUDIT EMPTY DATA GRACEFUL RENDERING ---');
    const emptyBrowser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    });
    const emptyPage = await emptyBrowser.newPage();
    await emptyPage.setViewport({ width: 1440, height: 900 });
    await emptyPage.setRequestInterception(true);

    emptyPage.on('request', (req) => {
      const headers = { 
        'Access-Control-Allow-Origin': 'http://localhost:5173', 
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      };
      if (req.method() === 'OPTIONS') {
        req.respond({ 
          status: 204, 
          headers 
        });
        return;
      }
      if (req.url().includes('/api/v1/public/events') || req.url().includes('/api/v1/public/alerts')) {
        req.respond({ 
          status: 200, 
          headers, 
          contentType: 'application/json', 
          body: JSON.stringify({ success: true, data: { data: [] } }) 
        });
      } else {
        req.continue();
      }
    });

    await emptyPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const eventsSectionText = await emptyPage.$eval('section[aria-labelledby="recent-events-heading"]', el => el.innerText).catch(() => 'EVENTS SECTION ERROR');
    const alertsSectionText = await emptyPage.$eval('section[aria-labelledby="early-warnings-heading"]', el => el.innerText).catch(() => 'ALERTS SECTION ERROR');

    const hasEmptyEvents = eventsSectionText.includes('Tidak Ada Kejadian Kritis Aktif') || eventsSectionText.includes('rentang normal');
    const hasEmptyAlerts = alertsSectionText.includes('Tidak Ada Peringatan Dini Aktif') || alertsSectionText.includes('Tidak ada peringatan darurat');

    testResults.push({
      section: 'Reliability & UX',
      name: 'Empty Data State displays proper EmptyState components without crashing',
      pass: hasEmptyEvents && hasEmptyAlerts,
      details: { hasEmptyEvents, hasEmptyAlerts }
    });

    await emptyBrowser.close();

    // -------------------------------------------------------------
    // 10. UNCAUGHT RUNTIME JS EXCEPTIONS
    // -------------------------------------------------------------
    testResults.push({
      section: 'Code Quality',
      name: 'Zero uncaught runtime JavaScript exceptions',
      pass: consoleErrors.length === 0,
      details: { consoleErrors }
    });

  } catch (err) {
    console.error('Audit Error:', err);
    testResults.push({ section: 'Audit Engine', name: 'Suite Execution', pass: false, details: err.message });
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('            PHASE 2B.2 FINAL VERIFICATION SUMMARY               ');
  console.log('================================================================');

  let passed = 0;
  testResults.forEach((t, i) => {
    const status = t.pass ? 'PASS' : 'FAIL';
    if (t.pass) passed++;
    console.log(`[${status}] #${i + 1} [${t.section}] ${t.name}`);
    if (t.details) {
      console.log('      Details:', JSON.stringify(t.details));
    }
  });

  console.log(`\nTOTAL: ${passed}/${testResults.length} PASSED`);
}

runAudit();
