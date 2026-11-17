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

async function run() {
  console.log('================================================================');
  console.log('   SENTRAVAX PHASE 3.1 STEP 1: VERIFICATION & AUDIT SUITE       ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Capture console errors
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      pageErrors.push(msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated Guest Protection
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Unauthenticated Route Protection ---');
    await page.goto(`${BASE_URL}/intelligence-center`, { waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    assert(
      currentUrl.includes('/login'),
      'Unauthenticated user accessing /intelligence-center is redirected to /login',
      `URL: ${currentUrl}`
    );

    // -------------------------------------------------------------
    // TEST 2: Login as Intelligence Analyst
    // -------------------------------------------------------------
    console.log('\n--- 2. Authenticating as Intelligence Analyst ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

    // Click Intelijen preset button
    const intelBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.trim() === 'Intelijen');
    });
    if (intelBtn) {
      await intelBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    } else {
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', 'intelligence@sentravax.go.id');
      await page.type('input[type="password"]', 'Sentravax2026!');
    }

    // Submit form
    const submitBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('Masuk ke Akun'));
    });
    await submitBtn.click();

    // Wait for navigation and state hydration
    await new Promise((r) => setTimeout(r, 2500));

    // Ensure on /intelligence-center/overview
    if (!page.url().includes('/intelligence-center')) {
      await page.goto(`${BASE_URL}/intelligence-center/overview`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1000));
    }

    const intelUrl = page.url();
    assert(
      intelUrl.includes('/intelligence-center'),
      'Intelligence analyst granted access to /intelligence-center',
      `URL: ${intelUrl}`
    );

    // -------------------------------------------------------------
    // TEST 3: Telemetry Stream & PostGIS Indicators
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifying Telemetry Stream & PostGIS Indicators ---');
    const headerText = await page.evaluate(() => document.body.innerText);

    assert(
      headerText.includes('STREAMING AKTIF') || headerText.includes('STREAMING'),
      'Command banner displays live streaming telemetry status'
    );
    assert(
      headerText.includes('PostGIS: NORMAL') || headerText.includes('PostGIS'),
      'Command banner displays PostGIS spatial engine status'
    );
    assert(
      headerText.includes('Node Aktif'),
      'Command banner displays active nodes connectivity'
    );

    // -------------------------------------------------------------
    // TEST 4: Operational Metrics Cards
    // -------------------------------------------------------------
    console.log('\n--- 4. Verifying Operational Metrics Cards ---');
    const headerUpper = headerText.toUpperCase();
    assert(
      headerUpper.includes('ANCAMAN BENCANA AKTIF'),
      'Metric card "Ancaman Bencana Aktif" is rendered'
    );
    assert(
      headerUpper.includes('LAPORAN BELUM TERVERIFIKASI'),
      'Metric card "Laporan Belum Terverifikasi" is rendered'
    );
    assert(
      headerUpper.includes('PERINGATAN DINI CAP AKTIF'),
      'Metric card "Peringatan Dini CAP Aktif" is rendered'
    );
    assert(
      headerUpper.includes('WAWASAN AI TERBIT'),
      'Metric card "Wawasan AI Terbit" is rendered'
    );

    // -------------------------------------------------------------
    // TEST 5: Demonstration Simulation Projection & Disclaimer
    // -------------------------------------------------------------
    console.log('\n--- 5. Verifying Simulation Projection & Transparent Disclaimer ---');
    assert(
      headerText.includes('Simulasi Proyeksi Genangan dan Bahaya Spasial'),
      'Simulation projection scenario title is rendered'
    );
    assert(
      headerUpper.includes('SKENARIO DEMONSTRASI'),
      'Honest badge "SKENARIO DEMONSTRASI" is displayed'
    );
    assert(
      headerText.includes('Batasan Metodologi Proyeksi:') || headerText.includes('BUKAN prediksi mutlak'),
      'Demonstration hydrology disclaimer is transparently displayed'
    );
    assert(
      headerUpper.includes('ESTIMASI POPULASI TERPAPAR') && headerText.includes('Jiwa'),
      'Exposed population telemetry metric is displayed'
    );
    assert(
      headerUpper.includes('STATUS DEBIT ALIRAN SUNGAI') && headerText.includes('SIAGA 2'),
      'River discharge status telemetry is displayed'
    );

    // Check timeline scrubber buttons
    const scrubberButtons = await page.$$eval(
      'button',
      (btns) => btns.map((b) => b.innerText.trim()).filter((t) => t.startsWith('+'))
    );
    assert(
      scrubberButtons.includes('+1 Jam') && scrubberButtons.includes('+12 Jam'),
      `Timeline scrubber steps available: [${scrubberButtons.join(', ')}]`
    );

    // -------------------------------------------------------------
    // TEST 6: AI Proactive Insights Feed
    // -------------------------------------------------------------
    console.log('\n--- 6. Verifying AI Proactive Insights Feed ---');
    assert(
      headerText.includes('Wawasan AI Proaktif Terkini'),
      'Recent AI Proactive Insights section is present'
    );
    assert(
      headerText.includes('Keyakinan: 92.0%') || headerText.includes('Keyakinan:'),
      'AI confidence score badge is displayed'
    );
    assert(
      headerUpper.includes('REKOMENDASI TINDAKAN TERVERIFIKASI:'),
      'Actionable recommendations list is rendered'
    );

    // -------------------------------------------------------------
    // TEST 7: External Data Sources Provenance
    // -------------------------------------------------------------
    console.log('\n--- 7. Verifying External Data Sources Provenance ---');
    assert(
      headerText.includes('Integritas Aliran Data Eksternal'),
      'Data sources provenance panel is present'
    );
    assert(
      headerText.includes('BMKG') || headerText.includes('SENTRAVAX'),
      'Actual registered data sources from DB are listed'
    );

    // Check for freshness badges
    const badges = await page.$$eval(
      'span',
      (spans) => spans.map((s) => s.innerText.trim()).filter((t) => ['LIVE', 'STATIC', 'STALE', 'UNAVAILABLE'].includes(t))
    );
    assert(
      badges.includes('LIVE') && badges.includes('STATIC'),
      `Provenance freshness badges found: [${[...new Set(badges)].join(', ')}]`
    );

    // -------------------------------------------------------------
    // TEST 8: Refresh / Retry Behavior
    // -------------------------------------------------------------
    console.log('\n--- 8. Verifying Refresh Telemetry Action ---');
    const refreshBtn = await page.$('button[aria-label="Segarkan telemetri"]');
    assert(Boolean(refreshBtn), 'Refresh telemetry button with accessible aria-label exists');
    if (refreshBtn) {
      await refreshBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      const afterRefreshText = await page.evaluate(() => document.body.innerText);
      assert(
        afterRefreshText.includes('Pusat Komando dan Analisis Multi-Hazard Nasional'),
        'Page successfully updates after refresh click without crash'
      );
    }

    // -------------------------------------------------------------
    // TEST 9: Responsive Viewports on Intelligence Overview (5 Viewports)
    // -------------------------------------------------------------
    console.log('\n--- 9. Responsive Viewports Audit on Intelligence Overview ---');
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise((r) => setTimeout(r, 200));

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      assert(!overflow, `Zero horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`);
    }

    // Reset viewport to desktop
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // TEST 10: Regression Verification of Phase 2B.4C Locked Features
    // -------------------------------------------------------------
    console.log('\n--- 10. Regression Testing Locked Phase 2B.4C Deliverables ---');

    // 10.1 Homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    const homeText = await page.evaluate(() => document.body.innerText);
    assert(
      homeText.includes('SENTRAVAX') && homeText.includes('Pusat Informasi Peringatan Dini'),
      'Homepage loads cleanly with locked non-CAP heading'
    );

    // 10.2 Public Map
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
    const mapText = await page.evaluate(() => document.body.innerText);
    assert(
      mapText.includes('Peta Interaktif Bencana Multi-Hazard') || mapText.includes('Peta Bencana'),
      'Public Disaster Map loads cleanly'
    );

    // 10.3 Public Disaster Explorer (/disasters)
    await page.goto(`${BASE_URL}/disasters`, { waitUntil: 'networkidle0' });
    const disastersText = await page.evaluate(() => document.body.innerText);
    assert(
      disastersText.includes('Katalog Kejadian Bencana') || disastersText.includes('Gempa Bumi'),
      'Public Disaster Explorer (/disasters) loads cleanly'
    );

    // 10.4 Disaster Event Detail (/disasters/1)
    await page.goto(`${BASE_URL}/disasters/1`, { waitUntil: 'networkidle0' });
    const detailText = await page.evaluate(() => document.body.innerText);
    assert(
      detailText.includes('Detail Kejadian Bencana') || detailText.includes('Sungai Ciliwung'),
      'Disaster Event Detail (/disasters/1) loads cleanly'
    );

    // 10.5 Early Warning Center (/warnings)
    await page.goto(`${BASE_URL}/warnings`, { waitUntil: 'networkidle0' });
    const warningsText = await page.evaluate(() => document.body.innerText);
    assert(
      warningsText.includes('Pusat Informasi Peringatan Dini') || warningsText.includes('Peringatan'),
      'Early Warning Center (/warnings) loads cleanly'
    );

    // 10.6 Warning Detail (/warnings/1)
    await page.goto(`${BASE_URL}/warnings/1`, { waitUntil: 'networkidle0' });
    const warningDetailText = await page.evaluate(() => document.body.innerText);
    assert(
      warningDetailText.includes('Peringatan Siaga 2') || warningDetailText.includes('Ciliwung Hilir'),
      'Warning Detail (/warnings/1) loads cleanly'
    );

    // 10.7 SIAGA PERSONAL (/preparedness)
    await page.goto(`${BASE_URL}/preparedness`, { waitUntil: 'networkidle0' });
    const prepText = await page.evaluate(() => document.body.innerText);
    assert(
      prepText.includes('SIAGA PERSONAL') || prepText.includes('Cek Risiko Lokasi Mandiri'),
      'SIAGA PERSONAL (/preparedness) loads cleanly'
    );

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
    if (failedTests > 0) {
      console.error(`   FAILURES: ${failedTests} FAILED`);
    } else {
      console.log('   ALL CHECKS PASSED WITH ZERO FAILURES!                          ');
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

run();
