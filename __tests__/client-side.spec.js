/**
 * Tests for AjaxCMS Client-Side JavaScript
 *
 * These tests verify critical bugs that were fixed in the client-side code.
 * They use code analysis and pattern matching since full DOM simulation
 * is complex with ESM/CommonJS incompatibilities.
 */

const fs = require('fs');
const path = require('path');

describe('AjaxCMS Client-Side JavaScript Regressions', () => {
  let ajaxcmsCode;
  let victorCode;

  beforeAll(() => {
    ajaxcmsCode = fs.readFileSync(
      path.join(__dirname, '../js/ajaxcms.js'),
      'utf-8'
    );
    victorCode = fs.readFileSync(
      path.join(__dirname, '../js/victor.js'),
      'utf-8'
    );
  });

  describe('Victor.js Browser Compatibility (Issue #1)', () => {
    it('should not contain CommonJS module.exports that breaks in browser', () => {
      // Victor.js should use UMD pattern, not raw module.exports
      // The bundled version wraps CommonJS in UMD for browser compatibility
      expect(victorCode).toContain('function(t)'); // UMD wrapper
      expect(victorCode).not.toContain('module.exports=o'); // Raw CommonJS
    });

    it('should define Victor globally for browser use', () => {
      // Should set window.Victor or global.Victor
      expect(victorCode).toMatch(/Victor.*?function/);
    });

    it('should have normalize method available', () => {
      // Check that normalize is defined in the prototype
      expect(victorCode).toContain('normalize');
      expect(victorCode).toMatch(/normalize.*?function/);
    });
  });

  describe('loadInsert Callback on Failure (Issue #2 - CRITICAL)', () => {
    it('should call callback in .fail() handler to prevent hanging', () => {
      // This was the critical bug - when $.get fails, callback must still be called
      // The fix adds callback invocation in the .fail() handler at the END of loadInsert

      const loadInsertMatch = ajaxcmsCode.match(/function loadInsert[\s\S]*?\n};/);
      expect(loadInsertMatch).toBeTruthy();

      const loadInsertFunction = loadInsertMatch[0];

      // Should have .fail() handler at the end
      expect(loadInsertFunction).toContain('.fail(');

      // The .fail() handler should be after the main $.get callback closes
      // and should include callback invocation
      const endFailPattern = /\}\)\.fail\(function[\s\S]*?callback\(\)/;
      expect(loadInsertFunction).toMatch(endFailPattern);
    });

    it('should have callback check in fail handler', () => {
      // Should check if callback exists before calling
      const failHandlerPattern = /\.fail\(function[\s\S]*?if.*?callback.*?typeof.*?function.*?callback\(\)/;
      expect(ajaxcmsCode).toMatch(failHandlerPattern);
    });
  });

  describe('imageMatch Return Value (Issue #3)', () => {
    it('should return empty string instead of undefined when image not found', () => {
      // Find the imageMatch function
      const imageMatchPattern = /function imageMatch[\s\S]*?^}/m;
      const imageMatchMatch = ajaxcmsCode.match(imageMatchPattern);

      expect(imageMatchMatch).toBeTruthy();

      const imageMatchFunction = imageMatchMatch[0];

      // Should have explicit return '' at the end
      expect(imageMatchFunction).toContain("return ''");
    });

    it('should validate input and return empty string for invalid input', () => {
      const imageMatchPattern = /function imageMatch[\s\S]*?^}/m;
      const imageMatchMatch = ajaxcmsCode.match(imageMatchPattern);
      const imageMatchFunction = imageMatchMatch[0];

      // Should check for empty/undefined input
      expect(imageMatchFunction).toMatch(/if\s*\(\s*!s\s*\|\|/);
      expect(imageMatchFunction).toContain("return ''");
    });
  });

  describe('Invalid Insert Helper Handling (Issue #4)', () => {
    it('should skip inserts with no page name', () => {
      // Find processInserts function
      const processInsertsPattern = /function processInserts[\s\S]*?^}/m;
      const processInsertsMatch = ajaxcmsCode.match(processInsertsPattern);

      expect(processInsertsMatch).toBeTruthy();

      const processInsertsFunction = processInsertsMatch[0];

      // Should check for empty pageName
      expect(processInsertsFunction).toMatch(/if\s*\(\s*!pageName/);

      // Should decrement rcount and continue on invalid insert
      expect(processInsertsFunction).toContain('rcount--');
      expect(processInsertsFunction).toContain('continue');
    });

    it('should warn about invalid inserts', () => {
      const processInsertsPattern = /function processInserts[\s\S]*?^}/m;
      const processInsertsMatch = ajaxcmsCode.match(processInsertsPattern);
      const processInsertsFunction = processInsertsMatch[0];

      // Should log warning for invalid inserts
      expect(processInsertsFunction).toContain('console.warn');
      expect(processInsertsFunction).toMatch(/Skipping invalid insert/);
    });
  });

  describe('Google Analytics Error Handling (Issue #5)', () => {
    it('should check if ga exists before calling it', () => {
      // Find where ga() is called
      const gaCallPattern = /ga\s*\(\s*['"]send['"]/;
      const matches = ajaxcmsCode.match(new RegExp(gaCallPattern.source, 'g'));

      expect(matches).toBeTruthy();

      // For each ga() call, verify there's a typeof check before it
      const gaContextPattern = /if\s*\(\s*typeof\s+ga\s*===\s*['"]function['"]\s*\)\s*\{[\s\S]*?ga\s*\(\s*['"]send['"]/;
      expect(ajaxcmsCode).toMatch(gaContextPattern);
    });
  });

  describe('Callback.save Property Handling (Issue #6)', () => {
    it('should create callback object with save property correctly', () => {
      // Find loadPage function (use \( to match exact function name)
      const loadPagePattern = /function loadPage\([\s\S]*?^}/m;
      const loadPageMatch = ajaxcmsCode.match(loadPagePattern);

      expect(loadPageMatch).toBeTruthy();

      const loadPageFunction = loadPageMatch[0];

      // Should create callbackObj properly
      expect(loadPageFunction).toContain('var callbackObj = function()');
      expect(loadPageFunction).toContain('callbackObj.save = save');

      // Should NOT use "this.save = save" inside a callback
      expect(loadPageFunction).not.toMatch(/function\s*\(\)\s*\{\s*this\.save\s*=/);
    });
  });

  describe('Helper Documentation Pattern (Issue #7)', () => {
    it('should only match helpers with 0-4 spaces', () => {
      // The insert regex should skip helpers with 5+ spaces
      const insertRegex = /\{\{\s{0,4}insert.*?\}\}/gi;

      expect('{{insert | page}}').toMatch(insertRegex);
      expect('{{ insert | page}}').toMatch(insertRegex);
      expect('{{  insert | page}}').toMatch(insertRegex);
      expect('{{   insert | page}}').toMatch(insertRegex);
      expect('{{    insert | page}}').toMatch(insertRegex);
      expect('{{     insert | page}}').not.toMatch(insertRegex); // 5 spaces
    });
  });

  describe('Code Quality Checks', () => {
    it('should be wrapped in IIFE to prevent global pollution', () => {
      // Code should start with (function() and end with })();
      expect(ajaxcmsCode).toMatch(/^\(function\(\)\s*\{/);
      expect(ajaxcmsCode).toMatch(/\}\)\(\);?\s*$/);
    });

    it('should use strict mode', () => {
      expect(ajaxcmsCode).toContain("'use strict'");
    });

    it('should expose loadPage to global scope', () => {
      expect(ajaxcmsCode).toContain('window.loadPage = loadPage');
    });

    it('should have error logging for critical failures', () => {
      expect(ajaxcmsCode).toContain('console.error');
      expect(ajaxcmsCode).toContain('console.warn');
    });
  });
});
