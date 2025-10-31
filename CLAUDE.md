# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AjaxCMS is a JavaScript-based front-end CMS with a static file backend. It dynamically generates content by parsing Apache directory listings, building navigation menus, and rendering pages with custom helper syntax. The system uses jQuery, Bootstrap, and animated canvas backgrounds (themes) to create an interactive single-page application.

Demo and documentation: http://ajaxcms.org

## Development Commands

**Testing locally:**

**Option 1: Node.js Server (Recommended)**
- Install dependencies: `npm install`
- Create a site: `mkdir -p sites/mysite && cp -r index.html pages/ images/ sites/mysite/`
  - Note: `js/` and `themes/` are shared automatically - no need to copy them
  - Override by creating local copies in the site directory if needed
- Start the server: `npm start`
- Navigate to `http://localhost:3000` to see the sites index
- Sites are stored in `./sites/` directory
- Each site can have a `description.md` file to describe it on the index
- See `QUICKSTART.md` for multi-site configuration and deployment

**Option 2: Simple File Server**
- Open `index.html` directly in a browser, OR
- Use a local web server: `python -m http.server 8000` or `php -S localhost:8000`
- Navigate to `http://localhost:8000/index.html`

**Note:** The system requires directory listings for dynamic content discovery. The Node.js server provides JSON directory listings. Simple file servers may not work properly with the modified code (see note below).

## Architecture

### Core System Flow

1. **Initialization** (`index.html` loads → `ajaxcms.js` executes):
   - Parse configuration variables in `index.html` (`default_background`, `ajaxcms_google_analytics`, `ajaxcms_splash_time`)
   - Load directory listings via `load_pages('./pages')` and `load_images('./images')`
   - Build navigation menu from files in `pages/menus/`
   - Display splash page if present (`pages/splash.html`), then fade to main content
   - Load initial page from URL param or first menu page

2. **Page Loading** (`loadPage()` in `js/ajaxcms.js`):
   - Fetch page content (HTML or Markdown)
   - Find and apply layout template (`layout.html` in page's directory hierarchy)
   - Process pre-processors (`pre_process_page()` - handles `{{blog}}` helpers)
   - Convert Markdown to HTML if `.md` extension
   - Process inserts recursively (`processInserts()` - handles `{{insert}}` helpers)
   - Process remaining helpers (`process_page()` - handles links, images, carousels, etc.)
   - Apply page transition animation (slide/fade)
   - Update browser history and Google Analytics

3. **Helper System** (`js/ajaxcms.js:236-503`):
   - Custom `{{ }}` syntax for dynamic content
   - Helpers support pipes (`|`) for parameters and `=>` for HTML attributes
   - Examples:
     - Links: `{{a | page_name}}` or `{{a | page_name | link text}}`
     - Images: `{{i | image_name}}` or `{{i | image_name | alt text}}`
     - Carousels: `{{carousel:5000 | img1:alt1:caption1 | img2:alt2:caption2}}`
     - File lists: `{{filelist | directory_path}}`
     - Blog lists: `{{bloglist | directory | start | stop}}`
     - Blog content: `{{blog | directory | start | stop}}`
     - Inserts: `{{insert | page_name | allow_scripts}}`

### Directory Structure

- **`index.html`**: Main entry point, configuration, and HTML structure
- **`js/ajaxcms.js`**: Core CMS logic (~1000 lines) - page loading, helper processing, menu generation
  - Wrapped in IIFE (Immediately Invoked Function Expression) to prevent global pollution
  - Comprehensive JSDoc documentation for all functions
  - Optimized and refactored (eliminated ~140 lines of duplicate code)
- **`js/canvasstuff.js`**: Canvas animation utilities (custom)
- **`js/jquery-mobile-swipe.js`**: Touch gesture support (custom)
- **`node_modules/`**: Third-party libraries managed by npm
  - **`jquery`**: DOM manipulation and AJAX (v3.7.1)
  - **`jquery-ui-dist`**: UI widgets and effects (v1.13.3)
  - **`bootstrap`**: CSS framework (v5.3.8)
  - **`marked`**: Markdown to HTML converter (v16.4.1)
  - **`victor`**: 2D vector math library
  - **`segment-js`**: SVG path animation library
- **`pages/`**: Content pages (HTML/Markdown) organized in directories
  - **`pages/menus/`**: Pages that appear in navigation menu (auto-discovered)
  - **`pages/splash.html`**: Optional splash screen shown on initial load
  - **`pages/*/layout.html`**: Layout templates that wrap page content
- **`images/`**: Image assets (auto-discovered for helper matching)
- **`themes/`**: Visual themes, each containing:
  - **`background.js`**: Animated canvas background implementation
  - **`theme.css`**: Theme-specific styles
- **`ajaxcms.html`**: Standalone SVG logo animation demo

### Key Implementation Details

**Page Discovery:**
- System fetches JSON directory listings via `/api/list-recursive` endpoint
- `load_pages()` builds arrays from JSON responses
- `load_images()` loads image paths from JSON
- Menu items are files in `pages/menus/` (sorted, with numeric prefixes for ordering)
- Layouts are discovered as `layout.html` files in directory hierarchy

**Dependencies:**
- All third-party libraries are managed via npm and served from `node_modules/`
- Run `npm install` to install all dependencies
- Libraries are referenced in `index.html` via `node_modules/` paths
- Custom code remains in `js/` directory (ajaxcms.js, canvasstuff.js, jquery-mobile-swipe.js)

**Server Architecture:**
- Node.js server (`server.js`) provides three JSON API endpoints:
  - `/api/sites` - Lists all available sites
  - `/api/list?dir=<path>` - Non-recursive directory listing
  - `/api/list-recursive?dir=<path>` - Recursive directory listing
- Supports multi-site hosting with dual routing:
  - Path-based: `http://localhost:3000/sitename/`
  - Domain-based: `http://sitename:3000` (requires hosts file/DNS)
- Sites are subdirectories in `./sites/` (configurable via `SITES_DIR` env var)
- Root URL (`http://localhost:3000`) displays a visual index of all sites
- **Resource Fallback System**:
  - `js/`, `themes/`, `images/`, and `node_modules/` folders are shared across all sites by default
  - Server checks site directory first, then falls back to main directory
  - Sites can override shared files by creating local copies
  - Priority: `sites/mysite/js/ajaxcms.js` → `js/ajaxcms.js`
  - Priority: `sites/mysite/node_modules/` → `node_modules/`
- Static file serving with directory traversal protection

**Page Transitions:**
- Configured via `load_transition` variable in `js/ajaxcms.js:3` (default: "slide")
- Two content divs (`#a` and `#b`) swap with jQuery UI slide/fade effects
- Direction based on menu position (left/right) or fade for non-sequential pages
- Swipe gestures and arrow keys navigate between menu pages

**Theme System:**
- Each site has a fixed theme set via `default_background` variable in `index.html`
- Each theme has `background.js` (canvas animation) and `theme.css` (styles)
- Animated backgrounds use `<canvas id="background">` with requestAnimationFrame
- Theme is loaded on page initialization and cannot be changed dynamically

**Blog Functionality:**
- Blog posts named with date prefix: `YYYY-MM-DD-Post_Title.html` or `.md`
- `{{blog}}` helper generates list of blog entries with excerpts
- `{{bloglist}}` helper generates simple list of blog links
- Supports pagination with start/stop parameters

**URL Routing:**
- Single-page app with `?page=path/to/page.html` parameter
- Browser history managed via `window.history.pushState()`
- Back button supported with `popstate` event listener

## Coding Patterns

**Helper Pattern Matching:**
- `pageMatch(searchterm)` finds best matching page by shortest filename
- `imageMatch(searchterm)` finds first partial-match image
- Both use regex partial matching for flexible lookups

**Async Directory Loading:**
- Recursive directory parsing with counters (`pages_count`, `images_count`)
- Callbacks fire when counters reach zero (all async loads complete)

**Script Security:**
- `removeScripts(text)` strips `<script>` tags from inserted content
- Insert helper supports `allow_scripts` parameter (default: true)

## Common Development Tasks

When adding new pages:
- Place in `pages/menus/` to appear in navigation
- Use numeric prefix (e.g., `01-Home.html`) to control menu order
- Create `layout.html` in directory to define template for all pages in that directory

When creating new themes:
- Create directory in `themes/` with `background.js` and `theme.css`
- Follow existing theme structure (see `themes/starter/` or `themes/gears/`)
- Canvas animation should use global variables for configuration
- Test theme with `?theme=yourtheme&page=blank.html`

When debugging page load issues:
- Check browser console for `ajaxcms.js` debug output (shows page loading)
- Verify directory structure matches expected patterns
- Ensure file naming follows conventions (no spaces, proper extensions)
- Test helper syntax with five spaces (prevents processing for documentation)
