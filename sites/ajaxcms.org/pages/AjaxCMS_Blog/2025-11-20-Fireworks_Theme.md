## Fireworks: Celebration Animation Theme with Particle Physics

AjaxCMS showcases the **Fireworks** theme, featuring spectacular particle-based fireworks displays with realistic physics, multiple explosion patterns, and vibrant color palettes.

{{i | fireworks-theme}}

**[View Live Demo →](http://ajaxcms.org/theme-demos/fireworks.com/?page=pages/menus/01-Welcome.md)**

### Visual Features

**Dynamic Fireworks:**
- Multiple fireworks launching simultaneously from random positions
- Variety of explosion patterns: burst, fountain, ring, spiral, heart
- Realistic particle physics with gravity and air resistance
- Vibrant color palettes: red/gold, blue/white, green/yellow, purple/pink
- Particle trails that fade over time

**Launch Effects:**
- Bright launch trails as rockets ascend
- Configurable launch height and speed
- Random launch positions across bottom of screen
- Smooth acceleration curves

### Explosion Patterns

**Burst Pattern:** Particles explode outward in all directions with uniform distribution

**Heart Pattern:** Uses parametric equations to form heart shapes with particles

**Ring Pattern:** Concentric rings of particles expanding outward at different speeds

**Fountain Pattern:** Upward-cascading particles with slight spread

**Spiral Pattern:** Rotating particle streams creating spinning effects

### Physics Simulation

**Realistic Motion:**
- Gravity pulls particles downward naturally
- Air resistance (drag) slows particles over time
- Configurable physics parameters for different effects
- Launch trajectories with randomized angles

**Visual Effects:**
- Particles fade based on age and lifetime
- Additive blending creates luminous glow effect
- Trail rendering for rocket launches
- Multi-colored palettes randomly selected

### Performance Optimizations

**Efficient Rendering:**
- Particle pooling reduces garbage collection
- Spatial culling removes off-screen particles
- Age-based culling for expired particles
- Batch rendering with globalCompositeOperation
- Maximum particle limit prevents performance issues

**Canvas Optimization:**
- Additive blending for realistic glow ('lighter' composite mode)
- Pre-fade effect creates natural trails
- Optimized drawing with fillRect for speed

### Configuration

The Fireworks theme offers extensive customization:
- Launch interval control (min/max timing)
- Physics tuning (gravity, drag, launch speed)
- Explosion settings (particle count, patterns)
- Visual options (trail length, glow intensity)
- Performance limits (max particles, culling margin)

### Browser Compatibility

The Fireworks theme works across all modern browsers:
- Canvas API for particle rendering
- RequestAnimationFrame for smooth 60 FPS animation
- Additive blending for glow effects
- Graceful fallback for older browsers (static gradient)

### Use Cases

Perfect for:
- Holiday sites (New Year's, celebrations)
- Event pages (product launches, achievements)
- Portfolio sites (creative, energetic feel)
- Landing pages (attention-grabbing background)
- Congratulations and success pages

---

The Fireworks theme demonstrates AjaxCMS's particle system capabilities with realistic physics and beautiful visual effects. Perfect for celebratory sites or any project needing an energetic, eye-catching background.

Try it yourself by setting `default_background = "fireworks"` in your `index.html` configuration!
