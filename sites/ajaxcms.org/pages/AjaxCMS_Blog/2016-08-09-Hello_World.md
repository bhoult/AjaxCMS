Welcome to AjaxCMS.

AjaxCMS is a JavaScript-based front-end CMS with a minimal static file backend. The core of AjaxCMS is released as an open source project under the GPL-3.0 license. For more information, visit our {{a | Home | Homepage}} or check out the [GitHub repository](https://github.com/bhoult/AjaxCMS).

### Introduction: A Different Approach to Content Management
AjaxCMS takes a fundamentally different approach from traditional CMS platforms like WordPress, Joomla, or Drupal. Traditional systems store content in databases, process it with server-side code (PHP, Python, etc.), and send rendered HTML to the browser. The browser's role is mostly passive—just displaying the HTML with minimal JavaScript interactivity.

AjaxCMS flips this model: content is stored as static HTML or Markdown files on the server, with **no database required**. A lightweight Node.js server provides JSON directory listings, but all layout processing, helper expansion, and page rendering happens in the user's browser using JavaScript. This architecture delivers several key benefits:

- **Speed**: No database queries or server-side rendering delays
- **Security**: Minimal server-side code reduces attack surface
- **Simplicity**: No database to configure or maintain
- **Rich Interactions**: Full JavaScript capabilities for animations and transitions
- **Easy Deployment**: Static files can be hosted almost anywhere

For detailed information, read the {{a | Home | Homepage}} and browse the Documentation section.

### Why Another CMS?
Traditional CMS platforms like WordPress, Joomla, and Drupal have been around for decades and have massive communities. They're established, well-tested, and mostly secure (unless you add untested plugins). However, they've evolved into extremely complex systems with hundreds of interrelated server-side files, database dependencies, and security vulnerabilities.

Many attempts have been made to build "better" CMS platforms using different languages or frameworks, but few gain traction because the established systems have enormous plugin ecosystems that are nearly impossible to replicate. However, the web platform itself has fundamentally changed.

**Modern browsers are now true application platforms.** HTML5, CSS3, ES6+ JavaScript, and standardized APIs have transformed what's possible in the browser. The old paradigm of "server does everything, browser just displays" is outdated. AjaxCMS embraces this shift by:

- **Minimizing server requirements**: A simple Node.js server provides directory listings via JSON API
- **Maximizing browser capabilities**: All rendering, routing, and content processing happens client-side
- **Using modern web standards**: ES6 modules, async/await, Bootstrap 5, marked.js for Markdown
- **Leveraging external services**: Comments ([Disqus](https://disqus.com/)), forms ([Google Forms](https://forms.google.com)), analytics (Google Analytics)

AJAX (Asynchronous JavaScript and XML) enables loading page fragments without full refreshes, creating smooth single-page application experiences. Combined with modern JavaScript libraries and npm package management, AjaxCMS delivers a powerful yet simple content platform.

### Is It Production Ready?
**Yes.** AjaxCMS has matured significantly since its initial release. The architecture's inherent security advantage—minimal server-side code—means most bugs are client-side rendering issues that can't compromise your server or other users.

**Current Status (2025):**
- Tested in all modern browsers (Chrome, Firefox, Safari, Edge)
- Works on mobile and desktop devices
- Production-ready with active development
- Comprehensive documentation and examples
- npm package management for dependencies
- Multi-site hosting support with resource fallback

**Upgrading:** Unlike traditional CMS platforms, you don't need to upgrade for security patches. Updates to `js/ajaxcms.js` are only necessary when you want new features or bug fixes. The system is designed for stability—existing sites continue working even without updates.

**Browser Support:** AjaxCMS targets modern browsers (released in the last 3-5 years). Very old browsers may experience degraded functionality, but the core content remains accessible. We continue to improve accessibility and may add fallback modes for assistive technologies in future releases.

### Get Started
**Quick Start:**
1. Clone the repository: `git clone https://github.com/bhoult/AjaxCMS.git`
2. Install dependencies: `npm install`
3. Create a site: `mkdir -p sites/mysite && cp -r index.html pages/ images/ sites/mysite/`
4. Start the server: `npm start`
5. Visit `http://localhost:3000`

**Documentation:** Check out the {{a | 01-Getting_Started.md | Getting Started Guide}} for detailed setup instructions.

**Contributing:** Found a bug or want to contribute? Visit our [GitHub Issues](https://github.com/bhoult/AjaxCMS/issues) page.

### Conclusion
AjaxCMS represents a modern approach to content management—embracing browser capabilities, minimizing server complexity, and delivering fast, secure websites. We continue to add features and improvements, and we welcome community feedback and contributions.

The source code is available on [GitHub](https://github.com/bhoult/AjaxCMS) under the GPL-3.0 license.

<div id="disqus_thread"></div>
<script>
var disqus_config = function () {
    this.page.url = window.location.href;  
    this.page.identifier = ajaxcms_page_id; 
};

(function() { // DON'T EDIT BELOW THIS LINE
    var d = document, s = d.createElement('script');
    s.src = '//ajaxcms-org.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
})();
</script>


