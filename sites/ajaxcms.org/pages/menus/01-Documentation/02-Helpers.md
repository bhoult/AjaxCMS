# Helpers

AjaxCMS uses **helpers** to simplify inserting dynamic content and complex code. Helpers use a double-brace syntax: `{{helper | param1 | param2 | ...}}`. Parameters are separated by the pipe `|` character and processed in sequential order. Trailing parameters can be omitted if not needed.

Before a page is displayed, helpers are replaced with the appropriate HTML content.

## Helper Syntax Rules

### Disabling Helpers

If a helper contains **five or more sequential spaces**, it will be skipped. This allows you to display helper code examples without processing them (as used throughout this documentation page).

**Example:**
```
{{a     | home}}  ← Five spaces - NOT processed (displays as-is)
{{a | home}}      ← Normal - WILL be processed
```

### HTML Attributes

All helpers (except `{{insert}}`) support **attribute parameters** using the `=>` syntax. These inject HTML attributes into the generated element.

**Format:** `attr=>value` becomes `attr="value"` in the output HTML

**Example:**
```
{{a | documentation | class=>btn btn-primary | id=>nav-link}}
```

**Becomes:**
```html
<a class="btn btn-primary" id="nav-link"
   onclick="loadPage('./pages/menus/01-Documentation/02-Helpers.md')">
   documentation
</a>
```

This works for any HTML attribute: `class`, `id`, `style`, `data-*`, `aria-*`, etc.

### Markdown Support

Pages with `.md` extensions are processed through the **marked** Markdown parser (GitHub-flavored). See the [GitHub Markdown Guide](https://guides.github.com/features/mastering-markdown/) for syntax reference.

## Available Helpers

### Anchor (Link)

**Syntax:** `{{a | page | link_text | alt_text}}`

Creates an internal link that loads a page via AJAX without refreshing the browser. Uses partial matching to find pages, so you only need to specify enough of the filename to uniquely identify it.

**Parameters:**
- `page` (required) - Page filename or partial match (e.g., "test" matches "./pages/menus/test.html")
- `link_text` (optional) - Display text for the link (defaults to page name)
- `alt_text` (optional) - Alt/title attribute text

**Examples:**
```
{{a | 01-Getting_Started.md}}
{{a | 01-Getting_Started.md | Get Started}}
{{a | 01-Getting_Started.md | Get Started | Getting Started Guide}}
```

**With attributes:**
```
{{a | home | Home Page | class=>nav-link active}}
```

**Why use this instead of `<a>`?**
Regular HTML anchor tags (`<a href="...">`) cause full page reloads. The `{{a}}` helper creates links that load content via AJAX with smooth page transitions.

---

### Image

**Syntax:** `{{i | image | alt_text}}`

Inserts an image from the `images/` directory. Uses partial matching, so you only need enough of the filename to uniquely identify it.

**Parameters:**
- `image` (required) - Image filename or partial match (e.g., "logo" matches "./images/branding/logo.png")
- `alt_text` (optional) - Alt attribute for accessibility

**Examples:**
```
{{i | logo}}
{{i | logo | Company Logo}}
{{i | vacation/colorado.jpg | Mountain View}}
```

**With CSS classes:**
```
{{i | logo | Company Logo | class=>img-fluid rounded}}
```

**Built-in CSS classes** (defined in `index.html`):
- **Size:** `icon` (70px), `thumb` (20px), `small` (300px), `medium` (600px), `large` (900px)
- **Position:** `left`, `right`

**Example with built-in classes:**
```
{{i | photo | class=>medium left}}
```

---

### Carousel (Slideshow)

**Syntax:** `{{carousel:interval | image1:alt1:caption1 | image2:alt2:caption2 | ...}}`

Creates a Bootstrap 5 carousel slideshow with multiple images. Supports unlimited slides.

**Parameters:**
- `interval` (optional) - Milliseconds between slides (e.g., `5000` = 5 seconds). If omitted, uses Bootstrap default (5000ms)
- Each slide: `image:alt:caption` separated by `|`
  - `image` (required) - Image filename or partial match
  - `alt` (optional) - Alt text for accessibility
  - `caption` (optional) - Text overlay (can include HTML like `<h3>Title</h3>`)

**Examples:**

**Basic carousel (3 slides, 5-second interval):**
```
{{carousel:5000 | slide1.jpg | slide2.jpg | slide3.jpg}}
```

**With alt text:**
```
{{carousel:3000 | beach.jpg:Sunset at the beach | mountain.jpg:Mountain peak}}
```

**With captions (HTML allowed):**
```
{{carousel:4000 |
  product1.jpg:Product Image:<h3>New Arrival</h3><p>Check out our latest product</p> |
  product2.jpg:Product Image:<h3>Best Seller</h3><p>Our most popular item</p>
}}
```

**With CSS classes:**
```
{{carousel:5000 | img1 | img2 | img3 | class=>carousel-fade}}
```

---

### Insert

**Syntax:** `{{insert | page_name | allow_scripts}}`

Embeds the content of another page at the helper location. The inserted page includes any `layout.html` that applies to it. Inserts can be nested (inserted pages can contain other inserts).

**Parameters:**
- `page_name` (required) - Page filename or partial match
- `allow_scripts` (optional) - Boolean, defaults to `true`. Set to `false` to strip `<script>` tags

**Examples:**
```
{{insert | sidebar}}
{{insert | header}}
{{insert | footer | false}}
```

**Use cases:**
- Embed common content (headers, footers, sidebars) into layouts
- Insert formatted content into pages without layouts
- Create reusable content blocks

**Note:** The `{{insert}}` helper does NOT support attribute parameters. To add attributes, wrap it manually:

```html
<div id="sidebar" class="col-md-4">
  {{insert | sidebar_content}}
</div>
```

---

### File List

**Syntax:** `{{filelist | directory_path}}`

Generates a hierarchical menu from a directory and all its subdirectories. Uses standard HTML list format (`<ul>`, `<li>`).

**Parameters:**
- `directory_path` (required) - Path relative to site root (e.g., `./pages/docs`)

**Example:**
```
{{filelist | ./pages/tutorials}}
```

**Use cases:**
- Create vertical navigation menus
- Display file/folder structures
- Generate dynamic content indexes

---

### Blog

**Syntax:** `{{blog | directory | start | stop}}`

Displays blog entries as expandable summaries. Entries load full content via AJAX when clicked. Blog files must follow a specific naming convention.

**Parameters:**
- `directory` (required) - Path to blog posts directory
- `start` (optional) - First post index to display (for pagination)
- `stop` (optional) - Last post index to display (for pagination)

**Blog file naming convention:**
```
YYYY-MM-DD-Title.md
YYYY-MM-DD-Title.html
YYYY-MM-DD-n-Title.md  (n = optional number for multiple posts per day)
```

**Examples:**
```
2024-01-15-Hello_World.md
2024-01-15-1-Morning_Post.md
2024-01-15-2-Evening_Post.md
```

**Usage:**
```
{{blog | ./pages/blog}}
{{blog | ./pages/blog | 0 | 5}}    ← Show first 5 posts
{{blog | ./pages/blog | 5 | 10}}   ← Show posts 5-10 (pagination)
```

**How it works:**
- Displays post title, date, and excerpt
- Clicking a post loads full content in place
- Automatically sorts by date (newest first)

---

### Blog List

**Syntax:** `{{bloglist | directory | start | stop}}`

Displays a simple list of blog post titles with links. Similar to `{{blog}}` but shows only titles without excerpts or expansion.

**Parameters:**
- `directory` (required) - Path to blog posts directory
- `start` (optional) - First post index to display
- `stop` (optional) - Last post index to display

**Blog file naming:** Same as `{{blog}}` - must use `YYYY-MM-DD-Title` format

**Examples:**
```
{{bloglist | ./pages/blog}}
{{bloglist | ./pages/blog | 0 | 10}}  ← Show first 10 post titles
```

**Use case:** Create a compact blog archive or sidebar widget

---

## Helper Reference Quick Guide

| Helper | Purpose | Example |
|--------|---------|---------|
| `{{a}}` | Internal link | `{{a     | page     | text}}` |
| `{{i}}` | Image | `{{i     | image     | alt}}` |
| `{{carousel}}` | Slideshow | `{{carousel:5000     | img1     | img2}}` |
| `{{insert}}` | Embed page | `{{insert     | page}}` |
| `{{filelist}}` | Directory tree | `{{filelist     | ./pages/docs}}` |
| `{{blog}}` | Blog with excerpts | `{{blog     | ./pages/blog     | 0     | 5}}` |
| `{{bloglist}}` | Blog titles only | `{{bloglist     | ./pages/blog}}` |

## Next Steps

- {{a | 03-Layouts.md | Learn about layouts}} to create multi-column page templates
- {{a | 01-Getting_Started.md | Return to Getting Started}} guide
- View example helper usage in the {{a | ../02-Examples | Examples section}}
