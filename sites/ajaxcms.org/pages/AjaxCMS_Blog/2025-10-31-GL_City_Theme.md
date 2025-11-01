## GL City: 3D Cityscape Theme with Three.js

AjaxCMS now features an impressive 3D cityscape theme powered by **Three.js**, bringing WebGL-rendered graphics to the platform. The `gl_city` theme showcases procedurally generated skyscrapers with realistic lighting, shadows, and a dynamic starfield.

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

The gl_city theme demonstrates AjaxCMS's ability to integrate modern WebGL libraries:

```javascript
// Three.js initialization
function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, page_width / page_height, 0.1, 3000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('background'),
        antialias: true,
        alpha: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}
```

**Building Generation:**
Each building is procedurally generated with random dimensions and window patterns:

```javascript
// Buildings vary from 40-400 units tall
var height = 40 + Math.random() * 360;
var width = 10 + Math.random() * 30;
var depth = 10 + Math.random() * 30;
```

**Shadow Mapping:**
The theme uses Three.js shadow mapping for realistic lighting:

```javascript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
moonLight.castShadow = true;
buildingMesh.castShadow = true;
buildingMesh.receiveShadow = true;
```

### Performance Optimizations

**Efficient Rendering:**
- Uses WebGL hardware acceleration
- Optimized geometry with minimal polygons
- Shadow map caching for static objects
- Proper cleanup on theme change (disposeTheme function)

**Adaptive Quality:**
- Buildings positioned at varying depths to create perspective
- Instanced geometry for window patterns
- Frustum culling handled automatically by Three.js
- Configurable pan speed (68% slower than original for smoother motion)

### User Interactions

**View Modes:**
- Press **'O'** to toggle overhead view
- **Mouse drag** to pan the overhead camera
- **Mouse wheel** to zoom in/out (200-2000 units range)
- Automatic return to normal view when exiting overhead mode

**Camera Movement:**
The camera smoothly tracks the cityscape:

```javascript
var buildingPanSpeed = 0.16;  // Units per frame
camera.position.x -= buildingPanSpeed;
```

### Theme Configuration

The gl_city theme is structured like all AjaxCMS themes:

```
themes/gl_city/
├── background.js    # Three.js scene setup and animation
└── theme.css        # Theme-specific styles
```

**Loading the theme** (`index.html`):

```javascript
var default_background = "gl_city";
```

### Browser Compatibility

The gl_city theme requires:
- **WebGL support** (available in all modern browsers)
- **Three.js library** (loaded via CDN in background.js)
- Hardware acceleration enabled (recommended)

Browsers without WebGL will fall back gracefully with a static gradient background.

### Comparison to Other Themes

Unlike canvas-based themes (network, gears, bubbles), gl_city uses **3D graphics hardware acceleration**:

| Feature | Canvas Themes | GL City Theme |
|---------|---------------|---------------|
| Rendering | 2D Canvas API | WebGL (Three.js) |
| Performance | CPU-based | GPU-accelerated |
| Depth | Simulated | True 3D space |
| Shadows | Not supported | Real-time shadows |
| Lighting | Static | Dynamic moon light |
| Complexity | Low polygon | High polygon 3D models |

### Future Enhancements

Potential improvements for the gl_city theme:

- **Day/night cycle**: Transition from night cityscape to daytime
- **Weather effects**: Rain, fog, or snow particles
- **Building interiors**: Glowing windows with varying patterns
- **Traffic simulation**: Moving lights along streets
- **User-controlled camera**: Click-and-drag navigation in normal view
- **Sound integration**: Ambient city sounds synchronized with visuals

### Code Highlights

**Cleanup on theme change:**

```javascript
function disposeTheme() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
    }
    if (renderer) {
        renderer.dispose();
    }
    // Dispose all geometries and materials
    buildingMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
}
```

**Starfield generation:**

```javascript
var starGeometry = new THREE.BufferGeometry();
var starVertices = [];
for (var i = 0; i < 5000; i++) {
    var x = (Math.random() - 0.5) * 4000;
    var y = Math.random() * 2000;
    var z = (Math.random() - 0.5) * 4000;
    starVertices.push(x, y, z);
}
```

### Developer Notes

**Theme Performance:**
- Tested with 50+ buildings rendering smoothly at 60 FPS
- Shadow map size: 2048x2048 for quality/performance balance
- Building recycling as they exit viewport (infinite scrolling effect)

**CDN Dependencies:**
The theme loads Three.js from CDN:

```javascript
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
```

This keeps the AjaxCMS core lightweight while enabling advanced 3D graphics when needed.

---

The gl_city theme demonstrates AjaxCMS's flexibility in supporting both traditional 2D canvas animations and cutting-edge WebGL 3D graphics. It's perfect for portfolios, tech demos, or any site wanting a futuristic, dynamic background.

Try it yourself by setting `default_background = "gl_city"` in your `index.html` configuration!
