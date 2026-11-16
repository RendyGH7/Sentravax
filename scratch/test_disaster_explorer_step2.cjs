const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runStep2TestSuite() {
  console.log('================================================================');
  console.log('   SENTRAVAX PHASE 2B.4C — STEP 2: DISASTER EXPLORER TEST SUITE ');
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
      // Allow expected 401 guest auth check and 404 for test 99999
      if (!text.includes('/api/v1/auth/user') && !text.includes('404') && !text.includes('status of 401')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  const testResults = [];
  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${name} ${extra ? `(${extra})` : ''}`);
      testResults.push({ name, pass: true });
    } else {
      console.error(`  ✗ FAIL: ${name} ${extra ? `(${extra})` : ''}`);
      testResults.push({ name, pass: false, error: extra });
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: CATALOG PAGE LOAD & HERO TELEMETRY (GUEST ACCESS)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: CATALOG INITIAL LOAD (/disasters) ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/disasters`, { waitUntil: 'networkidle2' });

    // Wait for event cards to appear
    await page.waitForSelector('article', { timeout: 10000 });

    const titleText = await page.$eval('h1', (el) => el.textContent?.trim());
    assert('Page H1 Title', titleText?.includes('Katalog Kejadian Bencana Indonesia'), titleText);

    const bannerTag = await page.$eval('span', (el) => el.textContent?.trim());
    const bodyText = await page.$eval('body', (el) => el.innerText);
    assert('Telemetry Banner', bodyText.includes('PUSAT INTELIJEN BENCANA TERPADU'));

    // Metric chips check
    assert('Metric Total Kejadian', bodyText.includes('Total Kejadian Aktif'));
    assert('Metric Kategori', bodyText.includes('Kategori Dipantau'));
    assert('Metric Wilayah', bodyText.includes('Wilayah Terintegrasi'));
    assert('Metric Status Live', bodyText.includes('LIVE FEED ON'));

    // Check 5 event articles rendered
    const eventCards = await page.$$('article');
    assert('Event Cards Count', eventCards.length === 5, `Found ${eventCards.length} cards`);

    // Provenance badge check
    assert('Provenance LIVE badge', bodyText.includes('LIVE (BMKG TEWS)') || bodyText.includes('LIVE'));
    assert('Provenance STATIC badge', bodyText.includes('STATIC (TERKURASI)') || bodyText.includes('STATIC'));

    // Interactive map container
    const mapExists = await page.$('.sentravax-map-container');
    assert('Interactive Map Mounted', !!mapExists);

    // -------------------------------------------------------------
    // TEST 2: INTERACTIVE FILTERING & DEBOUNCED SEARCH
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: SEARCH & FILTER FUNCTIONALITY ---');

    // Search for "gempa"
    const searchInput = await page.$('input[type="text"]');
    const searchResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/public/events') && res.url().includes('q=gempa') && res.status() === 200
    );
    await searchInput.type('gempa', { delay: 50 });
    await searchResponsePromise;
    await page.waitForFunction(() => document.querySelectorAll('article').length === 2);

    let filteredCards = await page.$$('article');
    assert('Search "gempa" returns 2 items', filteredCards.length === 2, `Count: ${filteredCards.length}`);

    // Clear search using clear button
    const clearBtn = await page.$('button[aria-label="Bersihkan pencarian"]');
    if (clearBtn) {
      const clearResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/v1/public/events') && !res.url().includes('q=gempa') && res.status() === 200
      );
      await clearBtn.click();
      await clearResponsePromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 5);
      filteredCards = await page.$$('article');
      assert('Clear search restores 5 items', filteredCards.length === 5, `Count: ${filteredCards.length}`);
    } else {
      assert('Clear button exists', false);
    }

    // Category Pill Filter: Click "Banjir dan Genangan"
    const floodPill = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Banjir dan Genangan'));
    });
    if (floodPill.asElement()) {
      const floodResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/v1/public/events') && res.url().includes('hazard_type_id=1') && res.status() === 200
      );
      await floodPill.asElement().click();
      await floodResponsePromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 1);
      filteredCards = await page.$$('article');
      assert('Category "Banjir" returns 1 item', filteredCards.length === 1, `Count: ${filteredCards.length}`);
    } else {
      assert('Flood Category Pill exists', false);
    }

    // Reset Filter Button
    const resetBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Reset Filter'));
    });
    if (resetBtn.asElement()) {
      const resetResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/v1/public/events') && !res.url().includes('hazard_type_id=1') && res.status() === 200
      );
      await resetBtn.asElement().click();
      await resetResponsePromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 5);
      filteredCards = await page.$$('article');
      assert('Reset Filter restores 5 items', filteredCards.length === 5, `Count: ${filteredCards.length}`);
    } else {
      assert('Reset Filter button exists', false);
    }

    // Severity Dropdown Filter: Select "Sedang"
    const sevResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/public/events') && res.url().includes('severity=medium') && res.status() === 200
    );
    await page.select('#select-severity', 'medium');
    await sevResponsePromise;
    await page.waitForFunction(() => document.querySelectorAll('article').length === 2);
    filteredCards = await page.$$('article');
    assert('Severity "Sedang" returns 2 items', filteredCards.length === 2, `Count: ${filteredCards.length}`);

    // Reset again
    const resetBtn2 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Reset Filter'));
    });
    if (resetBtn2.asElement()) {
      const reset2Promise = page.waitForResponse(
        (res) => res.url().includes('/api/v1/public/events') && !res.url().includes('severity=medium') && res.status() === 200
      );
      await resetBtn2.asElement().click();
      await reset2Promise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 5);
    }

    // -------------------------------------------------------------
    // TEST 3: MAP VISIBILITY TOGGLE & CARD FOCUS
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: MAP TOGGLE & CARD FOCUS ---');
    const toggleMapBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Tutup Tampilan Peta'));
    });
    if (toggleMapBtn.asElement()) {
      await toggleMapBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 300));
      const mapAfterHide = await page.$('.sentravax-map-container');
      assert('Map Hidden successfully', !mapAfterHide);

      // Re-open map
      const openMapBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && b.textContent.includes('Buka Tampilan Peta'));
      });
      if (openMapBtn.asElement()) {
        await openMapBtn.asElement().click();
        await new Promise((r) => setTimeout(r, 300));
        const mapAfterShow = await page.$('.sentravax-map-container');
        assert('Map Re-opened successfully', !!mapAfterShow);
      }
    }

    // -------------------------------------------------------------
    // TEST 4: EVENT DETAIL PAGE — EARTHQUAKE #5 (/disasters/5)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: EVENT DETAIL #5 (EARTHQUAKE TELEMETRY) ---');
    await page.goto(`${BASE_URL}/disasters/5`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const detail5Body = await page.$eval('body', (el) => el.innerText);
    assert('Event 5 Title', detail5Body.includes('Gempa Bumi Mag 5.4'));
    assert('Breadcrumb Navigation', detail5Body.includes('Beranda') && detail5Body.includes('Katalog Bencana'));
    assert('Category Badge', detail5Body.includes('Gempa Bumi'));
    assert('Severity Badge', detail5Body.includes('Tingkat Sedang'));
    assert('Provenance Badge', detail5Body.includes('LIVE (BMKG TEWS)'));

    // Telemetry metadata cards
    assert('Magnitude Card', detail5Body.includes('Magnitudo Gempa') && detail5Body.includes('5.4'));
    assert('Depth Card', detail5Body.includes('Kedalaman Hiposentrum') && detail5Body.includes('323 km'));
    assert('Tsunami Potential', detail5Body.includes('Tidak berpotensi tsunami'));

    // Mini Map
    const miniMap = await page.$('.leaflet-container');
    assert('Mini Map Rendered', !!miniMap);

    // Chronological Timeline
    assert('Timeline Section', detail5Body.includes('Kronologi Kejadian Terverifikasi'));
    assert('Timeline Milestone Waktu Kejadian', detail5Body.includes('Waktu Kejadian Bencana'));

    // Data Source Provenance Card
    assert('Data Source Provider', detail5Body.includes('Badan Meteorologi, Klimatologi, dan Geofisika'));
    assert('Data Source Name', detail5Body.includes('BMKG TEWS Open Data API'));

    // Emergency Hotlines
    assert('Hotline 112', detail5Body.includes('112'));
    assert('Hotline 115 BASARNAS', detail5Body.includes('115'));
    assert('Hotline 119 Ambulans', detail5Body.includes('119'));
    assert('Hotline 117 BNPB', detail5Body.includes('117'));

    // -------------------------------------------------------------
    // TEST 5: EVENT DETAIL PAGE — FLOOD #1 (/disasters/1)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: EVENT DETAIL #1 (FLOOD, ALERTS, NEARBY) ---');
    await page.goto(`${BASE_URL}/disasters/1`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const detail1Body = await page.$eval('body', (el) => el.innerText);
    assert('Event 1 Title', detail1Body.includes('Banjir') || detail1Body.includes('Ciliwung'));
    assert('Flow Rate Telemetry', detail1Body.includes('480') && detail1Body.includes('m³/detik'));

    // Linked Alerts
    assert('Linked Alerts Section', detail1Body.includes('Peringatan Dini Terkait'));
    assert('Linked Alert Title 1', detail1Body.includes('Peringatan Siaga 2 Luapan Sungai Ciliwung Hilir'));
    assert('Linked Alert Broadcast Regional', detail1Body.includes('Siaran Regional'));
    assert('Linked Alert Broadcast Undefined', detail1Body.includes('Cakupan Belum Ditentukan'));

    // Spatial Nearby Events within 50 km
    assert('Nearby Events Section', detail1Body.includes('Kejadian Terdekat'));
    assert('Nearby Event Distance', detail1Body.includes('11.4 km'));

    // Safety Guidelines
    assert('Safety Guidelines Section', detail1Body.includes('Panduan Keselamatan & Mitigasi'));
    assert('Safety Guideline Title', detail1Body.includes('Panduan Tanggap Darurat & Mitigasi Banjir Luapan'));

    // -------------------------------------------------------------
    // TEST 5B: EVENT DETAIL #2 (EMPTY METADATA HONEST HANDLING)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5B: EVENT DETAIL #2 (EMPTY METADATA HONEST STATE) ---');
    await page.goto(`${BASE_URL}/disasters/2`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const detail2Body = await page.$eval('body', (el) => el.innerText);
    assert('Event 2 Title', detail2Body.includes('Peringatan Angin Kencang'));
    assert('Honest Empty Telemetry Notice', detail2Body.includes('Parameter telemetri sensor spesifik tidak tersedia'));
    assert('Truthful Static Provenance Label', detail2Body.includes('STATIC (TERKURASI)'));

    // -------------------------------------------------------------
    // TEST 6: ERROR & BOUNDARY STATES (/disasters/99999 & /disasters/invalid)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: ERROR HANDLING & ROUTE BOUNDARIES ---');

    // Non-existent ID: 99999
    await page.goto(`${BASE_URL}/disasters/99999`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const notFoundBody = await page.$eval('body', (el) => el.innerText);
    assert('404 Message', notFoundBody.includes('Kejadian Bencana #99999 Tidak Ditemukan'));
    assert('Back to Catalog Button', notFoundBody.includes('Katalog Bencana'));

    // Invalid ID: 'invalid'
    await page.goto(`${BASE_URL}/disasters/invalid`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const invalidBody = await page.$eval('body', (el) => el.innerText);
    assert('Invalid ID Message', invalidBody.includes('Parameter ID Kejadian Bencana Tidak Valid'));
    assert('Back Button on Invalid ID', invalidBody.includes('Kembali ke Katalog Bencana'));

    // Click back button to return to catalog
    const backBtn = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find((l) => l.textContent && l.textContent.includes('Kembali ke Katalog Bencana'));
    });
    if (backBtn.asElement()) {
      await backBtn.asElement().click();
      await page.waitForSelector('h1', { timeout: 5000 });
      const returnUrl = page.url();
      assert('Navigation Back to Catalog', returnUrl.includes('/disasters'), returnUrl);
    }

    // -------------------------------------------------------------
    // TEST 7: ZERO UNHANDLED CONSOLE ERRORS
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: CONSOLE ERROR AUDIT ---');
    assert('Zero Unexpected Console Errors', consoleErrors.length === 0, consoleErrors.join(', '));
  } catch (err) {
    console.error('Test Suite Exception:', err);
    assert('Execution Exception', false, err.message);
  } finally {
    await browser.close();

    const passed = testResults.filter((r) => r.pass).length;
    const total = testResults.length;
    console.log('\n================================================================');
    console.log(`   SUITE COMPLETE: ${passed}/${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
    console.log('================================================================\n');

    if (passed < total) {
      process.exit(1);
    }
  }
}

runStep2TestSuite();
