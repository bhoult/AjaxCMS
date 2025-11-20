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

# 4. Start the development server
./start-dev.sh
```

Visit `http://localhost:3000` to see the sites index!

**Note:** For production deployment with SSL, see the Production Deployment section below.

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

## Managing Your Content

**AjaxCMS has no backend editor.** You edit content by directly modifying files. This keeps things simple, secure, and version-controllable.

### Recommended Workflows

**1. Git-Based (Best for Teams & Version Control)**
```bash
# Edit locally
vim sites/mysite.com/pages/about.md

# Commit and push
git add -A
git commit -m "Update about page"
git push origin main

# On server
git pull origin main
```

**2. GitHub Web Interface (Quick Edits)**
- Edit files directly in GitHub's web editor
- On server: `git pull` to deploy changes
- Great for non-technical team members

**3. Direct Server Access (Immediate Changes)**
```bash
# SSH and edit
ssh user@yourserver.com
vim /path/to/ajaxcms/sites/mysite.com/pages/about.md
# Changes appear immediately!
```

**4. SFTP/FTP (Visual File Management)**
- Use FileZilla, Cyberduck, or similar
- Upload/edit files visually
- Changes appear immediately after upload

**5. Remote IDE (Professional Workflow)**
- VSCode Remote SSH
- JetBrains Gateway
- Edit server files like they're local

**6. Automated Deployment (Advanced)**
```bash
# GitHub Actions example
# Push to main → CI runs → Server pulls changes

# Or use rsync
rsync -avz --delete ./sites/mysite.com/ user@server:/path/to/sites/mysite.com/
```

### Content File Types

All content is stored as files:
- **Pages**: `.html` or `.md` files in `pages/`
- **Images**: Any image format in `images/`
- **Styles**: `.css` files anywhere in your site
- **Config**: `index.html` contains site settings

**No database. No build step. Just files.**

## Production Deployment

**Prerequisites:**
- Domain names pointing to your server's IP address
- Ports 80 and 443 open in firewall
- PM2 installed globally: `npm install -g pm2`

### Development Mode (HTTP only, port 3000)

Use the included startup script:

```bash
./start-dev.sh
```

This starts the server in development mode on `http://localhost:3000`.

### Production Mode (HTTPS with Let's Encrypt)

**Automatic SSL with built-in Let's Encrypt support:**

**1. Edit the SSL startup script:**
```bash
nano start-ssl.sh
# Change MAINTAINER_EMAIL="your@email.com" to your actual email
```

**2. Make sure your domain DNS points to your server's IP address**

**3. Run the SSL startup script:**
```bash
sudo ./start-ssl.sh
```

**What this does:**
- ✅ Auto-discovers all site domains from `sites/` directory
- ✅ Automatically registers domains with Let's Encrypt
- ✅ Provisions SSL certificates for all discovered sites
- ✅ Serves on port 80 (HTTP → HTTPS redirect) and 443 (HTTPS)
- ✅ Auto-renews certificates before expiration
- ✅ Sets up PM2 to restart on server boot

**After setup:**
- Access sites at `https://yourdomain.com`
- Sites index available at `/sites` from any domain
- Changes to content files appear immediately (no restart needed)

**Manage the server:**

```bash
# View status
pm2 status

# View logs
pm2 logs ajaxcms

# Restart
pm2 restart ajaxcms

# Stop
pm2 stop ajaxcms
```

**Content updates are automatic!**
- Edit any site file (pages, images, CSS, JS) - changes appear immediately
- No server restart needed
- Browsers automatically fetch updated files
- Uses ETag-based caching with file modification timestamps

## File Structure

```
AjaxCMS/
├── server.js               # Node.js server with built-in SSL
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

## SEO Features (Built-in)

Every AjaxCMS site includes automatic SEO features - no configuration needed!

**Automatic XML Sitemap:**
```
http://yoursite.com/sitemap.xml
```

**Static HTML for Search Engines:**
```
http://yoursite.com/static/pages/menus/01-Home.md
```

**Automatic robots.txt:**
```
http://yoursite.com/robots.txt
```

**Features:**
- Auto-generated sitemaps with modification timestamps
- Server-rendered static HTML versions of all pages
- SEO-optimized meta tags (title, description, Open Graph, Twitter Cards)
- Organized sections (Homepage, Menu Pages, Blog Posts, Other Pages)
- Human-readable sitemap display with XSLT

**Submit to search engines:**
1. Visit [Google Search Console](https://search.google.com/search-console)
2. Add your site and verify ownership
3. Submit sitemap: `http://yoursite.com/sitemap.xml`

## Next Steps

- **Add content**: Create pages in `sites/mysite.com/pages/menus/` for navigation
- **Choose theme**: Edit `default_background` in `index.html` (15+ themes available)
- **Customize**: Override `js/`, `themes/`, or `images/` per-site as needed
- **SEO**: Submit your sitemap to Google Search Console and Bing Webmaster Tools
- **Test**: Run `npm test` to verify functionality
- **Documentation**: See [README.md](README.md) for features and [CLAUDE.md](CLAUDE.md) for development details

## Troubleshooting

- **No sites found**: Ensure `sites/` directory exists with at least one site containing `index.html`
- **Site not loading**: Check that site directory has both `index.html` and `pages/` directory
- **Shared resources not loading**: Verify `js/`, `themes/`, and `images/` exist in main directory
- **Server won't start**: Check logs with `pm2 logs ajaxcms`
- **SSL not working**: Ensure domains point to your server and ports 80/443 are open

For detailed troubleshooting, see [README.md](README.md).
