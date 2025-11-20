## Modern Dependencies: Bootstrap 5 and npm Package Management

AjaxCMS has been modernized with Bootstrap 5 and proper npm dependency management. This update brings the platform up to current web standards while maintaining the simplicity and performance that make AjaxCMS unique.

### What Changed

**Bootstrap 4 → Bootstrap 5**
- Dropped jQuery dependency (Bootstrap 5 uses vanilla JavaScript)
- Improved utility classes and responsive design
- Better accessibility features
- Smaller bundle size
- Modern CSS features (CSS custom properties, improved flexbox/grid)

**CDN → npm Package Management**
- All third-party libraries now managed via `package.json`
- Predictable, version-locked dependencies
- Local serving via `node_modules/`
- Easier updates and security patches
- Offline development capability

### Current Dependencies

```json
{
  "dependencies": {
    "bootstrap": "^5.3.8",
    "jquery": "^3.7.1",
    "jquery-ui-dist": "^1.13.3",
    "marked": "^16.4.1",
    "victor": "latest",
    "segment-js": "latest"
  }
}
```

**Why we kept jQuery:** While Bootstrap 5 doesn't require jQuery, AjaxCMS core (`ajaxcms.js`) still uses jQuery extensively for AJAX requests, DOM manipulation, and animations. Rewriting to vanilla JavaScript is a future consideration, but for now jQuery remains for backward compatibility and development speed.

### Installation & Setup

**For new sites:**
```bash
git clone https://github.com/bhoult/AjaxCMS.git
cd AjaxCMS
npm install  # Installs all dependencies
npm start    # Starts the server
```

**For existing sites:**
```bash
cd your-ajaxcms-site
npm install  # Update to latest dependencies
```

### How Dependencies Are Loaded

In `index.html`, libraries are referenced from `node_modules/`:

```html
<!-- Bootstrap CSS -->
<link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">

<!-- jQuery (3.7.1) -->
<script src="node_modules/jquery/dist/jquery.min.js"></script>

<!-- jQuery UI (1.13.3) -->
<script src="node_modules/jquery-ui-dist/jquery-ui.min.js"></script>

<!-- Bootstrap JS -->
<script src="node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>

<!-- Marked (Markdown parser) -->
<script src="node_modules/marked/lib/marked.umd.js"></script>
```

The Node.js server (`server.js`) serves `node_modules/` files automatically, with proper MIME types and caching headers.

### Multi-Site Resource Sharing

One powerful feature of the updated architecture is **resource fallback**. Sites in the `sites/` directory automatically share dependencies:

```
AjaxCMS/
├── node_modules/        ← Shared across all sites
├── js/                  ← Shared ajaxcms.js
├── themes/              ← Shared themes
├── sites/
│   ├── site1/
│   │   ├── pages/       ← Site-specific content
│   │   ├── images/      ← Site-specific images
│   │   └── index.html   ← Site-specific config
│   └── site2/
│       └── ...
```

**Fallback Priority:**
1. `sites/mysite/node_modules/` (site-specific override)
2. `node_modules/` (shared default)

This means:
- One `npm install` serves all sites
- Individual sites can override specific libraries if needed
- Reduces disk space and update overhead
- Faster deployment for multi-site hosts

### Bootstrap 5 Migration Notes

If you have custom themes or layouts from earlier AjaxCMS versions:

**Removed jQuery dependencies:**
```javascript
// Old (Bootstrap 4)
$('#myModal').modal('show');

// New (Bootstrap 5)
var myModal = new bootstrap.Modal(document.getElementById('myModal'));
myModal.show();
```

**Carousel initialization:**
```javascript
// Bootstrap 5 vanilla JS
var carousel = new bootstrap.Carousel(carouselElement, {
    interval: speed,
    ride: 'carousel'
});
```

**Updated utility classes:**
- `ml-*` / `mr-*` → `ms-*` / `me-*` (start/end instead of left/right)
- `float-left` → `float-start`
- `float-right` → `float-end`

See the [Bootstrap 5 migration guide](https://getbootstrap.com/docs/5.3/migration/) for comprehensive changes.

### Security & Updates

**Dependency auditing:**
```bash
npm audit        # Check for vulnerabilities
npm audit fix    # Auto-fix issues
npm update       # Update to latest compatible versions
```

**Version pinning:**
The `package.json` uses caret (`^`) versioning, which allows patch and minor updates but locks major versions:
- `^5.3.8` allows 5.3.9, 5.4.0 but NOT 6.0.0
- Balances security updates with stability

Run `npm outdated` periodically to check for updates.

### Performance Benefits

**Before (CDN approach):**
- Multiple external requests
- No offline capability
- Unpredictable availability
- Potential privacy concerns (CDN tracking)

**After (npm approach):**
- All assets served locally
- Works offline after first load
- Faster on local development
- No external tracking
- Cacheable by browser
- Version consistency guaranteed

### Future Improvements

**Potential optimizations:**
- **Tree shaking**: Import only used Bootstrap components
- **Bundling**: Combine JS files for fewer requests
- **Minification**: Further reduce file sizes
- **ES modules**: Use modern import/export syntax
- **Vanilla JS**: Gradually reduce jQuery dependency

These are future considerations—current setup balances simplicity with modern standards.

### Developer Experience

**Benefits for developers:**
- Familiar npm workflow
- Easy dependency updates
- Consistent development environment
- Offline capability
- Version control via `package-lock.json`

**Benefits for users:**
- Faster page loads (local serving)
- Better privacy (no CDN tracking)
- Offline functionality
- Consistent experience

---

This modernization keeps AjaxCMS current with web development best practices while maintaining the lightweight, database-free architecture that makes it unique. The platform is now easier to maintain, more secure, and better positioned for future enhancements.
