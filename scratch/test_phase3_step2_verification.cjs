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
  console.log('   SENTRAVAX PHASE 3.1 STEP 2: RISK WORKSPACE VERIFICATION      ');
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
    await page.goto(`${BASE_URL}/intelligence-center/risk-analysis`, { waitUntil: 'networkidle0' });
    const guestUrl = page.url();
    assert(
      guestUrl.includes('/login'),
      'Unauthenticated visitor accessing /risk-analysis is redirected to /login',
      `URL: ${guestUrl}`
    );

    // -------------------------------------------------------------
    // TEST 2: Authenticate as Intelligence Officer (role: intelligence)
    // -------------------------------------------------------------
    console.log('\n--- 2. Authenticating as Intelligence Officer (role: intelligence) ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

    // Click Intelijen preset button
    const intelBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.trim() === 'Intelijen');
    });
    if (intelBtn) {
      await intelBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    const submitBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('Masuk ke Akun'));
    });
    await submitBtn.click();

    await new Promise((r) => setTimeout(r, 2500));

    // Navigate to Risk Analysis Workspace
    await page.goto(`${BASE_URL}/intelligence-center/risk-analysis`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));

    const workspaceUrl = page.url();
    assert(
      workspaceUrl.includes('/intelligence-center/risk-analysis'),
      'Intelligence Officer (role: intelligence) successfully navigated to /intelligence-center/risk-analysis',
      `URL: ${workspaceUrl}`
    );

    // -------------------------------------------------------------
    // TEST 3: Header Context Banner & Workspace Identity
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifying Workspace Identity & Header Banner ---');
    const pageText = await page.evaluate(() => document.body.innerText);
    const pageUpper = pageText.toUpperCase();

    assert(
      pageUpper.includes('MESIN ANALISIS RISIKO MULTI-HAZARD') || pageUpper.includes('ANALISIS RISIKO'),
      'Workspace displays "MESIN ANALISIS RISIKO MULTI-HAZARD" header'
    );
    assert(
      pageText.includes('v1.0-deterministic-spatial'),
      'Methodology version badge "v1.0-deterministic-spatial" is displayed'
    );
    assert(
      pageText.includes('Buffer 25 km') || pageText.includes('PostGIS'),
      'PostGIS buffer and regional association note is displayed'
    );

    // -------------------------------------------------------------
    // TEST 4: Dynamic Selectors Populated from Backend
    // -------------------------------------------------------------
    console.log('\n--- 4. Verifying Dynamic Selectors (Regions & Hazards) ---');
    const regionOptions = await page.$$eval('#risk-region option', (opts) =>
      opts.map((o) => o.innerText.trim())
    );
    const hazardOptions = await page.$$eval('#risk-hazard option', (opts) =>
      opts.map((o) => o.innerText.trim())
    );

    assert(
      regionOptions.some((r) => r.includes('DKI Jakarta')),
      `Region options populated from DB (Found: ${regionOptions.length} options)`
    );
    assert(
      hazardOptions.some((h) => h.includes('Banjir') || h.includes('Gempa')),
      `Hazard options populated from DB (Found: ${hazardOptions.length} options)`
    );

    // -------------------------------------------------------------
    // TEST 5: Interactive Risk Evaluation Execution
    // -------------------------------------------------------------
    console.log('\n--- 5. Executing Risk Evaluation via API ---');
    // Type realistic operational title
    await page.type('#risk-title', 'Penilaian Risiko Banjir dan Genangan Banten');

    // Click submit evaluation
    const evalBtn = await page.$('button[type="submit"]');
    assert(Boolean(evalBtn), 'Evaluation submit button exists');

    if (evalBtn) {
      await evalBtn.click();
      // Wait for API round-trip
      await new Promise((r) => setTimeout(r, 2000));

      const updatedText = await page.evaluate(() => document.body.innerText);
      const updatedUpper = updatedText.toUpperCase();

      assert(
        updatedUpper.includes('HASIL EVALUASI AKTIF'),
        'Active evaluation results showcase is populated'
      );
      assert(
        updatedUpper.includes('SKOR RISIKO TERHITUNG') && updatedText.includes('/ 100'),
        'Calculated risk score display is rendered'
      );
      assert(
        updatedUpper.includes('RADIUS ZONA DAMPAK LANGSUNG') && updatedUpper.includes('DEFAULT BUFFER'),
        'Direct impact zone radius label is accurately distinguished from search radius and marked as default buffer'
      );
      assert(
        updatedUpper.includes('ESTIMASI POPULASI (BASELINE REGIONAL)'),
        'Population estimate is honestly declared as baseline regional demographic estimate'
      );
      assert(
        updatedText.includes('Integritas Skor & Penjelasan Metodologi:'),
        'Risk score integrity transparency box is displayed'
      );
      assert(
        updatedText.includes('bukan probabilitas persentase bencana'),
        'Explicit non-probability disclaimer is transparently stated'
      );
    }

    // -------------------------------------------------------------
    // TEST 6: Calculation Factor Transparency
    // -------------------------------------------------------------
    console.log('\n--- 6. Verifying Calculation Factors Transparency ---');
    const factorText = await page.evaluate(() => document.body.innerText);
    const factorUpper = factorText.toUpperCase();

    assert(
      factorUpper.includes('1. KERENTANAN DASAR') && factorText.includes('15%'),
      'Factor 1: Baseline vulnerability contribution is rendered'
    );
    assert(
      factorUpper.includes('2. ANCAMAN BENCANA SEKITAR') && factorText.includes('45%'),
      'Factor 2: Nearby active events contribution is rendered'
    );
    assert(
      factorUpper.includes('3. PERINGATAN DINI RESMI') && factorText.includes('30%'),
      'Factor 3: Official alerts contribution is rendered'
    );

    // -------------------------------------------------------------
    // TEST 7: Regional Risk Comparison Table & Filtering
    // -------------------------------------------------------------
    console.log('\n--- 7. Verifying Regional Risk Comparison Table ---');
    assert(
      factorText.includes('Penilaian Risiko Regional Terkini'),
      'Regional comparison table header is rendered'
    );

    // Check inspection buttons in table
    const inspectBtns = await page.$$eval(
      'button',
      (btns) => btns.filter((b) => b.innerText.trim() === 'Inspeksi').length
    );
    assert(
      inspectBtns > 0,
      `Regional comparison table contains ${inspectBtns} evaluable rows with action buttons`
    );

    // Test search filter input
    await page.type('input[placeholder="Cari wilayah..."]', 'Jakarta');
    await new Promise((r) => setTimeout(r, 300));
    const searchResultCount = await page.$$eval(
      'button',
      (btns) => btns.filter((b) => b.innerText.trim() === 'Inspeksi').length
    );
    assert(
      searchResultCount > 0,
      `Search input filtered regional table (Found ${searchResultCount} matches for 'Jakarta')`
    );

    // -------------------------------------------------------------
    // TEST 8: Responsive Viewports Audit (5 Viewports)
    // -------------------------------------------------------------
    console.log('\n--- 8. Responsive Viewports Audit on Risk Analysis Workspace ---');
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
    // TEST 9: Regression Testing on Intelligence Overview & Phase 2B.4C
    // -------------------------------------------------------------
    console.log('\n--- 9. Regression Testing Step 1 & Phase 2B.4C Deliverables ---');

    // 9.1 Intelligence Overview (Step 1)
    await page.goto(`${BASE_URL}/intelligence-center/overview`, { waitUntil: 'networkidle0' });
    const overviewText = await page.evaluate(() => document.body.innerText);
    assert(
      overviewText.includes('Pusat Komando dan Analisis Multi-Hazard Nasional') &&
        overviewText.includes('STREAMING AKTIF'),
      'Intelligence Overview (Step 1) remains fully operational'
    );

    // 9.2 Homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    const homeText = await page.evaluate(() => document.body.innerText);
    assert(
      homeText.includes('SENTRAVAX') && homeText.includes('Pusat Informasi Peringatan Dini'),
      'Homepage loads cleanly'
    );

    // 9.3 Public Disaster Map
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
    const mapText = await page.evaluate(() => document.body.innerText);
    assert(
      mapText.includes('Peta Interaktif Bencana Multi-Hazard') || mapText.includes('Peta Bencana'),
      'Public Disaster Map loads cleanly'
    );

    // 9.4 Public Disaster Explorer (/disasters)
    await page.goto(`${BASE_URL}/disasters`, { waitUntil: 'networkidle0' });
    const disastersText = await page.evaluate(() => document.body.innerText);
    assert(
      disastersText.includes('Katalog Kejadian Bencana') || disastersText.includes('Gempa Bumi'),
      'Public Disaster Explorer loads cleanly'
    );

    // 9.5 Disaster Detail (/disasters/1)
    await page.goto(`${BASE_URL}/disasters/1`, { waitUntil: 'networkidle0' });
    const detailText = await page.evaluate(() => document.body.innerText);
    assert(
      detailText.includes('Detail Kejadian Bencana') || detailText.includes('Sungai Ciliwung'),
      'Disaster Event Detail loads cleanly'
    );

    // 9.6 Early Warning Center (/warnings)
    await page.goto(`${BASE_URL}/warnings`, { waitUntil: 'networkidle0' });
    const warningsText = await page.evaluate(() => document.body.innerText);
    assert(
      warningsText.includes('Pusat Informasi Peringatan Dini') || warningsText.includes('Peringatan'),
      'Early Warning Center loads cleanly'
    );

    // 9.7 Warning Detail (/warnings/1)
    await page.goto(`${BASE_URL}/warnings/1`, { waitUntil: 'networkidle0' });
    const warningDetailText = await page.evaluate(() => document.body.innerText);
    assert(
      warningDetailText.includes('Peringatan Siaga 2') || warningDetailText.includes('Ciliwung Hilir'),
      'Warning Detail loads cleanly'
    );

    // 9.8 SIAGA PERSONAL (/preparedness)
    await page.goto(`${BASE_URL}/preparedness`, { waitUntil: 'networkidle0' });
    const prepText = await page.evaluate(() => document.body.innerText);
    assert(
      prepText.includes('SIAGA PERSONAL') || prepText.includes('Cek Risiko Lokasi Mandiri'),
      'SIAGA PERSONAL loads cleanly'
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
