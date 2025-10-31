/**
 * Test to capture the actual HTML diff to see what's changing
 */

const puppeteer = require('puppeteer');

describe('Helpers Page HTML Diff Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should capture what HTML is changing', async () => {
    await page.goto('http://localhost:3000/ajaxcms.org/?page=pages/menus/01-Documentation/02-Helpers.md', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take HTML snapshots
    const snapshot1 = await page.evaluate(() => {
      const div = document.querySelector('#a') || document.querySelector('#b');
      return div ? div.innerHTML : '';
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const snapshot2 = await page.evaluate(() => {
      const div = document.querySelector('#a') || document.querySelector('#b');
      return div ? div.innerHTML : '';
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const snapshot3 = await page.evaluate(() => {
      const div = document.querySelector('#a') || document.querySelector('#b');
      return div ? div.innerHTML : '';
    });

    console.log('Snapshot 1 length:', snapshot1.length);
    console.log('Snapshot 2 length:', snapshot2.length);
    console.log('Snapshot 3 length:', snapshot3.length);

    // Find differences between snapshots
    if (snapshot1 !== snapshot2) {
      console.log('\n=== DIFFERENCE FOUND BETWEEN SNAPSHOT 1 AND 2 ===');

      // Find first difference
      for (let i = 0; i < Math.min(snapshot1.length, snapshot2.length); i++) {
        if (snapshot1[i] !== snapshot2[i]) {
          const context = 200;
          console.log('First difference at position:', i);
          console.log('Snapshot 1 (context):', snapshot1.substring(Math.max(0, i-context), i+context));
          console.log('Snapshot 2 (context):', snapshot2.substring(Math.max(0, i-context), i+context));
          break;
        }
      }

      // Check if length differs
      if (snapshot1.length !== snapshot2.length) {
        console.log('\nLength difference:', snapshot2.length - snapshot1.length, 'characters');

        // Check end of strings
        const minLen = Math.min(snapshot1.length, snapshot2.length);
        console.log('\nSnapshot 1 ending:', snapshot1.substring(minLen - 200));
        console.log('\nSnapshot 2 ending:', snapshot2.substring(minLen - 200));
      }
    }

    if (snapshot2 !== snapshot3) {
      console.log('\n=== DIFFERENCE FOUND BETWEEN SNAPSHOT 2 AND 3 ===');
      console.log('Length changed from', snapshot2.length, 'to', snapshot3.length);
    }

    if (snapshot1 === snapshot3 && snapshot1 !== snapshot2) {
      console.log('\n=== PATTERN: Snapshot 1 and 3 are identical, but 2 is different ===');
      console.log('This suggests content is toggling back and forth!');
    }
  }, 30000);
});
