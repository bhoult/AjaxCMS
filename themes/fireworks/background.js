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
const gravity = 0.05;
const fireworkChance = 0.02;

// Firework colors - vibrant combinations
const colorSchemes = [
    [[255, 50, 50], [255, 150, 50], [255, 255, 50]], // Red-Orange-Yellow
    [[50, 100, 255], [100, 200, 255], [200, 230, 255]], // Blue-Cyan-White
    [[255, 50, 150], [255, 100, 200], [255, 200, 255]], // Pink-Magenta
    [[50, 255, 50], [150, 255, 150], [200, 255, 200]], // Green
    [[200, 50, 255], [150, 100, 255], [220, 180, 255]], // Purple
    [[255, 255, 50], [255, 200, 50], [255, 150, 50]], // Gold
];

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
        const particleCount = Math.random() * 100 + 150;
        const explosionType = Math.random();

        for (let i = 0; i < particleCount; i++) {
            let angle, speed;

            if (explosionType < 0.3) {
                // Circular burst
                angle = (Math.PI * 2 * i) / particleCount;
                speed = Math.random() * 5 + 3;
            } else if (explosionType < 0.6) {
                // Random burst
                angle = Math.random() * Math.PI * 2;
                speed = Math.random() * 8 + 2;
            } else {
                // Ring burst
                angle = (Math.PI * 2 * i) / particleCount;
                speed = Math.random() * 2 + 6;
            }

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme));
        }

        // Add secondary explosions for some fireworks
        if (Math.random() < 0.3) {
            setTimeout(() => {
                const secondaryCount = 30;
                for (let i = 0; i < secondaryCount; i++) {
                    const angle = (Math.PI * 2 * i) / secondaryCount;
                    const speed = Math.random() * 3 + 2;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    particles.push(new Particle(this.x, this.y, vx, vy, this.colorScheme, true));
                }
            }, 500);
        }
    }
}

class Particle {
    constructor(x, y, vx, vy, colorScheme, isSecondary = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.color = colorScheme[Math.floor(Math.random() * colorScheme.length)];
        this.isSecondary = isSecondary;
        this.size = isSecondary ? 1.5 : 2.5;
        this.trail = [];

        // Streamer effect - some particles last longer
        if (Math.random() < 0.1) {
            this.decay *= 0.5;
            this.isStreamer = true;
        } else {
            this.isStreamer = false;
        }
    }

    update() {
        this.vy += gravity * 0.3; // Less gravity for particles
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98; // Air resistance
        this.vy *= 0.98;
        this.alpha -= this.decay;

        // Trail for streamers
        if (this.isStreamer) {
            this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.trail.length > 15) this.trail.shift();
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

        // Draw particle
        const glow = this.isStreamer ? 4 : 2;
        ctx.shadowBlur = glow;
        ctx.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.alpha})`;
        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    isDead() {
        return this.alpha <= 0;
    }
}

function animate() {
    // Fade previous frame for trail effect
    ctx.fillStyle = 'rgba(10, 10, 30, 0.1)';
    ctx.fillRect(0, 0, width, height);

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
});

// Initialize with dark sky
ctx.fillStyle = 'rgba(10, 10, 30, 1)';
ctx.fillRect(0, 0, width, height);

// Start animation
animate();
