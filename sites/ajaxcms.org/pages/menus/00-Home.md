## What is AjaxCMS?

{{carousel | screenshots/* | class=>carousel-float-right carousel-half-width}}

AjaxCMS is an open-source, static-file-based CMS that runs entirely in JavaScript on the browser. The server only provides static files and JSON directory listings—everything else happens client-side. You add content by uploading [HTML](https://www.w3schools.com/html/) or [Markdown](https://guides.github.com/features/mastering-markdown/) files to the `pages/` directory. Files in `pages/menus/` automatically appear in the navigation menu. When users navigate, content loads via AJAX without page refreshes.

### Key Advantages

1. **Fast Performance** - The main HTML, CSS, and JavaScript load once. Subsequent pages are inserted via AJAX, so only new content is processed.

2. **No Backend Required** - No database or server-side code needed. All content is static HTML/Markdown, reducing server costs and complexity.

3. **Seamless Animations** - Background animations and page transitions continue smoothly during navigation since the page never reloads.

4. **Enhanced Security** - No admin backend, server-side code, or database means fewer vulnerabilities. No CMS updates to manage or SQL injection risks.

5. **Simple & Transparent** - The entire CMS is ~2,300 lines of well-documented JavaScript in `js/ajaxcms.js`. Easy to understand and customize with basic HTML/CSS/JavaScript knowledge.

## How It Works

AjaxCMS uses a Node.js server that provides JSON directory listings via API endpoints. When the site loads, it:

1. Fetches recursive directory listings from `pages/` and `images/` via `/api/list-recursive`
2. Builds the navigation menu from files in `pages/menus/`
3. Loads the initial page or splash screen
4. Dynamically loads content when users navigate

**Naming Convention:** Files prefixed with numbers (e.g., `01-Home.md`) control menu order. The number and file extension are stripped from the display name.

**Layouts & Inserts:** Pages can use layout templates (`layout.html`) for consistent styling. The `{{     insert}}` helper embeds content from other files.

## Features

**Mobile-Friendly** - Built on [Bootstrap 5](https://getbootstrap.com/) with responsive design. Supports swipe gestures and arrow key navigation.

**Markdown Support** - Create pages as `.html` or `.md` files. Markdown is faster for simple content; HTML allows complex layouts.

**Helper Syntax** - Custom `{{ }}` tags simplify common tasks:
- Links: `{{a | page_name | link text}}`
- Images: `{{i | image_name | alt text}}`
- Carousels: `{{carousel | img1 | img2 | img3}}`
- See {{a | documentation}} for complete helper reference.

**Themes** - Animated canvas backgrounds with coordinated CSS color schemes. Each theme includes `background.js` and `theme.css`.

**Multi-Site Hosting** - The Node.js server supports hosting multiple sites from a single installation. Sites can be accessed via paths (`/sitename/`) or domain names.

## Modern Architecture

**Dependencies Managed via NPM** - All third-party libraries (jQuery, Bootstrap, marked, etc.) are managed through npm and served from `node_modules/`. Run `npm install` to set up all dependencies.

**Resource Fallback** - The server shares `js/`, `themes/`, `images/`, and `node_modules/` across all sites. Individual sites can override by providing their own copies.

**Well-Documented Code** - Comprehensive JSDoc comments throughout the codebase. See `CLAUDE.md` for development guidance.

## Limitations

**Content Display Only** - AjaxCMS is designed for viewing content, not user-generated changes. For interactive features (forms, forums, shopping carts), use third-party services:
- Forms: [Google Forms](https://www.google.com/forms/about/)
- Comments: [Disqus](https://disqus.com/)
- Maps: [Google Maps Embed API](https://developers.google.com/maps/documentation/embed)

**Server Requirement** - Requires a web server that can provide directory listings (Node.js server included, or Apache).

## Open Source

AjaxCMS is free and open source under the GPL-3.0 license.

**Source Code:** [github.com/bhoult/AjaxCMS](https://github.com/bhoult/AjaxCMS)
**Demo Site:** [ajaxcms.org](http://ajaxcms.org)
**Questions?** Email [bhoult@gmail.com](mailto:bhoult@gmail.com)

---

*Getting started? See the {{a | 01-Getting_Started.md | Getting Started guide}}.*
