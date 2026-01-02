const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

let app;
let testSitePath;
let testFilesDir;

describe('Form System', () => {
  beforeAll(async () => {
    app = require('../server.js');

    // Get a valid site for testing
    const sitesResponse = await request(app).get('/api/sites');
    if (sitesResponse.body.sites.length > 0) {
      const site = sitesResponse.body.sites[0];
      testSitePath = site.path;
      testFilesDir = path.join(__dirname, '..', 'sites', site.path, 'files');
    }
  });

  afterAll(async () => {
    // Clean up test CSV files
    if (testFilesDir) {
      try {
        const files = await fs.readdir(testFilesDir);
        for (const file of files) {
          if (file.startsWith('test_form_')) {
            await fs.unlink(path.join(testFilesDir, file));
          }
        }
      } catch (err) {
        // Directory might not exist, that's fine
      }
    }
  });

  // Helper to get CSRF token and encrypted form name
  async function getFormToken(formName) {
    const response = await request(app)
      .get(`/${testSitePath}/api/csrf-token?form=${formName}`);
    return response.body;
  }

  describe('CSRF Token Endpoint', () => {
    it('should require form name parameter', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .get(`/${testSitePath}/api/csrf-token`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return token and encrypted form', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .get(`/${testSitePath}/api/csrf-token?form=test_form`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('form');
      expect(response.body.token).toBeTruthy();
      expect(response.body.form).toBeTruthy();
    });

    it('should reject invalid form name characters', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .get(`/${testSitePath}/api/csrf-token?form=../../../etc/passwd`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should generate different tokens each time', async () => {
      if (!testSitePath) return;

      const response1 = await request(app)
        .get(`/${testSitePath}/api/csrf-token?form=test_form`);
      const response2 = await request(app)
        .get(`/${testSitePath}/api/csrf-token?form=test_form`);

      expect(response1.body.token).not.toBe(response2.body.token);
    });

    it('should generate different encrypted forms each time (different IV)', async () => {
      if (!testSitePath) return;

      const response1 = await request(app)
        .get(`/${testSitePath}/api/csrf-token?form=test_form`);
      const response2 = await request(app)
        .get(`/${testSitePath}/api/csrf-token?form=test_form`);

      expect(response1.body.form).not.toBe(response2.body.form);
    });
  });

  describe('POST /api/form-submit', () => {
    it('should create CSV file with valid token and encrypted form', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_' + Date.now();
      const { token, form } = await getFormToken(testFilename);

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: {
            Name: 'John Doe',
            Email: 'john@example.com'
          },
          _csrf: token,
          _hp_check: ''
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);

      // Verify CSV file was created
      const csvPath = path.join(testFilesDir, testFilename + '.csv');
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      expect(csvContent).toContain('Timestamp');
      expect(csvContent).toContain('IP');
      expect(csvContent).toContain('Name');
      expect(csvContent).toContain('Email');
      expect(csvContent).toContain('John Doe');
      expect(csvContent).toContain('john@example.com');
    });

    it('should reject submission without CSRF token', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_nocsrf_' + Date.now();
      const { form } = await getFormToken(testFilename);

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: { Name: 'Test' },
          _hp_check: ''
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('token');
    });

    it('should reject submission with invalid CSRF token', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_badcsrf_' + Date.now();
      const { form } = await getFormToken(testFilename);

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: { Name: 'Test' },
          _csrf: 'invalid-token-12345',
          _hp_check: ''
        });

      expect(response.status).toBe(403);
    });

    it('should reject reused CSRF token (one-time use)', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_reuse_' + Date.now();
      const { token, form } = await getFormToken(testFilename);

      // First submission should succeed
      const response1 = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: { Name: 'First' },
          _csrf: token,
          _hp_check: ''
        });
      expect(response1.status).toBe(200);

      // Second submission with same token should fail
      const response2 = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: { Name: 'Second' },
          _csrf: token,
          _hp_check: ''
        });
      expect(response2.status).toBe(403);
    });

    it('should reject submission without encrypted form', async () => {
      if (!testSitePath) return;

      const { token } = await getFormToken('test_form');

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          data: { Name: 'Test' },
          _csrf: token,
          _hp_check: ''
        });

      expect(response.status).toBe(400);
    });

    it('should reject submission with invalid encrypted form', async () => {
      if (!testSitePath) return;

      const { token } = await getFormToken('test_form');

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: 'invalid-encrypted-data',
          data: { Name: 'Test' },
          _csrf: token,
          _hp_check: ''
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid form identifier');
    });

    it('should silently accept honeypot submissions (return success but not save)', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_honeypot_' + Date.now();
      const { token, form } = await getFormToken(testFilename);

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: { Name: 'Bot' },
          _csrf: token,
          _hp_check: 'I am a bot filling hidden fields'  // Old field name still works
        });

      // Returns success to not alert bots
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);

      // But file should NOT be created
      const csvPath = path.join(testFilesDir, testFilename + '.csv');
      await expect(fs.access(csvPath)).rejects.toThrow();
    });

    it('should protect against CSV injection', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_injection_' + Date.now();
      const { token, form } = await getFormToken(testFilename);

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: {
            Name: '=HYPERLINK("http://evil.com")',
            Email: '+cmd|calc'
          },
          _csrf: token,
          _hp_check: ''
        });

      expect(response.status).toBe(200);

      // Verify values are prefixed with single quote
      const csvPath = path.join(testFilesDir, testFilename + '.csv');
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      expect(csvContent).toContain("'=HYPERLINK");
      expect(csvContent).toContain("'+cmd");
    });

    it('should append to existing CSV file', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_append_' + Date.now();

      // First submission
      const { token: token1, form: form1 } = await getFormToken(testFilename);
      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form1,
          data: { Name: 'First' },
          _csrf: token1,
          _hp_check: ''
        });

      // Second submission (need new token)
      const { token: token2, form: form2 } = await getFormToken(testFilename);
      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form2,
          data: { Name: 'Second' },
          _csrf: token2,
          _hp_check: ''
        });

      const csvPath = path.join(testFilesDir, testFilename + '.csv');
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');

      // Should have header + 2 data rows
      expect(lines.length).toBe(3);
      expect(csvContent).toContain('First');
      expect(csvContent).toContain('Second');
    });

    it('should include timestamp and IP in submissions', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_meta_' + Date.now();
      const { token, form } = await getFormToken(testFilename);

      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: { Name: 'Test' },
          _csrf: token,
          _hp_check: ''
        });

      const csvPath = path.join(testFilesDir, testFilename + '.csv');
      const csvContent = await fs.readFile(csvPath, 'utf-8');

      // Check headers include Timestamp and IP
      const headerLine = csvContent.split('\n')[0];
      expect(headerLine).toContain('Timestamp');
      expect(headerLine).toContain('IP');
    });

    it('should handle textarea content (multi-line text)', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_textarea_' + Date.now();
      const { token, form } = await getFormToken(testFilename);

      const multiLineMessage = 'Line 1\nLine 2\nLine 3';

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: {
            Name: 'Test User',
            Message: multiLineMessage
          },
          _csrf: token,
          _hp_check: ''
        });

      expect(response.status).toBe(200);

      // Verify CSV file contains the multi-line content (properly escaped)
      const csvPath = path.join(testFilesDir, testFilename + '.csv');
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      expect(csvContent).toContain('Message');
      expect(csvContent).toContain('Line 1');
    });
  });

  describe('GET /files/*.csv', () => {
    let testCsvFilename;

    beforeAll(async () => {
      if (!testSitePath) return;

      // Create a test CSV file
      testCsvFilename = 'test_form_view_' + Date.now();
      const { token, form } = await getFormToken(testCsvFilename);

      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: { Name: 'Test User', Email: 'test@example.com' },
          _csrf: token,
          _hp_check: ''
        });
    });

    it('should display CSV as HTML table', async () => {
      if (!testSitePath || !testCsvFilename) return;

      const response = await request(app)
        .get(`/${testSitePath}/files/${testCsvFilename}.csv`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain('<table>');
      expect(response.text).toContain('Test User');
      expect(response.text).toContain('test@example.com');
      expect(response.text).toContain('Download CSV');
    });

    it('should return raw CSV with download param', async () => {
      if (!testSitePath || !testCsvFilename) return;

      const response = await request(app)
        .get(`/${testSitePath}/files/${testCsvFilename}.csv?download=1`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/csv/);
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 404 for non-existent CSV', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .get(`/${testSitePath}/files/nonexistent_12345.csv`);

      expect(response.status).toBe(404);
    });

    it('should escape HTML in displayed values', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_xss_' + Date.now();
      const { token, form } = await getFormToken(testFilename);

      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          encryptedForm: form,
          data: { Name: '<script>alert("xss")</script>' },
          _csrf: token,
          _hp_check: ''
        });

      const response = await request(app)
        .get(`/${testSitePath}/files/${testFilename}.csv`);

      expect(response.status).toBe(200);
      expect(response.text).not.toContain('<script>');
      expect(response.text).toContain('&lt;script&gt;');
    });
  });

  describe('Directory Listing Protection', () => {
    it('should block /api/list for files directory', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .get(`/${testSitePath}/api/list?dir=files`);

      expect(response.status).toBe(403);
    });

    it('should block /api/list-recursive for files directory', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .get(`/${testSitePath}/api/list-recursive?dir=files`);

      expect(response.status).toBe(403);
    });

    it('should block /api/list for files subdirectory', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .get(`/${testSitePath}/api/list?dir=files/subdir`);

      expect(response.status).toBe(403);
    });

    it('should block /api/list with ./files path', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .get(`/${testSitePath}/api/list?dir=./files`);

      expect(response.status).toBe(403);
    });
  });

  // Rate limiting tests run last to avoid affecting other tests
  describe('Rate Limiting', () => {
    it('should enforce rate limit on form submissions', async () => {
      if (!testSitePath) return;

      // Submit 11 times (limit is 10 per minute)
      const results = [];
      for (let i = 0; i < 11; i++) {
        const testFilename = 'test_form_ratelimit_' + Date.now() + '_' + i;
        const { token, form } = await getFormToken(testFilename);

        const response = await request(app)
          .post(`/${testSitePath}/api/form-submit`)
          .send({
            encryptedForm: form,
            data: { Name: 'Test ' + i },
            _csrf: token,
            _hp_check: ''
          });
        results.push(response.status);
      }

      // At least one should be rate limited (429)
      expect(results).toContain(429);
    });
  });
});
