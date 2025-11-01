const request = require('supertest');
const path = require('path');

describe('AjaxCMS SEO Features', () => {
  let app;

  beforeAll(() => {
    // Load the server
    app = require('../server.js');
  });

  describe('XML Sitemap Generation', () => {
    describe('GET /sitemap.xml', () => {
      it('should return XML sitemap with correct content-type', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xml')
          .expect(200)
          .expect('Content-Type', /xml/);

        expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(response.text).toContain('<urlset');
        expect(response.text).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      });

      it('should include XSLT stylesheet reference', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xml');

        expect(response.text).toContain('<?xml-stylesheet');
        expect(response.text).toContain('type="text/xsl"');
        expect(response.text).toMatch(/href=".*sitemap\.xsl"/);
      });

      it('should include all .html and .md pages', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xml');

        // Should have multiple URL entries
        const urlMatches = response.text.match(/<url>/g);
        expect(urlMatches).toBeTruthy();
        expect(urlMatches.length).toBeGreaterThan(0);

        // Should include pages directory prefix
        expect(response.text).toContain('?page=pages/');
      });

      it('should include alternate links to static HTML versions', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xml');

        // Should have xhtml:link elements
        expect(response.text).toContain('xmlns:xhtml=');
        expect(response.text).toContain('<xhtml:link');
        expect(response.text).toContain('rel="alternate"');
        expect(response.text).toContain('/static/pages/');
      });

      it('should include lastmod timestamps', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xml');

        expect(response.text).toContain('<lastmod>');
        // Should be valid ISO 8601 format
        expect(response.text).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it('should include priority values', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xml');

        expect(response.text).toContain('<priority>');
        // Homepage should have priority 1.0
        expect(response.text).toContain('<priority>1.0</priority>');
      });

      it('should include changefreq values', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xml');

        expect(response.text).toContain('<changefreq>');
        expect(response.text).toMatch(/<changefreq>(always|hourly|daily|weekly|monthly|yearly|never)<\/changefreq>/);
      });

      it('should be alphabetically sorted', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xml');

        // Extract all URLs
        const urlRegex = /<loc>([^<]+)<\/loc>/g;
        const urls = [];
        let match;
        while ((match = urlRegex.exec(response.text)) !== null) {
          urls.push(match[1]);
        }

        // Verify alphabetical order (case-insensitive)
        for (let i = 1; i < urls.length; i++) {
          const prev = urls[i-1].toLowerCase();
          const curr = urls[i].toLowerCase();
          expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
        }
      });
    });

    describe('GET /sitemap.xsl', () => {
      it('should serve XSLT stylesheet', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xsl')
          .expect(200)
          .expect('Content-Type', /xslt\+xml/);

        expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(response.text).toContain('<xsl:stylesheet');
      });

      it('should include section groupings in stylesheet', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/sitemap.xsl');

        // Should have templates for different sections
        expect(response.text).toContain('Homepage');
        expect(response.text).toContain('Menu Pages');
        expect(response.text).toContain('Blog Posts');
      });
    });
  });

  describe('Robots.txt', () => {
    describe('GET /robots.txt', () => {
      it('should return robots.txt with correct content-type', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/robots.txt')
          .expect(200)
          .expect('Content-Type', /text\/plain/);
      });

      it('should allow all user agents', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/robots.txt');

        expect(response.text).toContain('User-agent: *');
        expect(response.text).toContain('Allow: /');
      });

      it('should reference sitemap', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/robots.txt');

        expect(response.text).toContain('Sitemap:');
        expect(response.text).toContain('/sitemap.xml');
      });
    });
  });

  describe('Static HTML Rendering', () => {
    describe('GET /static/*', () => {
      it('should render Markdown files to static HTML', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/static/pages/menus/00-Home.md')
          .expect(200)
          .expect('Content-Type', /html/);

        expect(response.text).toContain('<!DOCTYPE html>');
        expect(response.text).toContain('<html');
        expect(response.text).toContain('</html>');
      });

      it('should include SEO meta tags', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/static/pages/menus/00-Home.md');

        // Should have title
        expect(response.text).toContain('<title>');

        // Should have meta description
        expect(response.text).toContain('<meta name="description"');

        // Should have canonical URL
        expect(response.text).toContain('<link rel="canonical"');
      });

      it('should include Open Graph tags', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/static/pages/menus/00-Home.md');

        expect(response.text).toContain('<meta property="og:title"');
        expect(response.text).toContain('<meta property="og:description"');
        expect(response.text).toContain('<meta property="og:url"');
        expect(response.text).toContain('<meta property="og:type"');
      });

      it('should include Twitter Card tags', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/static/pages/menus/00-Home.md');

        expect(response.text).toContain('<meta property="twitter:card"');
        expect(response.text).toContain('<meta property="twitter:title"');
        expect(response.text).toContain('<meta property="twitter:description"');
      });

      it('should render HTML files without markdown conversion', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/static/pages/splash.html')
          .expect(200);

        expect(response.text).toContain('<!DOCTYPE html>');
      });

      it('should return 404 for non-existent files', async () => {
        await request(app)
          .get('/ajaxcms.org/static/pages/nonexistent.md')
          .expect(404);
      });

      it('should prevent directory traversal', async () => {
        await request(app)
          .get('/ajaxcms.org/static/../../server.js')
          .expect(403);
      });

      it('should have canonical URL pointing to AJAX version', async () => {
        const response = await request(app)
          .get('/ajaxcms.org/static/pages/menus/00-Home.md');

        expect(response.text).toMatch(/<link rel="canonical" href="[^"]*\?page=pages\/menus\/00-Home\.md"/);
      });
    });
  });

  describe('SEO Integration', () => {
    it('should ensure sitemap URLs match static rendering URLs', async () => {
      // Get sitemap
      const sitemapResponse = await request(app)
        .get('/ajaxcms.org/sitemap.xml');

      // Extract alternate URLs from sitemap
      const alternateRegex = /<xhtml:link rel="alternate"[^>]*href="([^"]+)"/g;
      const alternateUrls = [];
      let match;
      while ((match = alternateRegex.exec(sitemapResponse.text)) !== null) {
        alternateUrls.push(match[1]);
      }

      // Verify at least one alternate URL exists
      expect(alternateUrls.length).toBeGreaterThan(0);

      // Test first alternate URL works
      const firstUrl = new URL(alternateUrls[0]);
      const response = await request(app)
        .get(firstUrl.pathname)
        .expect(200);

      expect(response.text).toContain('<!DOCTYPE html>');
    });

    it('should include all SEO routes in different sites', async () => {
      // Test theme-demos site
      const sitemapRes = await request(app)
        .get('/theme-demos/gears.com/sitemap.xml')
        .expect(200);

      const robotsRes = await request(app)
        .get('/theme-demos/gears.com/robots.txt')
        .expect(200);

      expect(sitemapRes.text).toContain('<urlset');
      expect(robotsRes.text).toContain('User-agent:');
    });
  });
});
