const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

(async () => {
  console.log('================================================================');
  console.log('   SENTRAVAX PHASE 2B.3: REMEDIATION VERIFICATION SUITE         ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('401') && !txt.includes('Unauthorized')) {
        consoleErrors.push(txt);
      }
    }
  });

  const results = [];

  try {
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // TEST 1: Jakarta In-Pilot - Score Reconciliation & Association
    // -------------------------------------------------------------
    console.log('--- TEST 1: Jakarta In-Pilot & Reconciled Calculation ---');
    await page.goto('http://localhost:5173/preparedness', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('span.text-4xl.sm\\:text-5xl', { timeout: 10000 });

    const scoreText = await page.$eval('span.text-4xl.sm\\:text-5xl', el => el.innerText.trim());
    const riskBadge = await page.$eval('div.lg\\:col-span-5 span.rounded-full', el => el.innerText.trim());
    const regionTitle = await page.$eval('h3.text-lg.font-extrabold', el => el.innerText.trim());
    const reconText = await page.$eval('div.p-2\\.5.rounded-lg.bg-\\[\\#F9FAFB\\]', el => el.innerText.trim());

    const parsedScore = parseFloat(scoreText);
    const hasReconciled = reconText.includes('Total Rekonsiliasi') && reconText.includes(scoreText);

    results.push({
      id: 1,
      name: 'Jakarta In-Pilot: Correct Siaga level, pilot association radius title, and exact reconciled score',
      pass: parsedScore >= 50 && parsedScore <= 60 && riskBadge.includes('Siaga') && regionTitle.includes('DKI Jakarta') && hasReconciled,
      details: { scoreText, riskBadge, regionTitle, reconText }
    });

    // -------------------------------------------------------------
    // TEST 2: Papua Out-of-Coverage - Must NOT Imply Normal/Low Risk
    // -------------------------------------------------------------
    console.log('--- TEST 2: Papua Out-of-Coverage (Insufficient Data) ---');
    const latInput = await page.$('input[placeholder="-6.2088"]');
    const lonInput = await page.$('input[placeholder="106.8456"]');

    await latInput.click({ clickCount: 3 });
    await latInput.press('Backspace');
    await latInput.type('-4.0000');

    await lonInput.click({ clickCount: 3 });
    await lonInput.press('Backspace');
    await lonInput.type('138.0000');

    const analyzeBtn = await page.$('button.bg-\\[\\#047857\\]');
    await analyzeBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    const papuaBadge = await page.$eval('div.lg\\:col-span-5 span.rounded-full', el => el.innerText.trim());
    const papuaScoreCard = await page.$eval('div.lg\\:col-span-5', el => el.innerText.trim());
    const papuaRegion = await page.$eval('h3.text-lg.font-extrabold', el => el.innerText.trim());
    const papuaBanner = await page.$eval('div.bg-\\[\\#FFFBEB\\]', el => el.innerText.trim()).catch(() => '');

    const papuaNotNormal = !papuaBadge.toLowerCase().includes('normal') && papuaBadge.toLowerCase().includes('data tidak mencukupi');
    const papuaDataTerbatas = papuaScoreCard.includes('DATA TERBATAS');

    results.push({
      id: 2,
      name: 'Papua Out-of-Coverage: Strictly displays "Data Tidak Mencukupi" & "DATA TERBATAS", never Normal/Safe',
      pass: papuaNotNormal && papuaDataTerbatas && papuaRegion.includes('Di Luar') && papuaBanner.includes('Perhatian'),
      details: { papuaBadge, papuaDataTerbatas, papuaRegion }
    });

    // -------------------------------------------------------------
    // TEST 3: Laut Jawa (~55km North) - Beyond 45km Pilot Association
    // -------------------------------------------------------------
    console.log('--- TEST 3: Laut Jawa Proximity (~55km North) ---');
    await latInput.click({ clickCount: 3 });
    await latInput.press('Backspace');
    await latInput.type('-5.7100');

    await lonInput.click({ clickCount: 3 });
    await lonInput.press('Backspace');
    await lonInput.type('106.8456');

    await analyzeBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    const lautBadge = await page.$eval('div.lg\\:col-span-5 span.rounded-full', el => el.innerText.trim());
    const lautRegion = await page.$eval('h3.text-lg.font-extrabold', el => el.innerText.trim());
    const lautScoreCard = await page.$eval('div.lg\\:col-span-5', el => el.innerText.trim());

    results.push({
      id: 3,
      name: 'Laut Jawa (~55km): Exceeds 45km pilot radius, honest Out-of-Coverage with DATA TERBATAS',
      pass: lautRegion.includes('Di Luar') && lautBadge.includes('Data Tidak Mencukupi') && lautScoreCard.includes('DATA TERBATAS'),
      details: { lautBadge, lautRegion }
    });

    // -------------------------------------------------------------
    // TEST 4: Enggano Out-of-Coverage WITH Live BMKG TEWS Event
    // -------------------------------------------------------------
    console.log('--- TEST 4: Enggano Out-of-Coverage with Live BMKG TEWS ---');
    await latInput.click({ clickCount: 3 });
    await latInput.press('Backspace');
    await latInput.type('-5.5600');

    await lonInput.click({ clickCount: 3 });
    await lonInput.press('Backspace');
    await lonInput.type('102.2400');

    await analyzeBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    const engganoRegion = await page.$eval('h3.text-lg.font-extrabold', el => el.innerText.trim());
    const engganoThreatCount = await page.$eval('span.text-xs.font-bold.text-\\[\\#6B7280\\]', el => el.innerText.trim());
    const threatTitle = await page.$eval('div.p-3\\.5.rounded-xl.bg-\\[\\#F9FAFB\\] p', el => el.innerText.trim()).catch(() => '');
    const threatSourceText = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('div.p-3\\.5 span'));
      const srcSpan = spans.find(s => s.innerText.includes('Sumber:'));
      return srcSpan ? srcSpan.innerText : '';
    });
    const threatBadge = await page.$eval('div.p-3\\.5.rounded-xl.bg-\\[\\#F9FAFB\\] span.rounded-full', el => el.innerText.trim()).catch(() => '');

    const hasEngganoThreat = threatTitle.includes('Enggano') && threatSourceText.includes('BMKG TEWS') && threatBadge.includes('LIVE');

    results.push({
      id: 4,
      name: 'Enggano: Outside pilot radius yet accurately detects & displays LIVE BMKG TEWS earthquake event',
      pass: engganoRegion.includes('Di Luar') && hasEngganoThreat,
      details: { engganoRegion, engganoThreatCount, threatTitle, threatSourceText, threatBadge }
    });

    // -------------------------------------------------------------
    // TEST 5: Complete 13-item BNPB Go-Bag Checklist Intact
    // -------------------------------------------------------------
    console.log('--- TEST 5: BNPB Go-Bag 13 Items & Zero Regression ---');
    const checklistCards = await page.$$('div.p-3.rounded-xl.border.transition-all.cursor-pointer');
    results.push({
      id: 5,
      name: 'BNPB Go-Bag: All 13 items rendered without regression',
      pass: checklistCards.length === 13,
      details: { totalCards: checklistCards.length }
    });

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('          REMEDIATION VERIFICATION RESULTS                      ');
  console.log('================================================================');
  let passCount = 0;
  results.forEach(r => {
    const status = r.pass ? '[PASS]' : '[FAIL]';
    if (r.pass) passCount++;
    console.log(`${status} #${r.id} ${r.name}`);
    if (!r.pass) {
      console.log('      Details:', JSON.stringify(r.details));
    }
  });

  console.log(`\nTOTAL: ${passCount}/${results.length} PASSED`);
  process.exit(passCount === results.length ? 0 : 1);
})();
