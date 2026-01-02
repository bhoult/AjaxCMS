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

  describe('POST /api/form-submit', () => {
    it('should create CSV file with form data', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_' + Date.now();
      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          filename: testFilename,
          data: {
            Name: 'John Doe',
            Email: 'john@example.com'
          }
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

    it('should require filename and data', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should sanitize filename', async () => {
      if (!testSitePath) return;

      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          filename: '../../../etc/passwd',
          data: { Name: 'Test' }
        });

      // Should either sanitize to valid name or reject
      expect([200, 400]).toContain(response.status);

      // Verify no file created outside files directory
      try {
        await fs.access('/etc/passwd.csv');
        fail('Should not create file outside site directory');
      } catch (err) {
        // Expected - file should not exist
      }
    });

    it('should protect against CSV injection', async () => {
      if (!testSitePath) return;

      const testFilename = 'test_form_injection_' + Date.now();
      const response = await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          filename: testFilename,
          data: {
            Name: '=HYPERLINK("http://evil.com")',
            Email: '+cmd|calc'
          }
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
      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          filename: testFilename,
          data: { Name: 'First' }
        });

      // Second submission
      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          filename: testFilename,
          data: { Name: 'Second' }
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
      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          filename: testFilename,
          data: { Name: 'Test' }
        });

      const csvPath = path.join(testFilesDir, testFilename + '.csv');
      const csvContent = await fs.readFile(csvPath, 'utf-8');

      // Check headers include Timestamp and IP
      const headerLine = csvContent.split('\n')[0];
      expect(headerLine).toContain('Timestamp');
      expect(headerLine).toContain('IP');
    });
  });

  describe('GET /files/*.csv', () => {
    let testCsvFilename;

    beforeAll(async () => {
      if (!testSitePath) return;

      // Create a test CSV file
      testCsvFilename = 'test_form_view_' + Date.now();
      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          filename: testCsvFilename,
          data: { Name: 'Test User', Email: 'test@example.com' }
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
      await request(app)
        .post(`/${testSitePath}/api/form-submit`)
        .send({
          filename: testFilename,
          data: { Name: '<script>alert("xss")</script>' }
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
});
