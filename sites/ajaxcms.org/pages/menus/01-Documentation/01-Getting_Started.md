# Getting Started

## 1. System Requirements

AjaxCMS runs on **Node.js** and works on any platform that supports Node.js (Linux, macOS, Windows). The included Node.js server provides JSON directory listings that power the dynamic content discovery system.

**Required:**
- Node.js (v14 or higher recommended)
- npm (comes with Node.js)

**Recommended hosting options:**
- **Development:** Run locally with `npm start`
- **Production:** Any VPS provider (DigitalOcean, Linode, AWS, Azure, etc.)
- **Simple deployment:** Works great on small instances since it only serves static files

## 2. Installation

### Quick Start

1. **Clone or download AjaxCMS:**
   ```bash
   git clone https://github.com/bhoult/AjaxCMS.git
   cd AjaxCMS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This installs all required libraries (jQuery, Bootstrap 5, marked, etc.) managed through npm.

3. **Start the server:**

   **For development (HTTP only, port 3000):**
   ```bash
   ./start-dev.sh
   ```

   **For production (HTTPS with SSL, ports 80 & 443):**
   ```bash
   # First, edit start-ssl.sh and set your email address
   nano start-ssl.sh

   # Then run (requires sudo for ports 80/443):
   sudo ./start-ssl.sh
   ```

4. **View your site:**
   - **Development:** Open `http://localhost:3000` to see the sites index
   - **Production:** Open `https://yourdomain.com` (auto-redirects from HTTP)
   - Access individual sites at `/sitename/` or via domain routing
   - Sites index always available at `/sites` from any domain

### What Gets Installed

The core AjaxCMS requires only two main files:
- **`index.html`** - Main HTML structure and configuration
- **`js/ajaxcms.js`** - Core CMS logic (~2,300 lines of well-documented JavaScript)

All dependencies (jQuery, Bootstrap, marked, etc.) are managed through npm and served from `node_modules/`. Themes and examples are included to help you get started.

## 3. Creating Your Site

AjaxCMS supports **multi-site hosting** - multiple sites can run from a single installation. Each site is a subdirectory in the `sites/` folder.

### Option A: Create a New Site

1. **Create a site directory:**
   ```bash
   mkdir -p sites/mysite/pages/menus
   mkdir sites/mysite/images
   ```

2. **Copy the base index.html:**
   ```bash
   cp index.html sites/mysite/
   ```

3. **Create your first page:**
   ```bash
   echo "# Welcome to My Site" > sites/mysite/pages/menus/01-Home.md
   ```

4. **Configure your site** (edit `sites/mysite/index.html`):
   ```html
   <script>
       var default_background = "network";  // Choose a theme
       var ajaxcms_splash_time = 3000;      // Splash screen duration (ms)
   </script>
   ```

5. **View your site:**
   - Go to `http://localhost:3000/mysite/`

### Option B: Customize the Demo Site

1. Navigate to `sites/ajaxcms.org/`
2. Delete example pages in `pages/` and `pages/menus/`
3. Delete example images in `images/`
4. Create your own pages as `.md` (Markdown) or `.html` files in `pages/menus/`

### Naming Conventions

Files in `pages/menus/` become navigation menu items. Use numeric prefixes to control order:

- `01-Home.md` → displays as "Home"
- `02-About.md` → displays as "About"
- `03-Contact.html` → displays as "Contact"

The number and file extension are automatically stripped from the menu display.

## 4. Required HTML Structure

Your `index.html` must include these key elements:

```html
<!-- Navigation menu -->
<nav class="navbar navbar-expand-lg">
    <ul id='menu' class="navbar-nav">
        <!-- Menu items auto-generated here -->
    </ul>
</nav>

<!-- Content area -->
<main id="main">
    <!-- Content divs for page transitions -->
    <div id='a'></div>
    <div id='b' style="display:none;"></div>
</main>
```

The `#menu` element is where navigation links appear. The `#a` and `#b` divs enable smooth page transitions without full page reloads.

## 5. Choosing Content: Markdown vs HTML

**Markdown (.md files):**
- Fast and simple for text-heavy content
- Supports basic formatting (headers, lists, links, images, code blocks)
- Automatically converted to HTML
- Great for documentation, blog posts, simple pages

**HTML (.html files):**
- Full control over layout and structure
- Required for complex layouts
- Can use all Bootstrap components
- Best for custom designs

Both formats support AjaxCMS {{a | 02-Helpers.md | helper syntax}}.

## 6. Themes and Styling

### Background Themes

AjaxCMS includes animated canvas backgrounds. Each theme has:
- **`themes/[name]/background.js`** - Canvas animation code
- **`themes/[name]/theme.css`** - Color scheme and styles

Available themes include: `network`, `gears`, `ribbons`, `gl_city`, and more.

Set your theme in `index.html`:
```html
<script>
    var default_background = "network";
</script>
```

### Custom Styling

1. **Override theme CSS:** Create your own `theme.css` in your site directory
2. **Modify Bootstrap:** Include custom CSS after Bootstrap in `index.html`
3. **Use Bootstrap classes:** Reference [Bootstrap 5 documentation](https://getbootstrap.com/docs/5.3/)

## 7. Editing Your Site

Since AjaxCMS uses plain Markdown and HTML files, you can edit them with any text editor:

**Desktop editors:**
- **VS Code** - Free, powerful, cross-platform
- **Sublime Text** - Fast and lightweight
- **Notepad++** (Windows)
- **Vim/Nano** (command line)

**Remote editing:**
- Edit files via SSH using `vim`, `nano`, or `emacs`
- Use SFTP clients like **FileZilla** to download/upload files
- Use remote editing extensions in VS Code or other editors

**Note:** Avoid document editors (Microsoft Word, LibreOffice) - they add formatting that conflicts with HTML/CSS.

## 8. Resource Fallback System

AjaxCMS shares resources across all sites:
- `js/` - JavaScript files
- `themes/` - Background themes
- `images/` - Can be shared or site-specific
- `node_modules/` - npm packages

**How it works:**
1. Server checks your site directory first (`sites/mysite/js/ajaxcms.js`)
2. If not found, falls back to main directory (`js/ajaxcms.js`)
3. This means you only copy files you want to customize

**To override a shared file:** Just create a local copy in your site directory.

## 9. SEO Features

AjaxCMS includes comprehensive built-in SEO features - no configuration required!

### Automatic XML Sitemap

Every site automatically has an XML sitemap at `/sitemap.xml`:

```
http://yoursite.com/sitemap.xml
```

**Features:**
- Auto-discovers all `.html` and `.md` files in `pages/`
- Includes modification timestamps
- Organized into sections (Homepage, Menu Pages, Blog Posts, Other Pages)
- Human-readable display with XSLT stylesheet
- Includes alternate links to static HTML versions

### Static HTML for Search Engines

Every page has a crawlable static HTML version at `/static/*`:

```
http://yoursite.com/static/pages/menus/01-Home.md
```

These pages include:
- SEO-optimized meta tags (title, description)
- Open Graph tags for social media
- Twitter Card tags
- Canonical URLs pointing to the AJAX version

**Dual rendering strategy:**
- Users see the full interactive AJAX site
- Search engines see clean, crawlable HTML

### Robots.txt

Every site has an automatic `robots.txt` at `/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: http://yoursite.com/sitemap.xml
```

### Submitting to Search Engines

**Google Search Console:**
1. Visit [Google Search Console](https://search.google.com/search-console)
2. Add your property and verify ownership
3. Submit sitemap: `http://yoursite.com/sitemap.xml`

**Bing Webmaster Tools:**
1. Visit [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site and verify ownership
3. Submit sitemap: `http://yoursite.com/sitemap.xml`

For detailed information, see the {{a | ../../AjaxCMS_Blog/2025-10-31-SEO_Enhancements.md | SEO Enhancements blog post}}.

## 10. Deployment to Production

### Development Mode (HTTP, port 3000)

Use the included startup script:

```bash
./start-dev.sh
```

This starts the server in development mode on `http://localhost:3000`.

### Production Mode (HTTPS with Let's Encrypt)

**Automatic SSL with built-in Let's Encrypt support:**

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Edit the SSL startup script:**
   ```bash
   nano start-ssl.sh
   # Change MAINTAINER_EMAIL="your@email.com" to your actual email
   ```

3. **Make sure your domain DNS points to your server's IP address**

4. **Run the SSL startup script:**
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

### Domain Routing

Sites can be accessed via:
- **Path-based:** `https://yourdomain.com/sitename/`
- **Domain-based:** `https://sitename.com/` (requires DNS configuration)

For domain-based routing, create a site directory matching your domain name in `sites/`. The system automatically discovers and registers the domain for SSL.

## 11. Learning Resources

**Essential skills:**
- **Markdown:** [Mastering Markdown](https://guides.github.com/features/mastering-markdown/) (5-minute read)
- **HTML:** [W3Schools HTML Tutorial](https://www.w3schools.com/html/)
- **CSS:** [W3Schools CSS Tutorial](https://www.w3schools.com/css/)
- **Bootstrap 5:** [Official Documentation](https://getbootstrap.com/docs/5.3/)

**Inspiration for animations:**
- [CodePen.io](https://codepen.io) - Thousands of Canvas/SVG/WebGL examples
- Use the included "starter" theme as a base for your own

## Next Steps

- {{a | 02-Helpers.md | Learn about helper syntax}} for links, images, and carousels
- {{a | 03-Layouts.md | Create layouts}} for consistent multi-column designs
- Explore the included themes in `themes/` for animation examples
- Check out `CLAUDE.md` for detailed developer documentation
