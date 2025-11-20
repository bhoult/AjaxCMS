## Growth: Organic Animation Theme with Intelligent Tree Growth

AjaxCMS introduces the **Growth** theme, featuring procedurally generated trees that grow around your content with intelligent collision avoidance, autumn leaf effects, and smooth page transitions.

{{i | growth-theme}}

**[View Live Demo →](http://ajaxcms.org/theme-demos/growth.com/?page=pages/menus/01-Welcome.md)**

### Visual Features

**Organic Tree Growth:**
- Procedurally generated trees with natural branching patterns
- Intelligent content detection and avoidance - trees grow around text
- Dynamic twig sprouting from main branches
- Realistic autumn leaf fall with physics-based piling
- Smooth fade-out and regrowth on page transitions

**Adaptive Design:**
- Sky blue gradient background fading to white
- Transparent content areas showing the gradient beneath
- White text glow for readability against animated background
- Mobile-optimized with reduced tree count and enhanced text contrast

### Performance Optimizations

**Smart Collision Detection:**
- O(1) pixel-based collision detection for leaves using canvas sampling
- 500x faster than traditional leaf-to-leaf comparison
- Invisible collision canvas tracks settled leaves for realistic piling

**Mobile Enhancements:**
- Reduced tree count (1/3 on mobile) for better performance
- Disabled content collision detection on mobile
- Smart resize handler prevents regrowth when URL bar appears/disappears
- Enhanced text glow with 12 shadow layers for better readability

### Page Transitions

**Intelligent Detection:**
- MutationObserver tracks DOM changes with node counting
- Higher threshold on mobile (20 nodes vs 5 desktop) prevents false positives
- Trees fade out and regrow smoothly when navigating between pages
- Scroll events don't trigger regrowth

### Configuration

The Growth theme offers extensive customization:
- Configurable tree count ranges (mobile: 1-6, desktop: 3-18)
- Adjustable gradient height (mobile: 400px, desktop: 800px)
- Customizable physics (gravity, wind strength, fall speed)
- Optional content collision detection

### Browser Compatibility

The Growth theme works across all modern browsers:
- Canvas API for tree and leaf rendering
- MutationObserver for content detection
- RequestAnimationFrame for smooth 60 FPS animation
- Graceful fallback for older browsers (static gradient)

### Use Cases

Perfect for:
- Nature-themed websites and portfolios
- Environmental or sustainability sites
- Organic and wellness brands
- Educational content about biology or ecology
- Any project wanting a calm, living background

---

The Growth theme demonstrates AjaxCMS's capability for complex, intelligent animations that adapt to content. Perfect for creating an organic, professional atmosphere.

Try it yourself by setting `default_background = "growth"` in your `index.html` configuration!
