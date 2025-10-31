const puppeteer = require('puppeteer');

describe('Blog Usage Section Check', () => {
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

  it('should show blog syntax in Usage section, not empty divs', async () => {
    // Disable cache
    await page.setCacheEnabled(false);

    await page.goto('http://localhost:3000/ajaxcms.org/?page=pages/menus/01-Documentation/02-Helpers.md', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the HTML content
    const html = await page.evaluate(() => {
      const div = document.querySelector('#a') || document.querySelector('#b');
      return div ? div.innerHTML : '';
    });

    // Look for the Usage section
    const usageMatch = html.match(/<strong>Usage:<\/strong>[\s\S]{0,500}/);
    if (usageMatch) {
      console.log('\n=== USAGE SECTION HTML ===');
      console.log(usageMatch[0]);
    }

    // Count empty blog divs
    const emptyBlogDivs = (html.match(/<div\s+class='blog'>\s*<\/div>/g) || []).length;
    console.log('\n=== EMPTY BLOG DIVS ===');
    console.log('Count:', emptyBlogDivs);

    // Check for proper code display
    const hasProperCode = html.includes('{{blog | ./pages/blog}}');
    console.log('\n=== HAS PROPER BLOG SYNTAX ===');
    console.log('Found "{{blog | ./pages/blog}}":', hasProperCode);

    expect(emptyBlogDivs).toBe(0);
    expect(hasProperCode).toBe(true);
  }, 30000);
});
