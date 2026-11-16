const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:5173/map';

async function testPopupProvenance() {
  console.log('=== VERIFYING DYNAMIC MAP POPUP PROVENANCE RENDERING ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('Navigating to http://localhost:5173/map...');
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('Waiting for map markers to appear...');
    await page.waitForSelector('.sentravax-leaflet-divicon', { timeout: 15000 });

    const markers = await page.$$('.sentravax-leaflet-divicon');
    console.log(`Found ${markers.length} markers on the map.`);

    let checkedPopups = 0;
    let foundLive = false;
    let foundStatic = false;

    for (let i = 0; i < markers.length; i++) {
      await markers[i].click();
      await new Promise((r) => setTimeout(r, 600));

      const popup = await page.$('.leaflet-popup-content');
      if (popup) {
        const text = await page.evaluate((el) => el.textContent, popup);
        console.log(`\nMarker #${i + 1} Popup Content:`);
        
        const hasLive = text.includes('LIVE');
        const hasStatic = text.includes('STATIC');
        const hasBmkg = text.includes('BMKG');
        const hasCurated = text.includes('Data Observasi Terkurasi SENTRAVAX') || text.includes('Terkurasi');

        console.log(`- Status LIVE: ${hasLive}`);
        console.log(`- Status STATIC: ${hasStatic}`);
        console.log(`- Source mentions BMKG: ${hasBmkg}`);
        console.log(`- Source mentions Curated: ${hasCurated}`);

        if (hasLive && hasBmkg) {
          foundLive = true;
          console.log(`>>> CONFIRMED: Authentic LIVE BMKG Event rendered via backend metadata.`);
        }
        if (hasStatic && hasCurated) {
          foundStatic = true;
          console.log(`>>> CONFIRMED: Authentic STATIC Curated Event rendered via backend metadata.`);
        }

        checkedPopups++;
      }
    }

    console.log('\n=============================================');
    console.log(`Popups Inspected: ${checkedPopups}`);
    console.log(`Found Dynamic LIVE Provenance: ${foundLive ? 'PASS' : 'FAIL'}`);
    console.log(`Found Dynamic STATIC Provenance: ${foundStatic ? 'PASS' : 'FAIL'}`);
    console.log('=============================================');

    if (foundLive && foundStatic) {
      console.log('\n>>> OVERALL POPUP PROVENANCE: PASS <<<');
      process.exit(0);
    } else {
      console.error('\n>>> OVERALL POPUP PROVENANCE: FAIL <<<');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testPopupProvenance();
