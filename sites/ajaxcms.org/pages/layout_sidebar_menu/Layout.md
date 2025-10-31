## Layout Example

{{i | glacier_lake | Hidden Lake at Glacier National Park | class=>medium right}}

This page demonstrates a **two-column responsive layout** using Bootstrap's grid system. The layout is defined in `layout.html` in this directory and automatically applies to all pages in this folder.

### Layout Structure

The layout divides the page into two columns:
- **Main content area** (left, 8/12 width) - You're reading this now
- **Sidebar** (right, 4/12 width) - Shows a file list using the `{{     filelist}}` helper

On mobile devices, these columns stack vertically for better readability.

### Why Use Layouts?

{{a | colorado.html | Layouts}} provide consistency across multiple pages without duplicating HTML. Common use cases include:

1. **Documentation sites** - Consistent navigation sidebar across all docs
2. **Blogs** - Standard sidebar with recent posts, categories, or tags
3. **Multi-page forms** - Shared header/footer with different content sections
4. **Portfolio sites** - Unified structure for project pages

### Dynamic Content in Layouts

{{i | pagosa | Pagosa Springs, Colorado | small left}}

The sidebar in this layout uses the `{{     filelist}}` helper to automatically generate a file tree. When you add or remove files from this directory, the sidebar updates automatically—no manual editing required.

This demonstrates how layouts can include dynamic helpers that process when the page loads. Other useful helpers in layouts include:

- `{{     bloglist}}` - Recent blog posts
- `{{     insert}}` - Reusable sidebar content
- `{{     carousel}}` - Image slideshows
- Custom navigation menus

### Creating Your Own Layout

To create a layout for your pages:

1. Create a `layout.html` file in your pages directory
2. Use `{{content}}` where you want the page content inserted
3. Add Bootstrap grid classes (`col-md-8`, `col-md-4`, etc.)
4. Include any helpers you want in the sidebar or header/footer

All pages in that directory (and subdirectories) will automatically use the layout unless they have their own `layout.html` that overrides it.

See the {{a | 01-Documentation/03-Layouts.md | Layouts documentation}} for complete details and examples.
