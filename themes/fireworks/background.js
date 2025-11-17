/* Fireworks Theme Background Animation */

const canvas = document.getElementById('background');
const ctx = canvas.getContext('2d');
const foregroundCanvas = document.getElementById('foreground');
const fgCtx = foregroundCanvas ? foregroundCanvas.getContext('2d') : null;

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;
if (foregroundCanvas) {
    foregroundCanvas.width = width;
    foregroundCanvas.height = height;
}

// Firework configuration
const fireworks = [];
const particles = [];
const stars = [];
const ufos = [];
const ufoParticles = []; // Particles from UFO explosions (draw on foreground)
const ufoParts = []; // Physical UFO parts that fly apart
const gravity = 0.05;
const fireworkChance = 0.04;
let lastUfoSpawn = 0;

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
            const trailLen = this.trail.length;
            if (trailLen > 0) {
                // Draw trail
                ctx.strokeStyle = 'rgba(255,255,200,0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const first = this.trail[0];
                ctx.moveTo(first.x, first.y);
                for (let i = 1; i < trailLen; i++) {
                    const point = this.trail[i];
                    ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();
            }

            // Draw rocket
            ctx.fillStyle = 'rgba(255,255,200,0.8)';
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
        } else if (this.type < 0.88) {
            // Random burst
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, false, false, false, this.hasParticleExplosions));
            }
        } else {
            // American Flag pattern - massive size with correct 1.9:1 aspect ratio
            const flagWidth = 2560; // Double again for massive flag
            const flagHeight = 1347; // Correct 1.9:1 aspect ratio (2560 / 1.9)
            const stripeHeight = flagHeight / 13; // 13 stripes
            const cantonWidth = flagWidth * 0.4;
            const cantonHeight = stripeHeight * 7; // Canton covers 7 stripes

            // 13 stripes (7 red, 6 white) - 4x more particles
            for (let stripe = 0; stripe < 13; stripe++) {
                const isRedStripe = stripe % 2 === 0;
                const stripeColor = isRedStripe ? [[178, 34, 52]] : [[255, 255, 255]];
                const particlesPerStripe = 140; // 4x increase (35 * 4)

                for (let i = 0; i < particlesPerStripe; i++) {
                    const xOffset = (Math.random() - 0.5) * flagWidth;
                    const yOffset = (stripe * stripeHeight - flagHeight / 2) + Math.random() * stripeHeight;

                    // Skip canton area for upper 7 stripes
                    if (stripe < 7 && xOffset < -flagWidth / 2 + cantonWidth) {
                        continue;
                    }

                    // Much higher speed to reach massive flag size
                    const speed = Math.random() * 4 + 12;
                    // Use same scale for both x and y to maintain aspect ratio
                    const scale = flagWidth;
                    const vx = (xOffset / scale) * speed;
                    const vy = (yOffset / scale) * speed;
                    particles.push(new Particle(this.x, this.y, vx, vy, stripeColor, false, false, false, this.hasParticleExplosions));
                }
            }

            // Blue canton (union) background - 4x more particles
            const cantonBlueParticles = 320; // 4x increase (80 * 4)
            for (let i = 0; i < cantonBlueParticles; i++) {
                const xOffset = -flagWidth / 2 + Math.random() * cantonWidth;
                const yOffset = -flagHeight / 2 + Math.random() * cantonHeight;

                const speed = Math.random() * 4 + 12;
                const scale = flagWidth;
                const vx = (xOffset / scale) * speed;
                const vy = (yOffset / scale) * speed;

                particles.push(new Particle(this.x, this.y, vx, vy, [[0, 63, 135]], false, false, false, this.hasParticleExplosions));
            }

            // 50 white stars in canton - proper 9 row pattern (6-5-6-5-6-5-6-5-6)
            const starPattern = [6, 5, 6, 5, 6, 5, 6, 5, 6]; // 9 rows = 50 stars
            let starY = 0;
            for (let row = 0; row < starPattern.length; row++) {
                const starsInRow = starPattern[row];
                const isOffset = starsInRow === 5;
                const xStart = isOffset ? cantonWidth / 12 : 0;

                for (let col = 0; col < starsInRow; col++) {
                    // Multiple particles per star for visibility
                    const particlesPerStar = 8;
                    for (let p = 0; p < particlesPerStar; p++) {
                        const xOffset = -flagWidth / 2 + xStart + (col * cantonWidth / 6) + (Math.random() - 0.5) * 8;
                        const yOffset = -flagHeight / 2 + (row * cantonHeight / 9) + (Math.random() - 0.5) * 8;

                        const speed = Math.random() * 4 + 12;
                        const scale = flagWidth;
                        const vx = (xOffset / scale) * speed;
                        const vy = (yOffset / scale) * speed;

                        particles.push(new Particle(this.x, this.y, vx, vy, [[255, 255, 255]], false, false, false, this.hasParticleExplosions));
                    }
                }
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
        this.dead = false; // Add dead flag to avoid splice

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

    draw(context) {
        const drawCtx = context || ctx;

        // Draw trail for streamers (skip if too many particles for performance)
        if (this.isStreamer && this.trail.length > 0 && particles.length < 500) {
            const trailLen = this.trail.length;
            const invTrailLen = 1 / trailLen;
            for (let i = 0; i < trailLen; i++) {
                const point = this.trail[i];
                const trailAlpha = point.alpha * (i * invTrailLen) * 0.5;
                drawCtx.fillStyle = 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ',' + trailAlpha + ')';
                drawCtx.beginPath();
                drawCtx.arc(point.x, point.y, this.size * 0.5, 0, Math.PI * 2);
                drawCtx.fill();
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

        drawCtx.shadowBlur = glow;
        const colorStr = 'rgba(' + particleColor[0] + ',' + particleColor[1] + ',' + particleColor[2] + ',' + this.alpha + ')';
        drawCtx.shadowColor = colorStr;
        drawCtx.fillStyle = colorStr;
        drawCtx.beginPath();
        drawCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        drawCtx.fill();
    }

    isDead() {
        return this.alpha <= 0;
    }
}

// UFO object (from night_city theme)
class UFO {
    constructor() {
        // UFOs fly from left to right or right to left
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.x = this.direction > 0 ? -200 : width + 200;
        this.y = Math.random() * height * 0.3 + 50; // Upper third of screen
        this.speed = 2 + Math.random() * 2;
        this.size = (20 + Math.random() * 15) * 2; // Double the size (40-70px)
        this.wobble = Math.random() * Math.PI * 2; // For wobbling motion
        this.lightPhase = Math.random() * Math.PI * 2; // For blinking lights
        this.exploded = false;

        // Pre-calculate size multipliers
        this.sizeHalf = this.size * 0.5;
        this.size02 = this.size * 0.2;
        this.size025 = this.size * 0.25;
        this.size03 = this.size * 0.3;
        this.size035 = this.size * 0.35;
        this.size015 = this.size * 0.15;
        this.size024 = this.size * 0.24;
        this.size08 = this.size * 0.8;
        this.size15 = this.size * 1.5;
        this.size3 = this.size * 3;

        // Pre-build light color arrays
        this.lightColors = [
            { r: 255, g: 100, b: 100 },
            { r: 100, g: 255, b: 100 },
            { r: 100, g: 100, b: 255 },
            { r: 255, g: 255, b: 100 }
        ];
    }

    update(frame) {
        this.x += this.speed * this.direction;
        this.wobble = frame * 0.05;
        this.lightPhase = frame * 0.1;
    }

    isAlive() {
        if (this.exploded) return false;
        if (this.direction > 0) {
            return this.x < width + 200;
        } else {
            return this.x > -200;
        }
    }

    containsPoint(px, py) {
        const wobbleY = Math.sin(this.wobble) * 3;
        const y = this.y + wobbleY;
        // Simple circular hit detection using the UFO's size
        const dx = px - this.x;
        const dy = py - y;
        return Math.sqrt(dx * dx + dy * dy) < this.size * 1.2; // Slightly larger hit area
    }

    explode() {
        this.exploded = true;
        const wobbleY = Math.sin(this.wobble) * 3;
        const y = this.y + wobbleY;

        // Create UFO parts that fly apart
        // Dome
        ufoParts.push(new UFOPart(
            this.x,
            y - this.size * 0.2,
            (Math.random() - 0.5) * 8,
            -Math.random() * 8 - 5,
            'dome',
            this.size,
            null
        ));

        // Body (saucer) - break into 3 pieces
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            ufoParts.push(new UFOPart(
                this.x + Math.cos(angle) * this.size * 0.3,
                y,
                Math.cos(angle) * 6 + (Math.random() - 0.5) * 3,
                Math.sin(angle) * 3 - Math.random() * 5,
                'body',
                this.size * 0.6,
                null
            ));
        }

        // Lights
        const lightColors = [
            'rgba(255, 100, 100, 0.9)',
            'rgba(100, 255, 100, 0.9)',
            'rgba(100, 100, 255, 0.9)',
            'rgba(255, 255, 100, 0.9)',
            'rgba(255, 100, 255, 0.9)'
        ];
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            ufoParts.push(new UFOPart(
                this.x + Math.cos(angle) * this.size * 0.8,
                y + Math.sin(angle) * this.size * 0.24,
                Math.cos(angle) * 10 + (Math.random() - 0.5) * 4,
                Math.sin(angle) * 5 - Math.random() * 3,
                'light',
                4,
                lightColors[i]
            ));
        }

        // Create some explosion particles for effect
        const particleCount = 50;
        const colorScheme = [
            [100, 200, 255], // Cyan
            [255, 100, 100], // Red
            [100, 255, 100], // Green
            [255, 255, 100], // Yellow
            [200, 200, 200]  // White/gray
        ];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 8 + 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            ufoParticles.push(new Particle(this.x, y, vx, vy, colorScheme, false, false, false, false));
        }
    }

    draw(frame) {
        if (!fgCtx) return; // Skip if no foreground canvas

        const wobbleY = Math.sin(this.wobble) * 3;
        const y = this.y + wobbleY;
        const yPlusHalf = y + this.sizeHalf;

        // UFO shadow/glow underneath
        const glowGradient = fgCtx.createRadialGradient(this.x, yPlusHalf, 0, this.x, yPlusHalf, this.size15);
        glowGradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
        glowGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        fgCtx.fillStyle = glowGradient;
        fgCtx.beginPath();
        fgCtx.arc(this.x, yPlusHalf, this.size15, 0, Math.PI * 2);
        fgCtx.fill();

        // UFO dome (top)
        fgCtx.fillStyle = 'rgba(150, 160, 170, 0.8)';
        fgCtx.beginPath();
        fgCtx.ellipse(this.x, y - this.size02, this.sizeHalf, this.size035, 0, 0, Math.PI * 2);
        fgCtx.fill();

        // Dome highlight
        fgCtx.fillStyle = 'rgba(200, 220, 240, 0.4)';
        fgCtx.beginPath();
        fgCtx.ellipse(this.x - this.size015, y - this.size025, this.size02, this.size015, 0, 0, Math.PI * 2);
        fgCtx.fill();

        // UFO body (saucer)
        fgCtx.fillStyle = 'rgba(120, 130, 140, 0.9)';
        fgCtx.beginPath();
        fgCtx.ellipse(this.x, y, this.size, this.size03, 0, 0, Math.PI * 2);
        fgCtx.fill();

        // Body edge highlight
        fgCtx.strokeStyle = 'rgba(180, 190, 200, 0.6)';
        fgCtx.lineWidth = 2;
        fgCtx.beginPath();
        fgCtx.ellipse(this.x, y, this.size, this.size03, 0, 0, Math.PI);
        fgCtx.stroke();

        // Colored lights around the rim
        const twoPi = Math.PI * 2;
        const lightFraction = twoPi / 5;
        for (let i = 0; i < 5; i++) {
            const angle = i * lightFraction + this.lightPhase;
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);
            const lightX = this.x + cosAngle * this.size08;
            const lightY = y + sinAngle * this.size024;

            // Alternate between colors
            const brightness = Math.sin(this.lightPhase + i) * 0.3 + 0.7;
            const colorObj = this.lightColors[i % 4];
            const colorStr = 'rgba(' + colorObj.r + ',' + colorObj.g + ',' + colorObj.b + ',' + brightness + ')';
            const glowStr = 'rgba(' + colorObj.r + ',' + colorObj.g + ',' + colorObj.b + ',0.2)';

            fgCtx.fillStyle = colorStr;
            fgCtx.beginPath();
            fgCtx.arc(lightX, lightY, 2, 0, twoPi);
            fgCtx.fill();

            // Light glow
            fgCtx.fillStyle = glowStr;
            fgCtx.beginPath();
            fgCtx.arc(lightX, lightY, 4, 0, twoPi);
            fgCtx.fill();
        }

        // Beam underneath (occasionally)
        if (Math.sin(this.lightPhase * 0.5) > 0.6) {
            const yBeamTop = y + this.size03;
            const yBeamBottom = y + this.size3;
            const beamGradient = fgCtx.createLinearGradient(this.x, yBeamTop, this.x, yBeamBottom);
            beamGradient.addColorStop(0, 'rgba(200, 255, 255, 0.2)');
            beamGradient.addColorStop(1, 'rgba(200, 255, 255, 0)');
            fgCtx.fillStyle = beamGradient;
            fgCtx.beginPath();
            fgCtx.moveTo(this.x - this.size03, yBeamTop);
            fgCtx.lineTo(this.x + this.size03, yBeamTop);
            fgCtx.lineTo(this.x + this.size08, yBeamBottom);
            fgCtx.lineTo(this.x - this.size08, yBeamBottom);
            fgCtx.closePath();
            fgCtx.fill();
        }
    }
}

// UFO Part - individual pieces that fly apart when UFO explodes
class UFOPart {
    constructor(x, y, vx, vy, type, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type; // 'dome', 'body', 'light'
        this.size = size;
        this.color = color;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += gravity; // Apply gravity
        this.rotation += this.rotationSpeed;

        // Fade out as it falls
        if (this.y > height * 0.7) {
            this.alpha -= 0.02;
        }
    }

    draw() {
        if (!fgCtx) return;

        fgCtx.save();
        fgCtx.translate(this.x, this.y);
        fgCtx.rotate(this.rotation);
        fgCtx.globalAlpha = this.alpha;

        if (this.type === 'dome') {
            // Draw dome piece
            fgCtx.fillStyle = 'rgba(150, 160, 170, 0.8)';
            fgCtx.beginPath();
            fgCtx.ellipse(0, 0, this.size * 0.5, this.size * 0.35, 0, 0, Math.PI * 2);
            fgCtx.fill();

            // Dome highlight
            fgCtx.fillStyle = 'rgba(200, 220, 240, 0.4)';
            fgCtx.beginPath();
            fgCtx.ellipse(-this.size * 0.15, -this.size * 0.05, this.size * 0.2, this.size * 0.15, 0, 0, Math.PI * 2);
            fgCtx.fill();
        } else if (this.type === 'body') {
            // Draw body piece
            fgCtx.fillStyle = 'rgba(120, 130, 140, 0.9)';
            fgCtx.beginPath();
            fgCtx.ellipse(0, 0, this.size, this.size * 0.3, 0, 0, Math.PI * 2);
            fgCtx.fill();

            // Body edge
            fgCtx.strokeStyle = 'rgba(180, 190, 200, 0.6)';
            fgCtx.lineWidth = 2;
            fgCtx.beginPath();
            fgCtx.ellipse(0, 0, this.size, this.size * 0.3, 0, 0, Math.PI);
            fgCtx.stroke();
        } else if (this.type === 'light') {
            // Draw light piece
            fgCtx.fillStyle = this.color;
            fgCtx.beginPath();
            fgCtx.arc(0, 0, this.size, 0, Math.PI * 2);
            fgCtx.fill();

            // Light glow
            fgCtx.fillStyle = this.color.replace(/[\d.]+\)/, '0.3)');
            fgCtx.beginPath();
            fgCtx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
            fgCtx.fill();
        }

        fgCtx.restore();
    }

    isDead() {
        return this.y > height + 100 || this.alpha <= 0;
    }
}

let time = 0;
function animate() {
    time += 1;

    // Fade previous frame for trail effect
    ctx.fillStyle = 'rgba(10, 10, 30, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Clear foreground canvas for UFOs
    if (fgCtx) {
        fgCtx.clearRect(0, 0, width, height);
    }

    // Draw twinkling stars (use traditional for loop)
    const starsLen = stars.length;
    for (let i = 0; i < starsLen; i++) {
        const star = stars[i];
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const brightness = star.brightness * twinkle;
        ctx.fillStyle = 'rgba(255,255,255,' + brightness + ')';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Spawn UFO every 10 seconds (600 frames at 60fps)
    if (time - lastUfoSpawn >= 600) {
        ufos.push(new UFO());
        lastUfoSpawn = time;
    }

    // Update and draw UFOs
    let j = 0;
    while (j < ufos.length) {
        ufos[j].update(time);
        if (!ufos[j].isAlive()) {
            ufos[j] = ufos[ufos.length - 1];
            ufos.pop();
        } else {
            ufos[j].draw(time);
            j++;
        }
    }

    // Update and draw UFO explosion particles on foreground
    let k = 0;
    while (k < ufoParticles.length) {
        const particle = ufoParticles[k];
        particle.update();
        if (particle.isDead()) {
            particle.dead = true;
            ufoParticles[k] = ufoParticles[ufoParticles.length - 1];
            ufoParticles.pop();
        } else {
            particle.draw(fgCtx);
            k++;
        }
    }

    // Update and draw UFO parts on foreground
    let m = 0;
    while (m < ufoParts.length) {
        const part = ufoParts[m];
        part.update();
        if (part.isDead()) {
            ufoParts[m] = ufoParts[ufoParts.length - 1];
            ufoParts.pop();
        } else {
            part.draw();
            m++;
        }
    }

    // Randomly launch new fireworks
    if (Math.random() < fireworkChance) {
        const x = Math.random() * width;
        const targetY = Math.random() * height * 0.4 + 50; // Top 40% of screen
        fireworks.push(new Firework(x, targetY));
    }

    // Update and draw fireworks - use swap-and-pop for removal
    let i = 0;
    while (i < fireworks.length) {
        fireworks[i].update();
        fireworks[i].draw();
        if (fireworks[i].exploded) {
            // Swap with last element and pop (much faster than splice)
            fireworks[i] = fireworks[fireworks.length - 1];
            fireworks.pop();
        } else {
            i++;
        }
    }

    // Update and draw particles - batch removal for performance
    i = 0;
    while (i < particles.length) {
        const particle = particles[i];
        particle.update();
        if (particle.isDead()) {
            particle.dead = true;
            // Swap with last element and pop
            particles[i] = particles[particles.length - 1];
            particles.pop();
        } else {
            particle.draw();
            i++;
        }
    }

    // Reset shadow blur once at end
    ctx.shadowBlur = 0;

    requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (foregroundCanvas) {
        foregroundCanvas.width = width;
        foregroundCanvas.height = height;
    }
    stars.length = 0; // Clear stars
    createStars(); // Recreate stars for new dimensions
});

// Initialize with dark sky
ctx.fillStyle = 'rgba(10, 10, 30, 1)';
ctx.fillRect(0, 0, width, height);

// Create stars
createStars();

// UFO click handling
if (foregroundCanvas) {
    console.log('Setting up UFO click handlers');

    // Click handler - only fires when hovering over UFO (pointer-events controlled by CSS)
    foregroundCanvas.addEventListener('click', (e) => {
        const clickX = e.clientX;
        const clickY = e.clientY;

        console.log('Click at:', clickX, clickY, 'UFOs:', ufos.length);

        // Check if click hit any UFO
        for (let i = 0; i < ufos.length; i++) {
            if (!ufos[i].exploded && ufos[i].containsPoint(clickX, clickY)) {
                console.log('UFO hit! Exploding UFO', i);
                ufos[i].explode();
                e.preventDefault();
                e.stopPropagation();
                return; // Stop processing - we hit a UFO
            }
        }
    });

    // Track mouse for cursor change on document (since canvas has pointer-events:none by default)
    // Throttle to avoid checking on every pixel movement
    let lastMouseCheck = 0;
    document.addEventListener('mousemove', (e) => {
        const now = performance.now();
        if (now - lastMouseCheck < 16) return; // Throttle to ~60fps
        lastMouseCheck = now;

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Check if mouse is over any UFO
        let overUfo = false;
        const ufoLen = ufos.length;
        for (let i = 0; i < ufoLen; i++) {
            if (!ufos[i].exploded && ufos[i].containsPoint(mouseX, mouseY)) {
                overUfo = true;
                break;
            }
        }

        // Change cursor based on UFO hover
        if (overUfo) {
            foregroundCanvas.classList.add('ufo-hover');
        } else {
            foregroundCanvas.classList.remove('ufo-hover');
        }
    });
}

// Start animation
animate();
