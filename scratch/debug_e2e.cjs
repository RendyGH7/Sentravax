const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function debug() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.trim() === 'Intelijen');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.includes('Masuk ke Akun'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  // 2. Go to ai-insights
  await page.goto(`${BASE_URL}/intelligence-center/ai-insights`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  console.log('ai-insights URL:', page.url());

  // Click Verification Queue tab
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.textContent && b.textContent.includes('Verification Queue'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Verification Queue button:', clicked);
  await new Promise((r) => setTimeout(r, 1500));
  const queueSnippet = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Queue text snippet:\n', queueSnippet);

  // 3. Check Overview
  await page.goto(`${BASE_URL}/intelligence-center`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Overview URL:', page.url());
  const overviewSnippet = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Overview snippet:\n', overviewSnippet);

  await browser.close();
}

debug();
