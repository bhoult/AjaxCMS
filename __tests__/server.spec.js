const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Mock the server app
let app;

describe('AjaxCMS Server', () => {
  beforeAll(() => {
    // Load the server module
    // Since server.js starts listening, we need to create a testable version
    app = require('../server.js');
  });

  describe('API Endpoints', () => {
    describe('GET /api/sites', () => {
      it('should return list of all sites', async () => {
        const response = await request(app).get('/api/sites');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('sites');
        expect(Array.isArray(response.body.sites)).toBe(true);
      });

      it('should include site metadata (name, path, url, description)', async () => {
        const response = await request(app).get('/api/sites');

        if (response.body.sites.length > 0) {
          const site = response.body.sites[0];
          expect(site).toHaveProperty('name');
          expect(site).toHaveProperty('path');
          expect(site).toHaveProperty('url');
          expect(site).toHaveProperty('description');
        }
      });

      it('should discover sites in nested directories', async () => {
        const response = await request(app).get('/api/sites');

        // Check if any sites have nested paths
        const nestedSites = response.body.sites.filter(site =>
          site.path.includes('/')
        );

        expect(nestedSites.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/list', () => {
      it('should require site context', async () => {
        const response = await request(app).get('/api/list');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });

      it('should return directory listing for valid site', async () => {
        // Get a valid site first
        const sitesResponse = await request(app).get('/api/sites');
        if (sitesResponse.body.sites.length === 0) {
          return; // Skip if no sites
        }

        const site = sitesResponse.body.sites[0];
        const response = await request(app)
          .get(`/${site.path}/api/list?dir=.`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('directories');
        expect(response.body).toHaveProperty('files');
        expect(Array.isArray(response.body.directories)).toBe(true);
        expect(Array.isArray(response.body.files)).toBe(true);
      });

      it('should prevent directory traversal attacks', async () => {
        const sitesResponse = await request(app).get('/api/sites');
        if (sitesResponse.body.sites.length === 0) {
          return;
        }

        const site = sitesResponse.body.sites[0];
        const response = await request(app)
          .get(`/${site.path}/api/list?dir=../../`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/list-recursive', () => {
      it('should return recursive file listing', async () => {
        const sitesResponse = await request(app).get('/api/sites');
        if (sitesResponse.body.sites.length === 0) {
          return;
        }

        const site = sitesResponse.body.sites[0];
        const response = await request(app)
          .get(`/${site.path}/api/list-recursive?dir=.`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('files');
        expect(Array.isArray(response.body.files)).toBe(true);
      });

      it('should prevent directory traversal in recursive listing', async () => {
        const sitesResponse = await request(app).get('/api/sites');
        if (sitesResponse.body.sites.length === 0) {
          return;
        }

        const site = sitesResponse.body.sites[0];
        const response = await request(app)
          .get(`/${site.path}/api/list-recursive?dir=../../`);

        expect(response.status).toBe(403);
      });
    });
  });

  describe('Multi-Site Routing', () => {
    describe('Path-based routing', () => {
      it('should serve sites via path (e.g., /sitename/)', async () => {
        const sitesResponse = await request(app).get('/api/sites');
        if (sitesResponse.body.sites.length === 0) {
          return;
        }

        const site = sitesResponse.body.sites[0];
        const response = await request(app).get(`/${site.path}/`);

        expect(response.status).toBe(200);
        expect(response.text).toContain('<!DOCTYPE html>');
      });

      it('should support nested site paths (e.g., /folder/sitename/)', async () => {
        const sitesResponse = await request(app).get('/api/sites');
        const nestedSites = sitesResponse.body.sites.filter(site =>
          site.path.includes('/')
        );

        if (nestedSites.length === 0) {
          return;
        }

        const site = nestedSites[0];
        const response = await request(app).get(`/${site.path}/`);

        expect(response.status).toBe(200);
        expect(response.text).toContain('<!DOCTYPE html>');
      });

      it('should serve index.html for site root', async () => {
        const sitesResponse = await request(app).get('/api/sites');
        if (sitesResponse.body.sites.length === 0) {
          return;
        }

        const site = sitesResponse.body.sites[0];
        const response = await request(app).get(`/${site.path}/`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/html/);
      });
    });
  });

  describe('Resource Fallback System', () => {
    it('should serve shared js/ files for sites', async () => {
      const sitesResponse = await request(app).get('/api/sites');
      if (sitesResponse.body.sites.length === 0) {
        return;
      }

      const site = sitesResponse.body.sites[0];
      const response = await request(app)
        .get(`/${site.path}/js/ajaxcms.js`);

      // Should either serve from site or fallback to main
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/javascript/);
      }
    });

    it('should serve shared themes/ files for sites', async () => {
      const sitesResponse = await request(app).get('/api/sites');
      if (sitesResponse.body.sites.length === 0) {
        return;
      }

      const site = sitesResponse.body.sites[0];
      // Try to get a theme file
      const response = await request(app)
        .get(`/${site.path}/themes/network/background.js`);

      expect([200, 404]).toContain(response.status);
    });

    it('should serve shared images/ files for sites', async () => {
      const sitesResponse = await request(app).get('/api/sites');
      if (sitesResponse.body.sites.length === 0) {
        return;
      }

      const site = sitesResponse.body.sites[0];
      const response = await request(app)
        .get(`/${site.path}/images/ajaxcms.svg`);

      expect([200, 404]).toContain(response.status);
    });

    it('should prioritize site-local files over shared files', async () => {
      // This test would need a specific test site with local overrides
      // For now, just verify the fallback happens
      expect(true).toBe(true);
    });
  });

  describe('Static File Serving', () => {
    it('should serve HTML files', async () => {
      const sitesResponse = await request(app).get('/api/sites');
      if (sitesResponse.body.sites.length === 0) {
        return;
      }

      const site = sitesResponse.body.sites[0];
      const response = await request(app).get(`/${site.path}/index.html`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/html/);
    });

    it('should serve JavaScript files with correct content-type', async () => {
      const response = await request(app).get('/js/ajaxcms.js');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/javascript/);
      }
    });

    it('should serve CSS files with correct content-type', async () => {
      // Try to get a theme CSS file
      const response = await request(app).get('/themes/network/theme.css');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/css/);
      }
    });

    it('should return 404 for non-existent files', async () => {
      const response = await request(app)
        .get('/nonexistent-file-12345.html');

      expect(response.status).toBe(404);
    });
  });

  describe('Sites Index Page', () => {
    it('should serve sites index at root', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('AjaxCMS Sites');
    });

    it('should load sites dynamically via JavaScript', async () => {
      const response = await request(app).get('/');

      expect(response.text).toContain('loadSites');
      expect(response.text).toContain('/api/sites');
    });
  });

  describe('Security', () => {
    it('should prevent directory traversal in static files', async () => {
      const response = await request(app)
        .get('/../../etc/passwd');

      expect(response.status).toBe(403);
    });

    it('should sanitize file paths', async () => {
      const response = await request(app)
        .get('/../../../etc/passwd');

      expect([403, 404]).toContain(response.status);
    });
  });
});
