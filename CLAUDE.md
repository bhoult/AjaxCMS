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

## Content Management

**AjaxCMS has no backend editor or admin interface.** Content is managed by directly editing files on the filesystem. This design philosophy keeps the system simple, version-controllable, and flexible.

### Recommended Editing Workflows

**1. Git-Based Workflow (Recommended)**
- Make changes locally in your preferred editor/IDE
- Commit changes to GitHub (or other git hosting)
- On server: `git pull` to update the live site
- Or: Push from local → GitHub → Pull on server

**2. GitHub Web UI**
- Edit files directly in GitHub's web interface
- On server: `git pull` to deploy changes
- Good for quick edits and non-technical contributors

**3. Direct Server Access**
- SSH into the server and edit files with vim/nano/etc.
- Or use SFTP/FTP client (FileZilla, Cyberduck, etc.) to upload files
- Changes are live immediately (no pull needed)

**4. Remote IDE Editing**
- Use VSCode Remote SSH, JetBrains Gateway, or similar
- Edit remote files as if they were local
- Changes appear on site immediately after save

**5. Automated Deployment**
- Set up git post-receive hooks for automatic deployment
- Use CI/CD (GitHub Actions, GitLab CI, etc.)
- Automatically deploy when pushing to specific branch
- Example: Push to `main` → GitHub Action → Server pulls changes

**6. rsync Deployment**
- Use `rsync` over SSH to sync local changes to server
- Example: `rsync -avz --delete ./sites/mysite/ user@server:/path/to/sites/mysite/`
- Good for bulk updates and maintaining exact mirrors

### Content Structure

All content is stored as static files:
- **Pages**: HTML or Markdown files in `pages/` directories
- **Images**: Any image format in `images/` directories
- **Styles**: CSS files in site-specific directories
- **Configuration**: Variables in `index.html` and site-specific files

No database required. Version control friendly. Easy to backup and migrate.

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
     - Discussions: `{{discussion}}` - Adds threaded comment system with JSON storage
     - Forms: `{{form | formname | Field1 | Field2:textarea}}` - Creates secure contact forms

4. **Helper Protection System** (`js/ajaxcms.js:832-843, 988-990`):
   - Prevents markdown and async operations from corrupting helper syntax
   - Uses `§§§PROTECTED_HELPER_N§§§` placeholder system (section signs avoid markdown conflicts)
   - Global array `globalProtectedHelpers` stores original helper strings
   - Protection flow:
     1. Before markdown: Replace `{{...}}` with `§§§PROTECTED_HELPER_N§§§`
     2. Markdown processes safely (doesn't convert `=>` to `&gt;`)
     3. After all async inserts: Restore helpers from `globalProtectedHelpers` array
     4. Finally: `process_page()` processes restored helpers
   - Temporary placeholders `@@@@@`/`#####` used during insert operations
   - All replacements use global regex (`/g` flag) to handle multiple helpers per page
   - Documentation helpers (5+ spaces) are also protected but remain as visible text

### Directory Structure

- **`index.html`**: Main entry point, configuration, and HTML structure
- **`js/ajaxcms.js`**: Core CMS logic (~2,300 lines) - page loading, helper processing, menu generation
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

**Featured Themes:**

*Growth Theme* (`themes/growth/`):
- Procedurally generated trees with natural branching patterns
- Intelligent content collision detection - trees grow around text boundaries
- Dynamic twig sprouting and autumn leaf fall with physics
- Pixel-based collision detection using invisible canvas (O(1) performance)
- Sky blue gradient fading to white over configurable distance
- Mobile optimizations:
  - Reduced tree count (1/3 on mobile devices)
  - Disabled content collision detection for better performance
  - Enhanced text glow (12 shadow layers) for readability
  - Smart resize handler prevents regrowth on URL bar appearance/disappearance
- MutationObserver detects page changes (higher threshold on mobile: 20 nodes vs 5 desktop)
- Smooth fade-out and regrowth on page transitions

*Fireworks Theme* (`themes/fireworks/`):
- Particle-based fireworks with realistic physics (gravity, air resistance)
- Multiple explosion patterns: burst, fountain, ring, spiral, heart
- Vibrant color palettes randomly selected per firework
- Launch effects with bright trails
- Additive blending (`globalCompositeOperation = 'lighter'`) for glow effects
- Performance optimizations:
  - Particle pooling to reduce garbage collection
  - Spatial culling removes off-screen particles
  - Age-based culling for expired particles
  - Configurable max particle limit

*GL City Theme* (`themes/gl_city/`):
- WebGL-accelerated 3D cityscape using Three.js
- Procedurally generated buildings (40-400 units tall) with shadow mapping
- Moon lighting with dynamic shadows across city
- Animated starfield background
- Camera modes: normal (ground-level) and overhead (bird's-eye with mouse controls)
- Content-aware initialization:
  - Delays theme start (800-1000ms) to allow AjaxCMS content to load
  - Polls for content divs every 100ms before setting scroll spacer height
  - Prevents race condition where content area doesn't fully load on first page view
- Press 'O' to toggle overhead view, mouse drag to pan, wheel to zoom

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

**ParseHelper Function** (`js/ajaxcms.js:332-362`):
- Parses helper syntax into parts (parameters) and attributes (HTML attrs)
- Supports two distinct `=>` syntaxes:
  1. **Attribute syntax**: `class=>carousel-float-right` → becomes `class="carousel-float-right"`
  2. **Inline attributes**: `growth-theme => style="width: 50%"` → param + attrs
- Detection: If value after `=>` contains `=`, it's inline attributes; otherwise it's attribute syntax
- Handles both raw `=>` and HTML entity `=&gt;` (from markdown conversion)
- Example processing:
  ```javascript
  // {{carousel | images/* | class=>carousel-float-right}}
  // Results in: parts=['carousel', 'images/*'], attributes=['class="carousel-float-right"']

  // {{i | growth-theme => style="width: 50%"}}
  // Results in: parts=['i', 'growth-theme'], attributes=['style="width: 50%"']
  ```

**Async Directory Loading:**
- Recursive directory parsing with counters (`pages_count`, `images_count`)
- Callbacks fire when counters reach zero (all async loads complete)

**Script Security:**
- `removeScripts(text)` strips `<script>` tags from inserted content
- Insert helper supports `allow_scripts` parameter (default: true)

**Mobile Optimization Patterns:**

*Responsive Theme Configuration:*
- Detect mobile with `window.innerWidth <= 768` or `isMobile` helper functions
- Reduce resource counts (trees, particles, buildings) by 1/2 to 1/3 on mobile
- Disable expensive features (collision detection, complex physics)
- Increase performance thresholds (e.g., mutation observer node counts)

*Text Readability on Animated Backgrounds:*
- Apply text-shadow with multiple layers for glow effect
- Example: `0 0 3px white, 0 0 5px white, ...` (up to 12 layers on mobile)
- Use transparent or semi-transparent content backgrounds to show theme gradient
- Increase font weight on mobile for better visibility

*Resize Handler Best Practices:*
- Mobile URL bar appearance/disappearance triggers resize events
- Prevent expensive reinitialization (e.g., tree regrowth) on these false positives
- Solutions:
  - Track previous dimensions, only reinit if significant change
  - Use resize debouncing (e.g., `setTimeout` with 200-300ms delay)
  - Check if width changed (true resize) vs height only (URL bar)

*Page Transition Detection:*
- Use MutationObserver to detect DOM content changes
- Higher thresholds on mobile to prevent false positives from scroll events
- Desktop: 5+ nodes changed = new page
- Mobile: 20+ nodes changed = new page
- Ignore attribute-only changes (e.g., class modifications)

## Common Development Tasks

When adding new pages:
- Place in `pages/menus/` to appear in navigation
- Use numeric prefix (e.g., `01-Home.html`) to control menu order
- Create `layout.html` in directory to define template for all pages in that directory

When creating new themes:
- Create directory in `themes/` with `background.js` and `theme.css`
- Follow existing theme structure (see `themes/starter/`, `themes/gears/`, or featured themes above)
- Canvas animation should use global variables for configuration
- Test theme with `?theme=yourtheme&page=blank.html`
- **Best practices for complex themes:**
  - Delay theme initialization (500-1000ms) to allow AjaxCMS content to load first
  - For themes needing content dimensions, poll for content instead of fixed delays
  - Implement proper cleanup in `stopBackground()` to prevent memory leaks
  - Use MutationObserver for page change detection (see Growth theme)
  - Add mobile-specific optimizations (reduced counts, disabled features)
  - Consider WebGL/Three.js for 3D effects (see GL City theme)
  - Use requestAnimationFrame for smooth 60 FPS animations
  - Apply performance optimizations (pooling, culling, batching)

When debugging page load issues:
- Check browser console for `ajaxcms.js` debug output (shows page loading)
- Verify directory structure matches expected patterns
- Ensure file naming follows conventions (no spaces, proper extensions)
- Test helper syntax with five spaces (prevents processing for documentation)

When debugging helper issues:
- Check if helpers are showing as literal text (protection system issue)
- Verify `globalProtectedHelpers` array is declared and initialized
- Ensure all placeholder replacements use global regex (`/g` flag)
- Check browser console: `$('.content').html()` shows actual rendered HTML
- Look for HTML entities (`&gt;` instead of `>`) indicating markdown corruption
- Verify helper syntax: pipes (`|`) for params, `=>` for attributes
- For blog posts: helpers must be protected before markdown processing
- Image helpers: ensure image file names match helper parameters exactly

## Discussion System

The `{{discussion}}` helper adds a hierarchical comment system to any page. Discussions are stored in JSON files alongside the page content.

### Usage

Add `{{discussion}}` to any page to enable comments:

```html
<h1>My Page</h1>
<p>Page content...</p>

{{discussion}}
```

### Architecture

**Backend (server.js)**:
- **GET `/api/discussion?page=path`**: Fetches discussion data for a page (lines 445-495)
- **POST `/api/discussion`**: Appends new comment/reply with sanitization (lines 497-581)
- JSONL files created automatically (e.g., `pages/example.html` → `pages/example.discussion.jsonl`)
- Uses line-delimited JSON (JSONL) format for efficient append-only writes
- IP address tracking (stored but not displayed to users)
- Comprehensive XSS protection via `escapeHtml()` function (escapes: `& < > " '`)
- Rate limiting: 5 comments per IP per minute (configurable, lines 20-22)
- File size limit: 10MB per discussion file (configurable, line 20)

**Frontend (js/ajaxcms.js)**:
- Discussion helper (lines 702-717): Generates HTML container with form
- `loadDiscussions()`: Fetches and renders comment tree
- `submitDiscussion()`: Posts top-level comments
- `submitReply()`: Posts threaded replies
- Automatic initialization after page transitions

**Data Storage** (JSONL format):
Each comment is stored as a separate JSON object on its own line (line-delimited JSON):
```jsonl
{"id":"1763659140561-xfk0qrz3d","parentId":null,"timestamp":"2025-11-20T17:19:00.561Z","ip":"::1","author":"brandon","content":"test"}
{"id":"1763659170620-g1r87bhdd","parentId":"1763659140561-xfk0qrz3d","timestamp":"2025-11-20T17:19:30.620Z","ip":"::1","author":"reply","content":"reply to test"}
```

Benefits of JSONL:
- **Fast appends**: New comments added via `fs.appendFile()` without reading entire file
- **Atomic writes**: Safer for concurrent comment posting
- **Scalability**: No need to parse thousands of comments to add one more
- **Simple format**: Each line is a self-contained JSON object

### Security

- **XSS Prevention**: Comprehensive HTML entity escaping via `escapeHtml()` function
  - Escapes: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#x27;`
  - Applied to both comment content and author names
- **Rate Limiting**: Maximum 5 comments per IP address per minute
  - Prevents spam and comment flooding
  - Returns HTTP 429 with retry-after when exceeded
- **File Size Limits**: 10MB maximum per discussion file
  - Prevents disk exhaustion attacks
  - Returns HTTP 413 when exceeded
- **Content Length Limits**:
  - Comment content: 5,000 characters maximum
  - Author names: 50 characters maximum
- **Path Traversal Protection**: Server validates all file paths stay within site directory
- **Append-only**: No editing or deletion (prevents data tampering)
- **IP Tracking**: IP addresses recorded but not displayed to users

### Styling

Discussion CSS is in `index.html` (lines 249-453):
- Professional comment cards with blue accent
- Threaded indentation (20px per level)
- Hover effects and transitions
- Mobile responsive layout
- Bootstrap-compatible color scheme

### Troubleshooting

Common issues:
- **Comments disappear on reload**: Check that `loading_page` variable is set correctly (should match page path without `./` prefix)
- **JSON file not created**: Verify page path is correct and server has write permissions
- **Comments not loading**: Check browser console for API errors, verify page path formatting

## Form System

The `{{form}}` helper creates secure forms that save submissions to CSV files.

### Usage

```
{{form | filename | Field1 | Field2 | Field3:textarea}}
```

**Field Types:**
- Regular fields: `Name`, `Email`, `Phone` - creates single-line text inputs
- Textarea fields: `Message:textarea` - creates multi-line text area (4 rows)

**Examples:**
```html
<!-- Simple newsletter signup -->
{{form | newsletter_7293 | Name | Email}}

<!-- Contact form with message -->
{{form | contact_4182 | Name | Email | Subject | Message:textarea}}
```

**Best Practice:** Add random numbers to form names (e.g., `newsletter_7293`) to make endpoints harder to guess.

### Architecture

**Backend (server.js)**:
- **GET `/api/csrf-token?form=name`**: Returns CSRF token and encrypted form identifier
- **POST `/api/form-submit`**: Validates security tokens, appends data to CSV file
- **GET `/files/*.csv`**: Displays CSV as HTML table with download link
- CSV files stored in site's `files/` directory (auto-created if needed)
- Form name encryption using AES-256-GCM (form names never sent in plain text)

**Frontend (js/ajaxcms.js)**:
- Form helper: Generates HTML form with security fields (CSRF token, honeypot, encrypted form ID)
- `initializeForms()`: Fetches CSRF tokens for all forms after page load
- `submitForm()`: Posts form data via AJAX with security validation

**Data Storage** (CSV format):
Each submission is appended as a new row with automatic headers:
```csv
Timestamp,IP,Name,Email,Message
"Jan 2, 2026, 11:20 AM","192.168.1.1","John Doe","john@example.com","Hello there"
```

### Security

The form system includes comprehensive protection against spam and abuse:

- **CSRF Tokens**: One-time tokens prevent cross-site request forgery
  - Tokens fetched from server when page loads
  - Each token can only be used once
  - Tokens expire after 1 hour
- **Rate Limiting**: Maximum 10 form submissions per IP per minute
  - Prevents spam flooding
  - Returns HTTP 429 when exceeded
- **Origin Check**: Validates requests come from the same domain
  - Blocks cross-origin form submissions
- **Honeypot Field**: Hidden field that catches automated bots
  - Invisible to users, but bots fill it out
  - Submissions with filled honeypot silently rejected
- **Encrypted Form Names**: Form identifiers encrypted with AES-256-GCM
  - Form names never appear in network requests
  - Prevents discovery of form endpoints
  - Set `FORM_ENCRYPTION_KEY` env var for persistence across restarts
- **XSS Prevention**: All values HTML-escaped when displayed
- **CSV Injection Protection**: Values starting with `=`, `+`, `-`, `@`, tab, or CR are prefixed with single quote
- **Filename Sanitization**: Only alphanumeric characters, dashes, and underscores allowed
- **Path Traversal Protection**: Server validates file paths stay within site directory
- **Directory Listing Blocked**: The `files/` directory is excluded from `/api/list` endpoints

### Viewing Submissions

Visit the CSV file URL directly to see submissions as a formatted HTML table:
```
http://yoursite.com/files/newsletter_7293.csv
```

Features:
- Styled HTML table with all submissions
- Submission count
- "Download CSV" button for raw file
- Add `?download=1` to URL for direct CSV download

### Troubleshooting

Common issues:
- **Form shows success but no data saved**: Check server logs for "honeypot field filled" - browser autofill may be filling the hidden honeypot field
- **"Invalid or expired form token" error**: Page was open too long (tokens expire after 1 hour) - refresh the page
- **Form not submitting**: Check browser console for errors; ensure `initializeForms()` ran after page load
- **CSV file not created**: Verify server has write permissions to site directory
- **Rate limit errors**: Wait 1 minute before trying again
