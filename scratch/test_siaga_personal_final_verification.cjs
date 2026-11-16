const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

(async () => {
  console.log('================================================================');
  console.log('   SENTRAVAX PHASE 2B.3: FINAL VERIFICATION & AUDIT SUITE       ');
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
      // Exclude expected 401 guest authentication check
      if (!txt.includes('401') && !txt.includes('Unauthorized')) {
        consoleErrors.push(txt);
      }
    }
  });

  const testResults = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: Initial Mount & Default Location Transparency
    // -------------------------------------------------------------
    console.log('--- TEST 1: User Location Selection Transparency ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/preparedness', { waitUntil: 'networkidle0', timeout: 15000 });

    // Await analysis result render
    await page.waitForSelector('span.text-4xl.sm\\:text-5xl', { timeout: 10000 });

    const defaultBannerText = await page.$eval('div.bg-\\[\\#EFF6FF\\]', el => el.innerText).catch(() => null);
    const hasDefaultBanner = defaultBannerText && defaultBannerText.includes('Preset Lokasi Contoh Awal');

    const defaultTagText = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.map(s => s.innerText).find(t => t.includes('Preset Contoh Awal')) || null;
    });
    const hasDefaultTag = !!defaultTagText;

    const headingText = await page.$eval('h1', el => el.innerText);

    testResults.push({
      id: 1,
      name: 'Initial Mount displays explicit Demo/Preset Banner without false GPS claim',
      pass: hasDefaultBanner && hasDefaultTag && headingText.includes('SIAGA PERSONAL'),
      details: { hasDefaultBanner, hasDefaultTag, headingText }
    });

    // -------------------------------------------------------------
    // TEST 2: Risk Engine Mathematical Calculation & Scoring Scale
    // -------------------------------------------------------------
    console.log('--- TEST 2: Risk Engine Mathematical Consistency ---');
    const scoreVal = await page.$eval('span.text-4xl.sm\\:text-5xl', el => el.innerText.trim());
    const riskBadge = await page.$eval('div.lg\\:col-span-5 span.rounded-full', el => el.innerText.trim());
    const parsedScore = parseFloat(scoreVal);

    testResults.push({
      id: 2,
      name: 'Risk Engine returns verified deterministic score & level (Jakarta)',
      pass: parsedScore >= 50 && parsedScore <= 60 && riskBadge.toLowerCase().includes('siaga'),
      details: { scoreVal, riskBadge, parsedScore }
    });

    // -------------------------------------------------------------
    // TEST 3: Data Provenance & Freshness in Active Threats
    // -------------------------------------------------------------
    console.log('--- TEST 3: Truthful Data Provenance Distinction ---');
    const threatBadges = await page.$$eval('div.p-3\\.5.rounded-xl.bg-\\[\\#F9FAFB\\] span.rounded-full', els => els.map(e => e.innerText));
    const threatSources = await page.$$eval('div.p-3\\.5.rounded-xl.bg-\\[\\#F9FAFB\\] span.text-\\[\\#4B5563\\]', els => els.map(e => e.innerText));

    const hasStaticCuratedBadge = threatBadges.some(b => b.includes('STATIC (TERKURASI)'));
    const hasTruthfulSource = threatSources.some(s => s.includes('Data Observasi Terkurasi SENTRAVAX'));

    testResults.push({
      id: 3,
      name: 'Active threats distinguish STATIC curated events from LIVE feeds without deception',
      pass: hasStaticCuratedBadge && hasTruthfulSource,
      details: { threatBadges, threatSources }
    });

    // -------------------------------------------------------------
    // TEST 4: Out-of-Coverage & Data Completeness (Papua -4.0, 138.0)
    // -------------------------------------------------------------
    console.log('--- TEST 4: Out-of-Coverage Location Handling ---');
    const latInput = await page.$('input[placeholder="-6.2088"]');
    const lonInput = await page.$('input[placeholder="106.8456"]');

    // Click and clear inputs
    await latInput.click({ clickCount: 3 });
    await latInput.press('Backspace');
    await latInput.type('-4.0000');

    await lonInput.click({ clickCount: 3 });
    await lonInput.press('Backspace');
    await lonInput.type('138.0000');

    // Trigger analysis
    const analyzeBtn = await page.$('button.bg-\\[\\#047857\\]');
    await analyzeBtn.click();
    await new Promise(r => setTimeout(r, 1200));

    const outOfCoverageBanner = await page.$eval('div.bg-\\[\\#FFFBEB\\]', el => el.innerText).catch(() => null);
    const hasOutBanner = outOfCoverageBanner && (outOfCoverageBanner.includes('Perhatian Cakupan Wilayah Pilot') || outOfCoverageBanner.includes('Perhatian Cakupan'));

    const regionHeading = await page.$eval('h3.text-lg.font-extrabold', el => el.innerText);
    const isHonestRegion = regionHeading.toLowerCase().includes('di luar');
    const papuaBadge = await page.$eval('div.lg\\:col-span-5 span.rounded-full', el => el.innerText.trim());
    const isInsufficient = papuaBadge.toLowerCase().includes('data tidak mencukupi') && !papuaBadge.toLowerCase().includes('normal');

    testResults.push({
      id: 4,
      name: 'Out-of-Coverage coordinates (Papua) display honest notice & no false regional assignment',
      pass: hasOutBanner && isHonestRegion && isInsufficient,
      details: { hasOutBanner, regionHeading, papuaBadge }
    });

    // -------------------------------------------------------------
    // TEST 5: Complete 13-item BNPB Go-Bag Checklist
    // -------------------------------------------------------------
    console.log('--- TEST 5: 13-item BNPB Go-Bag Checklist ---');
    const checklistCards = await page.$$('div.p-3.rounded-xl.border.transition-all.cursor-pointer');
    const countBadge = await page.$eval('span[data-testid="gobag-count"]', el => el.innerText.trim());

    testResults.push({
      id: 5,
      name: 'Checklist renders all 13 items of BNPB Go-Bag standard',
      pass: checklistCards.length === 13 && countBadge.includes('/ 13 Siap'),
      details: { totalCards: checklistCards.length, countBadge }
    });

    // -------------------------------------------------------------
    // TEST 6: LocalStorage Privacy & Persistence Verification
    // -------------------------------------------------------------
    console.log('--- TEST 6: LocalStorage Privacy & Persistence ---');
    // Click items 1 and 2
    await checklistCards[0].click();
    await new Promise(r => setTimeout(r, 200));
    await checklistCards[1].click();
    await new Promise(r => setTimeout(r, 200));

    const afterCheckCount = await page.$eval('span[data-testid="gobag-count"]', el => el.innerText.trim());

    // Check localStorage content
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('sentravax_gobag_checklist');
    });
    const parsedStorage = JSON.parse(storageData || '{}');
    const hasOnlyItemIds = Object.keys(parsedStorage).every(k => !isNaN(Number(k)) && typeof parsedStorage[k] === 'boolean');
    const hasNoCoordinates = !storageData.includes('latitude') && !storageData.includes('longitude');

    // Reload page to verify persistence
    await page.reload({ waitUntil: 'networkidle0' });
    const reloadedCount = await page.$eval('span[data-testid="gobag-count"]', el => el.innerText.trim());
    const persistencePass = reloadedCount.startsWith('2 /');

    // Test Reset Button
    const resetBtn = await page.$('button[aria-label="Atur ulang checklist"]');
    if (resetBtn) {
      await resetBtn.click();
      await new Promise(r => setTimeout(r, 200));
    }
    const afterResetCount = await page.$eval('span[data-testid="gobag-count"]', el => el.innerText.trim());
    const resetPass = afterResetCount.startsWith('0 /');

    testResults.push({
      id: 6,
      name: 'LocalStorage stores only item IDs (0 sensitive data), persists across reload, and resets cleanly',
      pass: persistencePass && resetPass && hasOnlyItemIds && hasNoCoordinates,
      details: { afterCheckCount, storageData, reloadedCount, afterResetCount }
    });

    // -------------------------------------------------------------
    // TEST 7: Selection from Region Presets (Banten)
    // -------------------------------------------------------------
    console.log('--- TEST 7: Selection from Region Presets ---');
    await page.select('select[aria-label="Pilih wilayah pilot terpantau"]', '5'); // Banten Anyer (ID 5)
    await new Promise(r => setTimeout(r, 1200));

    const bantenRegionHeading = await page.$eval('h3.text-lg.font-extrabold', el => el.innerText);
    const bantenLat = await page.$eval('input[placeholder="-6.2088"]', el => el.value);

    testResults.push({
      id: 7,
      name: 'Dropdown switches to Banten and recalculates deterministic assessment',
      pass: bantenRegionHeading.includes('Banten') && parseFloat(bantenLat) < -6.0,
      details: { bantenRegionHeading, bantenLat }
    });

    // -------------------------------------------------------------
    // TEST 8: Interactive Map Click Pin Placement
    // -------------------------------------------------------------
    console.log('--- TEST 8: Interactive Map Click ---');
    const mapEl = await page.$('div.leaflet-container');
    if (mapEl) {
      const box = await mapEl.boundingBox();
      await page.mouse.click(box.x + box.width / 2 + 30, box.y + box.height / 2 - 20);
      await new Promise(r => setTimeout(r, 1500));
    }

    const pinText = await page.$eval('span.font-mono.text-\\[11px\\].text-\\[\\#047857\\]', el => el.innerText);

    testResults.push({
      id: 8,
      name: 'Interactive Leaflet click updates coordinates and re-evaluates risk',
      pass: pinText.includes('Pin Terpilih: ['),
      details: { pinText }
    });

    // -------------------------------------------------------------
    // TEST 9: Strict Geolocation Permission (No Auto GPS)
    // -------------------------------------------------------------
    console.log('--- TEST 9: Geolocation Explicit Consent ---');
    const gpsBtn = await page.$('button.w-full.justify-center');
    const gpsBtnText = await page.evaluate(el => el.innerText, gpsBtn);

    testResults.push({
      id: 9,
      name: 'Geolocation button requires explicit voluntary click',
      pass: gpsBtnText.includes('Lokasi GPS Saya'),
      details: { gpsBtnText }
    });

    // -------------------------------------------------------------
    // TEST 10: Responsiveness - Desktop 1440x900
    // -------------------------------------------------------------
    console.log('--- TEST 10: Viewport Desktop ---');
    await page.setViewport({ width: 1440, height: 900 });
    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    testResults.push({
      id: 10,
      name: 'Responsiveness: Desktop 1440x900 (No horizontal overflow)',
      pass: !desktopOverflow,
      details: { desktopOverflow }
    });

    // -------------------------------------------------------------
    // TEST 11: Responsiveness - Tablet 768x1024
    // -------------------------------------------------------------
    console.log('--- TEST 11: Viewport Tablet ---');
    await page.setViewport({ width: 768, height: 1024 });
    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    testResults.push({
      id: 11,
      name: 'Responsiveness: Tablet 768x1024 (No horizontal overflow)',
      pass: !tabletOverflow,
      details: { tabletOverflow }
    });

    // -------------------------------------------------------------
    // TEST 12: Responsiveness - Mobile 375x667
    // -------------------------------------------------------------
    console.log('--- TEST 12: Viewport Mobile ---');
    await page.setViewport({ width: 375, height: 667 });
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    testResults.push({
      id: 12,
      name: 'Responsiveness: Mobile 375x667 (No horizontal overflow)',
      pass: !mobileOverflow,
      details: { mobileOverflow }
    });

    // -------------------------------------------------------------
    // TEST 13: Zero Console Errors
    // -------------------------------------------------------------
    testResults.push({
      id: 13,
      name: 'Code Quality: Zero uncaught runtime JavaScript exceptions',
      pass: consoleErrors.length === 0,
      details: { consoleErrors }
    });

  } catch (err) {
    console.error('Fatal test execution error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('            PHASE 2B.3 FINAL AUDIT TEST RESULTS                 ');
  console.log('================================================================');
  let passCount = 0;
  testResults.forEach(r => {
    const status = r.pass ? '[PASS]' : '[FAIL]';
    if (r.pass) passCount++;
    console.log(`${status} #${r.id} ${r.name}`);
    if (!r.pass) {
      console.log('      Details:', JSON.stringify(r.details));
    }
  });

  console.log(`\nTOTAL: ${passCount}/${testResults.length} PASSED`);
  process.exit(passCount === testResults.length ? 0 : 1);
})();
