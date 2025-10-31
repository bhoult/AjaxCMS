/**
 * Test to verify helper documentation displays correctly (no placeholders)
 */

const puppeteer = require('puppeteer');

describe('Helpers Page Content Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should not contain placeholder tokens in rendered content', async () => {
    await page.goto('http://localhost:3000/ajaxcms.org/?page=pages/menus/01-Documentation/02-Helpers.md', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const bodyText = await page.evaluate(() => document.body.innerText);

    // Should not contain any placeholder tokens
    expect(bodyText).not.toContain('PROTECTED_CODE_BLOCK');
    expect(bodyText).not.toContain('PROTECTED_HELPER');

    // Should contain actual helper syntax examples
    expect(bodyText).toContain('{{a | page');
    expect(bodyText).toContain('{{i | image');
    expect(bodyText).toContain('{{insert | page_name');
    expect(bodyText).toContain('{{carousel:interval');
    expect(bodyText).toContain('{{blog | directory');
    expect(bodyText).toContain('{{bloglist | directory');
    expect(bodyText).toContain('{{filelist | directory_path');

    // Should contain the HTML Attributes section properly
    expect(bodyText).toContain('HTML Attributes');
    expect(bodyText).toContain('attr=>value');

    console.log('✓ No placeholder tokens found');
    console.log('✓ Helper syntax examples are visible (including blog, bloglist, filelist)');
  }, 30000);
});
