# AjaxCMS Node.js Multi-Site Server

This is a Node.js web server for hosting AjaxCMS sites. It provides JSON directory listings via API endpoints and supports multiple sites based on domain names or paths.

## Features

- **Sites Index**: Root URL displays a visual index of all available sites
- **JSON Directory Listings**: Serves directory contents as JSON via API endpoints
- **Multi-Site Support**: Hosts multiple AjaxCMS instances
- **Dual Routing**: Access sites via path (`/sitename/`) or domain (`sitename.com`)
- **Shared Resources**: Sites automatically share `js/` and `themes/` from main directory
- **Override Support**: Sites can override shared resources with local copies
- **Static File Serving**: Serves all static assets (HTML, CSS, JS, images, etc.)
- **Security**: Prevents directory traversal attacks

## Directory Structure

The server expects sites to be organized in a `sites/` directory:

```
AjaxCMS/
├── server.js             # Node.js server
├── sites-index.html      # Sites directory page
├── sites/                # Sites directory
│   ├── mysite.com/      # First site
│   │   ├── index.html
│   │   ├── js/
│   │   ├── pages/
│   │   ├── images/
│   │   └── themes/
│   ├── blog.local/      # Second site
│   │   └── ...
│   └── another-site/    # Third site
│       └── ...
└── ...
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create your sites directory:**
   ```bash
   # Create sites directory
   mkdir -p ./sites/mysite.com

   # Copy AjaxCMS template to your site (js/ and themes/ are shared automatically)
   cp -r index.html pages/ images/ ./sites/mysite.com/

   # Add a description (optional)
   echo "My awesome website" > ./sites/mysite.com/description.md
   ```

   **Note:** The `js/` and `themes/` folders don't need to be copied - sites use the shared versions automatically.

3. **Configure environment variables (optional):**
   ```bash
   export PORT=3000                # Server port (default: 3000)
   export SITES_DIR=./sites        # Sites directory (default: ./sites)
   ```

## Usage

### Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Accessing Sites

**Sites Index** (shows all available sites):
```
http://localhost:3000
```

**Path-based access** (works without configuration):
```
http://localhost:3000/mysite.com/
http://localhost:3000/blog.local/
```

**Domain-based access** (requires hosts file or DNS):
```
http://mysite.com:3000
http://blog.local:3000
```

### Multi-Site Setup

For local development with multiple domains:

1. **Edit your hosts file**:
   - Linux/Mac: `/etc/hosts`
   - Windows: `C:\Windows\System32\drivers\etc\hosts`

   ```
   127.0.0.1  mysite.com
   127.0.0.1  blog.local
   ```

2. **Access sites by domain**:
   ```
   http://mysite.com:3000
   http://blog.local:3000
   ```

For production:

1. **Configure DNS**: Point your domains to the server's IP address

2. **Use a reverse proxy** (nginx) or set `PORT=80`:
   ```
   http://mysite.com
   http://blog.local
   ```

## API Endpoints

The server provides three JSON API endpoints:

### `/api/sites`

Returns a list of all available sites.

**Example:**
```
GET /api/sites
```

**Response:**
```json
{
  "sites": [
    {"name": "mysite.com", "url": "http://mysite.com:3000"},
    {"name": "blog.local", "url": "http://blog.local:3000"}
  ]
}
```

### `/api/list?dir=<path>`

Returns files and directories in the specified path (non-recursive).

**Example:**
```
GET /api/list?dir=pages
```

**Response:**
```json
{
  "path": "pages",
  "directories": [
    {"name": "menus", "path": "pages/menus", "type": "directory"}
  ],
  "files": [
    {"name": "splash.html", "path": "pages/splash.html", "type": "file"}
  ]
}
```

### `/api/list-recursive?dir=<path>`

Returns all files in the specified directory tree (recursive).

**Example:**
```
GET /api/list-recursive?dir=pages
```

**Response:**
```json
{
  "path": "pages",
  "files": [
    {"name": "splash.html", "path": "splash.html", "type": "file"},
    {"name": "01-Home.html", "path": "menus/01-Home.html", "type": "file"},
    {"name": "02-About.html", "path": "menus/02-About.html", "type": "file"}
  ]
}
```

## Shared Resources

AjaxCMS uses a **resource fallback system** that allows sites to share common files while still allowing site-specific customization.

### How It Works

When a site requests a file from `js/` or `themes/`, the server:

1. **First** checks the site's local directory: `sites/mysite.com/js/ajaxcms.js`
2. **If not found**, falls back to the main directory: `js/ajaxcms.js`

This means:
- **All sites share** the same `js/` and `themes/` folders by default
- **No duplication** - you don't need to copy these folders to each site
- **Easy updates** - update one file and all sites get the change
- **Override anytime** - create a local copy to customize for a specific site

### Directory Priority

```
sites/mysite.com/js/ajaxcms.js    ← Checked first (site-specific)
js/ajaxcms.js                      ← Fallback (shared)
```

### Example: Custom Theme for One Site

```bash
# Create a custom theme for mysite.com only
mkdir -p sites/mysite.com/themes/custom
cp -r themes/default/* sites/mysite.com/themes/custom/
# Edit sites/mysite.com/themes/custom/background.js

# Other sites continue using shared themes
```

### Example: Custom JavaScript

```bash
# Override ajaxcms.js for one site
mkdir -p sites/mysite.com/js
cp js/ajaxcms.js sites/mysite.com/js/
# Make site-specific modifications
```

### What's Shared

- **`js/`** - All JavaScript files (ajaxcms.js, libraries, etc.)
- **`themes/`** - All theme directories and files

### What's NOT Shared

- **`index.html`** - Each site has its own (for custom config)
- **`pages/`** - Site-specific content
- **`images/`** - Site-specific images
- **`description.md`** - Site description for the index

## Code Changes

The following changes were made to AjaxCMS to work with the Node.js server:

### `js/ajaxcms.js`

- **`load_pages()`**: Modified to fetch from `/api/list-recursive` endpoint
- **`load_images()`**: Modified to fetch from `/api/list-recursive` endpoint
- **`load_themes()`**: Modified to fetch from `/api/list` endpoint

These functions now parse JSON responses from the server API.

## Production Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name ajaxcms
pm2 save
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/ajaxcms.service`:

```ini
[Unit]
Description=AjaxCMS Multi-Site Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/AjaxCMS
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SITES_DIR=./sites
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable ajaxcms
sudo systemctl start ajaxcms
```

### Reverse Proxy (nginx)

If using nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name site1.com www.site1.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name site2.com www.site2.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Security Considerations

- The server includes directory traversal protection
- All requests are validated to stay within the site directory
- Consider adding rate limiting for production use
- Use HTTPS in production (via reverse proxy or Node HTTPS module)
- Implement authentication if serving non-public content

## Troubleshooting

**Site not loading:**
- Check that the site directory exists in `sites/`
- Verify the directory name matches the hostname
- Check server logs for errors

**404 errors:**
- Ensure all required files exist in the site directory
- Check file permissions
- Verify `index.html` exists in the site directory

**API errors:**
- Verify the path parameter in API requests
- Check server console for detailed error messages
- Ensure site has proper directory structure

**Shared resources not loading:**
- Verify `js/` and `themes/` folders exist in main directory
- Check server console for file path errors
- Ensure proper file permissions

## License

Same as AjaxCMS project.
