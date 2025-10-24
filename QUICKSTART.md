# AjaxCMS Quick Start Guide

Get AjaxCMS running with the Node.js multi-site server in 3 easy steps.

**What is AjaxCMS?**
AjaxCMS is a JavaScript-based CMS with a Node.js backend that serves JSON directory listings. It features dynamic content generation, custom themes, and multi-site support - all without a database.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create your first site
mkdir -p sites/mysite.com
cp -r index.html pages/ sites/mysite.com/

# 3. Start the server
npm start
```

**Note:** You don't need to copy `js/`, `themes/`, or `images/` folders - sites automatically use the shared versions from the main directory. You can override them by creating local copies if needed.

Visit `http://localhost:3000` to see the sites index, then click on your site!

## Multi-Site Setup

To host multiple AjaxCMS sites on one server:

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create Your Sites

```bash
# Create sites directory
mkdir -p ./sites

# Create your first site (minimal setup - js/, themes/, and images/ are shared)
mkdir -p ./sites/mysite.com
cp -r index.html pages/ ./sites/mysite.com/

# Create additional sites
mkdir -p ./sites/blog.local
cp -r index.html pages/ ./sites/blog.local/

# Add descriptions (optional)
echo "My personal portfolio and blog" > ./sites/mysite.com/description.md
echo "My coding blog and tutorials" > ./sites/blog.local/description.md
```

**Note:** The `js/`, `themes/`, and `images/` folders are automatically shared from the main directory, so you don't need to copy them for each site.

### Step 3: Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Step 4: Access Your Sites

- **Sites Index**: `http://localhost:3000` (shows all available sites)
- **Via Path**: `http://localhost:3000/mysite.com/`
- **Via Domain** (requires hosts file): `http://mysite.com:3000`

### Step 5: Configure Hosts (Optional, for domain-based access)

Edit `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1  mysite.com
127.0.0.1  blog.local
```

Then access via: `http://mysite.com:3000`

### Organizing Sites into Subfolders

Sites can be organized into subfolders for better organization. The URL routing automatically supports nested paths:

```bash
# Create theme showcase sites in a subfolder
mkdir -p ./sites/themes
cp -r sites/bubbles.com ./sites/themes/
cp -r sites/gears.com ./sites/themes/

# Create production sites in another subfolder
mkdir -p ./sites/production
cp -r sites/mysite.com ./sites/production/
```

**Access nested sites via URL:**
- `http://localhost:3000/themes/bubbles.com/`
- `http://localhost:3000/themes/gears.com/`
- `http://localhost:3000/production/mysite.com/`

The server automatically:
- Recursively scans all subdirectories for sites (directories with `index.html`)
- Routes URLs to the correct nested site location
- Displays all sites (including nested) in the sites index page

**Benefits:**
- Organize sites by category (themes, production, demos, etc.)
- Keep related sites grouped together
- Maintain clean directory structure as you scale

## Shared Resources

AjaxCMS uses a **fallback system** for `js/`, `themes/`, and `images/` folders:

### How It Works

- All sites automatically share the `js/`, `themes/`, and `images/` folders from the main AjaxCMS directory
- You don't need to copy these folders to each site
- Sites can override specific files by creating local copies

When a site requests a file, the server:

1. **First** checks the site's local directory: `sites/mysite.com/js/ajaxcms.js`
2. **If not found**, falls back to the main directory: `js/ajaxcms.js`

This means:
- **All sites share** the same resources by default
- **No duplication** - you don't need to copy these folders to each site
- **Easy updates** - update one file and all sites get the change
- **Override anytime** - create a local copy to customize for a specific site

### Example: Custom Theme for One Site

```bash
# Most sites use shared themes, but mysite.com wants a custom one
mkdir -p sites/mysite.com/themes/custom
cp -r themes/starter/* sites/mysite.com/themes/custom/
# Now edit sites/mysite.com/themes/custom/background.js for custom animations
```

### Example: Custom JavaScript for One Site

```bash
# Override ajaxcms.js for one site only
mkdir -p sites/mysite.com/js
cp js/ajaxcms.js sites/mysite.com/js/
# Now edit sites/mysite.com/js/ajaxcms.js with site-specific changes
```

### Example: Site-Specific Images

```bash
# Override specific images for one site
mkdir -p sites/mysite.com/images
cp images/logo.png sites/mysite.com/images/
# Now edit sites/mysite.com/images/logo.png with site-specific image
```

### What's Shared

- **`js/`** - All JavaScript files (ajaxcms.js, libraries, etc.)
- **`themes/`** - All theme directories and files
- **`images/`** - All images (with per-site override support)

### What's NOT Shared

- **`index.html`** - Each site has its own (for custom config)
- **`pages/`** - Site-specific content
- **`description.md`** - Site description for the index

## Environment Variables

Customize the server with environment variables:

```bash
# Change port (default: 3000)
PORT=8080 npm start

# Change sites directory (default: ./sites)
SITES_DIR=/path/to/sites npm start

# Or both
PORT=8080 SITES_DIR=/path/to/sites npm start
```

## API Endpoints

The server provides three JSON API endpoints:

### `/api/sites`

Returns a list of all available sites.

**Example:**
```
GET /api/sites
```

**Response:**
```json
{
  "sites": [
    {"name": "mysite.com", "url": "http://mysite.com:3000"},
    {"name": "blog.local", "url": "http://blog.local:3000"}
  ]
}
```

### `/api/list?dir=<path>`

Returns files and directories in the specified path (non-recursive).

**Example:**
```
GET /api/list?dir=pages
```

**Response:**
```json
{
  "path": "pages",
  "directories": [
    {"name": "menus", "path": "pages/menus", "type": "directory"}
  ],
  "files": [
    {"name": "splash.html", "path": "pages/splash.html", "type": "file"}
  ]
}
```

### `/api/list-recursive?dir=<path>`

Returns all files in the specified directory tree (recursive).

**Example:**
```
GET /api/list-recursive?dir=pages
```

**Response:**
```json
{
  "path": "pages",
  "files": [
    {"name": "splash.html", "path": "splash.html", "type": "file"},
    {"name": "01-Home.html", "path": "menus/01-Home.html", "type": "file"},
    {"name": "02-About.html", "path": "menus/02-About.html", "type": "file"}
  ]
}
```

## Testing

AjaxCMS includes a comprehensive test suite with 59 tests covering all core features.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The test suite achieves **83.57% code coverage** and includes tests for:

- **Server API endpoints** (`/api/sites`, `/api/list`, `/api/list-recursive`)
- **Multi-site routing** (path-based and nested site paths)
- **Resource fallback system** (`js/`, `themes/`, `images/` sharing)
- **Static file serving** (HTML, CSS, JavaScript with proper content-types)
- **Sites index page** (dynamic site listing)
- **Security features** (directory traversal prevention, path sanitization)
- **Helper syntax patterns** ({{a|...}}, {{i|...}}, {{carousel:...}}, {{blog|...}}, etc.)
- **Helper parameter parsing** (pipes, arrow syntax for attributes)
- **Individual helpers** (link, image, carousel, blog, filelist, insert)
- **Page and image matching** (partial match algorithms)
- **Script security** (XSS prevention)
- **Markdown processing**

### Test Files

- `__tests__/server.spec.js` - Server functionality, routing, and API tests
- `__tests__/helpers.spec.js` - Helper syntax and processing tests

### Example Test Output

```
PASS __tests__/helpers.spec.js
PASS __tests__/server.spec.js

Test Suites: 2 passed, 2 total
Tests:       59 passed, 59 total
Snapshots:   0 total
Time:        0.331 s

-----------|---------|----------|---------|---------|---
File       | % Stmts | % Branch | % Funcs | % Lines |
-----------|---------|----------|---------|---------|---
All files  |   83.57 |    78.46 |   93.75 |   83.21 |
 server.js |   83.57 |    78.46 |   93.75 |   83.21 |
-----------|---------|----------|---------|---------|---
```

## Production Deployment

### Using PM2

PM2 is a process manager for Node.js that keeps your application running and restarts it automatically if it crashes.

```bash
# Install PM2 globally
npm install -g pm2

# Start AjaxCMS with PM2
pm2 start server.js --name ajaxcms

# Save the PM2 process list
pm2 save

# Configure PM2 to start on boot
pm2 startup
```

### Using systemd (Recommended for Linux)

AjaxCMS includes a systemd service file for automatic startup on boot.

**Step 1: Deploy AjaxCMS to production location**

```bash
# Clone or copy AjaxCMS to production location
sudo mkdir -p /var/www/AjaxCMS
sudo cp -r /path/to/AjaxCMS/* /var/www/AjaxCMS/

# Install dependencies
cd /var/www/AjaxCMS
sudo npm install --production

# Create sites directory if needed
sudo mkdir -p /var/www/AjaxCMS/sites
```

**Step 2: Configure the service file**

Edit `ajaxcms.service` if you need to customize:
- `User` and `Group` (default: www-data)
- `WorkingDirectory` (default: /var/www/AjaxCMS)
- `PORT` (default: 3000)
- `SITES_DIR` (default: ./sites)

**Step 3: Install the service**

```bash
# Copy service file to systemd
sudo cp /var/www/AjaxCMS/ajaxcms.service /etc/systemd/system/

# Set proper ownership
sudo chown -R www-data:www-data /var/www/AjaxCMS

# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable ajaxcms

# Start the service now
sudo systemctl start ajaxcms

# Check service status
sudo systemctl status ajaxcms
```

**Step 4: Manage the service**

```bash
# View logs
sudo journalctl -u ajaxcms -f

# Stop the service
sudo systemctl stop ajaxcms

# Restart the service
sudo systemctl restart ajaxcms

# Disable auto-start on boot
sudo systemctl disable ajaxcms
```

**Troubleshooting systemd service:**

If the service fails to start:
1. Check logs: `sudo journalctl -u ajaxcms -n 50`
2. Verify Node.js path: `which node` (update `ExecStart` in service file if needed)
3. Check file permissions: `ls -la /var/www/AjaxCMS`
4. Verify www-data user exists: `id www-data`
5. Test manually: `cd /var/www/AjaxCMS && sudo -u www-data node server.js`

### Reverse Proxy (nginx)

For production, use nginx as a reverse proxy to handle multiple domains and SSL:

```nginx
server {
    listen 80;
    server_name mysite.com www.mysite.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name blog.com www.blog.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

For SSL/HTTPS, add SSL certificates using Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d mysite.com -d www.mysite.com
```

### Production Checklist

- [ ] Configure DNS to point to your server
- [ ] Set up nginx reverse proxy
- [ ] Enable SSL/HTTPS with Let's Encrypt
- [ ] Configure PM2 or systemd for auto-restart
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall (open ports 80, 443)
- [ ] Set up log rotation
- [ ] Configure backups for sites directory
- [ ] Enable rate limiting if needed
- [ ] Set proper file permissions

## Security Considerations

- **Directory Traversal Protection**: The server validates all file paths to prevent directory traversal attacks
- **HTTPS**: Always use HTTPS in production via nginx reverse proxy with Let's Encrypt certificates
- **Authentication**: Implement authentication if serving non-public content
- **Rate Limiting**: Consider adding rate limiting for production use (via nginx or Express middleware)
- **File Permissions**: Ensure proper file permissions on the sites directory
- **Regular Updates**: Keep Node.js, npm packages, and system dependencies up to date
- **Firewall**: Configure firewall to only allow necessary ports (80, 443, SSH)

## Troubleshooting

### "No sites found" on index page
- Make sure `./sites/` directory exists
- Ensure you have at least one site directory in `./sites/`
- Check server console for errors

### Site not loading
- Verify `sites/yoursite.com/` exists
- Check that `index.html` exists in the site directory
- Verify the directory name matches the hostname
- Check server console for errors

### Menu not showing
- Verify `pages/menus/` directory exists with HTML/MD files
- Check browser console for API errors
- Ensure the site has proper directory structure

### Images not loading
- Check that images exist in `images/` folder (shared) or site-specific `images/` folder
- Verify image paths use relative paths (e.g., `images/logo.png` not `/images/logo.png`)
- Check file permissions
- Check browser console for 404 errors

### Themes not loading
- Shared `themes/` folder should exist in main directory
- Check theme name in site's `index.html` configuration
- Verify theme directory contains `background.js` and `theme.css`
- Check browser console for loading errors

### Multiple sites not working
- Verify domain names match directory names exactly in `sites/`
- Check hosts file configuration for domain-based access
- Ensure each site directory has required files (`index.html`, `pages/`)

### API errors
- Verify the path parameter in API requests
- Check server console for detailed error messages
- Ensure site has proper directory structure

### Shared resources not loading
- Verify `js/`, `themes/`, and `images/` folders exist in main directory
- Check server console for file path errors
- Ensure proper file permissions

## File Structure Reference

```
AjaxCMS/                    # This repository (template)
├── server.js               # Node.js multi-site server
├── sites-index.html        # Sites directory index page
├── package.json            # Dependencies
├── index.html              # AjaxCMS template (copy to sites)
├── js/                     # Shared JavaScript (all sites)
├── themes/                 # Shared themes (all sites)
├── images/                 # Shared images (all sites)
├── pages/                  # Template pages
└── sites/                  # Sites directory (you create this)
    ├── mysite.com/         # Your first site
    │   ├── index.html      # Site config
    │   ├── description.md  # Site description (optional)
    │   ├── pages/          # Site content
    │   └── images/         # Site images (optional)
    │   # js/ and themes/ inherited from main directory
    │   # Create local copies to override
    ├── blog.local/         # Another site
    │   ├── index.html
    │   ├── description.md
    │   ├── pages/
    │   └── js/             # Optional: local override
    └── another-site/       # Additional sites
        └── ...
```

## Next Steps

- **Customize your sites** by editing files in `sites/yoursite.com/`
- **Add pages** to `sites/yoursite.com/pages/menus/` to create navigation items
- **Create custom themes** by overriding files in `sites/yoursite.com/themes/`
- **Share resources** - update `js/`, `themes/`, or `images/` in the main directory to affect all sites
- **Run tests** - verify everything works with `npm test` (see [Testing](#testing) section)
- **Read `CLAUDE.md`** for development guidance and architecture details
- **Explore themes** - AjaxCMS includes 15+ animated canvas themes

## Additional Resources

- **Main README**: See [README.md](README.md) for project overview and features
- **Development Guide**: See [CLAUDE.md](CLAUDE.md) for architecture and development guidance
- **GitHub Issues**: Report bugs or request features at the GitHub repository
