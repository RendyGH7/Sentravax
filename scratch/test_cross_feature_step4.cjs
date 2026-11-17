const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runStep4CrossFeatureTestSuite() {
  console.log('================================================================');
  console.log('   SENTRAVAX PHASE 2B.4C — STEP 4: CROSS-FEATURE VERIFICATION   ');
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
      // Allow expected 401 guest auth checks and intentional 404 boundary tests
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
    // TEST 1: GLOBAL HEADER & NAVIGATION FLOW
    // -------------------------------------------------------------
    console.log('--- TEST 1: GLOBAL HEADER & ACTIVE HIGHLIGHTING ---');
    await page.setViewport({ width: 1440, height: 900 });

    // 1.1 Home page load & active link
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    let activeNavText = await page.$eval('nav a[class*="text-[#047857]"]', (el) => el.textContent?.trim());
    assert('Home Active Nav Highlight', activeNavText?.includes('Beranda'), activeNavText);

    // 1.2 Navigate to /disasters & check active link
    await page.goto(`${BASE_URL}/disasters`, { waitUntil: 'networkidle2' });
    activeNavText = await page.$eval('nav a[class*="text-[#047857]"]', (el) => el.textContent?.trim());
    assert('Disasters Active Nav Highlight', activeNavText?.includes('Kejadian Bencana'), activeNavText);

    // 1.3 Navigate to /disasters/1 & check parent active link preservation
    await page.goto(`${BASE_URL}/disasters/1`, { waitUntil: 'networkidle2' });
    activeNavText = await page.$eval('nav a[class*="text-[#047857]"]', (el) => el.textContent?.trim());
    assert('Disaster Detail Preserves Active Nav', activeNavText?.includes('Kejadian Bencana'), activeNavText);

    // 1.4 Navigate to /warnings & check active link
    await page.goto(`${BASE_URL}/warnings`, { waitUntil: 'networkidle2' });
    activeNavText = await page.$eval('nav a[class*="text-[#047857]"]', (el) => el.textContent?.trim());
    assert('Warnings Active Nav Highlight', activeNavText?.includes('Peringatan Dini'), activeNavText);

    // 1.5 Navigate to /warnings/1 & check parent active link preservation
    await page.goto(`${BASE_URL}/warnings/1`, { waitUntil: 'networkidle2' });
    activeNavText = await page.$eval('nav a[class*="text-[#047857]"]', (el) => el.textContent?.trim());
    assert('Warning Detail Preserves Active Nav', activeNavText?.includes('Peringatan Dini'), activeNavText);

    // 1.6 Navigate to /map & check active link
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle2' });
    activeNavText = await page.$eval('nav a[class*="text-[#047857]"]', (el) => el.textContent?.trim());
    assert('Map Active Nav Highlight', activeNavText?.includes('Peta Risiko'), activeNavText);

    // 1.7 Mobile menu toggle test
    console.log('\n--- TEST 1B: MOBILE NAVIGATION MENU ---');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

    const menuBtn = await page.$('button[aria-label="Buka menu navigasi"]');
    assert('Mobile Menu Button Present', !!menuBtn);
    await menuBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    const mobileMenuContent = await page.$eval('header', (el) => el.innerText);
    assert('Mobile Menu Opened', mobileMenuContent.includes('Peta Risiko') && mobileMenuContent.includes('Kejadian Bencana'));

    // Click link inside mobile dropdown to navigate
    const mobileWarningsLink = await page.$('header .lg\\:hidden a[href="/warnings"]');
    assert('Mobile Navigation Link Found', !!mobileWarningsLink);
    if (mobileWarningsLink) {
      await mobileWarningsLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
      const currentUrl = page.url();
      assert('Mobile Navigation Link Success', currentUrl.includes('/warnings'), currentUrl);
    }

    // Reset viewport to desktop
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // TEST 2: CROSS-FEATURE BIDIRECTIONAL DEEP-LINKING
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: CROSS-FEATURE LINKAGE AUDIT ---');

    // 2.1 From Map -> Popup Detail Link -> Disaster Detail
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.sentravax-leaflet-divicon', { timeout: 15000 });
    const firstMarker = await page.$('.sentravax-leaflet-divicon');
    await firstMarker.click();
    await new Promise((r) => setTimeout(r, 600));

    const popupDetailLink = await page.$('.sentravax-popup-detail-link');
    assert('Map Popup Detail Link Rendered', !!popupDetailLink);
    if (popupDetailLink) {
      const linkHref = await page.evaluate((el) => el.getAttribute('href'), popupDetailLink);
      assert('Popup Link Points to /disasters/:id', linkHref.startsWith('/disasters/'), linkHref);
    }

    // 2.2 From Disaster Detail #1 -> Linked Alert Link -> Alert Detail #1
    await page.goto(`${BASE_URL}/disasters/1`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const linkedAlertLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find((l) => l.getAttribute('href') && l.getAttribute('href').startsWith('/warnings/'));
    });
    assert('Disaster Detail Links to Associated Alert', !!linkedAlertLink.asElement());
    if (linkedAlertLink.asElement()) {
      const alertHref = await page.evaluate((el) => el.getAttribute('href'), linkedAlertLink.asElement());
      await linkedAlertLink.asElement().click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
      assert('Navigation from Event to Alert Success', page.url().includes(alertHref), page.url());
    }

    // 2.3 From Alert Detail #1 -> Associated Event Link -> Disaster Detail #1
    await page.goto(`${BASE_URL}/warnings/1`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const linkedEventLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find((l) => l.getAttribute('href') && l.getAttribute('href').startsWith('/disasters/'));
    });
    assert('Alert Detail Links to Associated Event', !!linkedEventLink.asElement());
    if (linkedEventLink.asElement()) {
      const eventHref = await page.evaluate((el) => el.getAttribute('href'), linkedEventLink.asElement());
      await linkedEventLink.asElement().click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
      assert('Navigation from Alert to Event Success', page.url().includes(eventHref), page.url());
    }

    // 2.4 Browser Back and Forward functionality
    await page.goBack({ waitUntil: 'networkidle2' });
    assert('Browser Back returns to Alert Detail', page.url().includes('/warnings/1'), page.url());
    await page.goForward({ waitUntil: 'networkidle2' });
    assert('Browser Forward returns to Event Detail', page.url().includes('/disasters/1'), page.url());

    // -------------------------------------------------------------
    // TEST 3: MULTI-HAZARD CATEGORIES & TRUTHFUL FILTERING
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: MULTI-HAZARD CATEGORIES & FILTERING ---');
    await page.goto(`${BASE_URL}/disasters`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('article', { timeout: 10000 });

    // 3.1 Filter Earthquake (Gempa Bumi) -> expect 2 items
    const earthquakePill = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Gempa Bumi'));
    });
    if (earthquakePill.asElement()) {
      const resPromise = page.waitForResponse((r) => r.url().includes('hazard_type_id=4') && r.status() === 200);
      await earthquakePill.asElement().click();
      await resPromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 2);
      const cards = await page.$$('article');
      assert('Multi-Hazard: Gempa Bumi returns 2 items', cards.length === 2, `Count: ${cards.length}`);
    } else {
      assert('Earthquake Pill Found', false);
    }

    // 3.2 Filter Flood (Banjir dan Genangan) -> expect 1 item
    const floodPill = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Banjir dan Genangan'));
    });
    if (floodPill.asElement()) {
      const resPromise = page.waitForResponse((r) => r.url().includes('hazard_type_id=1') && r.status() === 200);
      await floodPill.asElement().click();
      await resPromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 1);
      const cards = await page.$$('article');
      assert('Multi-Hazard: Banjir returns 1 item', cards.length === 1, `Count: ${cards.length}`);
    } else {
      assert('Flood Pill Found', false);
    }

    // 3.3 Reset Filter restores 5 items
    const resetBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Reset Filter'));
    });
    if (resetBtn.asElement()) {
      const resPromise = page.waitForResponse((r) => r.url().includes('/api/v1/public/events') && !r.url().includes('hazard_type_id=') && r.status() === 200);
      await resetBtn.asElement().click();
      await resPromise;
      await page.waitForFunction(() => document.querySelectorAll('article').length === 5);
      const cards = await page.$$('article');
      assert('Reset Filter restores all 5 multi-hazard events', cards.length === 5, `Count: ${cards.length}`);
    } else {
      assert('Reset Button Found', false);
    }

    // -------------------------------------------------------------
    // TEST 4: RESPONSIVE VIEWPORT AUDIT (5 VIEWPORTS)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: RESPONSIVE VIEWPORT CHECKS (ZERO HORIZONTAL OVERFLOW) ---');
    const viewports = [
      { name: 'Desktop (1440x900)', width: 1440, height: 900 },
      { name: 'Laptop (1366x768)', width: 1366, height: 768 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (390x844)', width: 390, height: 844 },
      { name: 'Small Mobile (360x800)', width: 360, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });

      // Check /disasters
      await page.goto(`${BASE_URL}/disasters`, { waitUntil: 'networkidle2' });
      let overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(`Responsive [${vp.name}] /disasters No Overflow`, !overflow);

      // Check /warnings
      await page.goto(`${BASE_URL}/warnings`, { waitUntil: 'networkidle2' });
      overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(`Responsive [${vp.name}] /warnings No Overflow`, !overflow);

      // Check /disasters/1
      await page.goto(`${BASE_URL}/disasters/1`, { waitUntil: 'networkidle2' });
      overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(`Responsive [${vp.name}] /disasters/1 No Overflow`, !overflow);

      // Check /warnings/1
      await page.goto(`${BASE_URL}/warnings/1`, { waitUntil: 'networkidle2' });
      overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(`Responsive [${vp.name}] /warnings/1 No Overflow`, !overflow);
    }

    // Reset viewport
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // TEST 5: DIRECT ROUTE & BOUNDARY HANDLING
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: DIRECT ROUTE & BOUNDARY HANDLING ---');

    // 5.1 Invalid route 404 page
    await page.goto(`${BASE_URL}/non-existent-route-404`, { waitUntil: 'networkidle2' });
    const notFoundText = await page.$eval('body', (el) => el.innerText);
    assert('Global 404 Route Rendered', notFoundText.includes('404') || notFoundText.includes('Tidak Ditemukan'));

    // 5.2 Invalid disaster ID
    await page.goto(`${BASE_URL}/disasters/invalid`, { waitUntil: 'networkidle2' });
    const invalidDisasterText = await page.$eval('body', (el) => el.innerText);
    assert('Invalid Disaster ID Boundary', invalidDisasterText.includes('Parameter ID'));

    // 5.3 Non-existent disaster ID
    await page.goto(`${BASE_URL}/disasters/99999`, { waitUntil: 'networkidle2' });
    const missingDisasterText = await page.$eval('body', (el) => el.innerText);
    assert('404 Disaster Event Boundary', missingDisasterText.includes('Tidak Ditemukan'));

    // 5.4 Invalid warning ID
    await page.goto(`${BASE_URL}/warnings/invalid`, { waitUntil: 'networkidle2' });
    const invalidWarningText = await page.$eval('body', (el) => el.innerText);
    assert('Invalid Warning ID Boundary', invalidWarningText.includes('Parameter ID'));

    // 5.5 Non-existent warning ID
    await page.goto(`${BASE_URL}/warnings/99999`, { waitUntil: 'networkidle2' });
    const missingWarningText = await page.$eval('body', (el) => el.innerText);
    assert('404 Warning Alert Boundary', missingWarningText.includes('Tidak Ditemukan'));

    // -------------------------------------------------------------
    // TEST 6: CONSOLE ERROR AUDIT
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: CONSOLE ERROR AUDIT ---');
    assert('Zero Unexpected Console Errors', consoleErrors.length === 0, consoleErrors.join(', '));

  } catch (err) {
    console.error('Step 4 Test Suite Exception:', err);
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

runStep4CrossFeatureTestSuite();
