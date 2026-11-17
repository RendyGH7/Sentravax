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

async function cleanLogout(page) {
  try {
    await page.evaluate(async () => {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
      } catch {}
      localStorage.clear();
      sessionStorage.clear();
    });
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await new Promise((r) => setTimeout(r, 600));
  } catch {}
}

async function loginAs(page, roleName) {
  await cleanLogout(page);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  await page.evaluate((role) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.trim() === role);
    if (btn) btn.click();
  }, roleName);
  await new Promise((r) => setTimeout(r, 400));

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]'),
  ]);
  await new Promise((r) => setTimeout(r, 1000));
}

async function run() {
  console.log('================================================================');
  console.log('  SENTRAVAX PHASE 3.2 STEP 1: NOTIFICATION ENGINE & CENTER E2E');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // 1. Login as Citizen User
    console.log('\n--- 1. Authentication & Route Access ---');
    await loginAs(page, 'Warga');

    await page.goto(`${BASE_URL}/user/notifications`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));

    const currentUrl = page.url();
    assert(currentUrl.includes('/user/notifications'), 'User can access /user/notifications', currentUrl);

    // 2. Notification Center Header & Actions
    console.log('\n--- 2. Notification Center Structure & UI ---');
    await page.waitForSelector('h1', { timeout: 5000 });
    const headerTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : '';
    });
    assert(
      headerTitle.includes('Pusat Notifikasi'),
      'Header displays "Pusat Notifikasi & Riwayat Peringatan"',
      headerTitle
    );

    const hasEngineBadge = await page.evaluate(() => {
      return document.body.innerText.toLowerCase().includes('notification engine active');
    });
    assert(hasEngineBadge, 'Notification Engine Active indicator is present');

    const hasMarkAllBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.innerText.includes('Tandai Semua Dibaca'));
    });
    assert(hasMarkAllBtn, '"Tandai Semua Dibaca" button is present in header');

    const hasPrefBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.innerText.includes('Preferensi'));
    });
    assert(hasPrefBtn, '"Preferensi" modal button is present in header');

    // 3. Category & Filter Tabs
    console.log('\n--- 3. Category & Urgency Filters ---');
    const tabTexts = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map((b) => b.innerText.trim());
    });
    assert(tabTexts.some((t) => t.includes('Semua')), 'Tab "Semua" exists');
    assert(tabTexts.some((t) => t.includes('Belum Dibaca')), 'Tab "Belum Dibaca" exists');
    assert(tabTexts.some((t) => t.includes('Peringatan Resmi')), 'Tab "Peringatan Resmi" exists');
    assert(tabTexts.some((t) => t.includes('Status Laporan')), 'Tab "Status Laporan" exists');
    assert(tabTexts.some((t) => t.includes('AI Insights')), 'Tab "AI Insights" exists');

    const hasUrgencySelect = await page.evaluate(() => {
      const select = document.querySelector('select');
      return !!select;
    });
    assert(hasUrgencySelect, 'Urgency filter selector is present');

    // 4. Preferences Modal Interaction
    console.log('\n--- 4. Preferences Modal & Controls ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const prefBtn = btns.find((b) => b.innerText.includes('Preferensi'));
      if (prefBtn) prefBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const modalTitle = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const found = h3s.find((h) => h.innerText.includes('Preferensi Notifikasi'));
      return found ? found.innerText : '';
    });
    assert(
      modalTitle.includes('Preferensi Notifikasi'),
      'Preferences modal opens with title "Preferensi Notifikasi"',
      modalTitle
    );

    const hasInAppChannel = await page.evaluate(() => {
      return document.body.innerText.includes('Saluran In-App SENTRAVAX');
    });
    assert(hasInAppChannel, 'In-App Channel switch is displayed');

    const hasCategorySwitches = await page.evaluate(() => {
      const body = document.body.innerText;
      return (
        body.includes('Peringatan Resmi (Official Warning)') &&
        body.includes('AI Proactive Insights') &&
        body.includes('Status Laporan Bencana') &&
        body.includes('Peringatan Darurat Lokal') &&
        body.includes('Pemberitahuan Sistem & Operasional')
      );
    });
    assert(hasCategorySwitches, 'All 5 category toggles are present in modal');

    // Close modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find((b) => b.innerText.trim() === 'Batal');
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // 5. Responsive Design Verification
    console.log('\n--- 5. Responsive Viewports Layout Integrity ---');
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise((r) => setTimeout(r, 300));

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      assert(
        !hasHorizontalScroll,
        `Viewport ${vp.name} maintains clean layout without horizontal overflow`
      );
    }

    // 6. Navigation Indicator Verification
    console.log('\n--- 6. Header Bell Icon & Navigation Linkage ---');
    await page.setViewport({ width: 1440, height: 900 });
    const bellLinkExists = await page.evaluate(() => {
      const link = document.querySelector('a[href="/user/notifications"]');
      return !!link;
    });
    assert(bellLinkExists, 'Header Bell link pointing to /user/notifications exists');

    console.log('\n================================================================');
    console.log(`  AUDIT RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
  }
}

run();
