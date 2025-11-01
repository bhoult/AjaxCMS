## Improved Documentation: Code Block Protection

One of the challenges in documenting a system with custom syntax is preventing that syntax from being processed when you're trying to show examples. AjaxCMS uses double-brace helpers like `{{a | page}}` and `{{carousel | img1 | img2}}`, but how do you display these in documentation without them being executed?

### The Old Approach: Five Spaces
Previously, AjaxCMS used a workaround: any helper with **five or more consecutive spaces** would be skipped during processing. This worked, but it was clunky and non-intuitive:

```
{{a     |     page}}  ← Five spaces, won't be processed
```

This approach had several problems:
- Not obvious to users unfamiliar with the system
- Easy to forget or misconfigure
- Violated the principle of least surprise
- Didn't work well in Markdown tables

### The New Approach: Automatic Code Block Protection

**As of October 2025**, AjaxCMS now automatically protects helpers inside code blocks and inline code spans. This is the standard Markdown approach that users expect:

**Inline code:**
```markdown
Use `{{a | home}}` to create a link to the home page.
```

**Code blocks:**
```
(triple backticks)
{{carousel:5000 | img1 | img2 | img3}}
(triple backticks)
```

### How It Works

The protection happens in multiple stages during page processing (`js/ajaxcms.js:794-867`):

1. **Before helper processing** (lines 802-817):
   - Triple-backtick code blocks are identified and protected
   - Inline code spans (single backticks) are protected
   - Each protected block is replaced with a placeholder like `___PROTECTED_CODE_BLOCK_0___`

2. **Helper processing occurs** (lines 826-828):
   - `{{blog}}`, `{{bloglist}}`, and other meta-helpers are expanded
   - Protected blocks are not matched by the helper regex

3. **Markdown processing** (line 839):
   - Protected code is temporarily restored
   - Markdown parser converts backticks to `<code>` and `<pre>` tags

4. **After Markdown** (lines 841-854):
   - `<code>` and `<pre>` tags are protected again
   - Remaining helpers (`{{a}}`, `{{i}}`, etc.) are processed

5. **Final restoration** (lines 861-867):
   - All protected blocks are restored
   - Content is ready for display

### Backward Compatibility

The **five-space workaround still works** for backward compatibility (line 819-824), but it's no longer necessary. Existing documentation using this approach will continue to function, but new documentation should use standard Markdown code syntax.

### Example: Documentation Tables

This improvement was crucial for fixing helper syntax in documentation tables. Previously, pipes (`|`) inside code spans in Markdown tables were being interpreted as column delimiters:

**Before:** (truncated)
```markdown
| Helper | Example |
|--------|---------|
| `{{a}}` | `{{a    ← Truncated!
```

**After:** (with escaped pipes)
```markdown
| Helper | Example |
|--------|---------|
| `{{a}}` | `{{a \| page \| text}}` |
```

The backslash escaping tells Markdown parsers that pipes are literal characters, not table delimiters.

### Benefits

- **Intuitive**: Standard Markdown syntax
- **Reliable**: Works in all contexts (tables, lists, code blocks)
- **Maintainable**: Easier for contributors to understand
- **Flexible**: Mix code examples with working helpers on the same page

### Migration Guide

If you have existing documentation using five-space protection:

**Old:**
```
{{a     |     page     |     text}}
```

**New:**
```markdown
`{{a | page | text}}`
```

No migration is required—both work—but the new approach is recommended for consistency.

---

This enhancement makes AjaxCMS documentation clearer and more maintainable, following established Markdown conventions that users already understand.
