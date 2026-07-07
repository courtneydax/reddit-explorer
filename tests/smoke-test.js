// Playwright smoke test for reddit-explorer.html.
// Run with: npm test (after `npm install` once, to fetch playwright + its browser).
//
// Covers:
//  - responsive drawer behavior (desktop vs mobile viewport)
//  - XSS regression: a malicious post.url must never execute as HTML/script
//  - search-target persists across a reload via the URL

const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

const FILE_URL = 'file://' + path.resolve(__dirname, '..', 'reddit-explorer.html');

async function testResponsiveDrawer(browser) {
  console.log('\n=== Responsive drawer ===');
  for (const [label, viewport] of [['desktop', { width: 1400, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });

    await page.goto(FILE_URL);
    await page.waitForTimeout(300);

    const hamburgerVisible = await page.isVisible('#btnHamburger');
    assert.strictEqual(hamburgerVisible, label === 'mobile', `[${label}] hamburger visibility`);

    if (label === 'mobile') {
      const transformBefore = await page.evaluate(() => getComputedStyle(document.querySelector('.sidebar')).transform);
      assert.ok(transformBefore.includes('-260'), 'sidebar should start off-screen on mobile');

      await page.click('#btnHamburger');
      await page.waitForTimeout(400);
      const openClass = await page.evaluate(() => document.querySelector('.sidebar').classList.contains('open'));
      assert.strictEqual(openClass, true, 'sidebar should open after hamburger click');

      await page.mouse.click(370, 400); // sliver of backdrop visible past the 260px-wide drawer
      await page.waitForTimeout(400);
      const openAfterBackdropClick = await page.evaluate(() => document.querySelector('.sidebar').classList.contains('open'));
      assert.strictEqual(openAfterBackdropClick, false, 'sidebar should close after backdrop click');
    }

    console.log(`[${label}] OK, console/page errors:`, errors.length ? errors : 'none');
    await page.close();
  }
}

async function testXssRegression(browser) {
  console.log('\n=== XSS regression (post.url -> innerHTML / window.open) ===');
  const page = await browser.newPage();
  let dialogFired = false;
  page.on('dialog', async d => { dialogFired = true; await d.dismiss(); });

  await page.goto(FILE_URL);
  await page.waitForTimeout(200);

  const result = await page.evaluate(() => {
    const maliciousPost = {
      author: 'testuser', subreddit: 'testsub', score: 42,
      created_utc: Date.now() / 1000, permalink: '/r/testsub/comments/abc123/test/',
      url: 'https://x.com/a.jpg"><svg onload=window.__xss_fired=true>',
      is_gallery: false, is_video: false, preview: null,
    };
    renderCard(maliciousPost);
    return {
      svgInDom: !!document.querySelector('#gallery svg'),
      xssFired: window.__xss_fired === true,
    };
  });
  assert.strictEqual(result.svgInDom, false, 'malicious post.url must not inject a live element');
  assert.strictEqual(result.xssFired, false, 'onload handler must never execute');
  assert.strictEqual(dialogFired, false, 'no dialog should fire');

  const openResult = await page.evaluate(() => {
    let openedUrl = null;
    const origOpen = window.open;
    window.open = (url) => { openedUrl = url; return null; };
    const post = { permalink: '/r/y/comments/z/x/', url: 'javascript:window.__xss2_fired=true' };
    const fullRedditUrl = `https://reddit.com${post.permalink}`;
    window.open(isSafeMediaUrl(post.url) ? post.url : fullRedditUrl, '_blank');
    window.open = origOpen;
    return { openedUrl, isSafe: isSafeMediaUrl(post.url) };
  });
  assert.strictEqual(openResult.isSafe, false, 'javascript: URIs must be rejected by isSafeMediaUrl');
  assert.strictEqual(openResult.openedUrl, 'https://reddit.com/r/y/comments/z/x/', 'window.open must fall back to the safe Reddit permalink');

  console.log('OK');
  await page.close();
}

async function testReloadPersistence(browser) {
  console.log('\n=== Search target persists across reload ===');
  const page = await browser.newPage();
  await page.route('**/arctic-shift.photon-reddit.com/**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

  await page.goto(FILE_URL);
  await page.fill('#sub', 'programming');
  await page.click('#btnSearch');
  await page.waitForTimeout(500);

  assert.ok(page.url().endsWith('?sub=programming'), 'URL should reflect the manual search');

  await page.reload();
  await page.waitForTimeout(500);

  assert.ok(page.url().endsWith('?sub=programming'), 'URL should survive reload');
  assert.strictEqual(await page.inputValue('#sub'), 'programming', '#sub field should repopulate after reload');

  console.log('OK');
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    await testResponsiveDrawer(browser);
    await testXssRegression(browser);
    await testReloadPersistence(browser);
    console.log('\nAll smoke tests passed.');
  } catch (e) {
    console.error('\nSMOKE TEST FAILED:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
