## Fireworks: Celebration Animation Theme with Particle Physics

AjaxCMS showcases the **Fireworks** theme, featuring spectacular particle-based fireworks displays with realistic physics, multiple explosion patterns, and vibrant color palettes.

{{i | fireworks-theme}}

**[View Live Demo →](http://ajaxcms.org/fireworks.com/?page=pages/menus/01-Welcome.md)**

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

### Technical Implementation

The Fireworks theme demonstrates advanced particle system techniques:

**Particle System:**
```javascript
class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.age = 0;
        this.alpha = 1;
    }

    update(gravity, drag) {
        this.vy += gravity;
        this.vx *= drag;
        this.vy *= drag;
        this.x += this.vx;
        this.y += this.vy;
        this.age++;
        this.alpha = 1 - (this.age / this.lifetime);
    }
}
```

**Explosion Patterns:**

**Burst Pattern:**
```javascript
function createBurst(x, y, color, particleCount) {
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 2 + Math.random() * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push(new Particle(x, y, vx, vy, color, 2, 100));
    }
}
```

**Heart Pattern:**
```javascript
function createHeart(x, y, color) {
    for (let t = 0; t < Math.PI * 2; t += 0.1) {
        // Parametric heart curve
        const px = 16 * Math.pow(Math.sin(t), 3);
        const py = -(13 * Math.cos(t) - 5 * Math.cos(2*t) -
                     2 * Math.cos(3*t) - Math.cos(4*t));
        const scale = 0.3;
        particles.push(new Particle(x, y, px * scale, py * scale, color, 2, 120));
    }
}
```

**Ring Pattern:**
```javascript
function createRing(x, y, color, rings) {
    for (let ring = 0; ring < rings; ring++) {
        const radius = (ring + 1) * 2;
        const particleCount = 30 + ring * 10;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const vx = Math.cos(angle) * radius;
            const vy = Math.sin(angle) * radius;
            particles.push(new Particle(x, y, vx, vy, color, 2, 90));
        }
    }
}
```

### Physics Simulation

**Gravity and Drag:**
Particles fall realistically with configurable physics:
```javascript
const config = {
    gravity: 0.1,        // Downward acceleration
    drag: 0.98,          // Air resistance (velocity *= drag)
    launchSpeed: 15,     // Initial upward velocity
    launchAngleVar: 0.2  // Launch angle variation
};

function updateParticles() {
    particles.forEach(particle => {
        particle.update(config.gravity, config.drag);
    });
}
```

**Launch Trajectory:**
Rockets accelerate upward with slight randomness:
```javascript
function launchFirework(x) {
    const rocket = {
        x: x,
        y: canvas.height,
        vx: (Math.random() - 0.5) * config.launchAngleVar,
        vy: -config.launchSpeed,
        targetHeight: canvas.height * (0.2 + Math.random() * 0.3),
        color: getRandomColor(),
        trail: []
    };
    rockets.push(rocket);
}
```

### Color Palettes

**Themed Color Sets:**
```javascript
const colorPalettes = [
    ['#ff0000', '#ff6600', '#ffaa00'],  // Red/Gold
    ['#0066ff', '#00aaff', '#ffffff'],  // Blue/White
    ['#00ff00', '#66ff00', '#ffff00'],  // Green/Yellow
    ['#ff00ff', '#ff66ff', '#ff99ff'],  // Purple/Pink
    ['#ff3300', '#ff6600', '#ff9900']   // Orange/Red
];

function getRandomColor() {
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    return palette[Math.floor(Math.random() * palette.length)];
}
```

### Performance Optimizations

**Particle Pooling:**
Reuse particle objects to reduce garbage collection:
```javascript
const particlePool = [];

function recycleParticle(particle) {
    particlePool.push(particle);
}

function getParticle() {
    return particlePool.pop() || new Particle();
}
```

**Culling:**
Remove particles that have aged out or left the screen:
```javascript
particles = particles.filter(p => {
    if (p.age >= p.lifetime) return false;
    if (p.y > canvas.height + 100) return false;
    if (p.x < -100 || p.x > canvas.width + 100) return false;
    return true;
});
```

**Canvas Optimization:**
```javascript
// Use globalCompositeOperation for additive blending
ctx.globalCompositeOperation = 'lighter';

// Batch similar particles
ctx.fillStyle = particle.color;
ctx.globalAlpha = particle.alpha;
ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
```

### Configuration

The Fireworks theme offers extensive customization:

```javascript
const config = {
    // Launch Settings
    minLaunchInterval: 500,      // ms between launches
    maxLaunchInterval: 1500,
    launchSpeed: 15,
    launchAngleVar: 0.2,

    // Physics
    gravity: 0.1,
    drag: 0.98,

    // Explosion Settings
    minParticles: 50,
    maxParticles: 150,
    explosionPatterns: ['burst', 'ring', 'fountain', 'spiral', 'heart'],

    // Visual
    trailLength: 10,
    particleSize: 2,
    glowIntensity: 0.8,

    // Performance
    maxParticles: 5000,          // Limit total particles
    cullingMargin: 100           // Pixels outside screen before culling
};
```

### Explosion Pattern Details

**Fountain Pattern:**
Creates upward-cascading particles:
```javascript
function createFountain(x, y, color) {
    for (let i = 0; i < 80; i++) {
        const angle = -Math.PI/2 + (Math.random() - 0.5) * 0.8;
        const speed = 3 + Math.random() * 6;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push(new Particle(x, y, vx, vy, color, 2, 100));
    }
}
```

**Spiral Pattern:**
Creates rotating particle streams:
```javascript
function createSpiral(x, y, color, arms) {
    for (let arm = 0; arm < arms; arm++) {
        const baseAngle = (Math.PI * 2 * arm) / arms;
        for (let i = 0; i < 20; i++) {
            const angle = baseAngle + (i * 0.1);
            const speed = 2 + (i * 0.1);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            particles.push(new Particle(x, y, vx, vy, color, 2, 120));
        }
    }
}
```

### Rendering Pipeline

**Multi-Layer Rendering:**
```javascript
function render() {
    // Fade previous frame
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render rocket trails
    ctx.globalCompositeOperation = 'lighter';
    rockets.forEach(renderRocketTrail);

    // Render particles with additive blending
    particles.forEach(renderParticle);

    // Render explosions
    explosions.forEach(renderExplosion);
}
```

**Trail Rendering:**
```javascript
function renderRocketTrail(rocket) {
    ctx.strokeStyle = rocket.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    rocket.trail.forEach((point, i) => {
        if (i === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.stroke();
}
```

### Browser Compatibility

The Fireworks theme works across all modern browsers:
- **Canvas API** for particle rendering
- **RequestAnimationFrame** for smooth 60 FPS animation
- **Additive blending** (`globalCompositeOperation: 'lighter'`)
- Graceful fallback for older browsers (static gradient)

### Theme Structure

```
themes/fireworks/
├── background.js    # Particle system and fireworks logic
└── theme.css        # Dark theme styling
```

**Loading the theme** (`index.html`):
```javascript
var default_background = "fireworks";
```

### Code Highlights

**Launch Scheduling:**
Random intervals create natural timing:
```javascript
function scheduleLaunch() {
    const delay = config.minLaunchInterval +
                  Math.random() * (config.maxLaunchInterval - config.minLaunchInterval);
    setTimeout(() => {
        launchFirework(Math.random() * canvas.width);
        scheduleLaunch();
    }, delay);
}
```

**Particle Alpha Fade:**
Smooth fadeout based on particle age:
```javascript
particle.alpha = Math.max(0, 1 - (particle.age / particle.lifetime));
```

### Developer Notes

**Performance Benchmarks:**
- 5000 particles @ 60 FPS on modern hardware
- Additive blending creates realistic glow effect
- Particle culling keeps active count manageable
- Trail arrays limited to prevent memory growth

**Key Techniques:**
- Parametric equations for special shapes (heart, spiral)
- Additive color blending for luminous effect
- Object pooling for reduced GC pressure
- Spatial culling for off-screen particles

### Use Cases

Perfect for:
- **Holiday sites** (New Year's, celebrations)
- **Event pages** (launches, achievements)
- **Portfolio sites** (creative, energetic feel)
- **Landing pages** (attention-grabbing background)
- **Congratulations pages** (success messages)

### Future Enhancements

Potential improvements for the Fireworks theme:
- **Sound effects**: Whistles, bangs, crackles synchronized with visuals
- **User interaction**: Click to launch fireworks
- **Word formations**: Spell out text with particles
- **Finale mode**: Massive multi-explosion finale
- **Time-based**: Automatic countdown to midnight
- **3D fireworks**: Use Three.js for depth and perspective

---

The Fireworks theme demonstrates AjaxCMS's particle system capabilities with realistic physics and beautiful visual effects. Perfect for celebratory sites or any project needing an energetic, eye-catching background.

Try it yourself by setting `default_background = "fireworks"` in your `index.html` configuration!
