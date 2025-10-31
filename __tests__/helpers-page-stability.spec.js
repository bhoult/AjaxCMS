/**
 * Test to check if Helpers page content is stable or keeps changing
 */

const puppeteer = require('puppeteer');

describe('Helpers Page Stability Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
      if (msg.text().includes('process') || msg.text().includes('insert')) {
        console.log('BROWSER:', msg.text());
      }
    });
    page.on('pageerror', error => console.log('ERROR:', error.message));
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should have stable content that does not keep changing', async () => {
    await page.goto('http://localhost:3000/ajaxcms.org/?page=pages/menus/01-Documentation/02-Helpers.md', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take snapshots of content height and HTML at intervals
    const snapshots = [];

    for (let i = 0; i < 5; i++) {
      const snapshot = await page.evaluate(() => {
        const contentDiv = document.querySelector('#a') || document.querySelector('#b');
        return {
          scrollHeight: contentDiv ? contentDiv.scrollHeight : 0,
          innerHTMLLength: contentDiv ? contentDiv.innerHTML.length : 0,
          linkCount: document.querySelectorAll('#a a, #b a').length,
          imageCount: document.querySelectorAll('#a img, #b img').length
        };
      });

      snapshots.push(snapshot);
      console.log(`Snapshot ${i}:`, JSON.stringify(snapshot));

      // Wait 500ms between snapshots
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Check if all snapshots are identical
    const first = snapshots[0];
    const allIdentical = snapshots.every(s =>
      s.scrollHeight === first.scrollHeight &&
      s.innerHTMLLength === first.innerHTMLLength &&
      s.linkCount === first.linkCount &&
      s.imageCount === first.imageCount
    );

    console.log('\n=== STABILITY CHECK ===');
    console.log('All snapshots identical?', allIdentical);
    console.log('First snapshot:', JSON.stringify(first));
    console.log('Last snapshot:', JSON.stringify(snapshots[snapshots.length - 1]));

    if (!allIdentical) {
      console.log('CONTENT IS CHANGING! Snapshots:');
      snapshots.forEach((s, i) => console.log(`  ${i}:`, s));
    }

    expect(allIdentical).toBe(true);
  }, 30000);
});
