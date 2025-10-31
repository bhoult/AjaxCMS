# Layouts

Layouts are reusable HTML templates that wrap your page content, enabling consistent multi-column designs across multiple pages. They're especially useful for creating sidebars, headers, footers, or any standardized page structure.

## How Layouts Work

When a directory contains a `layout.html` file, **all pages in that directory and its subdirectories** automatically use that layout. The `{{content}}` tag in the layout specifies where the page content gets inserted.

### Layout Hierarchy

Layouts follow a directory hierarchy:

```
pages/
  layout.html              ← Applies to ALL pages
  menus/
    01-Home.md             ← Uses pages/layout.html
    02-About.md            ← Uses pages/layout.html
    docs/
      layout.html          ← Overrides parent layout
      guide.md             ← Uses pages/docs/layout.html
      tutorial.md          ← Uses pages/docs/layout.html
```

**Rules:**
- Layouts are inherited from parent directories
- Child directories can override by including their own `layout.html`
- The closest `layout.html` in the directory hierarchy wins

## Creating a Layout

Layouts **must be HTML files** (Markdown is not supported). However, you can use {{a | 02-Helpers.md | AjaxCMS helpers}} inside layouts.

### Basic Layout Structure

Here's a minimal layout using Bootstrap 5:

```html
<div class="container-fluid">
  <div class="row">
    <div class="col-md-8">
      {{content}}
    </div>
  </div>
</div>
```

The `{{content}}` tag is replaced with your page content at render time.

## Layout Examples

### Two-Column Layout with Sidebar

This layout places content in the left column (8/12 width) and a sidebar in the right (4/12 width):

```html
<div class="container-fluid">
  <div class="row">
    <div class="col-md-8">
      {{content}}
    </div>
    <div class="col-md-4">
      <aside class="sidebar">
        <h3>Quick Links</h3>
        <ul>
          <li>{{a | home | Home}}</li>
          <li>{{a | about | About}}</li>
          <li>{{a | contact | Contact}}</li>
        </ul>
      </aside>
    </div>
  </div>
</div>
```

### Layout with Dynamic Sidebar Content

Use the `{{insert}}` helper to load sidebar content from a separate page:

```html
<div class="container-fluid">
  <div class="row">
    <div class="col-md-8">
      {{content}}
    </div>
    <div class="col-md-4">
      {{insert | sidebar_content}}
    </div>
  </div>
</div>
```

Then create `pages/sidebar_content.md` or `pages/sidebar_content.html` with your sidebar content. This approach lets you edit the sidebar independently from the layout.

### Three-Column Layout

```html
<div class="container-fluid">
  <div class="row">
    <div class="col-md-2">
      <nav class="sidebar-nav">
        {{filelist | ./pages/docs}}
      </nav>
    </div>
    <div class="col-md-8">
      {{content}}
    </div>
    <div class="col-md-2">
      {{insert | ads}}
    </div>
  </div>
</div>
```

### Layout with Header and Footer

```html
<header class="page-header">
  {{insert | header}}
</header>

<div class="container">
  <div class="row">
    <div class="col-12">
      {{content}}
    </div>
  </div>
</div>

<footer class="page-footer">
  {{insert | footer}}
</footer>
```

### Responsive Layout (Mobile-First)

Bootstrap's grid system is responsive by default. Use breakpoint classes:

```html
<div class="container-fluid">
  <div class="row">
    <!-- Full width on mobile, 2/3 width on tablet+ -->
    <div class="col-12 col-md-8">
      {{content}}
    </div>
    <!-- Hidden on mobile, 1/3 width on tablet+ -->
    <div class="col-12 col-md-4">
      {{insert | sidebar}}
    </div>
  </div>
</div>
```

**Bootstrap breakpoints:**
- `col-` - Extra small devices (< 576px)
- `col-sm-` - Small devices (≥ 576px)
- `col-md-` - Medium devices (≥ 768px)
- `col-lg-` - Large devices (≥ 992px)
- `col-xl-` - Extra large devices (≥ 1200px)
- `col-xxl-` - Extra extra large (≥ 1400px)

## Using Helpers in Layouts

All AjaxCMS helpers work inside layouts:

### Image Helper
```html
<aside class="sidebar">
  {{i | logo | Company Logo | class=>img-fluid}}
  <p>Welcome to our site!</p>
</aside>
```

### Carousel in Sidebar
```html
<aside class="sidebar">
  {{carousel:3000 | ad1.jpg | ad2.jpg | ad3.jpg}}
</aside>
```

### Blog List in Sidebar
```html
<aside class="sidebar">
  <h3>Recent Posts</h3>
  {{bloglist | ./pages/blog | 0 | 5}}
</aside>
```

## Advanced Techniques

### Conditional Layouts by Directory

Create different layouts for different sections:

```
pages/
  menus/
    layout.html          ← Blog layout (two-column)
    blog/
      2024-01-15-Post1.md
      2024-01-16-Post2.md
    docs/
      layout.html        ← Docs layout (three-column)
      guide.md
      tutorial.md
```

### Nested Inserts

Layouts can insert pages that also have layouts:

**pages/docs/layout.html:**
```html
<div class="container">
  <div class="row">
    <div class="col-md-3">
      {{insert | docs/navigation}}
    </div>
    <div class="col-md-9">
      {{content}}
    </div>
  </div>
</div>
```

**pages/docs/navigation.html** (has its own layout):
```html
<nav>
  <ul>
    <li>{{a | guide}}</li>
    <li>{{a | tutorial}}</li>
  </ul>
</nav>
```

### Layout Debugging

If a layout isn't working as expected:

1. **Check the file name:** Must be exactly `layout.html` (case-sensitive)
2. **Verify `{{content}}`:** Layout must include the `{{content}}` tag
3. **Check directory structure:** Layout applies to all files in and below its directory
4. **View browser console:** Check for JavaScript errors
5. **Test without layout:** Temporarily remove `layout.html` to isolate issues

## Bootstrap Grid Reference

Layouts typically use Bootstrap's grid system. Quick reference:

### Container
```html
<div class="container">       <!-- Fixed width -->
<div class="container-fluid"> <!-- Full width -->
```

### Row and Columns
```html
<div class="row">
  <div class="col-md-6">Half width</div>
  <div class="col-md-6">Half width</div>
</div>
```

### Common Column Patterns
```html
<!-- Equal width columns -->
<div class="col">1 of 3</div>
<div class="col">2 of 3</div>
<div class="col">3 of 3</div>

<!-- Specific widths (12-column grid) -->
<div class="col-4">4/12 width</div>
<div class="col-8">8/12 width</div>

<!-- Responsive -->
<div class="col-12 col-md-6">Full width mobile, half width desktop</div>
```

Full documentation: [Bootstrap 5 Grid System](https://getbootstrap.com/docs/5.3/layout/grid/)

## Best Practices

1. **Keep layouts simple** - Complex logic belongs in pages, not layouts
2. **Use `{{insert}}`** - Load dynamic sidebar content from separate files for easier maintenance
3. **Test responsiveness** - View layouts on different screen sizes
4. **Minimize nesting** - Deep nesting makes layouts harder to debug
5. **Document your layouts** - Add HTML comments explaining the structure

## Example: Complete Blog Layout

Here's a production-ready blog layout with sidebar:

```html
<div class="container-fluid">
  <div class="row">
    <!-- Main content -->
    <article class="col-12 col-lg-8">
      {{content}}
    </article>

    <!-- Sidebar -->
    <aside class="col-12 col-lg-4">
      <!-- Author bio -->
      <div class="card mb-3">
        <div class="card-body">
          {{insert | blog/author_bio}}
        </div>
      </div>

      <!-- Recent posts -->
      <div class="card mb-3">
        <div class="card-header">
          <h5>Recent Posts</h5>
        </div>
        <div class="card-body">
          {{bloglist | ./pages/blog | 0 | 10}}
        </div>
      </div>

      <!-- Newsletter signup -->
      <div class="card">
        <div class="card-body">
          {{insert | blog/newsletter}}
        </div>
      </div>
    </aside>
  </div>
</div>
```

## Next Steps

- {{a | 02-Helpers.md | Learn about available helpers}} for use in layouts
- {{a | 01-Getting_Started.md | Return to Getting Started}} guide
- {{a | ../02-Examples | View layout examples}} in the Examples section
