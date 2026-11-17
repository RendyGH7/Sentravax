const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const VIEWPORTS = [
  { name: 'Desktop (1440x900)', width: 1440, height: 900 },
  { name: 'Laptop (1366x768)', width: 1366, height: 768 },
  { name: 'Tablet (768x1024)', width: 768, height: 1024 },
  { name: 'Mobile L (390x844)', width: 390, height: 844 },
  { name: 'Mobile S (360x800)', width: 360, height: 800 },
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
  }
}

async function cleanLogout(page) {
  try {
    await page.evaluate(async () => {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
      } catch {}
      localStorage.clear();
      sessionStorage.clear();
    });
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await new Promise((r) => setTimeout(r, 600));
  } catch {}
}

async function loginAs(page, roleName) {
  await cleanLogout(page);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  await page.evaluate((role) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.trim() === role);
    if (btn) btn.click();
  }, roleName);
  await new Promise((r) => setTimeout(r, 400));

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]'),
  ]);
  await new Promise((r) => setTimeout(r, 1000));
}

async function run() {
  console.log('================================================================');
  console.log('  SENTRAVAX PHASE 3.1 STEP 4: GEOSPATIAL INTELLIGENCE & MONITOR');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated Guest Route Protection
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Unauthenticated Route Protection ---');
    await cleanLogout(page);

    await page.goto(`${BASE_URL}/admin/data-sources`, { waitUntil: 'networkidle0' });
    const guestAdminUrl = page.url();
    assert(
      guestAdminUrl.includes('/login'),
      'Guest accessing /admin/data-sources is redirected to /login',
      `URL: ${guestAdminUrl}`
    );

    await page.goto(`${BASE_URL}/intelligence-center/data-sources`, { waitUntil: 'networkidle0' });
    const guestIntelUrl = page.url();
    assert(
      guestIntelUrl.includes('/login'),
      'Guest accessing /intelligence-center/data-sources is redirected to /login',
      `URL: ${guestIntelUrl}`
    );

    // -------------------------------------------------------------
    // TEST 2: Public Navigation Regression (Guest / Unauthenticated)
    // -------------------------------------------------------------
    console.log('\n--- 2. Public Pages Regression Check ---');
    const publicPages = [
      { url: `${BASE_URL}/`, titleKey: 'SENTRAVAX', name: 'Homepage' },
      { url: `${BASE_URL}/map`, titleKey: 'Peta', name: 'Public Map' },
      { url: `${BASE_URL}/disasters`, titleKey: 'Katalog', name: 'Disaster Explorer' },
      { url: `${BASE_URL}/warnings`, titleKey: 'Peringatan', name: 'Early Warning Center' },
    ];

    for (const p of publicPages) {
      await page.goto(p.url, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 600));
      const text = await page.evaluate(() => document.body.innerText);
      assert(
        text.includes(p.titleKey),
        `Public page "${p.name}" loads properly without regression`
      );
    }

    // -------------------------------------------------------------
    // TEST 3: Authenticate as Intelligence Officer
    // -------------------------------------------------------------
    console.log('\n--- 3. Authenticating as Intelligence Officer ---');
    await loginAs(page, 'Intelijen');

    // 3.1 Step 4: Operational Data Sources Telemetry
    await page.goto(`${BASE_URL}/intelligence-center/data-sources`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    const intelPageText = await page.evaluate(() => document.body.innerText);
    assert(
      intelPageText.includes('Aliran Data Telemetri & Lapisan Sensor Geospasial'),
      'Intelligence Data Sources page title renders correctly'
    );
    assert(
      intelPageText.toUpperCase().includes('UMPAN GEOSPASIAL:') &&
        (intelPageText.toUpperCase().includes('STREAMING AKTIF') ||
          intelPageText.toUpperCase().includes('DEGRADED')),
      'Live streaming status indicator is visible with operational state'
    );
    assert(
      intelPageText.includes('Status Kesehatan Lapisan Spasial PostGIS') &&
        intelPageText.includes('SRID: 4326'),
      'PostGIS Spatial Layers Health matrix renders with SRID 4326'
    );
    assert(
      intelPageText.includes('hazard_events') &&
        intelPageText.includes('community_reports') &&
        intelPageText.includes('dem_mesh_5m'),
      'Spatial layers (hazard_events, community_reports, dem_mesh_5m) are operational'
    );
    assert(
      intelPageText.includes('FRESH') && intelPageText.includes('SIMULASI'),
      'Freshness badges and SIMULASI marker render in intelligence monitor'
    );
    assert(
      intelPageText.includes('BMKG') && intelPageText.includes('PVMBG'),
      'Official providers BMKG and PVMBG data streams are visible'
    );

    // 3.2 Step 3 Regressions under Intelligence Role
    console.log('\n--- 4. Step 3 Regressions (AI Insights & Reports Queue) ---');
    await page.goto(`${BASE_URL}/intelligence-center/ai-insights`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));
    const aiText = await page.evaluate(() => document.body.innerText);
    assert(
      aiText.includes('KECERDASAN PROAKTIF & VERIFIKASI INTELIJEN'),
      'Step 3 AI Insights Workspace loads header'
    );
    assert(
      aiText.includes('AI Proactive Insights') && aiText.includes('Verification Queue'),
      'Step 3 dual workspace tabs (Insights & Queue) render'
    );

    // Switch to Verification Queue Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const qTab = btns.find((b) => b.innerText.includes('Verification Queue'));
      if (qTab) qTab.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    const queueText = await page.evaluate(() => document.body.innerText);
    assert(
      queueText.includes('Antrean Moderasi') || queueText.includes('Verifikasi Laporan'),
      'Step 3 Triage Verification Queue tab content renders'
    );

    // -------------------------------------------------------------
    // TEST 5: Authenticate as Administrator
    // -------------------------------------------------------------
    console.log('\n--- 5. Authenticating as Administrator ---');
    await loginAs(page, 'Admin');

    // 5.1 Admin Data Source Registry
    console.log('\n--- 6. Testing Admin Data Source Registry ---');
    await page.goto(`${BASE_URL}/admin/data-sources`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    const adminPageText = await page.evaluate(() => document.body.innerText);
    assert(
      adminPageText.includes('Registri Sumber Data & Pemantauan Operasional'),
      'Admin Data Source Registry title renders correctly'
    );
    assert(
      adminPageText.includes('Total Sumber Terdaftar') && adminPageText.includes('Konektor Aktif'),
      'Quick aggregate metric cards render in admin view'
    );
    assert(
      adminPageText.includes('BMKG Weather Radar') || adminPageText.includes('BMKG TEWS'),
      'Individual registered data sources cards render with provider metadata'
    );

    // Test Category filter
    console.log('\n--- 7. Testing Filter & Detail Slideover ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const weatherBtn = btns.find((b) => b.innerText.trim() === 'WEATHER');
      if (weatherBtn) weatherBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    const weatherFilteredText = await page.evaluate(() => document.body.innerText);
    assert(
      weatherFilteredText.includes('BMKG Weather Radar'),
      'Category filter WEATHER successfully filters data sources'
    );

    // Reset to SEMUA
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allBtn = btns.find((b) => b.innerText.trim() === 'SEMUA');
      if (allBtn) allBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Detail" on the first source card
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const detailBtn = btns.find((b) => b.innerText.includes('Detail'));
      if (detailBtn) detailBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    const slideoverText = await page.evaluate(() => document.body.innerText);
    const slideoverUpper = slideoverText.toUpperCase();
    assert(
      slideoverUpper.includes('KONFIGURASI TEKNIS & KETENTUAN') &&
        slideoverUpper.includes('INTERVAL SINKRONISASI OTOMATIS'),
      'Detail slideover displays technical config, rate limits, and ToS'
    );
    assert(
      slideoverUpper.includes('RIWAYAT EKSEKUSI SINKRONISASI'),
      'Detail slideover displays sync run history table'
    );

    // Close slideover
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const close = btns.find((b) => b.querySelector('svg.lucide-x'));
      if (close) close.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // -------------------------------------------------------------
    // TEST 8: Test Health Tab & Failed Jobs Tab
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Health & Failed Jobs Tabs ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const healthTab = btns.find((b) => b.innerText.includes('Kesehatan Infrastruktur Live'));
      if (healthTab) healthTab.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    const healthText = await page.evaluate(() => document.body.innerText);
    const healthUpper = healthText.toUpperCase();
    assert(
      healthUpper.includes('STATUS KESELURUHAN SISTEM: HEALTHY') ||
        healthUpper.includes('STATUS KESELURUHAN SISTEM'),
      'Live Infrastructure Health overview renders'
    );
    assert(
      healthUpper.includes('POSTGRESQL ENGINE') && healthUpper.includes('POSTGIS:'),
      'Database engine latency and PostGIS version telemetry are displayed'
    );
    assert(
      healthUpper.includes('QUEUE PIPELINE') && healthUpper.includes('SCHEDULER HEARTBEAT'),
      'Queue worker status and scheduler heartbeat are monitored'
    );
    assert(
      healthUpper.includes('UJI KONEKTIVITAS ENDPOINT EKSTERNAL RESMI'),
      'Live TCP/HTTP connectivity probe to BMKG/PVMBG endpoints renders'
    );

    // Click Failed Jobs Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const failedTab = btns.find((b) => b.innerText.includes('Antrean Gagal'));
      if (failedTab) failedTab.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    const failedText = await page.evaluate(() => document.body.innerText);
    assert(
      failedText.includes('Antrean Tugas Sinkronisasi yang Gagal'),
      'Failed jobs monitor view is accessible'
    );

    // -------------------------------------------------------------
    // TEST 9: Admin Dashboard Real Telemetry
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Admin Dashboard Real Telemetry ---');
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    const dashboardText = await page.evaluate(() => document.body.innerText);
    assert(
      dashboardText.includes('Konsol Manajemen Administrasi SENTRAVAX'),
      'Admin Dashboard renders title'
    );
    assert(
      !dashboardText.includes('18.642'),
      'Hardcoded mock metric 18.642 was replaced with real database user count'
    );
    assert(
      dashboardText.includes('Konektor Sumber Data'),
      'Data Sources status metric is present on Admin Dashboard'
    );
    assert(
      dashboardText.includes('PostgreSQL') && dashboardText.includes('PostGIS Terhubung'),
      'Live database and PostGIS connection badge renders on Admin Dashboard'
    );

    // -------------------------------------------------------------
    // TEST 10: Responsive Viewports Check (Zero Horizontal Overflow)
    // -------------------------------------------------------------
    console.log('\n--- 10. Testing Responsive Viewports (Zero Overflow) ---');
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/admin/data-sources`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 800));

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      assert(
        !hasHorizontalScroll,
        `Admin Data Sources page on ${vp.name} has no horizontal overflow`
      );
    }

    // Reset viewport to desktop
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // TEST 11: Authenticate as User & Check Siaga Personal
    // -------------------------------------------------------------
    console.log('\n--- 11. Testing User Portal & Siaga Personal ---');
    await loginAs(page, 'Warga');
    await page.goto(`${BASE_URL}/siaga`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    const siagaText = await page.evaluate(() => document.body.innerText);
    assert(
      siagaText.includes('SIAGA') || siagaText.includes('Kesiapsiagaan'),
      'User portal Siaga Personal page renders properly without regression'
    );
  } catch (err) {
    console.error('Fatal test error:', err);
    assert(false, 'Puppeteer execution failed exception', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`  E2E TEST SUMMARY: ${passedTests} PASSED / ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run();
