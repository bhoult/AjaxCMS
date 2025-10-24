const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SITES_DIR = process.env.SITES_DIR || './sites';

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
              url: `http://localhost:${PORT}/${relPath}/`,
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
  // localhost -> serve the index page
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    req.siteName = null; // No specific site, will show index
    req.sitePath = null;
  } else {
    req.siteName = hostname;
    req.sitePath = path.join(sitesPath, hostname);
  }

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
    const fullPath = path.join(req.sitePath, dirParam);

    // Security check - prevent directory traversal
    if (!fullPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if directory exists
    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: 'Not a directory' });
      }
    } catch (err) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    // Read directory contents
    const items = await fs.readdir(fullPath, { withFileTypes: true });

    const files = [];
    const directories = [];

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
    const fullPath = path.join(req.sitePath, dirParam);

    // Security check
    if (!fullPath.startsWith(path.resolve(req.sitePath))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const files = [];

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

    await walkDirectory(fullPath);

    res.json({
      path: dirParam,
      files: files
    });

  } catch (err) {
    console.error('Error listing directory recursively:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index page for root or site root
app.get('/', (req, res) => {
  if (!req.siteName) {
    // Serve the sites index page
    res.sendFile(path.join(__dirname, 'sites-index.html'));
  } else {
    // This shouldn't happen with our routing
    next();
  }
});

// Serve site root (handles any nested path like /themes/test.com/)
app.get('*/', (req, res, next) => {
  if (req.siteName && req.sitePath && req.path === req.sitePrefix + '/') {
    const filePath = path.join(req.sitePath, 'index.html');
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).send('Site not found');
      }
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

  const filePath = path.join(req.sitePath, relativePath);

  // Security check
  if (!filePath.startsWith(path.resolve(req.sitePath))) {
    return res.status(403).send('Access denied');
  }

  // Try to serve from site directory first
  res.sendFile(filePath, (err) => {
    if (err) {
      // If file not found in site directory, check if it's in js/, themes/, or images/
      // and try to serve from main AjaxCMS directory as fallback
      if (err.code === 'ENOENT' && (relativePath.startsWith('/js/') || relativePath.startsWith('/themes/') || relativePath.startsWith('/images/'))) {
        const fallbackPath = path.join(__dirname, relativePath);

        // Security check for fallback path
        const allowedPaths = [
          path.resolve(__dirname, 'js'),
          path.resolve(__dirname, 'themes'),
          path.resolve(__dirname, 'images')
        ];

        const resolvedFallback = path.resolve(fallbackPath);
        const isAllowed = allowedPaths.some(allowed => resolvedFallback.startsWith(allowed));

        if (isAllowed) {
          res.sendFile(fallbackPath, (fallbackErr) => {
            if (fallbackErr) {
              next();
            }
          });
        } else {
          next();
        }
      } else {
        next();
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`AjaxCMS Multi-Site Server running on port ${PORT}`);
  console.log(`Sites directory: ${path.resolve(__dirname, SITES_DIR)}`);
  console.log(`\nLocal development: http://localhost:${PORT}`);
  console.log(`\nFor multi-site support, configure your hosts file or DNS to point domains to this server.`);
});
