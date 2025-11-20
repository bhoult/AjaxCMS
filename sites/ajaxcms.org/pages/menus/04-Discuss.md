# Discussion Helper

The `{{discussion}}` helper adds a hierarchical discussion/comment system to any page. Comments are stored in JSON files alongside the page content, with IP tracking and XSS protection built-in.

## Features

- **Threaded Discussions**: Reply to any comment to create nested conversation threads
- **Anonymous or Named**: Users can optionally provide a name, or post as "Anonymous"
- **IP Tracking**: All comments record the poster's IP address (backend only, not displayed)
- **Security**: All user input is automatically sanitized to prevent XSS attacks
- **Persistent Storage**: Comments are stored in JSON files named after the page (e.g., `page.html.json`)
- **Real-time**: No page reload needed - comments appear immediately after posting

## Usage

Simply add the helper to any page:

     {{discussion}}

The helper will automatically:
1. Generate a form for posting new comments
2. Load and display existing comments in a threaded format
3. Allow users to reply to any comment

## Data Storage

Discussion data is stored in a JSONL (JSON Lines) file with the same name as the page:
- Page: `pages/example.html` → Data: `pages/example.discussion.jsonl`
- Page: `pages/blog/post.md` → Data: `pages/blog/post.discussion.jsonl`

### JSONL Format

The discussion file uses **JSON Lines** format - one JSON object per line. This allows for efficient appending and streaming:

\`\`\`jsonl
{"id":"abc123","parentId":null,"timestamp":"2025-11-20T17:00:00.000Z","ip":"127.0.0.1","author":"John Doe","content":"This is a comment"}
{"id":"def456","parentId":"abc123","timestamp":"2025-11-20T17:05:00.000Z","ip":"192.168.1.1","author":"Jane Smith","content":"This is a reply"}
{"id":"ghi789","parentId":null,"timestamp":"2025-11-20T17:10:00.000Z","ip":"127.0.0.1","author":"Anonymous","content":"Another top-level comment"}
\`\`\`

Each line is a complete JSON object representing one comment. The `parentId` field creates the thread hierarchy (null for top-level comments).

## Security

All user input is automatically sanitized:
- HTML tags are escaped (e.g., `<script>` becomes `&lt;script&gt;`)
- Content is limited to 5,000 characters
- Author names are limited to 50 characters
- IP addresses are recorded but not displayed to users

**Rate Limiting:**
- Maximum 5 comments per IP address per minute
- Prevents spam and DoS attacks
- Returns HTTP 429 when limit exceeded
- Automatic cleanup of old rate limit entries

**File Size Limits:**
- Discussion files are limited to 10MB
- Returns HTTP 413 when limit exceeded
- Prevents disk exhaustion from excessive comments

## Try it Out

Post a comment below to see the discussion system in action!

{{discussion}}
