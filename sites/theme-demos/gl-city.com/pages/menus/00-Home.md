## GL-City Theme

Welcome to GL-City, a full 3D WebGL version of the Night City theme for AjaxCMS. This theme uses true 3D geometry and a moving camera to create authentic parallax effects as you scroll through your content.

### About This Theme

GL-City renders an actual 3D cityscape with real depth. Unlike traditional parallax which moves 2D layers at different speeds, GL-City uses a 3D camera that moves through a genuine 3D environment. Buildings are rendered as 3D boxes, mountains as 3D triangular prisms, and everything responds naturally to camera movement.

### Key Features

- **True 3D Rendering**: Buildings and mountains are actual 3D geometry, not flat sprites
- **Moving Camera**: Camera travels backward and upward as you scroll, creating natural parallax
- **150 3D Buildings**: Procedurally generated boxes at 10 depth layers spread through 3D space
- **3D Mountain Ranges**: Three layers of triangular prism geometry with atmospheric tinting
- **100 Twinkling Stars**: Positioned in 3D space with enhanced flickering effects
- **Depth Testing**: Proper Z-buffer rendering for realistic occlusion
- **Perspective Projection**: 45-degree field of view with realistic perspective
- **Responsive Design**: Entire 3D scene regenerates on window resize

### Technical Implementation

GL-City uses WebGL (OpenGL ES 2.0) with full 3D rendering:

**Matrix Math**: Custom implementation of perspective projection, lookAt camera, and matrix multiplication
**3D Vertex Shaders**: Transform 3D vertices using model-view-projection matrices
**Fragment Shaders**: Per-pixel coloring with alpha blending for transparency
**Box Geometry**: Buildings rendered as 36-vertex cubes (6 faces × 2 triangles × 3 vertices)
**Triangular Prisms**: Mountains rendered as 3D triangular geometry
**Camera System**: Moves in Z-axis (backward) and Y-axis (upward) based on scroll position
**Depth Buffer**: WebGL depth testing (LEQUAL) for proper 3D occlusion
**Perspective Projection**: 45° FOV with aspect ratio correction and near/far clipping planes

### Performance

WebGL provides significant performance advantages:

- **GPU Acceleration**: Offload rendering to graphics hardware
- **Smooth 60fps**: Consistent frame rates even on complex scenes
- **Efficient Memory**: Reusable vertex and color buffers
- **Scalable**: Handles hundreds of buildings and windows efficiently

### Browser Support

GL-City requires WebGL support (available in all modern browsers):
- Chrome/Edge 9+
- Firefox 4+
- Safari 5.1+
- Opera 12+

If WebGL is not available, the theme will gracefully fail and display an error message.

### Comparison to Night City

GL-City is a simplified WebGL implementation of Night City, focusing on core features:
- ✅ Buildings with parallax
- ✅ Mountains with atmospheric tinting
- ✅ Twinkling stars
- ✅ Window lights
- ⏳ Shooting stars (coming soon)
- ⏳ UFOs (coming soon)
- ⏳ Moon and clouds (coming soon)
- ⏳ Rooftop details (coming soon)

This is a proof-of-concept demonstrating WebGL rendering. Additional features will be added iteratively.
