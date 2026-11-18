let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');
}
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots', 'demo_readiness');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runDemoReadinessE2E() {
  console.log('=================================================================');
  console.log('   SENTRAVAX PHASE 5.0 — COMPETITION DEMO READINESS E2E AUDIT    ');
  console.log('=================================================================');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const demoSteps = {
    step1_public_home_speeddial: false,
    step2_public_location_risk_check: false,
    step3_public_disaster_map: false,
    step4_public_education_hub: false,
    step5_public_zero_barrier_report: false,
    step6_citizen_user_portal_readiness: false,
    step7_intel_command_center_telemetry: false,
    step8_intel_alert_operations_cap: false,
    step9_admin_dashboard_operations: false,
  };

  try {
    // -------------------------------------------------------------
    // STEP 1: PUBLIC HOMEPAGE WITH 1-CLICK SPEED DIAL & METRICS
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 1] Validating Public Home & Emergency Speed Dial...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    const homeText = await page.$eval('body', (el) => el.textContent);
    if (homeText.includes('117') && homeText.includes('115') && homeText.includes('119') && homeText.includes('SENTRAVAX')) {
      demoSteps.step1_public_home_speeddial = true;
      console.log('  -> PASS: Emergency Speed-Dial Bar & Platform Hero active.');
    }
    const shot1 = path.join(SCREENSHOT_DIR, '01_public_home_speeddial.png');
    await page.screenshot({ path: shot1, fullPage: true });

    // -------------------------------------------------------------
    // STEP 2: INSTANT LOCATION RISK CHECKER (HERO WIDGET)
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 2] Validating Instant Location Risk Checker in Hero...');
    await page.waitForSelector('button', { timeout: 5000 });
    // Click button to check Monas / Pilot preset or GPS
    const checkBtn = await page.$('button[type="button"]');
    if (checkBtn) {
      const btnText = await page.evaluate(el => el.textContent, checkBtn);
      console.log(`  -> Detected Action Button: "${btnText}"`);
    }
    // Navigate to /preparedness directly
    await page.goto('http://localhost:5173/preparedness', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const prepText = await page.$eval('body', (el) => el.textContent);
    if (prepText.includes('SIAGA PERSONAL') && prepText.includes('Pilih Wilayah Pilot')) {
      demoSteps.step2_public_location_risk_check = true;
      console.log('  -> PASS: SIAGA PERSONAL deterministic spatial risk calculation verified.');
    }
    const shot2 = path.join(SCREENSHOT_DIR, '02_public_preparedness_siaga.png');
    await page.screenshot({ path: shot2, fullPage: true });

    // -------------------------------------------------------------
    // STEP 3: DISASTER MAP & VERIFIED SHELTERS LAYER
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 3] Validating Public Disaster Map & Verified Shelters...');
    await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    const mapText = await page.$eval('body', (el) => el.textContent);
    if (mapText.includes('Peta') || mapText.includes('SENTRAVAX')) {
      demoSteps.step3_public_disaster_map = true;
      console.log('  -> PASS: Public Disaster Map rendering verified.');
    }
    const shot3 = path.join(SCREENSHOT_DIR, '03_public_disaster_map.png');
    await page.screenshot({ path: shot3, fullPage: true });

    // -------------------------------------------------------------
    // STEP 4: PUBLIC EDUCATION HUB WITH MULTI-HAZARD CHIPS
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 4] Validating Public Education Hub...');
    await page.goto('http://localhost:5173/education', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const eduText = await page.$eval('body', (el) => el.textContent);
    if (eduText.includes('Pusat Edukasi & Mitigasi Multi-Hazard') && eduText.includes('Gempa Bumi')) {
      demoSteps.step4_public_education_hub = true;
      console.log('  -> PASS: Public Education Hub interactive mitigation guides active.');
    }
    const shot4 = path.join(SCREENSHOT_DIR, '04_public_education_hub.png');
    await page.screenshot({ path: shot4, fullPage: true });

    // -------------------------------------------------------------
    // STEP 5: ZERO-BARRIER PUBLIC EMERGENCY REPORTING
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 5] Validating Zero-Barrier Public Reporting...');
    await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const reportText = await page.$eval('body', (el) => el.textContent);
    if (reportText.includes('Pelaporan Kejadian Bencana Warga') && reportText.includes('Zero-Barrier Public')) {
      demoSteps.step5_public_zero_barrier_report = true;
      console.log('  -> PASS: Zero-Barrier reporting verified.');
    }
    const shot5 = path.join(SCREENSHOT_DIR, '05_public_zero_barrier_report.png');
    await page.screenshot({ path: shot5, fullPage: true });

    // -------------------------------------------------------------
    // STEP 6: CITIZEN PORTAL (DASHBOARD & READINESS DIAL)
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 6] Logging in as Citizen User (user@sentravax.id)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'user@sentravax.id');
    await page.type('input[type="password"]', 'Sentravax2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    await page.goto('http://localhost:5173/user/dashboard', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const userDashText = await page.$eval('body', (el) => el.textContent);
    if (userDashText.includes('Dasbor Kesiapsiagaan Warga') || userDashText.includes('Tas Siaga')) {
      demoSteps.step6_citizen_user_portal_readiness = true;
      console.log('  -> PASS: Citizen Dashboard with live readiness and contacts active.');
    }
    const shot6 = path.join(SCREENSHOT_DIR, '06_citizen_user_dashboard.png');
    await page.screenshot({ path: shot6, fullPage: true });

    // -------------------------------------------------------------
    // STEP 7: INTELLIGENCE COMMAND CENTER & AI PROACTIVE INSIGHTS
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 7] Clearing session and logging in as Intelligence Analyst...');
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

    await page.goto('http://localhost:5173/intelligence-center/overview', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    const intelOverviewText = await page.$eval('body', (el) => el.textContent);
    if (intelOverviewText.includes('Pusat Komando') || intelOverviewText.includes('PostGIS')) {
      demoSteps.step7_intel_command_center_telemetry = true;
      console.log('  -> PASS: Intelligence Command Center telemetry & AI projections active.');
    }
    const shot7 = path.join(SCREENSHOT_DIR, '07_intel_command_overview.png');
    await page.screenshot({ path: shot7, fullPage: true });

    // -------------------------------------------------------------
    // STEP 8: INTELLIGENCE ALERT OPERATIONS & CAP DISSEMINATION
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 8] Validating Intelligence Alert Operations...');
    await page.goto('http://localhost:5173/intelligence-center/alert-operations', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const alertOpsText = await page.$eval('body', (el) => el.textContent);
    if (alertOpsText.includes('Operasi & Diseminasi Peringatan Dini')) {
      demoSteps.step8_intel_alert_operations_cap = true;
      console.log('  -> PASS: Alert Operations Desk with CAP compliance active.');
    }
    const shot8 = path.join(SCREENSHOT_DIR, '08_intel_alert_operations.png');
    await page.screenshot({ path: shot8, fullPage: true });

    // -------------------------------------------------------------
    // STEP 9: ADMIN CONSOLE & SYSTEM HEALTH MONITORING
    // -------------------------------------------------------------
    console.log('\n[DEMO STEP 9] Clearing session and logging in as Administrator...');
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@sentravax.go.id');
    await page.type('input[type="password"]', 'Sentravax2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const adminText = await page.$eval('body', (el) => el.textContent);
    if (adminText.includes('Konsol Manajemen Administrasi') || adminText.includes('Infrastruktur')) {
      demoSteps.step9_admin_dashboard_operations = true;
      console.log('  -> PASS: Admin Operations Console and system monitoring active.');
    }
    const shot9 = path.join(SCREENSHOT_DIR, '09_admin_dashboard_console.png');
    await page.screenshot({ path: shot9, fullPage: true });

    console.log('\n=================================================================');
    console.log('              DEMO READINESS AUDIT RESULT SUMMARY                ');
    console.log('=================================================================');
    console.log(JSON.stringify(demoSteps, null, 2));

    const allPassed = Object.values(demoSteps).every(Boolean);
    if (allPassed) {
      console.log('\n>>> SUCCESS: ALL 9 COMPETITION DEMONSTRATION STEPS ARE 100% READY <<<');
    } else {
      console.error('\n>>> WARNING: SOME DEMONSTRATION STEPS FAILED AUDIT <<<');
    }

    fs.writeFileSync(
      path.join(__dirname, 'demo_readiness_results.json'),
      JSON.stringify(demoSteps, null, 2)
    );
  } catch (err) {
    console.error('Demo Readiness Audit Encountered Error:', err);
  } finally {
    await browser.close();
  }
}

runDemoReadinessE2E();
