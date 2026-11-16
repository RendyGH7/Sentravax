const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runNormalizationTest() {
  console.log('================================================================');
  console.log('   VERIFIKASI NORMALISASI BROADCAST_LEVEL (PHASE 2B.4C)         ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const testResults = [];

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 15000 });

    // Test 1: Direct in-page verification of publicService.getAlerts()
    console.log('--- TEST 1: Service Layer API Response Normalization ---');
    const serviceAudit = await page.evaluate(async () => {
      // Dynamic import public-service module from Vite
      const module = await import('/src/services/public-service.ts');
      const { publicService, normalizeBroadcastLevel } = module;

      // Unit test normalizeBroadcastLevel
      const unitTests = {
        local: normalizeBroadcastLevel('local') === 'local',
        regional: normalizeBroadcastLevel('regional') === 'regional',
        national: normalizeBroadcastLevel('national') === 'national',
        warningNeverRegional: normalizeBroadcastLevel('warning') === null,
        warningIsNull: normalizeBroadcastLevel('warning') === null,
        advisoryIsNull: normalizeBroadcastLevel('advisory') === null,
        watchIsNull: normalizeBroadcastLevel('watch') === null,
        nullIsNull: normalizeBroadcastLevel(null) === null,
        undefinedIsNull: normalizeBroadcastLevel(undefined) === null,
        randomIsNull: normalizeBroadcastLevel('random_scope') === null,
      };

      // Call live getAlerts()
      const alertsData = await publicService.getAlerts({ per_page: 10 });
      const items = alertsData.data || [];

      // Find alert 1 (which in backend has broadcast_level = 'warning')
      const alert1 = items.find((a) => a.id === 1);
      const alert2 = items.find((a) => a.id === 2);
      const alert3 = items.find((a) => a.id === 3);

      return {
        unitTests,
        alert1_id: alert1?.id,
        alert1_broadcast_level: alert1?.broadcast_level,
        alert1_is_null: alert1?.broadcast_level === null,
        alert1_never_regional: alert1?.broadcast_level !== 'regional',
        alert2_broadcast_level: alert2?.broadcast_level,
        alert3_broadcast_level: alert3?.broadcast_level,
      };
    });

    console.log('Unit test results:', serviceAudit.unitTests);
    console.log('Alert 1 normalized level:', serviceAudit.alert1_broadcast_level);
    console.log('Alert 2 normalized level:', serviceAudit.alert2_broadcast_level);
    console.log('Alert 3 normalized level:', serviceAudit.alert3_broadcast_level);

    const allUnitsPass = Object.values(serviceAudit.unitTests).every(Boolean);
    testResults.push({
      name: 'normalizeBroadcastLevel unit tests: valid scopes pass, warning/advisory/null map to null',
      pass: allUnitsPass,
      details: serviceAudit.unitTests,
    });

    testResults.push({
      name: "Alert #1 (backend has 'warning') MUST have broadcast_level === null (NEVER 'regional')",
      pass: serviceAudit.alert1_is_null && serviceAudit.alert1_never_regional,
      details: {
        alert1_id: serviceAudit.alert1_id,
        alert1_broadcast_level: serviceAudit.alert1_broadcast_level,
        alert1_is_null: serviceAudit.alert1_is_null,
      },
    });

    testResults.push({
      name: "Alert #2 and #3 (backend has 'regional') MUST preserve broadcast_level === 'regional'",
      pass: serviceAudit.alert2_broadcast_level === 'regional' && serviceAudit.alert3_broadcast_level === 'regional',
      details: {
        alert2_broadcast_level: serviceAudit.alert2_broadcast_level,
        alert3_broadcast_level: serviceAudit.alert3_broadcast_level,
      },
    });

    // Test 2: Verify getAlertDetail normalization
    console.log('\n--- TEST 2: Single Alert Detail API Normalization ---');
    const detailAudit = await page.evaluate(async () => {
      const module = await import('/src/services/public-service.ts');
      const { publicService } = module;

      const detail1 = await publicService.getAlertDetail(1);
      const detail2 = await publicService.getAlertDetail(2);

      return {
        detail1_broadcast_level: detail1?.broadcast_level,
        detail1_is_null: detail1?.broadcast_level === null,
        detail1_never_regional: detail1?.broadcast_level !== 'regional',
        detail2_broadcast_level: detail2?.broadcast_level,
        detail2_is_regional: detail2?.broadcast_level === 'regional',
      };
    });

    console.log('Detail 1 normalized level:', detailAudit.detail1_broadcast_level);
    console.log('Detail 2 normalized level:', detailAudit.detail2_broadcast_level);

    testResults.push({
      name: "getAlertDetail(1) MUST return broadcast_level === null (NEVER 'regional')",
      pass: detailAudit.detail1_is_null && detailAudit.detail1_never_regional,
      details: detailAudit,
    });

    testResults.push({
      name: "getAlertDetail(2) MUST preserve broadcast_level === 'regional'",
      pass: detailAudit.detail2_is_regional,
      details: detailAudit,
    });

    console.log('\n================================================================');
    console.log('             VERIFIKASI NORMALISASI RINGKASAN                  ');
    console.log('================================================================');
    let allPassed = true;
    for (const [idx, t] of testResults.entries()) {
      const status = t.pass ? '[PASS]' : '[FAIL]';
      if (!t.pass) allPassed = false;
      console.log(`${status} #${idx + 1} ${t.name}`);
      console.log(`      Details: ${JSON.stringify(t.details)}`);
    }

    console.log(`\nHASIL AKHIR: ${testResults.filter((t) => t.pass).length}/${testResults.length} LULUS`);

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

runNormalizationTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
