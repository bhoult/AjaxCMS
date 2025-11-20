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

Discussion data is stored in a JSON file with the same name as the page:
- Page: `pages/example.html` → Data: `pages/example.json`
- Page: `pages/blog/post.md` → Data: `pages/blog/post.json`

### JSON Structure

The JSON file uses a flat array with parent references for efficient storage and flexible querying:

\`\`\`json
{
  "discussions": [
    {
      "id": "unique-id",
      "parentId": null,
      "timestamp": "2025-11-20T17:00:00.000Z",
      "ip": "127.0.0.1",
      "author": "John Doe",
      "content": "This is a comment"
    }
  ],
  "metadata": {
    "created": "2025-11-20T17:00:00.000Z",
    "lastModified": "2025-11-20T17:00:00.000Z"
  }
}
\`\`\`

## Security

All user input is automatically sanitized:
- HTML tags are escaped (e.g., `<script>` becomes `&lt;script&gt;`)
- Content is limited to 5,000 characters
- Author names are limited to 50 characters
- IP addresses are recorded but not displayed to users

## Try it Out

Post a comment below to see the discussion system in action!

{{discussion}}
