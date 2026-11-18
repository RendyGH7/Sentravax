let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');
}
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots', 'shelters');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runShelterE2E() {
  console.log('--- STARTING SENTRAVAX PHASE 3.2 STEP 2.5 SHELTER & EVACUATION E2E TEST ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = {
    public_map_loaded: false,
    shelter_layer_rendered: false,
    shelter_popup_verified: false,
    admin_login_success: false,
    admin_shelters_page_loaded: false,
    admin_stats_verified: false,
    admin_audit_drawer_verified: false,
    screenshots: [],
  };

  try {
    // 1. PUBLIC MAP TEST
    console.log('[1/5] Navigating to Public Map (/map)...');
    await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.sentravax-shelter-marker-icon', { timeout: 15000 });
    results.public_map_loaded = true;

    // Check shelter sub-toolbar
    const toolbarText = await page.$eval('.absolute.top-16', (el) => el.textContent);
    console.log('Shelter sub-toolbar text:', toolbarText);
    if (toolbarText.includes('Layer Shelter')) {
      results.shelter_layer_rendered = true;
    }

    const mapScreenshotPath = path.join(SCREENSHOT_DIR, '01_public_map_with_shelters.png');
    await page.screenshot({ path: mapScreenshotPath });
    results.screenshots.push(mapScreenshotPath);
    console.log('Saved screenshot:', mapScreenshotPath);

    // 2. CLICK SHELTER MARKER & INSPECT POPUP
    console.log('[2/5] Clicking verified shelter marker...');
    const markers = await page.$$('.sentravax-shelter-marker-icon');
    console.log(`Found ${markers.length} shelter markers on map.`);
    if (markers.length > 0) {
      await markers[0].click();
      await page.waitForSelector('.sentravax-shelter-popup', { timeout: 8000 });

      const popupText = await page.$eval('.sentravax-shelter-popup', (el) => el.textContent);
      console.log('Popup summary content snippet:', popupText.slice(0, 150) + '...');

      if (popupText.includes('RESMI TERVERIFIKASI') && popupText.includes('Kapasitas')) {
        results.shelter_popup_verified = true;
      }

      const popupScreenshotPath = path.join(SCREENSHOT_DIR, '02_shelter_popup_directive.png');
      await page.screenshot({ path: popupScreenshotPath });
      results.screenshots.push(popupScreenshotPath);
      console.log('Saved screenshot:', popupScreenshotPath);
    }

    // 3. ADMIN LOGIN
    console.log('[3/5] Logging in as Admin...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'admin@sentravax.go.id');
    await page.type('input[type="password"]', 'Sentravax2026!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    results.admin_login_success = currentUrl.includes('/admin');

    // 4. ADMIN SHELTERS REGISTRY PAGE
    console.log('[4/5] Navigating to /admin/shelters...');
    await page.goto('http://localhost:5173/admin/shelters', { waitUntil: 'networkidle2' });
    await page.waitForSelector('table', { timeout: 10000 });
    results.admin_shelters_page_loaded = true;

    // Check stats
    const statsText = await page.$eval('.grid.grid-cols-2', (el) => el.textContent);
    console.log('Admin Stats snippet:', statsText.slice(0, 100));
    if (statsText.includes('Resmi Terverifikasi') && statsText.includes('Total Terdaftar')) {
      results.admin_stats_verified = true;
    }

    const adminScreenshotPath = path.join(SCREENSHOT_DIR, '03_admin_shelters_cms.png');
    await page.screenshot({ path: adminScreenshotPath });
    results.screenshots.push(adminScreenshotPath);
    console.log('Saved screenshot:', adminScreenshotPath);

    // 5. INSPECT AUDIT HISTORY MODAL
    console.log('[5/5] Inspecting Audit History modal drawer...');
    const historyButtons = await page.$$('button[title="Lihat Riwayat Audit"]');
    if (historyButtons.length > 0) {
      await historyButtons[0].click();
      await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });

      const auditModalText = await page.$eval('.fixed.inset-0', (el) => el.textContent);
      console.log('Audit Modal text snippet:', auditModalText.slice(0, 120));
      if (auditModalText.includes('Riwayat Audit Perubahan Lokasi')) {
        results.admin_audit_drawer_verified = true;
      }

      const auditScreenshotPath = path.join(SCREENSHOT_DIR, '04_admin_audit_history_drawer.png');
      await page.screenshot({ path: auditScreenshotPath });
      results.screenshots.push(auditScreenshotPath);
      console.log('Saved screenshot:', auditScreenshotPath);
    }
  } catch (err) {
    console.error('E2E execution error:', err);
  } finally {
    await browser.close();
  }

  const resultsJsonPath = path.join(__dirname, 'shelter_e2e_results.json');
  fs.writeFileSync(resultsJsonPath, JSON.stringify(results, null, 2));
  console.log('E2E Results saved to:', resultsJsonPath);
  console.log('Results summary:', results);
}

runShelterE2E();
