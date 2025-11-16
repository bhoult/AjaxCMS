# Wildcard Images Example

This page demonstrates the wildcard feature for image and carousel helpers. Wildcards (`*`) allow you to match multiple images with a single helper.

## Basic Wildcard Syntax

Use `*` in your image path to match multiple files:

- `vacation/*` - All images in the vacation folder
- `photos/2024-*` - All images starting with "2024-" in photos folder
- `*colorado*` - All images with "colorado" in the name

---

## Image Helper: Creates Galleries

When you use a wildcard with the `{{i}}` helper, it automatically creates a **responsive grid gallery**.

### Example 1: Basic Image Gallery (Default)

**Code:**
```
{{i | backgrounds/back-*}}
```

**Result:**

{{i | backgrounds/back-*}}

This creates a gallery with all images in the `backgrounds/` folder that start with "back-". Default: **3 images per row**.

---

### Example 2: Gallery with Custom Per-Row Count

Control how many images appear per row by adding a number:

**Code:**
```
{{i | backgrounds/back-* | 2}}
```

**Result:**

{{i | backgrounds/back-* | 2}}

This displays **2 images per row** for a larger view.

---

### Example 3: Gallery with 4 Images Per Row

**Code:**
```
{{i | backgrounds/back-* | 4}}
```

**Result:**

{{i | backgrounds/back-* | 4}}

This displays **4 images per row** for a more compact gallery.

---

### Example 4: Gallery with Alt Text

You can provide alt text that applies to all matched images:

**Code:**
```
{{i | backgrounds/back-* | Background Examples}}
```

**Result:**

{{i | backgrounds/back-* | Background Examples}}

All images will have "Background Examples" as their alt text (default 3 per row).

---

### Example 5: Gallery with Alt Text AND Per-Row

Combine alt text with a custom per-row count:

**Code:**
```
{{i | backgrounds/back-* | Background Examples | 5}}
```

**Result:**

{{i | backgrounds/back-* | Background Examples | 5}}

All images have custom alt text and display **5 per row**.

---

## Carousel Helper: Creates Slideshows

The carousel helper creates animated slideshows and also supports wildcards for automatically including multiple images.

### Example 6: Carousel with Wildcard

**Code:**
```
{{carousel:3000 | backgrounds/back-* | style=>max-width:50%;margin:auto}}
```

**Result:**

{{carousel:3000 | backgrounds/back-* | style=>max-width:50%;margin:auto}}

This creates a carousel with a 3-second interval between slides at 50% width.

---

### Example 7: Carousel with Wildcard and Caption

Add captions that apply to all matched images:

**Code:**
```
{{carousel:4000 | backgrounds/back-*:Background Image:<h5>Theme Backgrounds</h5><p>Sample backgrounds from AjaxCMS themes</p> | style=>max-width:50%;margin:auto}}
```

**Result:**

{{carousel:4000 | backgrounds/back-*:Background Image:<h5>Theme Backgrounds</h5><p>Sample backgrounds from AjaxCMS themes</p> | style=>max-width:50%;margin:auto}}

---

### Example 8: Mixed Wildcards and Specific Images

Combine wildcard patterns with specific images:

**Code:**
```
{{carousel:5000 | backgrounds/back-* | glacier_lake.jpg::Glacier Lake | fire.jpg::Mountain Fire | style=>max-width:50%;margin:auto}}
```

**Result:**

{{carousel:5000 | backgrounds/back-* | glacier_lake.jpg::Glacier Lake | fire.jpg::Mountain Fire | style=>max-width:50%;margin:auto}}

This creates a carousel with:
- All background images from the wildcard
- Plus two specific images with custom captions

---

### Example 9: Carousel with Custom Interval

Create a fast-cycling carousel with 3-second intervals:

**Code:**
```
{{carousel:3000 | silverton | pagosa | colorado | style=>max-width:50%;margin:auto}}
```

**Result:**

{{carousel:3000 | silverton | pagosa | colorado | style=>max-width:50%;margin:auto}}

This creates a carousel of Colorado landscape images that advances every 3 seconds.

---

# Summary: Gallery vs Carousel

## Image Helper (`{{i}}`) with Wildcards
- Creates **static grid galleries**
- Images displayed simultaneously in rows
- Responsive Bootstrap grid layout
- Control images per row (default: 3)
- Best for: Photo galleries, product showcases, portfolios

## Carousel Helper (`{{carousel}}`) with Wildcards
- Creates **animated slideshows**
- Images cycle automatically
- Full-width display with navigation controls
- Control auto-advance interval
- Best for: Hero images, featured content, before/after

---

## How Wildcards Work

1. **Pattern Matching**: The `*` character matches any sequence of characters
2. **Image Helper**: Creates responsive grid galleries
3. **Carousel Helper**: Creates animated slideshows
4. **Default Interval**: Carousels auto-advance every 5 seconds (configurable with `:interval`)
5. **Alt Text**: Filenames are used as alt text if not specified
6. **No Matches**: If no images match, an error message is displayed

## Use Cases

**Photo Galleries**: `{{i | vacation/summer-2024-* | 4}}`

**Product Grid**: `{{i | products/featured-* | 3}}`

**Hero Slideshow**: `{{carousel:3000 | homepage/hero-*}}`

**Before/After Carousel**: `{{carousel:8000 | renovation/before-* | renovation/after-*}}`

**Event Grid**: `{{i | events/conference-* | 5}}`

---

## Tips

- **Organize images in folders** for easier wildcard matching
- **Use prefixes** like `featured-`, `2024-`, etc. for targeted matching
- **Choose gallery vs carousel** based on whether you want static grid or slideshow
- **Adjust per_row** in galleries to match your content (fewer = larger, more = compact)
- **Combine patterns** in carousels to create dynamic slideshows from multiple sources

See the {{a | 02-Helpers.md | Helpers documentation}} for complete syntax reference.
