# AjaxCMS Quick Start Guide

Get AjaxCMS running in 3 easy steps.

**What is AjaxCMS?**
A JavaScript-based CMS with a Node.js backend. Features dynamic content generation, custom animated themes, and multi-site support - all without a database.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create your sites
mkdir -p sites/mysite.com sites/blog.local
cp -r index.html pages/ sites/mysite.com/
cp -r index.html pages/ sites/blog.local/

# 3. Add optional descriptions (shown on sites index)
echo "My personal portfolio" > sites/mysite.com/description.md
echo "My coding blog" > sites/blog.local/description.md

# 4. Start the server
npm start
```

Visit `http://localhost:3000` to see the sites index!

**Note:** All sites automatically share `js/`, `themes/`, and `images/` from the main directory. No need to copy them unless you want site-specific overrides.

## Accessing Your Sites

- **Sites Index**: `http://localhost:3000` (lists all sites)
- **Via Path**: `http://localhost:3000/mysite.com/`
- **Via Domain**: `http://mysite.com:3000` (requires hosts file configuration)

### Domain-Based Access (Optional)

Edit `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1  mysite.com
127.0.0.1  blog.local
```

### Organizing Sites in Subfolders

Sites can be organized in subdirectories:

```bash
mkdir -p sites/production sites/demos
mv sites/mysite.com sites/production/
```

Access via: `http://localhost:3000/production/mysite.com/`

## Shared Resources

Sites automatically share resources from the main directory:

- **`js/`** - JavaScript files (ajaxcms.js, libraries)
- **`themes/`** - All animated themes
- **`images/`** - Image files

**How it works:**
The server checks the site's local directory first, then falls back to the shared directory if not found.

**To override for a specific site:**
```bash
# Copy and customize shared resources for one site
mkdir -p sites/mysite.com/themes/custom
cp -r themes/starter/* sites/mysite.com/themes/custom/
# Edit sites/mysite.com/index.html to use 'custom' theme
```

**What's NOT shared:**
- `index.html` - Each site has its own configuration
- `pages/` - Site-specific content
- `description.md` - Site description

## Local Development Options

```bash
# Auto-reload when files change
npm run dev

# Change port (default: 3000)
PORT=8080 npm start

# Change sites directory (default: ./sites)
SITES_DIR=/path/to/sites npm start
```

## Production Deployment

### Using systemd (Linux)

**1. Deploy to production location:**

```bash
sudo mkdir -p /var/www/AjaxCMS
sudo cp -r * /var/www/AjaxCMS/
cd /var/www/AjaxCMS
sudo npm install --production
```

**2. Configure service file:**

Edit `ajaxcms.service` and update `MAINTAINER_EMAIL` with your email address:
```ini
Environment=MAINTAINER_EMAIL=your-email@example.com
```

**3. Install systemd service:**

```bash
# Copy service file
sudo cp ajaxcms.service /etc/systemd/system/

# Set ownership
sudo chown -R www-data:www-data /var/www/AjaxCMS

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ajaxcms
sudo systemctl start ajaxcms

# Check status
sudo systemctl status ajaxcms
```

**4. View logs:**

```bash
sudo journalctl -u ajaxcms -f
```

**SSL is enabled by default!** The service will:
- Listen on ports 80 (HTTP) and 443 (HTTPS)
- Automatically provision Let's Encrypt certificates for all domains
- Redirect HTTP to HTTPS
- Auto-renew certificates before expiration

**Note:** SSL requires domain names pointing to your server. For local testing without domains, use `npm start` instead of systemd.

### Using PM2 (Alternative)

```bash
npm install -g pm2

# Start with SSL (requires domain names)
ENABLE_SSL=true MAINTAINER_EMAIL=admin@example.com pm2 start server.js --name ajaxcms

# Or without SSL (local testing only)
pm2 start server.js --name ajaxcms

pm2 save
pm2 startup
```

## File Structure

```
AjaxCMS/
├── server.js               # Node.js server
├── ajaxcms.service         # systemd service file
├── package.json            # Dependencies
├── index.html              # Template (copy to sites)
├── js/                     # Shared JavaScript
├── themes/                 # Shared themes (15+ animated themes)
├── images/                 # Shared images
├── pages/                  # Template pages
└── sites/                  # Your sites (created by you)
    ├── mysite.com/
    │   ├── index.html      # Site configuration
    │   ├── pages/          # Site content
    │   └── description.md  # Optional description
    └── blog.local/
        ├── index.html
        └── pages/
```

## Next Steps

- **Add content**: Create pages in `sites/mysite.com/pages/menus/` for navigation
- **Choose theme**: Edit `default_background` in `index.html` (15+ themes available)
- **Customize**: Override `js/`, `themes/`, or `images/` per-site as needed
- **Test**: Run `npm test` to verify functionality
- **Documentation**: See [README.md](README.md) for features and [CLAUDE.md](CLAUDE.md) for development details

## Troubleshooting

- **No sites found**: Ensure `sites/` directory exists with at least one site containing `index.html`
- **Site not loading**: Check that site directory has both `index.html` and `pages/` directory
- **Shared resources not loading**: Verify `js/`, `themes/`, and `images/` exist in main directory
- **Service won't start**: Check logs with `sudo journalctl -u ajaxcms -n 50`

For detailed troubleshooting, see [README.md](README.md).
