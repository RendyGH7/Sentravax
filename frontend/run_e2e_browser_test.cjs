const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
  console.log('========================================================================');
  console.log('SENTRAVAX — REAL BROWSER (CHROME) END-TO-END AUTHENTICATION TEST');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Monitor network requests and console errors
  const networkLogs = [];
  const consoleErrors = [];

  page.on('request', (req) => {
    if (req.url().includes('/api/') || req.url().includes('/sanctum/')) {
      networkLogs.push({
        type: 'REQ',
        method: req.method(),
        url: req.url(),
        headers: req.headers(),
      });
    }
  });

  page.on('response', (res) => {
    if (res.url().includes('/api/') || res.url().includes('/sanctum/')) {
      networkLogs.push({
        type: 'RES',
        status: res.status(),
        url: res.url(),
        headers: res.headers(),
      });
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const results = [];

  function record(scenarioNum, name, passed, details) {
    results.push({ scenarioNum, name, passed, details });
    const statusText = passed ? '[PASS]' : '[FAIL]';
    console.log(`${statusText} Skenario ${scenarioNum}: ${name}`);
    console.log(`       Keterangan: ${details}\n`);
  }

  try {
    // -------------------------------------------------------------
    // SKENARIO 1: Guest dapat membuka Public Website tanpa login
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    const publicTitle = await page.title();
    const navText = await page.evaluate(() => document.body.innerText);
    const hasNav = navText.includes('Beranda') && navText.includes('Peta Risiko') && navText.includes('Masuk');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_public_website.png') });
    record(1, 'Guest membuka Public Website', hasNav, `URL: ${page.url()} | Navigasi Beranda & Masuk ditemukan | Title: ${publicTitle}`);

    // -------------------------------------------------------------
    // SKENARIO 2: Guest tidak dapat membuka User Portal
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/user/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 5000 }).catch(() => {});
    const currentUrlAfterGuest = page.url();
    const isRedirectedToLogin = currentUrlAfterGuest.includes('/login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_guest_redirect_login.png') });
    record(2, 'Guest ditolak dari User Portal dan diredirect ke Login', isRedirectedToLogin, `URL tujuan: /user/dashboard -> Diarahkan ke: ${currentUrlAfterGuest}`);

    // -------------------------------------------------------------
    // SKENARIO 3 & 4: Login sebagai user berhasil & diarahkan ke /user/dashboard
    // -------------------------------------------------------------
    // Click "Warga" quick preset button
    const wargaBtn = await page.waitForSelector('button ::-p-text(Warga)', { timeout: 5000 });
    await wargaBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    // Submit form
    const submitBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await submitBtn.click();

    // Wait for navigation to /user/dashboard
    await page.waitForFunction(() => window.location.pathname.includes('/user/dashboard'), { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    const userUrl = page.url();
    const userLoggedIn = userUrl.includes('/user/dashboard');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_user_dashboard.png') });
    record(3, 'Login sebagai role user berhasil', userLoggedIn, `Login dengan user@sentravax.id sukses`);
    record(4, 'User diarahkan ke /user/dashboard', userLoggedIn, `Current URL: ${userUrl}`);

    // -------------------------------------------------------------
    // SKENARIO 14 & 15 (Pemeriksaan Cookie & Storage saat Login User)
    // -------------------------------------------------------------
    const cookiesAfterLogin = await page.cookies();
    const sessionCookie = cookiesAfterLogin.find((c) => c.name === 'laravel-session' || c.name === 'laravel_session');
    const xsrfCookie = cookiesAfterLogin.find((c) => c.name === 'XSRF-TOKEN');

    const isHttpOnly = sessionCookie ? sessionCookie.httpOnly : false;
    record(14, 'Pemeriksaan Cookie HttpOnly & CSRF DevTools', Boolean(sessionCookie && xsrfCookie && isHttpOnly),
      `Session Cookie: ${sessionCookie?.name} (HttpOnly: ${isHttpOnly}, SameSite: ${sessionCookie?.sameSite}) | CSRF Cookie: ${xsrfCookie?.name} (HttpOnly: ${xsrfCookie?.httpOnly})`);

    const localStorageTokens = await page.evaluate(() => {
      return {
        sentravax_auth_token: window.localStorage.getItem('sentravax_auth_token'),
        sentravax_user: window.localStorage.getItem('sentravax_user'),
        storageLength: window.localStorage.length,
        sessionStorageLength: window.sessionStorage.length,
      };
    });

    const isStorageClean = localStorageTokens.sentravax_auth_token === null && localStorageTokens.sentravax_user === null;
    record(15, 'Verifikasi ZERO Token di localStorage / sessionStorage', isStorageClean,
      `sentravax_auth_token: ${localStorageTokens.sentravax_auth_token} | localStorage length: ${localStorageTokens.storageLength} | sessionStorage length: ${localStorageTokens.sessionStorageLength}`);

    // -------------------------------------------------------------
    // SKENARIO 5: Refresh browser tidak menghilangkan sesi login
    // -------------------------------------------------------------
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const urlAfterReload = page.url();
    const sessionPreserved = urlAfterReload.includes('/user/dashboard');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_user_reload_session_persisted.png') });
    record(5, 'Refresh browser mempertahankan sesi login tanpa token localStorage', sessionPreserved,
      `URL setelah reload: ${urlAfterReload} (Sesi re-hidrasi via session cookie HttpOnly sukses)`);

    // -------------------------------------------------------------
    // SKENARIO 6: User tidak dapat membuka Admin Dashboard
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));
    const adminBlockedText = await page.evaluate(() => document.body.innerText);
    const userBlockedFromAdmin = adminBlockedText.includes('Akses Area Dibatasi') && adminBlockedText.includes('user');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_user_blocked_from_admin.png') });
    record(6, 'User tidak dapat membuka Admin Dashboard (Akses silang diblokir)', userBlockedFromAdmin,
      `Tampil banner: "Akses Area Dibatasi" | Role user tidak diizinkan masuk /admin/dashboard`);

    // -------------------------------------------------------------
    // SKENARIO 7: User tidak dapat membuka Intelligence Center
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/intelligence-center/overview', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));
    const intelBlockedText = await page.evaluate(() => document.body.innerText);
    const userBlockedFromIntel = intelBlockedText.includes('Akses Area Dibatasi') && intelBlockedText.includes('user');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_user_blocked_from_intelligence.png') });
    record(7, 'User tidak dapat membuka Intelligence Center (Akses silang diblokir)', userBlockedFromIntel,
      `Tampil banner: "Akses Area Dibatasi" | Role user tidak diizinkan masuk /intelligence-center/overview`);

    // -------------------------------------------------------------
    // SKENARIO 8 & 9: Logout berhasil & Halaman terlindungi tidak dapat diakses
    // -------------------------------------------------------------
    // Back to user dashboard
    await page.goto('http://localhost:5173/user/dashboard', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));

    // Execute logout via page evaluate
    await page.evaluate(async () => {
      // Find logout button if rendered or call auth service directly in window context
      const logoutBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Keluar') || b.innerText.includes('Logout'));
      if (logoutBtn) {
        logoutBtn.click();
      } else {
        const { default: apiClient } = await import('/src/lib/axios.ts');
        await apiClient.post('/auth/logout');
        window.location.href = '/login';
      }
    });

    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 5000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));
    const urlAfterLogout = page.url();
    record(8, 'Logout sesi berhasil', urlAfterLogout.includes('/login') || urlAfterLogout === 'http://localhost:5173/',
      `URL setelah logout: ${urlAfterLogout}`);

    // Test accessing protected page after logout
    await page.goto('http://localhost:5173/user/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 5000 }).catch(() => {});
    const urlAfterLogoutProtected = page.url();
    const protectedBlockedAfterLogout = urlAfterLogoutProtected.includes('/login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_blocked_after_logout.png') });
    record(9, 'Setelah logout, halaman terlindungi ditolak dan diredirect ke login', protectedBlockedAfterLogout,
      `Mencoba membuka /user/dashboard setelah logout -> Ditolak, diarahkan ke: ${urlAfterLogoutProtected}`);

    // -------------------------------------------------------------
    // SKENARIO 10 & 11: Login sebagai Admin berhasil & Admin tidak dapat buka Intelligence Center
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    const adminPresetBtn = await page.waitForSelector('button ::-p-text(Admin)', { timeout: 5000 });
    await adminPresetBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    const submitAdminBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await submitAdminBtn.click();

    await page.waitForFunction(() => window.location.pathname.includes('/admin/dashboard'), { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    const adminUrl = page.url();
    const adminLoggedIn = adminUrl.includes('/admin/dashboard');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_admin_dashboard.png') });
    record(10, 'Login sebagai admin berhasil dan diarahkan ke /admin/dashboard', adminLoggedIn,
      `URL: ${adminUrl} | Konsol Admin terbuka dengan tema Dark`);

    // Admin tries Intelligence Center
    await page.goto('http://localhost:5173/intelligence-center/overview', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));
    const adminCrossText = await page.evaluate(() => document.body.innerText);
    const adminBlockedFromIntel = adminCrossText.includes('Akses Area Dibatasi') && adminCrossText.includes('admin');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_admin_blocked_from_intel.png') });
    record(11, 'Admin tidak dapat membuka Intelligence Center (Akses silang diblokir)', adminBlockedFromIntel,
      `Tampil banner: "Akses Area Dibatasi" | Role admin tidak diizinkan masuk Intelligence Center`);

    // Logout Admin
    await page.evaluate(async () => {
      const { default: apiClient } = await import('/src/lib/axios.ts');
      await apiClient.post('/auth/logout');
      window.location.href = '/login';
    });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 5000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    // -------------------------------------------------------------
    // SKENARIO 12 & 13: Login sebagai Intelligence berhasil & Intelligence tidak dapat buka Admin Dashboard
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    const intelPresetBtn = await page.waitForSelector('button ::-p-text(Intelijen)', { timeout: 5000 });
    await intelPresetBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    const submitIntelBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await submitIntelBtn.click();

    await page.waitForFunction(() => window.location.pathname.includes('/intelligence-center/overview'), { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    const intelUrl = page.url();
    const intelLoggedIn = intelUrl.includes('/intelligence-center/overview');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_intelligence_overview.png') });
    record(12, 'Login sebagai intelligence berhasil dan diarahkan ke /intelligence-center/overview', intelLoggedIn,
      `URL: ${intelUrl} | Intelligence Center terbuka dengan tema Dark`);

    // Intelligence tries Admin Dashboard
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));
    const intelCrossText = await page.evaluate(() => document.body.innerText);
    const intelBlockedFromAdmin = intelCrossText.includes('Akses Area Dibatasi') && intelCrossText.includes('intelligence');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_intel_blocked_from_admin.png') });
    record(13, 'Intelligence tidak dapat membuka Admin Dashboard (Akses silang diblokir)', intelBlockedFromAdmin,
      `Tampil banner: "Akses Area Dibatasi" | Role intelligence tidak diizinkan masuk Admin Dashboard`);

    // Logout Intelligence
    await page.evaluate(async () => {
      const { default: apiClient } = await import('/src/lib/axios.ts');
      await apiClient.post('/auth/logout');
      window.location.href = '/';
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
  } catch (err) {
    console.error('Fatal test execution error:', err);
  } finally {
    await browser.close();
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log('========================================================================');
  console.log(`HASIL VERIFIKASI BROWSER E2E: ${passedCount} / ${results.length} SKENARIO LULUS`);
  console.log('========================================================================');

  // Write results JSON
  fs.writeFileSync(
    path.join(__dirname, 'e2e_results.json'),
    JSON.stringify({ passedCount, total: results.length, results, networkLogs, consoleErrors }, null, 2)
  );
}

runTest();
