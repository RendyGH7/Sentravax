let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  puppeteer = require('C:/Users/RENDY/AppData/Roaming/npm/node_modules/lighthouse/node_modules/puppeteer-core');
}
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots', 'preparedness');
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
  console.log('SENTRAVAX — E2E FINAL VERIFICATION: USER PREPAREDNESS PORTAL');
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
    const statusText = passed ? '[PASS]' : '[FAIL]';
    console.log(`${statusText} Skenario ${stepNum}: ${name}`);
    console.log(`       Keterangan: ${details}\n`);
  }

  try {
    // -------------------------------------------------------------
    // SKENARIO 1: Guest ditolak saat mengakses /user/siaga & dialihkan ke /login
    // -------------------------------------------------------------
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    await page.goto('http://localhost:5173/user/siaga', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_guest_blocked.png') });
    record(1, 'Guest ditolak mengakses /user/siaga', isRedirectedToLogin, `Dialihkan ke: ${currentUrl}`);

    // -------------------------------------------------------------
    // SKENARIO 2: Login sebagai user terverifikasi (user@sentravax.id)
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'user@sentravax.id');
    await page.type('input[type="password"]', 'Sentravax2026!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    const afterLoginUrl = page.url();
    const loginSuccess = afterLoginUrl.includes('/user');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_user_logged_in.png') });
    record(2, 'Login Akun Warga Terverifikasi', loginSuccess, `Berhasil masuk ke: ${afterLoginUrl}`);

    // -------------------------------------------------------------
    // SKENARIO 3: Buka halaman /user/siaga & Verifikasi Struktur Navigasi
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/user/siaga', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const pageContent = await page.evaluate(() => document.body.innerText);
    const hasHeader = pageContent.includes('Kesiapsiagaan & Rencana Darurat Keluarga');
    const hasTabs = pageContent.includes('Rencana Siaga Keluarga') && 
                    pageContent.includes('Kontak Darurat') && 
                    pageContent.includes('Tas Siaga Bencana');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_preparedness_page_loaded.png') });
    record(3, 'Buka Portal Kesiapsiagaan Warga (/user/siaga)', hasHeader && hasTabs, 'Header dan 3 Tab (Rencana, Kontak, Tas Siaga) ter-render sempurna');

    // -------------------------------------------------------------
    // SKENARIO 4: Family Plan — Simpan & Verifikasi Persistensi Pasca-Refresh
    // -------------------------------------------------------------
    const testTitle = 'Rencana Siaga Keluarga Teladan 2026';
    const testMeetingPoint = 'Taman Balai RW 08 Sentosa';
    const testSecondaryPoint = 'Lapangan Barat Kelurahan';
    const testNotes = 'Lansia butuh obat darah tinggi. Hubungi RT jika komunikasi terputus.';

    await setReactInput(page, 'input[placeholder*="Rencana Siaga Keluarga"]', testTitle);
    await setReactInput(page, 'input[placeholder*="Halaman Masjid"]', testMeetingPoint);
    await setReactInput(page, 'input[placeholder*="Lapangan Sepak Bola"]', testSecondaryPoint);
    await setReactInput(page, 'textarea', testNotes);

    // Click "Simpan Rencana"
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Simpan Rencana'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Reload browser to verify server-side persistence
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const planValuesAfterReload = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]')).map(i => i.value);
      const textarea = document.querySelector('textarea')?.value || '';
      return { inputs, textarea };
    });

    const planPersisted = planValuesAfterReload.inputs.includes(testTitle) &&
                          planValuesAfterReload.inputs.includes(testMeetingPoint) &&
                          planValuesAfterReload.inputs.includes(testSecondaryPoint) &&
                          planValuesAfterReload.textarea.includes(testNotes);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_plan_persisted_after_refresh.png') });
    record(4, 'Family Plan: Persistensi Titik Kumpul & Catatan Pasca-Refresh', planPersisted, 
      `Data tersimpan dan dimuat kembali dari API: "${testMeetingPoint}" & "${testSecondaryPoint}"`);

    // -------------------------------------------------------------
    // SKENARIO 5: Emergency Contacts — Tambah, Refresh, Hapus, Refresh
    // -------------------------------------------------------------
    // Switch to Contacts tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const contactTab = buttons.find(b => b.innerText.includes('Kontak Darurat'));
      if (contactTab) contactTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click "Tambah Kontak"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.innerText.includes('Tambah Kontak'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Fill modal form using setReactInput
    const contactName = 'Ibu Ratna Dewi';
    const contactRel = 'Ibu Kandung';
    const contactPhone = '081299887711';

    await setReactInput(page, 'input[placeholder*="Budi Santoso"]', contactName);
    await setReactInput(page, 'input[placeholder*="Saudara Kandung"]', contactRel);
    await setReactInput(page, 'input[placeholder*="081234567890"]', contactPhone);

    // Click "Simpan Kontak"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => b.innerText.includes('Simpan Kontak'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Reload browser to verify contact persisted
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Switch back to Contacts tab after reload
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const contactTab = buttons.find(b => b.innerText.includes('Kontak Darurat'));
      if (contactTab) contactTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const contentAfterAddReload = await page.evaluate(() => document.body.innerText);
    const contactPersistedAfterReload = contentAfterAddReload.includes(contactName) && contentAfterAddReload.includes(contactPhone);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05a_contact_persisted_after_refresh.png') });
    record(5, 'Emergency Contacts: Tambah Kontak & Persistensi Pasca-Refresh', contactPersistedAfterReload, 
      `Kontak "${contactName}" tetap tampil setelah refresh browser`);

    // Now delete the contact
    await page.evaluate((name) => {
      const delBtn = document.querySelector(`button[aria-label*="${name}"]`);
      if (delBtn) delBtn.click();
    }, contactName);
    await new Promise(r => setTimeout(r, 1000));

    // Confirm deletion in modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => b.innerText.includes('Hapus Kontak'));
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Reload browser to verify contact deletion is persistent
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to Contacts tab after reload
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const contactTab = buttons.find(b => b.innerText.includes('Kontak Darurat'));
      if (contactTab) contactTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const contentAfterDelReload = await page.evaluate(() => document.body.innerText);
    const contactDeletedPersisted = !contentAfterDelReload.includes(contactName);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05b_contact_deleted_after_refresh.png') });
    record(6, 'Emergency Contacts: Hapus Kontak & Konfirmasi Pasca-Refresh', contactDeletedPersisted, 
      `Kontak "${contactName}" terhapus secara permanen dan tidak muncul kembali setelah refresh`);

    // -------------------------------------------------------------
    // SKENARIO 7: Go-Bag Checklist — Centang Multiple Item & Verifikasi Persentase
    // -------------------------------------------------------------
    // Switch to Checklist tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const checklistTab = buttons.find(b => b.innerText.includes('Tas Siaga Bencana'));
      if (checklistTab) checklistTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Reset all checkboxes to unchecked state first for deterministic baseline
    const resetCount = await page.evaluate(async () => {
      const checkedBoxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
      for (const cb of checkedBoxes) {
        cb.click();
        await new Promise(r => setTimeout(r, 300));
      }
      return checkedBoxes.length;
    });
    if (resetCount > 0) {
      await new Promise(r => setTimeout(r, 1500));
    }

    const baselineStats = await page.evaluate(() => {
      const pctEl = document.querySelector('.text-3xl');
      return pctEl ? pctEl.innerText : '0%';
    });

    // Toggle Item 1 ON
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      if (checkboxes[0]) checkboxes[0].click();
    });
    await new Promise(r => setTimeout(r, 1800));

    const statsAfter1 = await page.evaluate(() => {
      const pctEl = document.querySelector('.text-3xl');
      return pctEl ? pctEl.innerText : '0%';
    });

    // Toggle Item 2 ON
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      if (checkboxes[1]) checkboxes[1].click();
    });
    await new Promise(r => setTimeout(r, 1800));

    const statsAfter2 = await page.evaluate(() => {
      const pctEl = document.querySelector('.text-3xl');
      return pctEl ? pctEl.innerText : '0%';
    });

    // Reload browser to verify multiple items remain checked and percentage matches
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to Checklist tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const checklistTab = buttons.find(b => b.innerText.includes('Tas Siaga Bencana'));
      if (checklistTab) checklistTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const statsAfterReload = await page.evaluate(() => {
      const pctEl = document.querySelector('.text-3xl');
      const checkedBoxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
      return {
        pctText: pctEl ? pctEl.innerText : '0%',
        checkedCount: checkedBoxes.length
      };
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06a_checklist_multi_persisted.png') });
    const multiItemPersisted = statsAfterReload.checkedCount === 2 && statsAfterReload.pctText === '15.4%';
    record(7, 'Go-Bag Checklist: Centang Multiple Item & Persentase Pasca-Refresh', multiItemPersisted, 
      `Baseline: ${baselineStats} -> Item 1 ON: ${statsAfter1} (7.7%) -> Item 2 ON: ${statsAfter2} (15.4%) -> Pasca-Refresh: ${statsAfterReload.pctText} (${statsAfterReload.checkedCount} item centang)`);

    // -------------------------------------------------------------
    // SKENARIO 8: Go-Bag Checklist — Batalkan Centang (Untoggle) & Verifikasi Pasca-Refresh
    // -------------------------------------------------------------
    // Untoggle Item 1 OFF (leaves Item 2 checked)
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      if (checkboxes[0]) checkboxes[0].click();
    });
    await new Promise(r => setTimeout(r, 1800));

    const statsAfterUntoggle = await page.evaluate(() => {
      const pctEl = document.querySelector('.text-3xl');
      return pctEl ? pctEl.innerText : '0%';
    });

    // Reload browser to verify untoggle persisted
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to Checklist tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const checklistTab = buttons.find(b => b.innerText.includes('Tas Siaga Bencana'));
      if (checklistTab) checklistTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const statsAfterUntoggleReload = await page.evaluate(() => {
      const pctEl = document.querySelector('.text-3xl');
      const checkedBoxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
      return {
        pctText: pctEl ? pctEl.innerText : '0%',
        checkedCount: checkedBoxes.length
      };
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07a_checklist_untoggle_persisted.png') });
    const untogglePersisted = statsAfterUntoggleReload.checkedCount === 1 && statsAfterUntoggleReload.pctText === '7.7%';
    record(8, 'Go-Bag Checklist: Batalkan Centang (Untoggle) & Persistensi Pasca-Refresh', untogglePersisted, 
      `Pasca-Untoggle Item 1: ${statsAfterUntoggle} -> Pasca-Refresh: ${statsAfterUntoggleReload.pctText} (${statsAfterUntoggleReload.checkedCount} item centang tersisa)`);

  } catch (err) {
    console.error('Error during E2E test:', err);
    record(99, 'Fatal E2E Execution Error', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('========================================================================');
  console.log('E2E TEST SUMMARY RESULTS:');
  console.log('========================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`Total Skenario: ${results.length} | Lulus: ${results.filter(r => r.passed).length} | Gagal: ${results.filter(r => !r.passed).length}`);
  console.log(`Status Akhir: ${allPassed ? 'ALL PASS (100% SUKSES)' : 'DEFECTS DETECTED'}\n`);

  fs.writeFileSync(
    path.join(__dirname, 'preparedness_e2e_results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), allPassed, results }, null, 2)
  );

  process.exit(allPassed ? 0 : 1);
}

runTest();
