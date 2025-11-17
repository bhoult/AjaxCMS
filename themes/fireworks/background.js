/* Fireworks Theme Background Animation */

const canvas = document.getElementById('background');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// Firework configuration
const fireworks = [];
const particles = [];
const stars = [];
const gravity = 0.05;
const fireworkChance = 0.04;

// Firework colors - vibrant combinations
const colorSchemes = [
    [[255, 50, 50], [255, 150, 50], [255, 255, 50]], // Red-Orange-Yellow
    [[50, 100, 255], [100, 200, 255], [200, 230, 255]], // Blue-Cyan-White
    [[255, 50, 150], [255, 100, 200], [255, 200, 255]], // Pink-Magenta
    [[50, 255, 50], [150, 255, 150], [200, 255, 200]], // Green
    [[200, 50, 255], [150, 100, 255], [220, 180, 255]], // Purple
    [[255, 255, 50], [255, 200, 50], [255, 150, 50]], // Gold
    [[255, 255, 255], [200, 200, 255], [255, 200, 200]], // White-Silver
];

// Create stars
function createStars() {
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            twinkleSpeed: Math.random() * 0.02 + 0.01,
            brightness: Math.random(),
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
}

class Firework {
    constructor(x, y) {
        this.x = x;
        this.y = height;
        this.targetY = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 8 - 12; // Launch speed
        this.exploded = false;
        this.colorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
        this.trail = [];
        this.type = Math.random(); // Determines explosion type
        this.hasParticleExplosions = Math.random() < 0.33; // 1 in 3 fireworks will have particle explosions
    }

    update() {
        if (!this.exploded) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 10) this.trail.shift();

            this.vy += gravity;
            this.x += this.vx;
            this.y += this.vy;

            // Explode when reaching target height or starting to fall
            if (this.y <= this.targetY || this.vy >= 0) {
                this.explode();
                this.exploded = true;
            }
        }
    }

    draw() {
        if (!this.exploded) {
            // Draw trail
            ctx.strokeStyle = `rgba(255, 255, 200, 0.5)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            ctx.stroke();

            // Draw rocket
            ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    explode() {
        let particleCount = Math.random() * 100 + 150;

        if (this.type < 0.15) {
            // Willow - Drooping effect
            particleCount = 200;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * 4 + 2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed * 0.5; // Less vertical spread
                particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, false, true, false, this.hasParticleExplosions));
            }
        } else if (this.type < 0.3) {
            // Palm - Rising particles
            particleCount = 150;
            for (let i = 0; i < particleCount; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;
                const speed = Math.random() * 6 + 4;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, false, false, false, this.hasParticleExplosions));
            }
        } else if (this.type < 0.45) {
            // Chrysanthemum - Dense circular burst
            particleCount = 300;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * 3 + 5;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, false, false, false, this.hasParticleExplosions));
            }
        } else if (this.type < 0.6) {
            // Crossette - Breaks into clusters
            const clusters = 8;
            for (let c = 0; c < clusters; c++) {
                const clusterAngle = (Math.PI * 2 * c) / clusters;
                const clusterSpeed = 6;
                const cx = this.x + Math.cos(clusterAngle) * 30;
                const cy = this.y + Math.sin(clusterAngle) * 30;

                for (let i = 0; i < 25; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 4 + 2;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    particles.push(new Particle(cx, cy, vx, vy, this.colorScheme, false, false, false, this.hasParticleExplosions));
                }
            }
        } else if (this.type < 0.75) {
            // Ring burst
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * 2 + 6;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, false, false, false, this.hasParticleExplosions));
            }
        } else {
            // Random burst
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, false, false, false, this.hasParticleExplosions));
            }
        }

        // Add secondary explosions for some fireworks (33% chance - one in three)
        if (Math.random() < 0.33) {
            const delay = Math.random() * 400 + 300;
            setTimeout(() => {
                const secondaryCount = Math.floor(Math.random() * 40) + 30;
                const secondaryType = Math.random();

                if (secondaryType < 0.33) {
                    // Ring secondary
                    for (let i = 0; i < secondaryCount; i++) {
                        const angle = (Math.PI * 2 * i) / secondaryCount;
                        const speed = Math.random() * 3 + 2;
                        const vx = Math.cos(angle) * speed;
                        const vy = Math.sin(angle) * speed;
                        particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, true));
                    }
                } else if (secondaryType < 0.66) {
                    // Burst secondary
                    for (let i = 0; i < secondaryCount; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 5 + 1;
                        const vx = Math.cos(angle) * speed;
                        const vy = Math.sin(angle) * speed;
                        particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, true));
                    }
                } else {
                    // Mini clusters secondary
                    const clusters = 5;
                    for (let c = 0; c < clusters; c++) {
                        const clusterAngle = (Math.PI * 2 * c) / clusters;
                        const cx = this.x + Math.cos(clusterAngle) * 20;
                        const cy = this.y + Math.sin(clusterAngle) * 20;

                        for (let i = 0; i < 10; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = Math.random() * 3 + 1;
                            const vx = Math.cos(angle) * speed;
                            const vy = Math.sin(angle) * speed;
                            particles.push(new Particle(cx, cy, vx, vy, this.colorScheme, true));
                        }
                    }
                }
            }, delay);
        }

        // Add tertiary explosions for extra spectacular fireworks (20% chance)
        if (Math.random() < 0.2) {
            const delay = Math.random() * 600 + 700;
            setTimeout(() => {
                const tertiaryCount = 20;
                for (let i = 0; i < tertiaryCount; i++) {
                    const angle = (Math.PI * 2 * i) / tertiaryCount;
                    const speed = Math.random() * 2 + 1;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, true));
                }
            }, delay);
        }
    }
}

class Particle {
    constructor(x, y, vx, vy, colorScheme, isSecondary = false, isWillow = false, isTertiary = false, fireworkHasExplosions = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.color = colorScheme[Math.floor(Math.random() * colorScheme.length)];
        this.isSecondary = isSecondary;
        this.isWillow = isWillow;
        this.isTertiary = isTertiary;
        this.size = isTertiary ? 1 : (isSecondary ? 1.5 : 2.5);
        this.trail = [];
        this.hasExploded = false;
        this.colorScheme = colorScheme;

        // Particles will explode only if their parent firework allows it (and they're not secondary/tertiary)
        this.willExplode = !isSecondary && !isTertiary && fireworkHasExplosions && Math.random() < 0.33;
        this.explodeThreshold = Math.random() * 0.3 + 0.3; // Explode when alpha is between 0.3-0.6

        // Streamer effect - some particles last longer
        if (Math.random() < 0.1) {
            this.decay *= 0.5;
            this.isStreamer = true;
        } else {
            this.isStreamer = false;
        }

        // Strobe effect - some particles flash white (10% chance)
        this.isStrobe = Math.random() < 0.1;
        this.strobeFrequency = Math.random() * 0.15 + 0.1; // Flash speed
        this.strobePhase = Math.random() * Math.PI * 2; // Random starting phase
        this.strobeTime = 0;
    }

    update() {
        // Willow particles have stronger gravity
        this.vy += gravity * (this.isWillow ? 0.5 : 0.3);
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98; // Air resistance
        this.vy *= 0.98;
        this.alpha -= this.decay;

        // Update strobe timing
        if (this.isStrobe) {
            this.strobeTime += this.strobeFrequency;
        }

        // Check if particle should explode
        if (this.willExplode && !this.hasExploded && this.alpha <= this.explodeThreshold) {
            this.explode();
            this.hasExploded = true;
        }

        // Trail for streamers
        if (this.isStreamer || this.isWillow) {
            this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.trail.length > 15) this.trail.shift();
        }
    }

    explode() {
        // Create smaller particles bursting out from this particle
        const particleCount = Math.floor(Math.random() * 8) + 6; // 6-14 smaller particles
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, false, false, true));
        }
    }

    draw() {
        // Draw trail for streamers
        if (this.isStreamer && this.trail.length > 0) {
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const trailAlpha = point.alpha * (i / this.trail.length) * 0.5;
                ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${trailAlpha})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw particle with optional strobe effect
        let particleColor = this.color;
        let glow = this.isStreamer ? 4 : 2;

        // Strobe effect - flash white
        if (this.isStrobe) {
            const strobeValue = Math.sin(this.strobeTime + this.strobePhase);
            if (strobeValue > 0.7) { // Flash when sine wave is high
                particleColor = [255, 255, 255]; // White flash
                glow = 8; // Bright glow during flash
            }
        }

        ctx.shadowBlur = glow;
        ctx.shadowColor = `rgba(${particleColor[0]}, ${particleColor[1]}, ${particleColor[2]}, ${this.alpha})`;
        ctx.fillStyle = `rgba(${particleColor[0]}, ${particleColor[1]}, ${particleColor[2]}, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    isDead() {
        return this.alpha <= 0;
    }
}

let time = 0;
function animate() {
    time += 1;

    // Fade previous frame for trail effect
    ctx.fillStyle = 'rgba(10, 10, 30, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Draw twinkling stars
    for (let star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const brightness = star.brightness * twinkle;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Randomly launch new fireworks
    if (Math.random() < fireworkChance) {
        const x = Math.random() * width;
        const targetY = Math.random() * height * 0.4 + 50; // Top 40% of screen
        fireworks.push(new Firework(x, targetY));
    }

    // Update and draw fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].draw();
        if (fireworks[i].exploded) {
            fireworks.splice(i, 1);
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    stars.length = 0; // Clear stars
    createStars(); // Recreate stars for new dimensions
});

// Initialize with dark sky
ctx.fillStyle = 'rgba(10, 10, 30, 1)';
ctx.fillRect(0, 0, width, height);

// Create stars
createStars();

// Start animation
animate();
