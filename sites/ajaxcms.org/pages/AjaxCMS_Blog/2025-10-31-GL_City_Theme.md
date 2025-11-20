## GL City: 3D Cityscape Theme with Three.js

AjaxCMS features an impressive 3D cityscape theme powered by **Three.js**, bringing WebGL-rendered graphics to the platform. The `gl_city` theme showcases procedurally generated skyscrapers with realistic lighting, shadows, and a dynamic starfield.

{{i | gl-city-theme}}

**[View Live Demo →](http://ajaxcms.org/theme-demos/gl-city.com/?page=pages/menus/01-Welcome.md)**

### Visual Features

**3D Cityscape:**
- Procedurally generated buildings with varying heights and positions
- Realistic shadow mapping for depth and dimension
- Smooth scrolling parallax as buildings pan across the viewport
- Moon with ambient lighting casting shadows across the city
- Animated starfield background for atmospheric depth

**Camera System:**
- Normal view: Ground-level perspective with smooth camera movement
- Overhead view: Bird's-eye view with mouse controls
- Smooth transitions between view modes
- Pan and zoom controls in overhead mode

### Technical Implementation

**WebGL Acceleration:**
- GPU-accelerated 3D rendering with Three.js
- Hardware-based shadow mapping
- Efficient geometry with optimized polygons
- True 3D space with depth and perspective

**Building Generation:**
- Procedurally generated buildings (40-400 units tall)
- Random dimensions and window patterns
- Varied positioning creates natural cityscape
- Infinite scrolling with building recycling

### Performance Optimizations

**Efficient Rendering:**
- WebGL hardware acceleration for smooth 60 FPS
- Shadow map caching for static objects
- Frustum culling automatically handled by Three.js
- Proper cleanup on theme change prevents memory leaks

**Adaptive Quality:**
- Optimized shadow map size (2048x2048) for quality/performance balance
- Configurable pan speed for smoother motion
- Buildings positioned at varying depths for perspective
- 50+ buildings render smoothly on modern hardware

### User Interactions

**View Modes:**
- Press **'O'** to toggle overhead view
- **Mouse drag** to pan the overhead camera
- **Mouse wheel** to zoom in/out (200-2000 units range)
- Automatic return to normal view when exiting overhead mode

**Camera Movement:**
- Smooth camera tracking follows cityscape
- Adjustable pan speed for desired effect
- Ground-level perspective provides immersive experience

### Browser Compatibility

The gl_city theme requires:
- WebGL support (available in all modern browsers)
- Three.js library (loaded via CDN)
- Hardware acceleration enabled (recommended)

Browsers without WebGL fall back gracefully with a static gradient background.

### Comparison to Other Themes

Unlike canvas-based themes, gl_city uses **3D graphics hardware acceleration**:

| Feature | Canvas Themes | GL City Theme |
|---------|---------------|---------------|
| Rendering | 2D Canvas API | WebGL (Three.js) |
| Performance | CPU-based | GPU-accelerated |
| Depth | Simulated | True 3D space |
| Shadows | Not supported | Real-time shadows |
| Lighting | Static | Dynamic moon light |

### Use Cases

Perfect for:
- Tech companies and developer portfolios
- Architecture and real estate sites
- Futuristic or sci-fi themed content
- Urban planning and city-focused projects
- Sites wanting a modern, cutting-edge feel

### Future Enhancements

Potential improvements for the gl_city theme:
- Day/night cycle transitions
- Weather effects (rain, fog, snow)
- Building interiors with glowing windows
- Traffic simulation with moving lights
- User-controlled camera navigation
- Ambient city sounds synchronized with visuals

---

The gl_city theme demonstrates AjaxCMS's flexibility in supporting both traditional 2D canvas animations and cutting-edge WebGL 3D graphics. It's perfect for portfolios, tech demos, or any site wanting a futuristic, dynamic background.

Try it yourself by setting `default_background = "gl_city"` in your `index.html` configuration!
