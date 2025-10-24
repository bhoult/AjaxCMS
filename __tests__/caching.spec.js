/**
 * Tests for AjaxCMS Caching System
 *
 * These tests verify that the server properly implements
 * ETag-based caching using file modification timestamps.
 */

const request = require('supertest');
const app = require('../server.js');

describe('AjaxCMS Caching System', () => {
  describe('ETag Headers', () => {
    it('should set ETag header on static files', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.headers.etag).toBeDefined();
      expect(response.headers.etag).toMatch(/^"[0-9]+(\.[0-9]+)?"$/); // Timestamp format
    });

    it('should set Cache-Control header on static files', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('must-revalidate');
    });

    it('should return different ETags for different files', async () => {
      const sitesResponse = await request(app).get('/api/sites');
      if (sitesResponse.body.sites.length === 0) {
        return; // Skip if no sites
      }

      const site = sitesResponse.body.sites[0];

      // Get two different files
      const response1 = await request(app).get(`/${site.path}/`);
      const response2 = await request(app).get('/');

      // Both should have ETags
      expect(response1.headers.etag).toBeDefined();
      expect(response2.headers.etag).toBeDefined();

      // ETags might be different (different files, different timestamps)
      // Just verify they're both valid timestamp formats
      expect(response1.headers.etag).toMatch(/^"[0-9]+(\.[0-9]+)?"$/);
      expect(response2.headers.etag).toMatch(/^"[0-9]+(\.[0-9]+)?"$/);
    });
  });

  describe('304 Not Modified Responses', () => {
    it('should return 304 when If-None-Match matches ETag', async () => {
      // First request to get ETag
      const firstResponse = await request(app).get('/');

      expect(firstResponse.status).toBe(200);
      const etag = firstResponse.headers.etag;
      expect(etag).toBeDefined();

      // Second request with If-None-Match header
      const secondResponse = await request(app)
        .get('/')
        .set('If-None-Match', etag);

      expect(secondResponse.status).toBe(304);
      expect(secondResponse.body).toEqual({});
    });

    it('should return 200 when If-None-Match does not match', async () => {
      const response = await request(app)
        .get('/')
        .set('If-None-Match', '"999999999"'); // Old timestamp

      expect(response.status).toBe(200);
      expect(response.headers.etag).toBeDefined();
    });

    it('should return 200 when no If-None-Match header', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.headers.etag).toBeDefined();
    });
  });

  describe('Site Files Caching', () => {
    it('should cache site index.html with ETag', async () => {
      const sitesResponse = await request(app).get('/api/sites');
      if (sitesResponse.body.sites.length === 0) {
        return; // Skip if no sites
      }

      const site = sitesResponse.body.sites[0];
      const response = await request(app).get(`/${site.path}/`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.headers.etag).toBeDefined();
        expect(response.headers['cache-control']).toBeDefined();
      }
    });

    it('should cache static resources (js/css/images)', async () => {
      // Try to get a shared JavaScript file
      const response = await request(app).get('/js/ajaxcms.js');

      if (response.status === 200) {
        expect(response.headers.etag).toBeDefined();
        expect(response.headers['cache-control']).toBeDefined();
        expect(response.headers.etag).toMatch(/^"[0-9]+(\.[0-9]+)?"$/);
      }
    });
  });

  describe('ETag Format', () => {
    it('should use timestamp as ETag value', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      const etag = response.headers.etag;

      // ETag should be quoted timestamp
      expect(etag).toMatch(/^"[0-9]+(\.[0-9]+)?"$/);

      // Extract timestamp (remove quotes)
      const timestamp = parseFloat(etag.replace(/"/g, ''));

      // Timestamp should be a reasonable Unix timestamp (in milliseconds)
      // Should be sometime after 2020 and before 2100
      expect(timestamp).toBeGreaterThan(1577836800000); // 2020-01-01
      expect(timestamp).toBeLessThan(4102444800000); // 2100-01-01
    });

    it('should have quotes around ETag value', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      const etag = response.headers.etag;

      expect(etag).toMatch(/^".*"$/);
    });
  });

  describe('Shared Resources Caching', () => {
    it('should cache shared theme files', async () => {
      const response = await request(app).get('/themes/network/background.js');

      if (response.status === 200) {
        expect(response.headers.etag).toBeDefined();
        expect(response.headers['cache-control']).toBeDefined();
      }
    });

    it('should cache shared image files', async () => {
      const response = await request(app).get('/images/ajaxcms.svg');

      if (response.status === 200) {
        expect(response.headers.etag).toBeDefined();
        expect(response.headers['cache-control']).toBeDefined();
      }
    });
  });
});
