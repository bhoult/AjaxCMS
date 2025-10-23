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
cp -r index.html pages/ images/ sites/mysite.com/

# 3. Start the server
npm start
```

**Note:** You don't need to copy `js/` or `themes/` folders - sites automatically use the shared versions from the main directory. You can override them by creating local copies if needed.

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

# Create your first site (minimal setup - js/ and themes/ are shared)
mkdir -p ./sites/mysite.com
cp -r index.html pages/ images/ ./sites/mysite.com/

# Create additional sites
mkdir -p ./sites/blog.local
cp -r index.html pages/ images/ ./sites/blog.local/

# Add descriptions (optional)
echo "My personal portfolio and blog" > ./sites/mysite.com/description.md
echo "My coding blog and tutorials" > ./sites/blog.local/description.md
```

**Note:** The `js/` and `themes/` folders are automatically shared from the main directory, so you don't need to copy them for each site.

### Step 3: Start the Server

```bash
npm start
```

### Step 4: Access Your Sites

- **Sites Index**: `http://localhost:3000` (shows all available sites)
- **Via Path**: `http://localhost:3000/mysite.com/`
- **Via Domain** (requires hosts file): `http://mysite.com:3000`

### Step 5: Add Site Descriptions (Optional)

Create a `description.md` file in each site to describe it on the sites index:

```bash
echo "My awesome portfolio site" > ./sites/mysite.com/description.md
```

The description supports Markdown formatting.

### Step 6: Configure Hosts (Optional, for domain-based access)

Edit `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1  mysite.com
127.0.0.1  blog.local
```

Then access via: `http://mysite.com:3000`

## Shared Resources

AjaxCMS uses a **fallback system** for `js/` and `themes/` folders:

### How It Works

- All sites automatically share the `js/` and `themes/` folders from the main AjaxCMS directory
- You don't need to copy these folders to each site
- Sites can override specific files by creating local copies

### Example: Custom Theme for One Site

```bash
# Most sites use shared themes, but mysite.com wants a custom one
mkdir -p sites/mysite.com/themes/custom
cp -r themes/default/* sites/mysite.com/themes/custom/
# Now edit sites/mysite.com/themes/custom/background.js for custom animations
```

### Example: Custom JavaScript for One Site

```bash
# Override ajaxcms.js for one site only
mkdir -p sites/mysite.com/js
cp js/ajaxcms.js sites/mysite.com/js/
# Now edit sites/mysite.com/js/ajaxcms.js with site-specific changes
```

### Directory Priority

1. **Site-specific files first**: `sites/mysite.com/js/ajaxcms.js`
2. **Shared files as fallback**: `js/ajaxcms.js`

This keeps your installation efficient while allowing site-specific customization!

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

## Production Deployment

For production deployment, see `SERVER_README.md` for detailed instructions on:
- **PM2** - Process management and auto-restart
- **systemd** - System service configuration
- **nginx** - Reverse proxy setup for multiple domains
- **SSL/HTTPS** - Securing your sites with encryption
- **Security** - Best practices and considerations

## Troubleshooting

**"No sites found" on index page**
- Make sure `./sites/` directory exists
- Ensure you have at least one site directory in `./sites/`
- Check server console for errors

**Site not loading**
- Verify `sites/yoursite.com/` exists
- Check that `index.html` exists in the site directory
- Check server console for errors

**Menu not showing**
- Verify `pages/menus/` directory exists with HTML/MD files
- Check browser console for API errors
- Ensure the site has proper directory structure

**Images not loading**
- Ensure `images/` directory exists in your site
- Check file permissions
- Verify image paths in your content

**Themes not loading**
- Shared `themes/` folder should exist in main directory
- Check theme name in site's `index.html` configuration
- Verify theme directory contains `background.js` and `theme.css`

**Multiple sites not working**
- Verify domain names match directory names exactly in `sites/`
- Check hosts file configuration for domain-based access
- Ensure each site directory has required files

## Next Steps

- **Customize your sites** by editing files in `sites/yoursite.com/`
- **Add pages** to `sites/yoursite.com/pages/menus/` to create navigation items
- **Create custom themes** by overriding files in `sites/yoursite.com/themes/`
- **Share resources** - update `js/` or `themes/` in the main directory to affect all sites
- **Read `SERVER_README.md`** for advanced configuration and production deployment
- **Read `CLAUDE.md`** for development guidance and architecture details

## File Structure Reference

```
AjaxCMS/                    # This repository (template)
├── server.js               # Node.js multi-site server
├── sites-index.html        # Sites directory index page
├── package.json            # Dependencies
├── index.html              # AjaxCMS template (copy to sites)
├── js/                     # Shared JavaScript (all sites)
├── themes/                 # Shared themes (all sites)
├── pages/                  # Template pages
├── images/                 # Template images
└── sites/                  # Sites directory (you create this)
    ├── mysite.com/         # Your first site
    │   ├── index.html      # Site config
    │   ├── description.md  # Site description (optional)
    │   ├── pages/          # Site content
    │   └── images/         # Site images
    │   # js/ and themes/ inherited from main directory
    │   # Create local copies to override
    ├── blog.local/         # Another site
    │   ├── index.html
    │   ├── description.md
    │   ├── pages/
    │   ├── images/
    │   └── js/             # Optional: local override
    └── another-site/       # Additional sites
        └── ...
```
