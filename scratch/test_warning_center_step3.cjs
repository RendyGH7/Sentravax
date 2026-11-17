const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runStep3TestSuite() {
  console.log('================================================================');
  console.log('   SENTRAVAX PHASE 2B.4C — STEP 3: WARNING CENTER TEST SUITE    ');
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
    // TEST 1: EARLY WARNING CENTER INITIAL LOAD (/warnings)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: WARNINGS CENTER INITIAL LOAD (/warnings) ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/warnings`, { waitUntil: 'networkidle2' });

    // Wait for alert cards to appear
    await page.waitForSelector('article', { timeout: 10000 });

    const titleText = await page.$eval('h1', (el) => el.textContent?.trim());
    assert('Page H1 Title', titleText?.includes('Pusat Peringatan Dini Kebencanaan'), titleText);

    const bodyText = await page.$eval('body', (el) => el.innerText);
    assert('Telemetry Banner', bodyText.includes('PUSAT INFORMASI PERINGATAN DINI PUBLIK'));

    // Metric chips check
    assert('Metric Total Peringatan', bodyText.includes('Peringatan Terdata'));
    assert('Metric Cakupan Siaran', bodyText.includes('Cakupan Siaran'));
    assert('Metric Status Peringatan', bodyText.includes('Status Peringatan'));
    assert('Metric Sumber Pembaruan', bodyText.includes('Sinkronisasi Berkala'));

    // Urgent Callout Banner
    assert('Urgent Warning Callout', bodyText.toUpperCase().includes('PERINGATAN UTAMA'));

    // Check 3 alert articles rendered
    const alertCards = await page.$$('article');
    assert('Alert Cards Count', alertCards.length === 3, `Found ${alertCards.length} cards`);

    // Broadcast Level Badge Checks
    assert('Regional Broadcast Badge', bodyText.includes('Siaran Regional'));
    assert('Undefined Broadcast Badge', bodyText.includes('Cakupan Belum Ditentukan'));

    // Alert Class Badge Check
    assert('Official Warning Badge', bodyText.includes('Peringatan Resmi Otoritas'));

    // Issuer Truthfulness Check
    assert('Unverified Issuer Label', bodyText.includes('Penerbit tidak terverifikasi'));
    assert('Uncertified Issuer Badge', bodyText.includes('Belum Tersertifikasi'));

    // -------------------------------------------------------------
    // TEST 2: INTERACTIVE SEARCH & FACETED FILTERING
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: SEARCH & FILTER FUNCTIONALITY ---');

    // Search for "rob"
    const searchInput = await page.$('input[type="text"]');
    const searchResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/public/alerts') && res.url().includes('q=rob') && res.status() === 200
    );
    await searchInput.type('rob', { delay: 50 });
    await searchResponsePromise;
    await page.waitForFunction(() => document.querySelectorAll('article').length === 1);

    let filteredCards = await page.$$('article');
    assert('Search "rob" returns 1 item', filteredCards.length === 1, `Count: ${filteredCards.length}`);

    // Clear search using clear button
    const clearBtn = await page.$('button[aria-label="Bersihkan pencarian"]');
    if (clearBtn) {
      const clearResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/v1/public/alerts') && !res.url().includes('q=rob') && res.status() === 200
      );
      await clearBtn.click();
      await clearResponsePromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 3);
      filteredCards = await page.$$('article');
      assert('Clear search restores 3 items', filteredCards.length === 3, `Count: ${filteredCards.length}`);
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
        (res) => res.url().includes('/api/v1/public/alerts') && res.url().includes('hazard_type_id=1') && res.status() === 200
      );
      await floodPill.asElement().click();
      await floodResponsePromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 2);
      filteredCards = await page.$$('article');
      assert('Category "Banjir" returns 2 items', filteredCards.length === 2, `Count: ${filteredCards.length}`);
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
        (res) => res.url().includes('/api/v1/public/alerts') && !res.url().includes('hazard_type_id=1') && res.status() === 200
      );
      await resetBtn.asElement().click();
      await resetResponsePromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 3);
      filteredCards = await page.$$('article');
      assert('Reset Filter restores 3 items', filteredCards.length === 3, `Count: ${filteredCards.length}`);
    } else {
      assert('Reset Filter button exists', false);
    }

    // Broadcast Level Dropdown Filter: Select "regional"
    const bcastResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/public/alerts') && res.url().includes('broadcast_level=regional') && res.status() === 200
    );
    await page.select('#select-broadcast', 'regional');
    await bcastResponsePromise;
    await page.waitForFunction(() => document.querySelectorAll('article').length === 2);
    filteredCards = await page.$$('article');
    assert('Broadcast "regional" returns 2 items', filteredCards.length === 2, `Count: ${filteredCards.length}`);

    // Reset again
    const resetBtn2 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Reset Filter'));
    });
    if (resetBtn2.asElement()) {
      const reset2Promise = page.waitForResponse(
        (res) => res.url().includes('/api/v1/public/alerts') && !res.url().includes('broadcast_level=regional') && res.status() === 200
      );
      await resetBtn2.asElement().click();
      await reset2Promise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 3);
    }

    // -------------------------------------------------------------
    // TEST 3: ALERT DETAIL PAGE — ALERT #1 (/warnings/1)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: ALERT DETAIL #1 (/warnings/1) ---');
    await page.goto(`${BASE_URL}/warnings/1`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const detail1Body = await page.$eval('body', (el) => el.innerText);
    assert('Alert 1 Title', detail1Body.includes('Peringatan Siaga 2 Luapan Sungai Ciliwung Hilir'));
    assert('Breadcrumb Navigation', detail1Body.includes('Beranda') && detail1Body.includes('Pusat Peringatan Dini'));
    assert('Alert ID Badge', detail1Body.includes('#1'));
    assert('Hazard Category Badge', detail1Body.toUpperCase().includes('BANJIR DAN GENANGAN') || detail1Body.includes('Banjir dan Genangan'));
    assert('Alert Class Badge', detail1Body.includes('Peringatan Resmi Otoritas'));
    assert('Honest Broadcast Level Badge', detail1Body.includes('Cakupan Belum Ditentukan'));
    assert('Status Badge', detail1Body.includes('Aktif (Berlaku)'));

    // Message callout
    assert('Warning Message Callout', detail1Body.includes('210 cm (Siaga 2)'));

    // Semantic Separation: Issuer vs Data Source
    assert('Issuer Box Title', detail1Body.includes('Penerbit Peringatan (Issuer)'));
    assert('Issuer Truthful Name', detail1Body.includes('Penerbit tidak terverifikasi'));
    assert('Issuer Verification Basis', detail1Body.includes('Tidak terdapat bukti eksplisit penerbit resmi'));
    assert('Event Data Source Box', detail1Body.includes('Sumber Data Kejadian'));
    assert('Event Data Source Name', detail1Body.includes('Data Observasi Terkurasi SENTRAVAX'));

    // Associated Hazard Event Link
    assert('Associated Event Section', detail1Body.includes('Kejadian Bencana Terkait'));
    assert('Associated Event Title', detail1Body.includes('Banjir Luapan Sungai Ciliwung'));

    // Center Map
    const miniMap = await page.$('.leaflet-container');
    assert('Broadcast Center Map Rendered', !!miniMap);

    // Preparedness Actions & Hotlines
    assert('Actionable Preparedness Section', detail1Body.includes('Panduan Kesiapsiagaan Mandiri'));
    assert('Preparedness Educational Disclaimer', detail1Body.includes('Panduan Edukasi Umum'));
    assert('Action 1 Tingkatkan Kewaspadaan', detail1Body.includes('Tingkatkan Kewaspadaan'));
    assert('Action 3 Tas Siaga Bencana', detail1Body.includes('Tas Siaga Bencana'));
    assert('Emergency Hotlines Section', detail1Body.includes('Nomor Kontak Darurat Nasional'));
    assert('Hotline 112 Pemda', detail1Body.includes('112') && detail1Body.includes('Pemda Penyelenggara'));
    assert('Hotline 115 BASARNAS', detail1Body.includes('115') && detail1Body.includes('BASARNAS'));
    assert('Hotline 119 PSC Darurat Medis', detail1Body.includes('119') && detail1Body.includes('PSC Darurat Medis'));
    assert('Hotline 117 Pusdalops BNPB', detail1Body.includes('117') && detail1Body.includes('Pusdalops BNPB'));
    assert('112 Regional Dissemination Note', detail1Body.includes('pemerintah daerah kabupaten/kota'));

    // -------------------------------------------------------------
    // TEST 4: ALERT DETAIL PAGE — ALERT #2 (/warnings/2)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: ALERT DETAIL #2 (/warnings/2) ---');
    await page.goto(`${BASE_URL}/warnings/2`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const detail2Body = await page.$eval('body', (el) => el.innerText);
    assert('Alert 2 Title', detail2Body.includes('Potensi Gelombang Pasang & Banjir Rob Pesisir'));
    assert('Regional Broadcast Badge', detail2Body.includes('Siaran Regional'));
    assert('Independent Alert Notice', detail2Body.includes('Peringatan ini diterbitkan secara mandiri tanpa keterkaitan'));
    assert('No Associated Event Notice', detail2Body.includes('tidak terikat secara langsung dengan rekaman kejadian bencana'));

    // -------------------------------------------------------------
    // TEST 5: ERROR HANDLING & BOUNDARY STATES (/warnings/99999 & /warnings/invalid)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: ERROR HANDLING & ROUTE BOUNDARIES ---');

    // Non-existent ID: 99999
    await page.goto(`${BASE_URL}/warnings/99999`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const notFoundBody = await page.$eval('body', (el) => el.innerText);
    assert('404 Message', notFoundBody.includes('Peringatan Dini #99999 Tidak Ditemukan'));
    assert('Back to Warnings Button', notFoundBody.includes('Pusat Peringatan'));

    // Invalid ID: 'invalid'
    await page.goto(`${BASE_URL}/warnings/invalid`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const invalidBody = await page.$eval('body', (el) => el.innerText);
    assert('Invalid ID Message', invalidBody.includes('Parameter ID Peringatan Dini Tidak Valid'));
    assert('Back Button on Invalid ID', invalidBody.includes('Kembali ke Pusat Peringatan'));

    // Click back button to return to warnings list
    const backBtn = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find((l) => l.textContent && l.textContent.includes('Kembali ke Pusat Peringatan'));
    });
    if (backBtn.asElement()) {
      await backBtn.asElement().click();
      await page.waitForSelector('h1', { timeout: 5000 });
      const returnUrl = page.url();
      assert('Navigation Back to Warnings', returnUrl.includes('/warnings'), returnUrl);
    }

    // -------------------------------------------------------------
    // TEST 6: ZERO UNHANDLED CONSOLE ERRORS
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: CONSOLE ERROR AUDIT ---');
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

runStep3TestSuite();
