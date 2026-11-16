const puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(msg.type() + ': ' + msg.text()));
  page.on('pageerror', err => consoleLogs.push('PAGE_ERR: ' + err.message));

  try {
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('Page loaded on 5174. Title:', await page.title());

    // Click demo resident button [Warga]
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Warga')) {
        await b.click();
        console.log('Clicked Warga demo button');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 600));

    // Click submit button
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('Clicked submit button');
    }

    await new Promise(r => setTimeout(r, 3000));

    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);

    const errorEl = await page.$('.bg-rose-50');
    if (errorEl) {
      const errText = await page.evaluate(el => el.textContent, errorEl);
      console.log('Error displayed on page:', errText);
    } else {
      console.log('No error banner displayed!');
    }
    console.log('Console logs:', consoleLogs.slice(-10));
  } catch (e) {
    console.error('Test error:', e.message);
  } finally {
    await browser.close();
  }
}
test();
