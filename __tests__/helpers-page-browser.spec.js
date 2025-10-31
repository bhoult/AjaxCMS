/**
 * Headless browser test for Helpers documentation page
 * This actually loads the page in a browser to see runtime issues
 */

const puppeteer = require('puppeteer');

describe('Helpers Page Browser Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();

    // Capture console messages and errors
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should load Helpers.md without errors', async () => {
    const errors = [];
    const consoleWarnings = [];
    const consoleErrors = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Load the page - use 'domcontentloaded' instead of 'networkidle0' since the page might have ongoing AJAX
    const response = await page.goto('http://localhost:3000/ajaxcms.org/?page=pages/menus/01-Documentation/02-Helpers.md', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    expect(response.ok()).toBe(true);

    // Wait a bit for any async processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Log what we found
    console.log('\n=== ERRORS ===');
    console.log(errors);
    console.log('\n=== CONSOLE WARNINGS ===');
    console.log(consoleWarnings);
    console.log('\n=== CONSOLE ERRORS ===');
    console.log(consoleErrors);

    // Get the page content
    const content = await page.content();

    // Check if helper examples are being processed (they shouldn't be)
    const bodyText = await page.evaluate(() => document.body.innerText);

    // If examples are being processed incorrectly, they'll show as links or images
    // instead of the raw helper syntax
    console.log('\n=== CHECKING FOR INCORRECTLY PROCESSED HELPERS ===');

    // Count how many times we see raw helper syntax in code blocks
    const helperMatches = bodyText.match(/{{[^}]+}}/g);
    console.log('Helper syntax found in page text:', helperMatches ? helperMatches.length : 0);
    if (helperMatches) {
      console.log('Examples:', helperMatches.slice(0, 10));
    }

    // Report errors found
    console.log('\n=== TEST RESULTS ===');
    console.log('Total errors:', errors.length);
    console.log('Total warnings:', consoleWarnings.length);
    console.log('Total console errors:', consoleErrors.length);

    // The test fails if there are errors
    expect(errors.length).toBe(0);
  }, 60000);
});
