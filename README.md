# AjaxCMS

> A lightweight, database-free CMS powered by JavaScript and Node.js

**AjaxCMS** is a modern content management system that generates dynamic websites from static files. No database required, no complex setup - just pure JavaScript magic with animated themes and powerful content helpers.

🌐 **[Live Demo](http://ajaxcms.org)** • 📖 **[Documentation](QUICKSTART.md)**

## What is AjaxCMS?

AjaxCMS is a single-page application (SPA) that dynamically builds websites from directory structures. It uses a Node.js backend to serve JSON directory listings, which the front-end JavaScript transforms into beautiful, navigable websites.

Think of it as a static site generator that runs in real-time, with the flexibility of a CMS.

## Key Features

✨ **No Database** - Content lives in simple HTML and Markdown files
🚀 **Multi-Site Ready** - Host unlimited sites from one installation
🎨 **Animated Themes** - Canvas-based backgrounds with 15+ built-in themes
📝 **Markdown Support** - Write content in Markdown or HTML
🔧 **Helper Syntax** - Custom `{{helper}}` tags for dynamic content
🌐 **Single Page App** - Fast navigation with smooth transitions
📱 **Responsive** - Built with Bootstrap, works on all devices
🎯 **Blog Support** - Built-in blog functionality with pagination
🔄 **Resource Sharing** - Share JavaScript, themes, and images across all sites
⚡ **Fast Setup** - Get running in minutes, not hours

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

Visit `http://localhost:3000` and click on your site!

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Browser requests page                                  │
│  ↓                                                       │
│  Node.js server serves JSON directory listings          │
│  ↓                                                       │
│  JavaScript builds navigation from file structure       │
│  ↓                                                       │
│  Content loaded dynamically with smooth transitions     │
│  ↓                                                       │
│  Helpers processed (links, images, blogs, etc.)         │
│  ↓                                                       │
│  Markdown converted to HTML                             │
│  ↓                                                       │
│  Animated theme renders in background                   │
└─────────────────────────────────────────────────────────┘
```

## Why AjaxCMS?

### 🎯 Perfect For

- **Portfolio sites** - Showcase your work with stunning themes
- **Documentation** - Organize docs with automatic navigation
- **Blogs** - Built-in blog functionality with date-based sorting
- **Multi-tenant hosting** - One server, unlimited sites
- **Learning projects** - Simple architecture, easy to understand

### 💡 Benefits

- **Zero Configuration** - Drop files in folders, they appear in menus
- **Easy Deployment** - Just copy files, no database migrations
- **Version Control Friendly** - All content in Git-friendly text files
- **Low Resource Usage** - Static files = minimal server requirements
- **Offline Development** - Test locally without complicated setup
- **Theme Flexibility** - Override any theme per-site or share globally

### ⚡ What Makes It Different

Unlike traditional CMSs (WordPress, Drupal) or static generators (Jekyll, Hugo):

- ✅ No build step required
- ✅ No database to manage
- ✅ Changes appear immediately
- ✅ Multi-site built-in from day one
- ✅ Dynamic content from static files
- ✅ Shared resources (js/, themes/, images/) across sites

## Directory Structure

```
AjaxCMS/
├── server.js              # Node.js multi-site server
├── sites-index.html       # Sites directory index
├── js/                    # Shared JavaScript (all sites)
├── themes/                # Shared themes (all sites)
├── images/                # Shared images (all sites)
└── sites/                 # Your sites
    ├── mysite.com/
    │   ├── index.html     # Site config
    │   ├── description.md # Shows on index
    │   ├── pages/         # Your content
    │   │   └── menus/     # Auto-discovered navigation
    │   └── images/        # Site images
    └── blog.com/
        └── ...
```

## Content Helpers

AjaxCMS includes powerful helpers for dynamic content:

```html
<!-- Links -->
{{a | about}}  <!-- Auto-finds pages/about.html -->

<!-- Images -->
{{i | logo}}   <!-- Auto-finds images/logo.png -->

<!-- Carousels -->
{{carousel:5000 | img1:alt1:caption1 | img2:alt2:caption2}}

<!-- Blogs -->
{{blog | ./pages/posts | 0 | 5}}  <!-- First 5 posts -->

<!-- File Lists -->
{{filelist | ./pages/docs}}  <!-- Auto-generated file tree -->
```

## Themes

Choose from 15+ animated canvas themes or create your own:

- **network** - Animated network connections
- **gears** - Spinning mechanical gears
- **kaleidoscope** - Colorful geometric patterns
- **bubbles** - Floating bubble animation
- **cityscape** - Parallax city skyline
- And many more!

Set per-site in `index.html`:
```javascript
var default_background = "gears";
```

## Multi-Site Setup

Host multiple sites from one installation:

```bash
# Create sites
mkdir -p sites/portfolio.com sites/blog.com

# Copy templates
cp -r index.html pages/ sites/portfolio.com/
cp -r index.html pages/ sites/blog.com/

# Add descriptions
echo "My portfolio site" > sites/portfolio.com/description.md
echo "My blog" > sites/blog.com/description.md
```

Access via:
- Path: `http://localhost:3000/portfolio.com/`
- Domain: `http://portfolio.com:3000` (with hosts file)

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[SERVER_README.md](SERVER_README.md)** - Server configuration and deployment
- **[CLAUDE.md](CLAUDE.md)** - Architecture and development guide

## Production Deployment

Deploy with PM2, systemd, or as a Docker container. Full instructions in [SERVER_README.md](SERVER_README.md).

```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name ajaxcms
pm2 save
```

## Requirements

- Node.js 14+
- npm or yarn

That's it! No database, no complex dependencies.

## License

See [LICENSE](LICENSE) file for details.

## Contact

Questions? Contact brandon.hoult@softwyre.com

---

Built with ❤️ for developers who love simplicity
