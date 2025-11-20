## Built-In Discussion System: Add Comments to Any Page

AjaxCMS now includes a native discussion system that brings threaded comments to your static site - no third-party services required. Add interactive discussions while maintaining the simplicity and security of a file-based CMS.

{{i | discussion-screenshot => style="width: 100%; margin: 20px 0;"}}

### Simple Integration

Adding discussions to any page is effortless - just include the `{{discussion}}` helper:

```html
<h1>My Blog Post</h1>
<p>Your content here...</p>

{{discussion}}
```

That's it! The discussion section appears automatically with a comment form and threaded reply system.

### Key Features

**Threaded Conversations:**
- Top-level comments with nested replies
- Hierarchical indentation shows conversation structure
- Reply buttons on each comment for easy responses
- Clean, professional card-based design

**Zero Configuration:**
- No API keys or third-party accounts needed
- Automatic JSON file creation per page
- Works immediately after adding the helper
- No database setup required

**Security Built-In:**
- All HTML tags automatically escaped (XSS protection)
- Content limited to 5,000 characters per comment
- Author names limited to 50 characters
- IP addresses recorded (not displayed publicly)
- Append-only design prevents tampering

**Automatic Timestamps:**
- Human-readable relative times ("2 hours ago", "3 days ago")
- Full ISO timestamps stored in JSON
- Metadata tracks creation and last modification dates

### How It Works

**Backend (server.js):**
- `GET /api/discussion?page=path` - Fetches discussion JSON
- `POST /api/discussion` - Adds new comments with sanitization
- JSON files stored alongside page content (e.g., `pages/example.html` → `pages/example.json`)

**Frontend (js/ajaxcms.js):**
- Discussion helper generates HTML container and form
- `loadDiscussions()` fetches and renders comment tree
- `submitDiscussion()` handles top-level comments
- `submitReply()` handles threaded replies
- Automatic initialization after page transitions

**Data Storage:**
```json
{
  "discussions": [
    {
      "id": "unique-id",
      "parentId": null,
      "timestamp": "2025-11-20T17:00:00.000Z",
      "ip": "127.0.0.1",
      "author": "User Name",
      "content": "Comment text"
    }
  ],
  "metadata": {
    "created": "2025-11-20T17:00:00.000Z",
    "lastModified": "2025-11-20T17:00:00.000Z"
  }
}
```

### Styling and Appearance

{{i | discussion-form => style="width: 50%; float: right; margin: 0 0 20px 20px;"}}

**Professional Design:**
- Bootstrap-compatible color scheme
- Blue accent color matching AjaxCMS theme
- Subtle shadows and hover effects
- Smooth CSS transitions
- Mobile responsive layout

**Comment Cards:**
- Clean white background with rounded corners
- Nested indentation (20px per level)
- Author name and timestamp in header
- Reply buttons with hover states
- Professional spacing and typography

**Forms:**
- Inline reply forms appear when clicking "Reply"
- Matching visual style throughout
- Clear submit and cancel actions
- Validation feedback

All styling is included in `index.html` (lines 249-453) and can be customized per-site.

### Use Cases

Perfect for:
- **Blogs** - Reader comments and discussions
- **Documentation** - User questions and clarifications
- **Portfolios** - Client feedback and testimonials
- **Knowledge Base** - Community answers and tips
- **Project Pages** - Stakeholder communication

### Advantages Over Third-Party Solutions

**Privacy & Control:**
- No tracking by external services (Disqus, Facebook Comments)
- Comments stored on your server, your data
- No user data sent to third parties
- Full control over moderation and retention

**Performance:**
- No external JavaScript loading
- No iframes or third-party assets
- Fast, native implementation
- Works offline in development

**Simplicity:**
- No accounts or API keys to manage
- No monthly fees or usage limits
- No complicated integrations
- Version-controllable JSON files

**Reliability:**
- Won't break if third-party service shuts down
- No dependency on external uptime
- Works without internet connection in dev mode

### Technical Implementation

The discussion system demonstrates AjaxCMS's ability to add dynamic features while maintaining its static-file philosophy:

- **Server-side**: Minimal JSON read/write endpoints with sanitization
- **Client-side**: JavaScript handles rendering and interactivity
- **Storage**: Simple JSON files alongside content
- **Security**: HTML escaping prevents injection attacks

No database. No complex backend. Just JSON files and clean JavaScript.

### Limitations

Current limitations (by design):
- **No editing** - Comments are append-only for security
- **No deletion** - Prevents abuse and maintains conversation context
- **No moderation UI** - Edit JSON files directly or delete them to moderate
- **No notifications** - Email notifications could be added via custom extensions

These limitations keep the system simple, secure, and maintainable. For advanced features, consider integrating third-party services or extending the backend.

### Future Possibilities

The discussion system provides a foundation for:
- Email notifications via server-side hooks
- Markdown support in comments
- Comment voting/reactions
- User authentication integration
- Spam filtering
- Comment search

The simple JSON format makes these enhancements straightforward to implement.

---

The discussion system brings community engagement to AjaxCMS while preserving its core values: simplicity, security, and file-based storage. No external dependencies, no complicated setup, no compromise on principles.

Try it on your pages today with `{{discussion}}`!
