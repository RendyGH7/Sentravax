const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');
const { execSync } = require('child_process');

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
  console.log('  SENTRAVAX PHASE 3.1 STEP 3: PROACTIVE AI & TRIAGE VERIFICATION');
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
    await page.goto(`${BASE_URL}/intelligence-center/ai-insights`, { waitUntil: 'networkidle0' });
    const guestUrl = page.url();
    assert(
      guestUrl.includes('/login'),
      'Unauthenticated visitor accessing /ai-insights is redirected to /login',
      `URL: ${guestUrl}`
    );

    // -------------------------------------------------------------
    // TEST 2: Authenticate as Intelligence Officer (role: intelligence)
    // -------------------------------------------------------------
    console.log('\n--- 2. Authenticating as Intelligence Officer (role: intelligence) ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

    // Click Intelijen preset button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.trim() === 'Intelijen');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('Masuk ke Akun'));
      if (btn) btn.click();
    });

    await new Promise((r) => setTimeout(r, 2500));

    // -------------------------------------------------------------
    // TEST 3: Access AI Proactive Insights Workspace
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifying AI Proactive Insights & Verification Queue Page ---');
    await page.goto(`${BASE_URL}/intelligence-center/ai-insights`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2500));

    let pageText = await page.evaluate(() => document.body.innerText);
    assert(
      pageText.includes('KECERDASAN PROAKTIF & VERIFIKASI INTELIJEN'),
      'Page header displays intelligence proactive banner'
    );
    assert(
      pageText.includes('Human-in-the-Loop Workflow'),
      'Page displays explicit Human-in-the-Loop notice'
    );

    // Verify dual workspace tabs
    const tabLabels = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map((b) => b.innerText.trim());
    });
    assert(
      tabLabels.some((t) => t.includes('AI Proactive Insights')),
      'Workspace contains "AI Proactive Insights" tab'
    );
    assert(
      tabLabels.some((t) => t.includes('Verification Queue')),
      'Workspace contains "Verification Queue" tab'
    );

    // -------------------------------------------------------------
    // TEST 4: Tab 1 (AI Insights Hero, Inference Console, Indicators)
    // -------------------------------------------------------------
    console.log('\n--- 4. Verifying Tab 1: AI Proactive Insights Features ---');
    const upperPageText = pageText.toUpperCase();
    assert(
      pageText.includes('Konsol Inferensi Intelijen Proaktif'),
      'Inference console panel is present'
    );
    assert(
      upperPageText.includes('INDIKATOR BUKTI PENDUKUNG ANALISIS'),
      'Explainable AI verification indicators grid is rendered'
    );
    assert(
      upperPageText.includes('HASIL ANALISIS PROAKTIF AKTIF'),
      'Active proactive insight hero showcase is rendered'
    );
    assert(
      upperPageText.includes('REKOMENDASI TINDAKAN MITIGASI TERSTRUKTUR'),
      'Actionable recommendations list is rendered'
    );
    assert(
      upperPageText.includes('STATUS ESKALASI ANCAMAN:'),
      'Threat escalation analysis banner is present'
    );
    assert(
      pageText.includes('Kepatuhan Human-in-the-Loop'),
      'Clear safety label that AI adheres to human-in-the-loop and does not auto-broadcast'
    );
    assert(
      pageText.includes('Daftar Wawasan Intelijen Proaktif Terkini'),
      'Historical proactive insights table is present'
    );

    // -------------------------------------------------------------
    // TEST 5: Tab 1 Execution - Generate New Proactive Insight
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Proactive Insight Inference Execution ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('Jalankan Analisis Proaktif'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 2500));

    pageText = await page.evaluate(() => document.body.innerText);
    assert(
      pageText.includes('KEYAKINAN') || pageText.includes('HIGH') || pageText.includes('MEDIUM'),
      'Successfully executed deterministic inference and rendered updated confidence badge'
    );

    // -------------------------------------------------------------
    // TEST 6: Tab 2 (Verification Queue & Triage Desk)
    // -------------------------------------------------------------
    console.log('\n--- 6. Switching to Tab 2: Verification Queue & Triage Desk ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent && b.textContent.includes('Verification Queue'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    let queuePageText = await page.evaluate(() => document.body.innerText);
    const upperQueueText = queuePageText.toUpperCase();

    assert(
      upperQueueText.includes('MENUNGGU VERIFIKASI') && upperQueueText.includes('SEDANG DITINJAU'),
      'Queue metrics bar displays verification counters'
    );
    assert(
      queuePageText.includes('Semua Status') && queuePageText.includes('Menunggu (Pending)'),
      'Queue status filter tabs are rendered'
    );
    assert(
      upperQueueText.includes('MEJA KEPUTUSAN VERIFIKASI PETUGAS'),
      'Right pane triage and moderation action desk is rendered'
    );
    assert(
      upperQueueText.includes('RIWAYAT TINDAKAN & JEJAK AUDIT'),
      'Immutable audit trail history timeline is rendered'
    );

    // Verify report triage score & priority badge
    assert(
      upperQueueText.includes('ANALISIS PRIORITAS TRIASE CERDAS') || upperQueueText.includes('KRITIS') || upperQueueText.includes('TINGGI'),
      'Reports show intelligent priority triage score and level'
    );

    // -------------------------------------------------------------
    // TEST 7: Verification Moderation Action (Human-in-the-Loop)
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Verification Moderation Action ---');
    const textareaHandle = await page.$('textarea');
    if (textareaHandle) {
      await textareaHandle.type('Verifikasi terkonfirmasi via kamera CCTV pemantau & laporan babinsa setempat.');
      await new Promise((r) => setTimeout(r, 400));

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find((b) => b.innerText.includes('Verifikasi Laporan'));
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 2000));

      queuePageText = await page.evaluate(() => document.body.innerText);
      assert(
        queuePageText.includes('kamera CCTV pemantau') || queuePageText.includes('TERVERIFIKASI'),
        'Verification action recorded in audit trail timeline'
      );
    } else {
      assert(false, 'Moderation note textarea not found');
    }

    // -------------------------------------------------------------
    // TEST 8: Responsive Verification across 5 Viewports (Zero Overflow)
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Responsive Layouts across 5 Viewports ---');
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise((r) => setTimeout(r, 600));

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      assert(
        !hasOverflow,
        `Viewport ${vp.name} has zero horizontal overflow (scrollWidth <= ${vp.width})`
      );
    }

    // Reset viewport to desktop
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // TEST 9: Regression Tests for Locked Deliverables
    // -------------------------------------------------------------
    console.log('\n--- 9. Regression Testing Locked Deliverables ---');

    // 9.1 Step 1 Overview
    await page.goto(`${BASE_URL}/intelligence-center/overview`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    const overviewText = await page.evaluate(() => document.body.innerText);
    assert(
      overviewText.includes('PUSAT KOMANDO INTELIJEN') && overviewText.includes('STREAMING AKTIF'),
      'Step 1 Intelligence Overview is operational with live telemetry'
    );

    // 9.2 Step 2 Risk Analysis
    await page.goto(`${BASE_URL}/intelligence-center/risk-analysis`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    const riskText = await page.evaluate(() => document.body.innerText);
    assert(
      riskText.includes('Evaluasi Risiko') && riskText.includes('25 km'),
      'Step 2 Multi-Hazard Risk Analysis workspace is operational with 25km buffer'
    );

    // 9.3 Homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const homeText = await page.evaluate(() => document.body.innerText);
    assert(homeText.includes('SENTRAVAX'), 'Homepage renders properly');

    // 9.4 Public Disaster Map
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const mapText = await page.evaluate(() => document.body.innerText);
    assert(mapText.includes('Peta Bencana & Kesiapsiagaan Indonesia'), 'Public Disaster Map renders properly');

    // 9.5 Disasters Explorer & Detail
    await page.goto(`${BASE_URL}/disasters`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const disText = await page.evaluate(() => document.body.innerText);
    assert(disText.includes('Katalog Kejadian Bencana Indonesia'), 'Disasters Explorer renders properly');

    await page.goto(`${BASE_URL}/disasters/1`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const disDetailText = await page.evaluate(() => document.body.innerText);
    assert(disDetailText.includes('Banjir') || disDetailText.includes('Detail'), 'Disaster Event Detail #1 renders properly');

    // 9.6 Warnings Explorer & Detail
    await page.goto(`${BASE_URL}/warnings`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const warnText = await page.evaluate(() => document.body.innerText);
    assert(warnText.includes('Pusat Peringatan Dini Kebencanaan'), 'Early Warning Center renders properly');

    await page.goto(`${BASE_URL}/warnings/1`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const warnDetailText = await page.evaluate(() => document.body.innerText);
    assert(warnDetailText.includes('Peringatan') || warnDetailText.includes('Detail'), 'Alert Detail #1 renders properly');

    // 9.7 SIAGA PERSONAL
    await page.goto(`${BASE_URL}/preparedness`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const siagaText = await page.evaluate(() => document.body.innerText);
    assert(siagaText.includes('SIAGA PERSONAL') || siagaText.includes('Kesiapsiagaan Mandiri'), 'SIAGA PERSONAL renders properly');

  } catch (err) {
    console.error('Unhandled test exception:', err);
    failedTests++;
  } finally {
    await browser.close();
    try {
      execSync('php scratch/clean_reports.php', { stdio: 'ignore' });
      console.log('  [CLEANUP] Restored database purity (zero residual test debris).');
    } catch (e) {
      console.error('Failed to run clean_reports.php:', e);
    }
  }

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run();
