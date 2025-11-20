/**
 * Discussion Screenshot Capture Utility
 *
 * This script uses Puppeteer to capture screenshots of the AjaxCMS discussion system
 * in action, demonstrating the threaded comment interface with example data.
 *
 * Copyright (C) 2016-2025 Brandon Hoult
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  await page.goto('http://localhost:3000/ajaxcms.org/?page=pages/menus/04-Discuss.md', {
    waitUntil: 'networkidle2',
    timeout: 10000
  });

  // Wait for discussion container to load
  await page.waitForSelector('.discussion-container', { timeout: 5000 });

  // Scroll to the discussion section
  await page.evaluate(() => {
    const discussion = document.querySelector('.discussion-container');
    if (discussion) {
      discussion.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  });

  // Wait a bit for any animations
  await new Promise(resolve => setTimeout(resolve, 500));

  // Take screenshot of the discussion section
  const element = await page.$('.discussion-container');
  await element.screenshot({ path: 'discussion-section.png' });

  // Also take a screenshot of just the form
  const form = await page.$('.discussion-form');
  if (form) {
    await form.screenshot({ path: 'discussion-form-only.png' });
  }

  await browser.close();
})();
