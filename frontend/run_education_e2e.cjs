let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');
}
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots', 'education');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Reliable helper for React controlled inputs
async function setReactInput(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.focus(selector);
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function runTest() {
  console.log('========================================================================');
  console.log('SENTRAVAX — E2E TEST: PUBLIC EDUCATION HUB & EMERGENCY DIRECTORY');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = [];
  function record(stepNum, name, passed, details) {
    results.push({ stepNum, name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] Step ${stepNum}: ${name}`);
    if (details) console.log(`       ${details}`);
  }

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Guest visits Public Education Page (/education)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 1: Guest Accessing /education ---');
    await page.goto('http://localhost:5173/education', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const pageHeading = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : '';
    });

    const isEducationHeading = pageHeading.includes('Edukasi Mitigasi') || pageHeading.includes('Multi-Hazard');
    record(1, 'Public Education Hub Loaded (Guest)', isEducationHeading, `Heading: "${pageHeading}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_public_education_hub.png') });

    // -------------------------------------------------------------------------
    // STEP 2: Verify Mitigation Guide Cards & Search
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Mitigation Guides & Filter ---');
    const guideCardCount = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Baca Panduan'));
      return buttons.length;
    });

    record(2, 'Mitigation Guide Cards Rendered', guideCardCount >= 2, `Found ${guideCardCount} guide cards`);

    // Search filter
    await setReactInput(page, 'input[placeholder*="Cari topik panduan"]', 'Banjir');
    await new Promise(r => setTimeout(r, 600));

    const filteredCount = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('h3')).map(h => h.innerText.toLowerCase());
      return titles.filter(t => t.includes('banjir')).length;
    });

    record(3, 'Search Filter by Keyword', filteredCount >= 1, `Found ${filteredCount} guides matching "Banjir"`);

    // Clear search
    await setReactInput(page, 'input[placeholder*="Cari topik panduan"]', '');
    await new Promise(r => setTimeout(r, 600));

    // -------------------------------------------------------------------------
    // STEP 3: Open Mitigation Guide Reader Modal & Verify Safe Markdown
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Guide Modal Reader & Safe Markdown ---');
    const readBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Baca Panduan'));
    });

    if (readBtn) {
      await readBtn.click();
      await new Promise(r => setTimeout(r, 800));

      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector('.safe-markdown');
        const h2 = modal ? modal.querySelector('h2') : null;
        const ul = modal ? modal.querySelector('ul') : null;
        const callout112 = document.body.innerText.includes('Panggil 112');
        return {
          hasSafeMarkdown: !!modal,
          hasHeading: !!h2,
          hasList: !!ul,
          has112Callout: callout112,
        };
      });

      record(4, 'Guide Modal Reader Opened with Safe Markdown', modalInfo.hasSafeMarkdown && modalInfo.hasHeading,
        `Markdown parsed: H2=${modalInfo.hasHeading}, List=${modalInfo.hasList}, Emergency Callout=${modalInfo.has112Callout}`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_guide_modal_reader.png') });

      // Close modal
      const closeBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.innerText.includes('Tutup Panduan'));
      });
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    } else {
      record(4, 'Guide Modal Reader Opened', false, 'Read button not found');
    }

    // -------------------------------------------------------------------------
    // STEP 4: Switch to Emergency Directory Tab
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Emergency Directory Tab ---');
    const directoryTabBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Direktori Layanan Darurat'));
    });

    if (directoryTabBtn) {
      await directoryTabBtn.click();
      await new Promise(r => setTimeout(r, 1000));

      const directoryNumbers = await page.evaluate(() => {
        const fontMonos = Array.from(document.querySelectorAll('.font-mono')).map(el => el.innerText.trim());
        const has112 = fontMonos.includes('112');
        const has115 = fontMonos.includes('115');
        const has117 = fontMonos.includes('117');
        const has110 = fontMonos.includes('110');
        const has113 = fontMonos.includes('113');
        const has119 = fontMonos.includes('119');

        // Check tel: links
        const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => a.getAttribute('href'));

        return {
          totalCards: fontMonos.length,
          numbers: fontMonos.slice(0, 8),
          has112,
          has115,
          has117,
          has110,
          has113,
          has119,
          telCount: telLinks.length,
        };
      });

      record(5, 'Emergency Directory Loaded with Official Hotlines',
        directoryNumbers.has112 && directoryNumbers.has115 && directoryNumbers.has117 && directoryNumbers.telCount >= 10,
        `Verified 112=${directoryNumbers.has112}, 115=${directoryNumbers.has115}, 117=${directoryNumbers.has117}, Total Tel Links=${directoryNumbers.telCount}`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_emergency_directory.png') });

      // Region Filter test
      await page.select('select:has(option[value="dki_jakarta"])', 'dki_jakarta');
      await new Promise(r => setTimeout(r, 600));

      const dkiCardsCount = await page.evaluate(() => {
        return document.querySelectorAll('.font-mono').length;
      });

      record(6, 'Emergency Region Filter (DKI Jakarta)', dkiCardsCount >= 3, `Cards shown for DKI: ${dkiCardsCount}`);
    } else {
      record(5, 'Emergency Directory Tab Switch', false, 'Tab button not found');
    }

    // -------------------------------------------------------------------------
    // STEP 5: Admin Login and Admin Education CMS
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Admin Education CMS ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 500));

    await page.type('input[type="email"]', 'admin@sentravax.go.id');
    await page.type('input[type="password"]', 'Sentravax2026!');

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    // Navigate to /admin/education
    await page.goto('http://localhost:5173/admin/education', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const adminPageTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : '';
    });

    const isAdminEducationLoaded = adminPageTitle.includes('Manajemen Literasi');
    record(7, 'Admin Education CMS Page Loaded', isAdminEducationLoaded, `Admin H1: "${adminPageTitle}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_admin_education_cms.png') });

    // -------------------------------------------------------------------------
    // STEP 6: Admin Creates New Guide with Live Markdown Preview
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Admin Create Guide Modal & Preview ---');
    const addBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Tambah Panduan Baru'));
    });

    if (addBtn) {
      await addBtn.click();
      await new Promise(r => setTimeout(r, 600));

      // Fill form
      await setReactInput(page, 'input[placeholder*="Contoh: Panduan Tanggap"]', 'Panduan E2E Test Automasi Mitigasi');
      await setReactInput(page, 'textarea[placeholder*="Deskripsi singkat"]', 'Panduan pengujian otomatis untuk verifikasi sistem CMS edukasi mitigasi.');

      // Toggle Live Markdown Preview tab
      const previewTabBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.innerText.includes('Pratinjau Live'));
      });
      if (previewTabBtn) {
        await previewTabBtn.click();
        await new Promise(r => setTimeout(r, 400));
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_admin_create_modal_preview.png') });

      // Submit form
      const saveBtn = await page.waitForSelector('button[type="submit"]', { visible: true });
      await saveBtn.click();
      await new Promise(r => setTimeout(r, 1500));

      // Check if newly created guide appears in table
      const createdInTable = await page.evaluate(() => {
        return document.body.innerText.includes('Panduan E2E Test Automasi Mitigasi');
      });

      record(8, 'Admin Successfully Created Guide', createdInTable, 'Newly created guide found in table');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_admin_guide_created.png') });

      // -------------------------------------------------------------------------
      // STEP 7: Delete Newly Created Guide to Clean Up
      // -------------------------------------------------------------------------
      console.log('\n--- Step 7: Clean Up Test Guide ---');
      const deleteBtn = await page.evaluateHandle(() => {
        const rows = Array.from(document.querySelectorAll('tr'));
        const testRow = rows.find(r => r.innerText.includes('Panduan E2E Test Automasi Mitigasi'));
        if (!testRow) return null;
        return testRow.querySelector('button[title="Hapus Panduan"]');
      });

      if (deleteBtn) {
        await deleteBtn.click();
        await new Promise(r => setTimeout(r, 600));

        // Click confirmation "Ya, Hapus"
        const confirmDeleteBtn = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.innerText.includes('Ya, Hapus'));
        });
        if (confirmDeleteBtn) {
          await confirmDeleteBtn.click();
          await new Promise(r => setTimeout(r, 1500));
        }

        const stillInTable = await page.evaluate(() => {
          return document.body.innerText.includes('Panduan E2E Test Automasi Mitigasi');
        });

        record(9, 'Admin Deleted Test Guide (Clean Up)', !stillInTable, 'Test article successfully removed');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_admin_guide_deleted.png') });
      }
    }

  } catch (err) {
    console.error('E2E Test execution failed with error:', err);
    record(99, 'E2E Execution Error', false, err.message);
  } finally {
    await browser.close();
  }

  // Write results JSON
  const allPassed = results.every(r => r.passed);
  fs.writeFileSync(
    path.join(__dirname, 'education_e2e_results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), allPassed, results }, null, 2)
  );

  console.log('\n========================================================================');
  console.log(`E2E SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED (All Passed: ${allPassed})`);
  console.log('========================================================================\n');
}

runTest();
