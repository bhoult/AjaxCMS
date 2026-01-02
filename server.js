/**
 * AjaxCMS Server - Node.js/Express server for hosting AjaxCMS sites
 *
 * This server provides JSON directory listing APIs, static file serving with resource fallback,
 * multi-site hosting support (path-based and domain-based routing), discussion system endpoints,
 * and server-side rendering for SEO with graceful degradation to client-side rendering.
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

const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

// Marked is an ES module, so we'll import it dynamically
let marked = null;
(async () => {
  const markedModule = await import('marked');
  marked = markedModule.marked;
})();

const app = express();
const SITES_DIR = process.env.SITES_DIR || './sites';
const ENABLE_SSL = process.env.ENABLE_SSL === 'true';
const MAINTAINER_EMAIL = process.env.MAINTAINER_EMAIL || '';
const LOGS_DIR = './logs';

// Discussion system configuration
const MAX_DISCUSSION_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit per discussion file
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_COMMENTS = 5; // Max comments per IP per window

// Form security configuration
const FORM_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const FORM_RATE_LIMIT_MAX = 10; // Max form submissions per IP per window
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

// Encryption key for form names - generate a random key on server start
// In production, this should be set via environment variable for persistence across restarts
const FORM_ENCRYPTION_KEY = process.env.FORM_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

// Rate limiting: Map of IP -> array of timestamps
const rateLimitMap = new Map();

// Form rate limiting: Map of IP -> array of timestamps
const formRateLimitMap = new Map();

// CSRF tokens: Map of token -> { ip, timestamp }
const csrfTokens = new Map();

/**
 * Escape HTML entities to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML insertion
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Check if IP is rate limited
 * @param {string} ip - Client IP address
 * @returns {boolean} True if rate limited, false otherwise
 */
function isRateLimited(ip) {
  const now = Date.now();

  // Get timestamps for this IP
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip);

  // Remove timestamps outside the window
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, validTimestamps);

  // Check if limit exceeded
  return validTimestamps.length >= RATE_LIMIT_MAX_COMMENTS;
}

/**
 * Record a comment submission for rate limiting
 * @param {string} ip - Client IP address
 */
function recordCommentSubmission(ip) {
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  rateLimitMap.get(ip).push(now);
}

// Clean up rate limit map every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, validTimestamps);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if an IP is rate limited for form submissions
 * @param {string} ip - Client IP address
 * @returns {boolean} True if rate limited
 */
function isFormRateLimited(ip) {
  const now = Date.now();

  if (!formRateLimitMap.has(ip)) {
    formRateLimitMap.set(ip, []);
  }

  const timestamps = formRateLimitMap.get(ip);
  const validTimestamps = timestamps.filter(ts => now - ts < FORM_RATE_LIMIT_WINDOW);
  formRateLimitMap.set(ip, validTimestamps);

  return validTimestamps.length >= FORM_RATE_LIMIT_MAX;
}

/**
 * Record a form submission for rate limiting
 * @param {string} ip - Client IP address
 */
function recordFormSubmission(ip) {
  const now = Date.now();

  if (!formRateLimitMap.has(ip)) {
    formRateLimitMap.set(ip, []);
  }

  formRateLimitMap.get(ip).push(now);
}

/**
 * Generate a CSRF token for a client
 * @param {string} ip - Client IP address
 * @returns {string} Generated token
 */
function generateCsrfToken(ip) {
  const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  csrfTokens.set(token, { ip, timestamp: Date.now() });
  return token;
}

/**
 * Validate a CSRF token
 * @param {string} token - Token to validate
 * @param {string} ip - Client IP address
 * @returns {boolean} True if valid
 */
function validateCsrfToken(token, ip) {
  if (!token || !csrfTokens.has(token)) {
    return false;
  }

  const data = csrfTokens.get(token);
  const now = Date.now();

  // Check expiry
  if (now - data.timestamp > CSRF_TOKEN_EXPIRY) {
    csrfTokens.delete(token);
    return false;
  }

  // Check IP matches (optional - some networks use rotating IPs)
  // For now, just check the token exists and isn't expired

  // Delete token after use (one-time use)
  csrfTokens.delete(token);
  return true;
}

/**
 * Encrypt a form name so it cannot be discovered from page source
 * @param {string} formName - The form name to encrypt
 * @returns {string} Encrypted form name (base64 encoded)
 */
function encryptFormName(formName) {
  const key = Buffer.from(FORM_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(formName, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted data
  return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64url');
}

/**
 * Decrypt a form name
 * @param {string} encryptedFormName - The encrypted form name (base64 encoded)
 * @returns {string|null} Decrypted form name, or null if invalid
 */
function decryptFormName(encryptedFormName) {
  try {
    const key = Buffer.from(FORM_ENCRYPTION_KEY, 'hex');
    const data = Buffer.from(encryptedFormName, 'base64url');

    // Extract iv (16 bytes), authTag (16 bytes), and encrypted data
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const encrypted = data.subarray(32);

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (e) {
    return null;
  }
}

// Clean up form rate limit and CSRF token maps every 5 minutes
setInterval(() => {
  const now = Date.now();

  // Clean form rate limits
  for (const [ip, timestamps] of formRateLimitMap.entries()) {
    const validTimestamps = timestamps.filter(ts => now - ts < FORM_RATE_LIMIT_WINDOW);
    if (validTimestamps.length === 0) {
      formRateLimitMap.delete(ip);
    } else {
      formRateLimitMap.set(ip, validTimestamps);
    }
  }

  // Clean expired CSRF tokens
  for (const [token, data] of csrfTokens.entries()) {
    if (now - data.timestamp > CSRF_TOKEN_EXPIRY) {
      csrfTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

// Middleware to parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Ensure logs directory exists
try {
  if (!fsSync.existsSync(LOGS_DIR)) {
    fsSync.mkdirSync(LOGS_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create logs directory:', err);
}

// Logging function for site requests
function logRequest(siteName, req, statusCode, contentLength) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const logFileName = `${day}-${siteName || 'index'}.log`;
  const logFilePath = path.join(LOGS_DIR, logFileName);

  const timestamp = now.toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.headers['user-agent'] || '-';
  const referer = req.headers['referer'] || '-';
  const ip = req.ip || req.connection.remoteAddress || '-';

  // Combined Log Format
  const logLine = `${ip} - - [${timestamp}] "${method} ${url} HTTP/1.1" ${statusCode} ${contentLength || '-'} "${referer}" "${userAgent}"\n`;

  // Append to log file (async, non-blocking)
  fsSync.appendFile(logFilePath, logLine, (err) => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
}

// Port configuration
// In SSL mode: use 80/443 (standard ports)
// In HTTP-only mode: use PORT env var or 3000 (development)
const HTTP_PORT = ENABLE_SSL ? 80 : (process.env.PORT || 3000);

// Helper function to send files with ETag based on modification time
function sendFileWithCache(filePath, req, res, next) {
  fsSync.stat(filePath, (err, stats) => {
    if (err) {
      logRequest(req.siteName, req, 404, 0);
      if (next) next();
      return;
    }

    // Create ETag from file modification timestamp (in milliseconds)
    const etag = `"${stats.mtimeMs}"`;

    // Check if client has cached version
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      // File hasn't changed, send 304 Not Modified
      logRequest(req.siteName, req, 304, 0);
      res.status(304).end();
      return;
    }

    // Set cache headers
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

    // Mark that logging is already handled (prevent double logging in middleware)
    res._loggedBySendFileWithCache = true;

    // Send the file
    res.sendFile(filePath, (sendErr) => {
      if (sendErr) {
        logRequest(req.siteName, req, sendErr.status || 500, 0);
        // Only call next if headers haven't been sent yet
        if (next && !res.headersSent) next();
      } else {
        logRequest(req.siteName, req, 200, stats.size);
      }
    });
  });
}

// API endpoint to list all available sites (recursively finds sites in subdirectories)
app.get('/api/sites', async (req, res) => {
  try {
    const sitesPath = path.join(__dirname, SITES_DIR);
    const sites = [];

    // Recursively find all directories with index.html
    async function findSites(dir, relativePath = '') {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          const itemPath = path.join(dir, item.name);
          const relPath = relativePath ? path.join(relativePath, item.name) : item.name;
          const indexPath = path.join(itemPath, 'index.html');

          // Check if this directory has an index.html (is a site)
          try {
            await fs.access(indexPath);
            // This is a site directory
            const descriptionPath = path.join(itemPath, 'description.md');
            let description = '';
            try {
              description = await fs.readFile(descriptionPath, 'utf-8');
            } catch (err) {
              // No description file
            }

            sites.push({
              name: item.name,
              path: relPath,
              url: ENABLE_SSL ? `https://localhost/${relPath}/` : `http://localhost:${HTTP_PORT}/${relPath}/`,
              description: description
            });
          } catch (err) {
            // No index.html, recurse into subdirectory
            await findSites(itemPath, relPath);
          }
        }
      }
    }

    await findSites(sitesPath);
    res.json({ sites });
  } catch (err) {
    console.error('Error listing sites:', err);
    res.status(500).json({ error: 'Could not list sites' });
  }
});

// Middleware to determine which site to serve based on hostname or path
app.use((req, res, next) => {
  const hostname = req.hostname;
  const sitesPath = path.join(__dirname, SITES_DIR);

  // Check if accessing via path (including nested paths like /themes/site1/...)
  // Try to match progressively longer paths to find a site directory
  const pathSegments = req.path.split('/').filter(s => s); // Remove empty segments

  // Try from longest path to shortest to find a site
  for (let i = pathSegments.length; i > 0; i--) {
    const potentialSitePath = pathSegments.slice(0, i).join('/');
    const fullSitePath = path.join(sitesPath, potentialSitePath);
    const indexPath = path.join(fullSitePath, 'index.html');

    // Check if this directory has an index.html (is a site)
    try {
      const stat = require('fs').statSync(indexPath);
      if (stat.isFile()) {
        req.siteName = pathSegments[i - 1]; // Last segment is the site name
        req.sitePath = fullSitePath;
        req.sitePrefix = '/' + potentialSitePath;
        // DON'T strip the URL - keep it so relative paths work
        return next();
      }
    } catch (err) {
      // Not a site, continue checking shorter paths
    }
  }

  // Domain-based routing: Map hostnames to directories
  // Check if hostname corresponds to a site directory
  const hostSitePath = path.join(sitesPath, hostname);
  try {
    const indexPath = path.join(hostSitePath, 'index.html');
    const stat = require('fs').statSync(indexPath);
    if (stat.isFile()) {
      // Hostname matches a site directory
      req.siteName = hostname;
      req.sitePath = hostSitePath;
    } else {
      // No site found for this hostname, show index
      req.siteName = null;
      req.sitePath = null;
    }
  } catch (err) {
    // No site directory for this hostname, show index
    req.siteName = null;
    req.sitePath = null;
  }

  next();
});

// Logging middleware - capture response details
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  const originalSendFile = res.sendFile;

  // Store original status code
  let statusCode = 200;
  let contentLength = 0;

  // Override res.status to capture status code
  const originalStatus = res.status;
  res.status = function(code) {
    statusCode = code;
    return originalStatus.call(this, code);
  };

  // Override send to capture content length
  res.send = function(data) {
    contentLength = data ? Buffer.byteLength(data) : 0;
    logRequest(req.siteName, req, statusCode, contentLength);
    return originalSend.call(this, data);
  };

  // Override json to capture content length
  res.json = function(data) {
    const jsonString = JSON.stringify(data);
    contentLength = jsonString ? Buffer.byteLength(jsonString) : 0;
    logRequest(req.siteName, req, statusCode, contentLength);
    return originalJson.call(this, data);
  };

  // Override sendFile to capture file size
  res.sendFile = function(filePath, options, callback) {
    // Skip logging if already handled by sendFileWithCache
    if (!res._loggedBySendFileWithCache) {
      try {
        const stats = fsSync.statSync(filePath);
        contentLength = stats.size;
        logRequest(req.siteName, req, statusCode, contentLength);
      } catch (err) {
        // File doesn't exist, will be handled by sendFile
      }
    }
    return originalSendFile.call(this, filePath, options, callback);
  };

  next();
});

// API endpoint to get directory listings as JSON
app.get('*/api/list', async (req, res) => {
  try {
    // If no site path, we can't serve directory listings
    if (!req.sitePath) {
      return res.status(400).json({ error: 'No site specified' });
    }

    const dirParam = req.query.dir || '.';
    let fullPath = path.join(req.sitePath, dirParam);

    // Security check - prevent directory traversal
    if (!fullPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Block listing of files directory (contains form submissions)
    const normalizedDir = dirParam.replace(/^\.?\/?/, '');
    if (normalizedDir === 'files' || normalizedDir.startsWith('files/')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Load from both site-specific and global directories
    let sitePathExists = false;
    let globalPathExists = false;
    let latestMtime = 0;

    // Try site-specific directory first
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        sitePathExists = true;
        latestMtime = Math.max(latestMtime, stats.mtimeMs);
      }
    } catch (err) {
      // Site-specific directory doesn't exist, that's okay
    }

    // Check for global shared directory
    let globalPath = null;
    if (dirParam.startsWith('./pages') || dirParam.startsWith('./js') ||
        dirParam.startsWith('./css') || dirParam.startsWith('./themes') ||
        dirParam.startsWith('./images') || dirParam.startsWith('./node_modules')) {
      globalPath = path.join(__dirname, dirParam.substring(2)); // Remove './'

      // Security check for global path
      const allowedPaths = [
        path.resolve(__dirname, 'pages'),
        path.resolve(__dirname, 'js'),
        path.resolve(__dirname, 'css'),
        path.resolve(__dirname, 'themes'),
        path.resolve(__dirname, 'images'),
        path.resolve(__dirname, 'node_modules')
      ];

      const resolvedGlobal = path.resolve(globalPath);
      const isAllowed = allowedPaths.some(allowed => resolvedGlobal.startsWith(allowed));

      if (isAllowed) {
        try {
          const stats = await fs.stat(globalPath);
          if (stats.isDirectory()) {
            globalPathExists = true;
            latestMtime = Math.max(latestMtime, stats.mtimeMs);
          }
        } catch (err) {
          // Global directory doesn't exist, that's okay
        }
      }
    }

    // If neither directory exists, return 404
    if (!sitePathExists && !globalPathExists) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    // Create ETag from latest modification timestamp
    const etag = `"${latestMtime}"`;

    // Check if client has cached version
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      // Directory hasn't changed, send 304 Not Modified
      return res.status(304).end();
    }

    // Set cache headers
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds

    const files = [];
    const directories = [];

    // Helper to read directory and add to arrays
    async function readDir(dirPath) {
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(dirParam, item.name);

          if (item.isDirectory()) {
            directories.push({
              name: item.name,
              path: itemPath,
              type: 'directory'
            });
          } else {
            files.push({
              name: item.name,
              path: itemPath,
              type: 'file'
            });
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dirPath}:`, err);
      }
    }

    // Read from site-specific directory
    if (sitePathExists) {
      await readDir(fullPath);
    }

    // Read from global directory (merged with site-specific)
    if (globalPathExists) {
      await readDir(globalPath);
    }

    res.json({
      path: dirParam,
      directories: directories,
      files: files
    });

  } catch (err) {
    console.error('Error listing directory:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to recursively get all files in a directory tree
app.get('*/api/list-recursive', async (req, res) => {
  try {
    // If no site path, we can't serve directory listings
    if (!req.sitePath) {
      return res.status(400).json({ error: 'No site specified' });
    }

    const dirParam = req.query.dir || '.';
    let fullPath = path.join(req.sitePath, dirParam);

    // Security check
    if (!fullPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Block listing of files directory (contains form submissions)
    const normalizedDir = dirParam.replace(/^\.?\/?/, '');
    if (normalizedDir === 'files' || normalizedDir.startsWith('files/')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get stats and load files from both site-specific and global directories
    const files = [];
    let sitePathExists = false;
    let globalPathExists = false;
    let latestMtime = 0;

    // Try site-specific directory first
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        sitePathExists = true;
        latestMtime = Math.max(latestMtime, stats.mtimeMs);
      }
    } catch (err) {
      // Site-specific directory doesn't exist, that's okay
    }

    // Check for global shared directory
    let globalPath = null;
    if (dirParam.startsWith('./pages') || dirParam.startsWith('./js') ||
        dirParam.startsWith('./css') || dirParam.startsWith('./themes') ||
        dirParam.startsWith('./images') || dirParam.startsWith('./node_modules')) {
      globalPath = path.join(__dirname, dirParam.substring(2)); // Remove './'

      // Security check for global path
      const allowedPaths = [
        path.resolve(__dirname, 'pages'),
        path.resolve(__dirname, 'js'),
        path.resolve(__dirname, 'css'),
        path.resolve(__dirname, 'themes'),
        path.resolve(__dirname, 'images'),
        path.resolve(__dirname, 'node_modules')
      ];

      const resolvedGlobal = path.resolve(globalPath);
      const isAllowed = allowedPaths.some(allowed => resolvedGlobal.startsWith(allowed));

      if (isAllowed) {
        try {
          const stats = await fs.stat(globalPath);
          if (stats.isDirectory()) {
            globalPathExists = true;
            latestMtime = Math.max(latestMtime, stats.mtimeMs);
          }
        } catch (err) {
          // Global directory doesn't exist, that's okay
        }
      }
    }

    // If neither directory exists, return 404
    if (!sitePathExists && !globalPathExists) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    // Create ETag from latest modification timestamp
    const etag = `"${latestMtime}"`;

    // Check if client has cached version
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      // Directory hasn't changed, send 304 Not Modified
      return res.status(304).end();
    }

    // Set cache headers
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    // Helper function to recursively walk directory
    async function walkDirectory(dir, basePath = '') {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(basePath, item.name);
          const fullItemPath = path.join(dir, item.name);

          if (item.isDirectory()) {
            await walkDirectory(fullItemPath, itemPath);
          } else {
            files.push({
              name: item.name,
              path: itemPath,
              type: 'file'
            });
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
      }
    }

    // Load files from site-specific directory
    if (sitePathExists) {
      await walkDirectory(fullPath);
    }

    // Load files from global directory (merged with site-specific)
    if (globalPathExists) {
      await walkDirectory(globalPath);
    }

    res.json({
      path: dirParam,
      files: files
    });

  } catch (err) {
    console.error('Error listing directory recursively:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get discussion data for a page
app.get('*/api/discussion', async (req, res) => {
  try {
    if (!req.sitePath) {
      return res.status(400).json({ error: 'No site specified' });
    }

    const pageParam = req.query.page;
    if (!pageParam) {
      return res.status(400).json({ error: 'Page parameter required' });
    }

    // Get the discussion file path (same as page but with .discussion.jsonl extension)
    const jsonPath = path.join(req.sitePath, pageParam.replace(/\.(html|md)$/, '.discussion.jsonl'));

    // Security check
    if (!jsonPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get client IP
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Try to read the discussion file
    try {
      const stats = await fs.stat(jsonPath);

      // Create ETag from file modification timestamp
      const etag = `"${stats.mtimeMs}"`;

      // Check if client has cached version
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag === etag) {
        // File hasn't changed, send 304 Not Modified
        return res.status(304).end();
      }

      // Set cache headers
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

      const fileContent = await fs.readFile(jsonPath, 'utf-8');

      // Parse JSONL format - one JSON object per line
      const discussions = fileContent
        .trim()
        .split('\n')
        .filter(line => line.trim()) // Skip empty lines
        .map(line => JSON.parse(line));

      // Return discussions with client's IP
      res.json({
        discussions: discussions,
        clientIp: clientIp
      });
    } catch (err) {
      // File doesn't exist yet, return empty discussion array
      // No caching for non-existent files
      res.json({
        discussions: [],
        clientIp: clientIp
      });
    }

  } catch (err) {
    console.error('Error fetching discussion:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to post a new comment/reply to a discussion
app.post('*/api/discussion', async (req, res) => {
  try {
    if (!req.sitePath) {
      return res.status(400).json({ error: 'No site specified' });
    }

    const { page, parentId, author, content } = req.body;

    // Validate required fields
    if (!page || !content) {
      return res.status(400).json({ error: 'Page and content are required' });
    }

    // Get client IP address
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Check rate limiting
    if (isRateLimited(clientIp)) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait before posting again.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000) // seconds
      });
    }

    // Sanitize content to prevent XSS using proper HTML escaping
    const sanitizedContent = escapeHtml(content.trim()).substring(0, 5000);

    // Sanitize author name if provided
    const sanitizedAuthor = author
      ? escapeHtml(author.trim()).substring(0, 50)
      : 'Anonymous';

    // Get the discussion file path
    const jsonPath = path.join(req.sitePath, page.replace(/\.(html|md)$/, '.discussion.jsonl'));

    // Security check
    if (!jsonPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check file size limit before appending
    try {
      const stats = await fs.stat(jsonPath);
      if (stats.size >= MAX_DISCUSSION_FILE_SIZE) {
        return res.status(413).json({
          error: 'Discussion file size limit exceeded. Cannot add more comments.',
          maxSize: MAX_DISCUSSION_FILE_SIZE
        });
      }
    } catch (err) {
      // File doesn't exist yet, that's fine
    }

    // Ensure the parent directory exists
    const dirPath = path.dirname(jsonPath);
    await fs.mkdir(dirPath, { recursive: true });

    // Create new comment
    const newComment = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11),
      parentId: parentId || null,
      timestamp: new Date().toISOString(),
      ip: clientIp,
      author: sanitizedAuthor,
      content: sanitizedContent
    };

    // Append comment as a new line (JSONL format)
    await fs.appendFile(jsonPath, JSON.stringify(newComment) + '\n', 'utf-8');

    // Record this submission for rate limiting
    recordCommentSubmission(clientIp);

    // Return the new comment
    res.json({
      success: true,
      comment: newComment
    });

  } catch (err) {
    console.error('Error posting discussion:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get a CSRF token and encrypted form name for form submission
app.get('*/api/csrf-token', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const formName = req.query.form;

  if (!formName) {
    return res.status(400).json({ error: 'Form name is required' });
  }

  // Validate form name format (only allow alphanumeric, dashes, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(formName)) {
    return res.status(400).json({ error: 'Invalid form name' });
  }

  const token = generateCsrfToken(clientIp);
  const encryptedForm = encryptFormName(formName);

  res.json({ token, form: encryptedForm });
});

// API endpoint to submit form data to CSV
app.post('*/api/form-submit', async (req, res) => {
  try {
    if (!req.sitePath) {
      return res.status(400).json({ error: 'No site specified' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // 1. Rate limiting check
    if (isFormRateLimited(clientIp)) {
      return res.status(429).json({
        error: 'Too many submissions. Please wait before trying again.',
        retryAfter: Math.ceil(FORM_RATE_LIMIT_WINDOW / 1000)
      });
    }

    // 2. Origin/Referer check
    const origin = req.get('Origin') || req.get('Referer') || '';
    const host = req.get('Host') || '';
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host && !originHost.endsWith('.' + host)) {
          return res.status(403).json({ error: 'Invalid request origin' });
        }
      } catch (e) {
        return res.status(403).json({ error: 'Invalid request origin' });
      }
    }

    const { encryptedForm, data, _csrf, _hp_check } = req.body;

    // 3. Honeypot check - this field should always be empty
    // Accept both old and new field names for backwards compatibility
    if (_hp_check && _hp_check.trim() !== '') {
      // Silently reject but return success to not alert bots
      console.log('Form rejected: honeypot field filled with:', _hp_check);
      return res.json({ success: true });
    }

    // 4. CSRF token validation
    if (!validateCsrfToken(_csrf, clientIp)) {
      return res.status(403).json({ error: 'Invalid or expired form token. Please refresh the page and try again.' });
    }

    // Validate required fields
    if (!encryptedForm || !data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Form data is required' });
    }

    // 5. Decrypt the form name
    const filename = decryptFormName(encryptedForm);
    if (!filename) {
      return res.status(403).json({ error: 'Invalid form identifier' });
    }

    // Sanitize filename (only allow alphanumeric, dashes, underscores)
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedFilename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Create files directory path
    const filesDir = path.join(req.sitePath, 'files');
    const csvPath = path.join(filesDir, sanitizedFilename + '.csv');

    // Security check
    if (!csvPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Record this submission for rate limiting
    recordFormSubmission(clientIp);

    // Ensure files directory exists
    await fs.mkdir(filesDir, { recursive: true });

    // Get field names and values
    const fields = Object.keys(data);
    const values = fields.map(field => {
      let value = String(data[field] || '');

      // Prevent CSV injection (formula injection) - prefix dangerous chars with single quote
      // Characters =, +, -, @, tab, CR can trigger formula execution in Excel/Sheets
      if (/^[=+\-@\t\r]/.test(value)) {
        value = "'" + value;
      }

      // Escape double quotes and wrap in quotes for CSV
      value = value.replace(/"/g, '""');
      return '"' + value + '"';
    });

    // Add IP address field
    fields.unshift('IP');
    values.unshift('"' + clientIp + '"');

    // Add timestamp field (human readable format)
    fields.unshift('Timestamp');
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    values.unshift('"' + timestamp + '"');

    // Check if file exists to determine if we need headers
    let fileExists = false;
    try {
      await fs.access(csvPath);
      fileExists = true;
    } catch (err) {
      // File doesn't exist, we'll create it with headers
    }

    // Build CSV content
    let csvContent = '';
    if (!fileExists) {
      // Add header row
      csvContent = fields.join(',') + '\n';
    }
    csvContent += values.join(',') + '\n';

    // Append to file
    await fs.appendFile(csvPath, csvContent, 'utf-8');

    res.json({ success: true });

  } catch (err) {
    console.error('Error submitting form:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve CSV files as HTML tables with download link
app.get('*/files/*.csv', async (req, res) => {
  try {
    if (!req.sitePath) {
      return res.status(400).send('No site specified');
    }

    // Extract the file path from the URL
    const urlPath = req.path.replace(req.sitePrefix || '', '');
    const csvPath = path.join(req.sitePath, urlPath);

    // Security check
    if (!csvPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).send('Access denied');
    }

    // Check if file exists
    try {
      await fs.access(csvPath);
    } catch (err) {
      return res.status(404).send('File not found');
    }

    // If download param is set, serve raw CSV
    if (req.query.download) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(csvPath)}"`);
      const content = await fs.readFile(csvPath, 'utf-8');
      return res.send(content);
    }

    // Read and parse CSV
    const content = await fs.readFile(csvPath, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length === 0) {
      return res.send('<html><body><p>Empty file</p></body></html>');
    }

    // Parse CSV (handle quoted values with commas)
    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    }

    const rows = lines.map(parseCSVLine);
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const filename = path.basename(csvPath);

    // Build HTML
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { margin: 0 0 10px 0; color: #333; }
    .meta { color: #666; margin-bottom: 20px; }
    .download-link { display: inline-block; background: #007bff; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; margin-bottom: 20px; }
    .download-link:hover { background: #0056b3; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: 600; position: sticky; top: 0; }
    tr:hover { background: #f8f9fa; }
    .empty { color: #999; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(filename)}</h1>
    <p class="meta">${dataRows.length} submission${dataRows.length !== 1 ? 's' : ''}</p>
    <a href="?download=1" class="download-link">Download CSV</a>
    <table>
      <thead>
        <tr>`;

    for (const header of headers) {
      html += `<th>${escapeHtml(header)}</th>`;
    }

    html += `</tr>
      </thead>
      <tbody>`;

    if (dataRows.length === 0) {
      html += `<tr><td colspan="${headers.length}" class="empty">No submissions yet</td></tr>`;
    } else {
      for (const row of dataRows) {
        html += '<tr>';
        for (let i = 0; i < headers.length; i++) {
          const value = row[i] || '';
          html += `<td>${escapeHtml(value)}</td>`;
        }
        html += '</tr>';
      }
    }

    html += `</tbody>
    </table>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (err) {
    console.error('Error serving CSV:', err);
    res.status(500).send('Internal server error');
  }
});

// SEO: Generate XML sitemap for a site
app.get('*/sitemap.xml', async (req, res) => {
  try {
    if (!req.sitePath) {
      return res.status(400).send('No site specified');
    }

    const pagesPath = path.join(req.sitePath, 'pages');
    const baseUrl = req.protocol + '://' + req.get('host') + (req.sitePrefix || '');

    // Check if pages directory exists
    try {
      await fs.access(pagesPath);
    } catch (err) {
      return res.status(404).send('No pages directory found');
    }

    const pages = [];

    // Recursively find all .html and .md files
    async function walkDirectory(dir, basePath = '') {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(basePath, item.name);
        const fullItemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          await walkDirectory(fullItemPath, itemPath);
        } else if (item.name.endsWith('.html') || item.name.endsWith('.md')) {
          // Skip splash.html and layout.html
          if (item.name !== 'splash.html' && item.name !== 'layout.html') {
            const stats = await fs.stat(fullItemPath);
            pages.push({
              url: itemPath,
              lastmod: stats.mtime.toISOString()
            });
          }
        }
      }
    }

    await walkDirectory(pagesPath);

    // Sort pages alphabetically by path (respects numeric prefixes like 01-, 02-)
    pages.sort((a, b) => a.url.localeCompare(b.url));

    // Generate XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Add homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Add each page with AJAX version and alternate link to static version
    for (const page of pages) {
      // AJAX version (primary) with alternate link to static HTML
      // AJAX URLs need pages/ prefix, static URLs use the file path directly
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/?page=pages/${page.url}</loc>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/static/pages/${page.url}" />\n`;
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// SEO: Serve sitemap XSLT stylesheet
app.get('*/sitemap.xsl', (req, res) => {
  const xslPath = path.join(__dirname, 'sitemap.xsl');
  res.header('Content-Type', 'application/xslt+xml');
  res.sendFile(xslPath, (err) => {
    if (err) {
      res.status(404).send('Stylesheet not found');
    }
  });
});

// SEO: Serve robots.txt
app.get('*/robots.txt', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host') + (req.sitePrefix || '');
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

// SEO: Server-side rendered static HTML version of pages
app.get('*/static/*', async (req, res) => {
  try {
    if (!req.sitePath) {
      return res.status(400).send('No site specified');
    }

    // Extract page path from URL
    let pagePath = req.path;
    if (req.sitePrefix) {
      pagePath = pagePath.substring(req.sitePrefix.length);
    }
    pagePath = pagePath.replace(/^\/static\//, '');

    const fullPath = path.join(req.sitePath, pagePath);

    // Security check
    if (!fullPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).send('Access denied');
    }

    // Read the page content
    let content;
    try {
      content = await fs.readFile(fullPath, 'utf-8');
    } catch (err) {
      return res.status(404).send('Page not found');
    }

    // Convert markdown to HTML if needed
    if (fullPath.endsWith('.md')) {
      if (!marked) {
        return res.status(503).send('Markdown processor is loading, please try again in a moment');
      }
      content = marked.parse(content);
    }

    // Extract title from content (first h1 or filename)
    let title = 'AjaxCMS';
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      title = h1Match[1].replace(/<[^>]+>/g, ''); // Strip HTML tags
    } else {
      const mdH1Match = content.match(/^#\s+(.+)$/m);
      if (mdH1Match) {
        title = mdH1Match[1];
      } else {
        title = path.basename(pagePath, path.extname(pagePath)).replace(/^\d+-/, '').replace(/_/g, ' ');
      }
    }

    // Extract description (first paragraph)
    let description = '';
    const pMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
    if (pMatch) {
      description = pMatch[1].replace(/<[^>]+>/g, '').substring(0, 160);
    }

    // Generate minimal SEO-friendly HTML
    const baseUrl = req.protocol + '://' + req.get('host') + (req.sitePrefix || '');
    const canonicalUrl = baseUrl + '/?page=' + pagePath;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary">
    <meta property="twitter:url" content="${canonicalUrl}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">

    <!-- Note: Static version for crawlers - no redirect -->
    <script>
        // No automatic redirect - this is the crawler-friendly version
        // To view the full interactive site, click the link in the footer
    </script>

    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        a { color: #0066cc; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <main>
        ${content}
    </main>
    <footer>
        <p><a href="${baseUrl}/">← Back to home</a> | <a href="${canonicalUrl}">View full site</a></p>
    </footer>
</body>
</html>`;

    res.header('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (err) {
    console.error('Error rendering static page:', err);
    res.status(500).send('Error rendering page');
  }
});

// Redirect specific page to sites index
app.get('/ajaxcms.org/', (req, res, next) => {
  if (req.query.page === 'pages/menus/03-Themes.md') {
    return res.redirect('/sites');
  }
  next();
});

// Serve sites index at /sites regardless of domain or path
app.get('*/sites', (req, res) => {
  // Override siteName for logging purposes
  req.siteName = 'sites-index';
  sendFileWithCache(path.join(__dirname, 'sites-index.html'), req, res, () => {
    res.status(404).send('Sites index not found');
  });
});

app.get('*/sites/', (req, res) => {
  // Override siteName for logging purposes
  req.siteName = 'sites-index';
  sendFileWithCache(path.join(__dirname, 'sites-index.html'), req, res, () => {
    res.status(404).send('Sites index not found');
  });
});

// Serve index page for root or site root
app.get('/', (req, res, next) => {
  if (!req.siteName) {
    // Override siteName for logging purposes
    req.siteName = 'sites-index';
    // Serve the sites index page with caching
    sendFileWithCache(path.join(__dirname, 'sites-index.html'), req, res, next);
  } else {
    // This shouldn't happen with our routing
    next();
  }
});

// Serve site root (handles any nested path like /themes/test.com/)
app.get('*/', (req, res, next) => {
  if (req.siteName && req.sitePath && req.path === req.sitePrefix + '/') {
    const filePath = path.join(req.sitePath, 'index.html');
    sendFileWithCache(filePath, req, res, () => {
      res.status(404).send('Site not found');
    });
  } else {
    next();
  }
});

// Custom static middleware that uses req.sitePath
app.use((req, res, next) => {
  if (!req.sitePath) {
    return next();
  }

  // Remove site prefix from path to get the actual file path
  let relativePath;
  if (req.sitePrefix && req.path.startsWith(req.sitePrefix)) {
    relativePath = req.path.substring(req.sitePrefix.length);
  } else {
    relativePath = req.path;
  }

  // Decode URL-encoded path to handle filenames with spaces, special chars, etc.
  try {
    relativePath = decodeURIComponent(relativePath);
  } catch (e) {
    // Invalid URL encoding, use as-is
  }

  const filePath = path.join(req.sitePath, relativePath);

  // Security check
  if (!filePath.startsWith(path.resolve(req.sitePath))) {
    return res.status(403).send('Access denied');
  }

  // Try to serve from site directory first with caching
  sendFileWithCache(filePath, req, res, () => {
    // If file not found in site directory, check if it's in js/, css/, themes/, images/, or node_modules/
    // and try to serve from main AjaxCMS directory as fallback
    if (relativePath.startsWith('/js/') || relativePath.startsWith('/css/') || relativePath.startsWith('/themes/') || relativePath.startsWith('/images/') || relativePath.startsWith('/node_modules/')) {
      const fallbackPath = path.join(__dirname, relativePath);

      // Security check for fallback path
      const allowedPaths = [
        path.resolve(__dirname, 'js'),
        path.resolve(__dirname, 'css'),
        path.resolve(__dirname, 'themes'),
        path.resolve(__dirname, 'images'),
        path.resolve(__dirname, 'node_modules')
      ];

      const resolvedFallback = path.resolve(fallbackPath);
      const isAllowed = allowedPaths.some(allowed => resolvedFallback.startsWith(allowed));

      if (isAllowed) {
        sendFileWithCache(fallbackPath, req, res, next);
      } else {
        next();
      }
    } else {
      next();
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  if (ENABLE_SSL) {
    // Production mode with automatic SSL via Let's Encrypt
    const greenlockExpress = require('greenlock-express');

    if (!MAINTAINER_EMAIL) {
      console.error('ERROR: MAINTAINER_EMAIL environment variable is required when ENABLE_SSL=true');
      console.error('Example: MAINTAINER_EMAIL=admin@example.com ENABLE_SSL=true node server.js');
      process.exit(1);
    }

    // Automatically discover all site domains from the sites directory
    async function discoverSiteDomains() {
      const sitesPath = path.join(__dirname, SITES_DIR);
      const domains = [];

      try {
        const items = await fs.readdir(sitesPath, { withFileTypes: true });

        for (const item of items) {
          if (item.isDirectory()) {
            const indexPath = path.join(sitesPath, item.name, 'index.html');
            try {
              await fs.access(indexPath);
              // This directory has an index.html, so it's a site
              // Use the directory name as the domain
              domains.push(item.name);
            } catch (err) {
              // No index.html, skip this directory
            }
          }
        }
      } catch (err) {
        console.error('Error discovering site domains:', err);
      }

      return domains;
    }

    // Initialize greenlock with discovered domains
    (async () => {
      const siteDomains = await discoverSiteDomains();

      console.log('Discovered site domains:', siteDomains.length > 0 ? siteDomains.join(', ') : 'none');

      // Update greenlock config file with discovered domains
      if (siteDomains.length > 0) {
        const configPath = path.join(__dirname, 'greenlock.d', 'config.json');
        try {
          // Read existing config or create new one
          let config = {
            defaults: {
              subscriberEmail: MAINTAINER_EMAIL,
              agreeToTerms: true
            },
            sites: []
          };

          try {
            const existingConfig = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(existingConfig);
          } catch (err) {
            // Config doesn't exist, use defaults
          }

          // Add discovered domains to config
          const existingSites = new Set(config.sites.map(s => s.subject));
          for (const domain of siteDomains) {
            if (!existingSites.has(domain)) {
              config.sites.push({
                subject: domain,
                altnames: [domain, 'www.' + domain]
              });
              console.log(`Added ${domain} to SSL configuration`);
            }
          }

          // Write updated config
          await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        } catch (err) {
          console.error('Error updating greenlock config:', err);
        }
      }

      greenlockExpress
        .init({
          packageRoot: __dirname,
          configDir: './greenlock.d',
          maintainerEmail: MAINTAINER_EMAIL,
          cluster: false
        })
        .ready((glx) => {
          // Serves on 80 and 443
          glx.serveApp(app);
          console.log('\nAjaxCMS Multi-Site Server with SSL');
          console.log(`Sites directory: ${path.resolve(__dirname, SITES_DIR)}`);
          console.log('\nListening on:');
          console.log('  - HTTP:  port 80 (redirects to HTTPS)');
          console.log('  - HTTPS: port 443');
          console.log('\nSSL certificates will be automatically provisioned via Let\'s Encrypt');
          console.log('Maintainer email:', MAINTAINER_EMAIL);
        });
    })();
  } else {
    // Development mode - HTTP only
    app.listen(HTTP_PORT, () => {
      console.log(`AjaxCMS Multi-Site Server (HTTP-only mode)`);
      console.log(`Sites directory: ${path.resolve(__dirname, SITES_DIR)}`);
      console.log(`\nLocal development: http://localhost:${HTTP_PORT}`);
      console.log(`\nFor production with SSL, set: ENABLE_SSL=true MAINTAINER_EMAIL=your@email.com`);
    });
  }
}

// Export app for testing
module.exports = app;
