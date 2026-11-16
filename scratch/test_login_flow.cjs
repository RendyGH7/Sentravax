const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text()));

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]: ${request.method()} ${request.url()} -> ${request.failure()?.errorText}`);
  });

  page.on('response', response => {
    if (response.url().includes('/api/') || response.url().includes('/sanctum/')) {
      console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    console.log('Clicking Warga button...');
    const wargaBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.trim() === 'Warga');
    });
    await wargaBtn.click();
    await new Promise(r => setTimeout(r, 500));

    const emailVal = await page.$eval('input[type="email"]', el => el.value);
    const passVal = await page.$eval('input[type="password"]', el => el.value);
    console.log(`Filled credentials: email=${emailVal}, password length=${passVal.length}`);

    console.log('Clicking Masuk ke Akun button...');
    const submitBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Masuk ke Akun'));
    });
    await submitBtn.click();

    await new Promise(r => setTimeout(r, 3000));

    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);

    const errorBox = await page.evaluate(() => {
      const el = document.querySelector('div.bg-red-50, div.border-red-200, div[role="alert"]');
      return el ? el.innerText : null;
    });
    console.log('Error box content:', errorBox);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
