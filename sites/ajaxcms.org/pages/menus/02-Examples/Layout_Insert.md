# Layout + Insert Example

This page demonstrates how the `{{     insert}}` helper works with layouts. The content below is inserted from another file that has its own layout applied.

## How it Works

The `{{     insert}}` helper below loads `Layout.md` from the `layout_sidebar_menu/` folder. That folder contains a `layout.html` file that creates a two-column layout:
- **Left column:** Page content (8/12 width)
- **Right column:** File list sidebar (4/12 width) using the `{{     filelist}}` helper

When the insert is processed, you'll see the page content with the sidebar layout applied.

---

## Inserted Content with Layout:

{{insert | layout.md }}

---

## Key Takeaways

1. **Inserts preserve layouts** - When you insert a page, any layout from that page's directory is applied
2. **Nested helpers work** - The inserted page's layout contains a `{{     filelist}}` helper that also gets processed
3. **Useful for reusable components** - Create formatted sections (sidebars, headers, footers) that can be inserted anywhere
4. **This page has no layout** - But the inserted content brings its own layout, creating a mixed-layout effect

See the {{a | 03-Layouts.md | Layouts documentation}} for more details on creating layouts.
