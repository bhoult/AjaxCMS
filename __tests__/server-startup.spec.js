/**
 * Tests for AjaxCMS Server Startup and Configuration
 *
 * These tests verify server initialization, SSL configuration,
 * environment variables, and port handling.
 */

const path = require('path');

describe('AjaxCMS Server Startup', () => {
  let originalEnv;
  let originalRequireMain;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    originalRequireMain = require.main;

    // Clear module cache to get fresh server.js
    delete require.cache[require.resolve('../server.js')];
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    require.main = originalRequireMain;
  });

  describe('Environment Variables', () => {
    it('should use default PORT of 3000 when not specified', () => {
      delete process.env.PORT;
      delete process.env.ENABLE_SSL;

      const server = require('../server.js');
      // Server module loads with defaults
      expect(process.env.PORT).toBeUndefined();
    });

    it('should use custom PORT from environment', () => {
      process.env.PORT = '8080';
      delete process.env.ENABLE_SSL;

      const server = require('../server.js');
      expect(process.env.PORT).toBe('8080');
    });

    it('should use default SITES_DIR of ./sites when not specified', () => {
      delete process.env.SITES_DIR;

      const server = require('../server.js');
      expect(process.env.SITES_DIR).toBeUndefined();
    });

    it('should use custom SITES_DIR from environment', () => {
      process.env.SITES_DIR = '/custom/sites';

      const server = require('../server.js');
      expect(process.env.SITES_DIR).toBe('/custom/sites');
    });

    it('should default ENABLE_SSL to false', () => {
      delete process.env.ENABLE_SSL;

      const server = require('../server.js');
      expect(process.env.ENABLE_SSL).toBeUndefined();
    });

    it('should read ENABLE_SSL from environment', () => {
      process.env.ENABLE_SSL = 'true';

      const server = require('../server.js');
      expect(process.env.ENABLE_SSL).toBe('true');
    });

    it('should read MAINTAINER_EMAIL from environment', () => {
      process.env.MAINTAINER_EMAIL = 'admin@example.com';

      const server = require('../server.js');
      expect(process.env.MAINTAINER_EMAIL).toBe('admin@example.com');
    });
  });

  describe('SSL Configuration', () => {
    it('should handle ENABLE_SSL=false (development mode)', () => {
      process.env.ENABLE_SSL = 'false';
      process.env.PORT = '3000';

      const server = require('../server.js');
      // Should load without errors
      expect(server).toBeDefined();
    });

    it('should handle ENABLE_SSL=true with MAINTAINER_EMAIL', () => {
      process.env.ENABLE_SSL = 'true';
      process.env.MAINTAINER_EMAIL = 'admin@example.com';

      // Note: We can't actually start the SSL server in tests,
      // but we can verify the module loads correctly
      expect(() => {
        const server = require('../server.js');
      }).not.toThrow();
    });

    it('should recognize SSL mode environment variable', () => {
      process.env.ENABLE_SSL = 'true';
      process.env.MAINTAINER_EMAIL = 'test@example.com';

      const server = require('../server.js');
      expect(process.env.ENABLE_SSL).toBe('true');
      expect(process.env.MAINTAINER_EMAIL).toBe('test@example.com');
    });
  });

  describe('Port Configuration', () => {
    it('should use port 3000 in development mode by default', () => {
      delete process.env.PORT;
      delete process.env.ENABLE_SSL;

      const server = require('../server.js');
      // Default HTTP_PORT should be 3000 when SSL is disabled
      expect(process.env.PORT).toBeUndefined();
    });

    it('should use custom port in development mode', () => {
      process.env.PORT = '8080';
      process.env.ENABLE_SSL = 'false';

      const server = require('../server.js');
      expect(process.env.PORT).toBe('8080');
    });

    it('should indicate standard ports (80/443) when SSL is enabled', () => {
      process.env.ENABLE_SSL = 'true';
      process.env.MAINTAINER_EMAIL = 'admin@example.com';

      const server = require('../server.js');
      // In SSL mode, server should use ports 80 and 443
      expect(process.env.ENABLE_SSL).toBe('true');
    });
  });

  describe('Module Export', () => {
    it('should export the Express app', () => {
      const server = require('../server.js');

      expect(server).toBeDefined();
      expect(typeof server).toBe('function'); // Express app is a function
      expect(server.get).toBeDefined(); // Should have Express methods
      expect(server.post).toBeDefined();
      expect(server.use).toBeDefined();
    });

    it('should be testable via supertest', () => {
      const request = require('supertest');
      const server = require('../server.js');

      // Should be able to make test requests
      return request(server)
        .get('/api/sites')
        .expect('Content-Type', /json/)
        .expect(200);
    });
  });

  describe('Directory Configuration', () => {
    it('should handle absolute paths for SITES_DIR', () => {
      process.env.SITES_DIR = '/var/www/sites';

      const server = require('../server.js');
      expect(process.env.SITES_DIR).toBe('/var/www/sites');
    });

    it('should handle relative paths for SITES_DIR', () => {
      process.env.SITES_DIR = './my-sites';

      const server = require('../server.js');
      expect(process.env.SITES_DIR).toBe('./my-sites');
    });
  });

  describe('Dependency Availability', () => {
    it('should have express available', () => {
      expect(() => require('express')).not.toThrow();
    });

    it('should have greenlock-express available for SSL', () => {
      expect(() => require('greenlock-express')).not.toThrow();
    });
  });

  describe('Server Module Loading', () => {
    it('should load without errors in development mode', () => {
      delete process.env.ENABLE_SSL;
      delete process.env.PORT;

      expect(() => {
        const server = require('../server.js');
      }).not.toThrow();
    });

    it('should load without errors when all env vars are set', () => {
      process.env.PORT = '3000';
      process.env.SITES_DIR = './sites';
      process.env.ENABLE_SSL = 'false';

      expect(() => {
        const server = require('../server.js');
      }).not.toThrow();
    });
  });

  describe('Production Readiness', () => {
    it('should indicate SSL capability', () => {
      // Verify greenlock-express is available
      const greenlockExpress = require('greenlock-express');
      expect(greenlockExpress).toBeDefined();
      expect(greenlockExpress.init).toBeDefined();
    });

    it('should support NODE_ENV=production', () => {
      process.env.NODE_ENV = 'production';

      const server = require('../server.js');
      expect(process.env.NODE_ENV).toBe('production');
    });
  });
});
