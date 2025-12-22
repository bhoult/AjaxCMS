/**
 * AjaxCMS Theme - Hope
 *
 * Animated canvas background theme for AjaxCMS providing visual effects and coordinated color schemes.
 *
 * Copyright (C) 2016-2025 Brandon Hoult
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Hope Theme - Trees that grow from bottom, with a chapel among them
 */

(function() {
    'use strict';

    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    // Create a separate canvas for leaves (so we can clear them without affecting branches)
    const leafCanvas = document.createElement('canvas');
    leafCanvas.style.position = 'fixed';
    leafCanvas.style.top = '0';
    leafCanvas.style.left = '0';
    leafCanvas.style.width = '100%';
    leafCanvas.style.height = '100%';
    leafCanvas.style.pointerEvents = 'none';
    leafCanvas.style.zIndex = '-1';
    canvas.parentNode.insertBefore(leafCanvas, canvas.nextSibling);
    const leafCtx = leafCanvas.getContext('2d');


    // Canvas dimensions
    let width, height;

    // Height map for O(1) leaf collision detection (replaces slow getImageData)
    // Tracks the highest settled leaf at each x coordinate
    let leafHeightMap = null;

    // Content rectangles for collision detection
    let contentRects = [];

    // Active growth tips - only track points that are currently growing
    let growthTips = [];

    // Leaves - grow at the end of branches
    let leaves = [];
    let unsettledLeafCount = 0;  // Track unsettled leaves to avoid iterating all leaves


    // Tree generation tracking
    let totalTreesCreated = 0;       // Total number of trees created so far
    let targetTreeCount = 0;         // Random target between minTrees and maxTrees
    let pendingTreeTimers = [];      // Array of pause timers for each pending tree

    // Detect mobile devices (function to allow dynamic checking on resize)
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
               || window.innerWidth <= 768;
    }

    // Configuration
    const config = {
        // === TREE POPULATION ===
        minTrees: isMobile() ? 1 : 3,              // Minimum number of trees to create (1/3 on mobile)
        maxTrees: isMobile() ? 6 : 18,             // Maximum number of trees to create (1/3 on mobile)
        minTreePause: 100,           // Minimum frames to pause between tree finish and new tree start
        maxTreePause: 700,           // Maximum frames to pause between tree finish and new tree start

        // === ANIMATION SPEED ===
        growthSpeed: 2,              // Pixels per frame
        targetFps: 30,               // Target frame rate (0 = unlimited/native refresh rate)
        preRenderFrames: 10,         // Number of frames to pre-render before animation starts

        // === PAGE TRANSITION ===
        fadeInSpeed: 0.02,           // Opacity increase per frame when fading in (0.01 = slow, 0.05 = fast)
        fadeOutSpeed: 0.02,          // Opacity decrease per frame when fading out (0.01 = slow, 0.05 = fast)

        // === DEBUG ===
        enableDebugLogging: false,   // Enable console logging for debugging (set to false for production)
        showFpsCounter: false,        // Show FPS counter overlay (set to false for production)

        // === MOBILE ===
        enableContentCollision: !isMobile(),  // Disable content collision detection on mobile for performance

        // === VISUAL ===
        backgroundColor: '#97e2ffff',      // Sky blue background color (top of gradient)
        backgroundGradientHeight: isMobile() ? 400 : 800,   // Height in pixels where gradient fades to white (half on mobile)

        // === TRUNK PROPERTIES (Generation 0) ===
        minTrunkHeight: 50,          // Minimum trunk age before first fork (generation 0)
        maxTrunkHeight: 450,         // Maximum trunk age before first fork (generation 0) - fork age randomly chosen between min and max
        initialMinWidth: 1,          // Minimum initial trunk width
        initialMaxWidth: 55,         // Maximum initial trunk width (based on distance to content)
        trunkWidthLookAhead: 10,     // Horizontal distance (pixels) to check for content above when calculating initial trunk width
        trunkWidthDistanceScale: 0.8,// Multiplier for distance-based width scaling (1.0 = no scaling at full page height, 0.5x at half height, etc. Higher values = less aggressive scaling)
        upwardBias: -0.8,            // Negative Y velocity (upward)
        horizontalVariance: 0.3,     // Random horizontal movement

        // === BRANCH FORKING ===
        forkChance: 0.02,           // Chance to fork per frame (for branches, not trunks)
        minForkAge: 45,              // Minimum age before forking (branches after trunk)
        maxForkAge: 120,             // Maximum age before forced forking (branches after trunk)
        minBranchAngle: 15,          // Minimum fork angle in degrees
        maxBranchAngle: 35,          // Maximum fork angle in degrees
        minBranchWidthRatio: 0.7,    // Minimum branch width as ratio of parent
        maxBranchWidthRatio: 0.9,    // Maximum branch width as ratio of parent
        branchOffsetRatio: 0.3,      // How far from parent center to position branches (0.5 = edge, 0 = center, 1 = beyond edge)
        branchCurvature: 0.05,       // Amount of natural curve/waviness in branches (0 = straight, higher = more curved)
        curvatureFrequency: 0.5,     // Noise sampling scale along age axis (lower = more frequent direction changes, higher = smoother curves)

        // === TWIG SPROUTING ===
        twigChance: 0.03,            // Chance to sprout a twig per frame
        minTwigAge: 20,              // Minimum age before branch can sprout twigs
        minTwigWidthRatio: 0.1,      // Minimum twig width as ratio of parent branch
        maxTwigWidthRatio: 0.2,      // Maximum twig width as ratio of parent branch
        minTwigAngle: 30,            // Minimum twig angle from parent direction (degrees)
        maxTwigAngle: 80,            // Maximum twig angle from parent direction (degrees)
        twigAttenuationMultiplier: 3.0, // Multiplier for twig width attenuation (higher = twigs thin faster)

        // === WIDTH/THICKNESS ===
        minWidth: 0.01,              // Stop growing when width is nearly invisible
        widthAttenuation: 0.015,     // Natural width reduction per frame (reduced from 0.03 for taller trees)
        generationAttenuationRatio: 0.2, // Attenuation multiplier per generation (<1 = slower for smaller branches, >1 = faster)

        // === CONTENT AVOIDANCE ===
        bendingRange: 100,           // Distance from content where bending/avoidance begins
        bendStrength: 0.02,          // How much to bend away from content
        attenuationRange: 200,       // Distance from content where width reduction begins
        widthReduction: 1,         // Width reduction when near content
        widthReductionConeAngle: 90, // Cone angle in degrees for detecting content ahead (0-180)

        // === VISUAL EFFECTS ===
        branchFade: 7,               // Number of frames to fade in new branches (0 to 100% opacity)
        color: 'rgba(230, 194, 161, 0.85)', // Brown tree color (darker and more opaque)

        // === LEAF PROPERTIES ===
        minLeavesPerBranch: 2,       // Minimum number of leaves to spawn at branch end
        maxLeavesPerBranch: 5,       // Maximum number of leaves to spawn at branch end
        leafGrowthRate: 0.03,         // Pixels per frame that leaves grow
        minLeafSize: 8,              // Minimum leaf size (width)
        maxLeafSize: 20,             // Maximum leaf size (width)
        leafColor: 'rgba(100, 180, 100, 0.9)', // Darker, more opaque green leaf color
        leafBrightnessVariation: 0.3, // How much leaves vary in brightness (0 = all same, 0.3 = ±30% variation)

        // === FALL/AUTUMN EFFECT ===
        enableFall: true,            // Enable autumn fall effect after animation completes
        colorChangeDelayMin: 160,     // Minimum frames to wait before leaf starts changing color
        colorChangeDelayMax: 1600,    // Maximum frames to wait before leaf starts changing color
        colorChangeRateMin: 0.0005,   // Minimum speed of color transition (slower change)
        colorChangeRateMax: 0.001,    // Maximum speed of color transition (faster change)
        fallDelayMin: 0,             // Minimum additional frames to wait after color change before falling
        fallDelayMax: 1500,            // Maximum additional frames to wait after color change before falling
        fallColors: [                // Possible fall colors (randomly chosen)
            'rgba(180, 50, 50, 0.9)',   // Red
            'rgba(200, 100, 50, 0.9)',  // Orange-red
            'rgba(150, 100, 50, 0.9)',  // Brown
            'rgba(224, 201, 84, 0.9)'   // Golden brown
        ],
        fallGravity: 0.007,           // Downward acceleration when falling
        maxFallSpeed: 2.5,           // Maximum downward velocity (terminal velocity)
        fallDriftSpeed: 1.0,         // Maximum horizontal drift speed
        fallRotationSpeed: 0.05,     // Rotation speed while falling
        maxLeafPileHeight: 50,       // Maximum height from bottom where leaves can pile (prevents infinite piling)

        // === CHAPEL ===
        chapelEnabled: true,         // Show the chapel image
        chapelImage: 'themes/hope/hope_chapel.png',  // Path to chapel image
        chapelWidthPercent: 50,      // Max width of chapel as percentage of screen width
        chapelHeightPercent: 80,     // Max height of chapel as percentage of screen height
        chapelOffsetX: 0.85,          // Horizontal position (0 = left edge, 0.5 = center, 1 = right edge)
        chapelOffsetY: -30             // Vertical offset in pixels (positive = up, negative = down)
    };

    let frameCount = 0;
    let animationComplete = false;  // Track when growth animation finishes
    let isFadingIn = true;           // Track when fading in after asset load
    let isFadingOut = false;         // Track when fading out for page transition
    let canvasOpacity = 0;           // Current opacity of canvases (start at 0 for fade-in)
    let lastPageChange = 0;          // Timestamp of last page change to debounce
    let animationFrameId = null;     // Store requestAnimationFrame ID
    let initTime = 0;                // Timestamp when theme was initialized (for grace period)
    let assetsLoaded = false;        // Track if all assets are preloaded

    // Pre-parsed colors for performance (avoid regex in animation loop)
    let parsedLeafColor = null;
    let parsedFallColors = [];
    let parsedBranchColor = null;

    // FPS tracking
    let fpsStartTime = performance.now();
    let fpsLastTime = performance.now();
    let fpsFrameCount = 0;
    let currentFps = 0;
    let minFps = Infinity;
    let fpsElement = null;
    let lastFrameTime = 0;
    let frameTime = 0;
    let lastUpdateTime = 0;  // For frame rate limiting

    /**
     * Simple Perlin-like noise implementation for smooth randomness
     */
    class NoiseGenerator {
        constructor() {
            // Create permutation table for noise
            this.permutation = [];
            for (let i = 0; i < 256; i++) {
                this.permutation[i] = i;
            }
            // Shuffle using simple random (seeded by time for consistency per session)
            for (let i = 255; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
            }
            // Duplicate for wrapping
            this.permutation = this.permutation.concat(this.permutation);
        }

        // Fade function for smooth interpolation
        fade(t) {
            return t * t * t * (t * (t * 6 - 15) + 10);
        }

        // Linear interpolation
        lerp(t, a, b) {
            return a + t * (b - a);
        }

        // Gradient function
        grad(hash, x, y) {
            const h = hash & 3;
            const u = h < 2 ? x : y;
            const v = h < 2 ? y : x;
            return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
        }

        // 2D Perlin noise
        noise2D(x, y) {
            // Find unit grid cell containing point
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;

            // Get relative coordinates within cell
            x -= Math.floor(x);
            y -= Math.floor(y);

            // Compute fade curves
            const u = this.fade(x);
            const v = this.fade(y);

            // Hash coordinates of 4 cube corners
            const a = this.permutation[X] + Y;
            const b = this.permutation[X + 1] + Y;

            // Blend results from 4 corners
            return this.lerp(v,
                this.lerp(u,
                    this.grad(this.permutation[a], x, y),
                    this.grad(this.permutation[b], x - 1, y)
                ),
                this.lerp(u,
                    this.grad(this.permutation[a + 1], x, y - 1),
                    this.grad(this.permutation[b + 1], x - 1, y - 1)
                )
            );
        }
    }

    // Create noise generator instance
    const noise = new NoiseGenerator();

    /**
     * Parse RGBA color string into components (optimization: avoid regex in animation loop)
     */
    function parseColor(colorString) {
        const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: parseFloat(match[4])
        };
    }

    /**
     * Get actual text boundaries for collision detection
     */
    function getTextBoundaries(element) {
        const rects = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            const range = document.createRange();
            range.selectNodeContents(node);
            const clientRects = range.getClientRects();

            for (let i = 0; i < clientRects.length; i++) {
                const rect = clientRects[i];
                if (rect.width > 0 && rect.height > 0) {
                    rects.push({
                        left: rect.left,
                        right: rect.right,
                        top: rect.top,
                        bottom: rect.bottom
                    });
                }
            }
        }

        return rects;
    }

    /**
     * Detect all content boundaries on the page
     */
    function detectContentBoundaries() {
        const oldCount = contentRects.length;
        contentRects = [];

        // Get all visible text-containing elements
        const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LI', 'TD', 'TH', 'LABEL', 'BUTTON', 'TIME', 'STRONG', 'B', 'I', 'EM'];

        textTags.forEach(tag => {
            const elements = document.querySelectorAll(tag);
            elements.forEach(element => {
                // Skip if element is not visible
                if (element.offsetParent === null) {
                    return;
                }

                // Skip canvas and background containers
                if (element.id === 'background' || element.id === 'background-div') {
                    return;
                }

                const rects = getTextBoundaries(element);
                contentRects.push(...rects);
            });
        });

        // Add images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.offsetWidth > 0 && img.offsetHeight > 0 && img.offsetParent !== null) {
                const rect = img.getBoundingClientRect();
                contentRects.push({
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom
                });
            }
        });

        // Add chapel to boundaries (fixed positioned elements have offsetParent === null)
        if (config.chapelEnabled) {
            const chapel = document.getElementById('chapel-image');
            if (chapel && chapel.offsetWidth > 0 && chapel.offsetHeight > 0) {
                const rect = chapel.getBoundingClientRect();
                contentRects.push({
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom
                });
            }
        }

        if (contentRects.length !== oldCount) {
            if (config.enableDebugLogging) console.log('Content boundaries updated:', oldCount, '->', contentRects.length, 'rectangles');
        }
    }

    /**
     * Get vertical distance to nearest content directly above a point
     * Checks content within trunkWidthLookAhead pixels left/right of position
     * Used for determining initial trunk width based on vertical clearance
     */
    function getDistanceToContentAbove(x, y) {
        let minDistance = Infinity;

        for (let rect of contentRects) {
            // Only consider content that is above this point
            if (rect.bottom < y) {
                // Check if content overlaps with horizontal search range (x ± trunkWidthLookAhead)
                const searchLeft = x - config.trunkWidthLookAhead;
                const searchRight = x + config.trunkWidthLookAhead;

                // Content overlaps if: content.left <= searchRight AND content.right >= searchLeft
                if (rect.left <= searchRight && rect.right >= searchLeft) {
                    // Calculate vertical distance to bottom of rect
                    const distance = y - rect.bottom;
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }
            }
        }

        return minDistance;
    }

    /**
     * Get distance to nearest content in the direction of travel
     * Returns 0 if point is inside a content rectangle
     * Uses nearest edge distance like bending, with directional filtering
     */
    function getDistanceInDirection(x, y, vx, vy) {
        let minDistance = Infinity;

        // Normalize direction vector
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed === 0) return Infinity;

        const dirX = vx / speed;
        const dirY = vy / speed;

        // Calculate alignment threshold from cone angle
        // Cone angle is the full angle, so half-angle on each side
        const halfConeAngle = config.widthReductionConeAngle / 2;
        const alignmentThreshold = Math.cos(halfConeAngle * Math.PI / 180);

        for (let rect of contentRects) {
            // Check if point is inside the bounding box
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return 0;  // Inside content - maximum avoidance
            }

            // Calculate distance to nearest edge of rectangle (same as bending)
            const closestX = Math.max(rect.left, Math.min(x, rect.right));
            const closestY = Math.max(rect.top, Math.min(y, rect.bottom));
            const toContentX = closestX - x;
            const toContentY = closestY - y;

            // Calculate dot product to see if content is ahead in direction of travel
            const dotProduct = toContentX * dirX + toContentY * dirY;

            // Only consider content that is ahead (dot product > 0)
            if (dotProduct > 0) {
                // Calculate actual distance to nearest edge
                const distance = Math.sqrt(toContentX * toContentX + toContentY * toContentY);

                // Weight distance by alignment - content directly ahead matters more
                // Alignment is dot product / distance (cosine of angle, ranges from 0 to 1)
                const alignment = dotProduct / distance;

                // Only consider if within cone angle
                if (alignment > alignmentThreshold) {
                    const weightedDistance = distance * (2 - alignment); // Closer alignment = lower distance
                    if (weightedDistance < minDistance) {
                        minDistance = weightedDistance;
                    }
                }
            }
        }

        return minDistance;
    }

    /**
     * Create a new growth tip
     */
    function createTip(x, y, vx, vy, width, parentX, parentY, generation, trunkForkAge, isTwig) {
        const gen = generation || 0;
        const tip = {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            width: width,
            initialWidth: width,  // Track starting width for fade scaling
            age: 0,
            parentX: parentX || x,
            parentY: parentY || y,
            generation: gen,  // Track branch depth for attenuation
            isTwig: isTwig || false  // Track if this is a twig (for special forking rules)
        };

        // For trunks (generation 0), use provided fork age (distance-scaled) or random default
        if (gen === 0) {
            tip.trunkForkAge = trunkForkAge !== undefined
                ? trunkForkAge
                : config.minTrunkHeight + Math.random() * (config.maxTrunkHeight - config.minTrunkHeight);
        }

        return tip;
    }

    /**
     * Create leaves at the end of a dying branch
     */
    function spawnLeaves(x, y) {
        const numLeaves = config.minLeavesPerBranch +
            Math.floor(Math.random() * (config.maxLeavesPerBranch - config.minLeavesPerBranch + 1));

        for (let i = 0; i < numLeaves; i++) {
            // Random target size for this leaf
            const targetSize = config.minLeafSize + Math.random() * (config.maxLeafSize - config.minLeafSize);

            // Each leaf angle varies randomly around the branch tip
            const leafAngle = Math.random() * Math.PI * 2; // Full 360° variation

            // Position at branch tip
            const leafX = x;
            const leafY = y;

            // Random brightness variation (1.0 ± variation)
            const brightnessMultiplier = 1.0 + (Math.random() - 0.5) * 2 * config.leafBrightnessVariation;

            // Choose random fall color for this leaf (store parsed color reference for performance)
            const fallColorIndex = Math.floor(Math.random() * parsedFallColors.length);

            // Random delays and rates for natural variation
            const colorChangeDelay = config.colorChangeDelayMin + Math.random() * (config.colorChangeDelayMax - config.colorChangeDelayMin);
            const colorChangeRate = config.colorChangeRateMin + Math.random() * (config.colorChangeRateMax - config.colorChangeRateMin);
            const fallDelay = config.fallDelayMin + Math.random() * (config.fallDelayMax - config.fallDelayMin);

            leaves.push({
                x: leafX,
                y: leafY,
                size: 0, // Start at 0 and grow
                targetSize: targetSize,
                angle: leafAngle,
                brightness: brightnessMultiplier,
                age: 0,
                // Fall properties
                colorChangeDelay: colorChangeDelay,    // Frames to wait before color starts changing
                colorChangeRate: colorChangeRate,      // Speed of color change for this leaf
                fallDelay: fallDelay,                  // Frames to wait after color change before falling
                fallColorIndex: fallColorIndex,        // Index into parsedFallColors array
                colorTransition: 0, // 0 = green, 1 = fall color
                isColorChanging: false,
                isFalling: false,
                isSettled: false,  // Track if leaf has settled on ground or another leaf
                fallVelocityY: 0,
                fallVelocityX: (Math.random() - 0.5) * config.fallDriftSpeed
            });
            unsettledLeafCount++;
        }
    }

    /**
     * Update and draw all leaves
     */
    function updateLeaves() {
        // Clear the leaf canvas each frame
        leafCtx.clearRect(0, 0, width, height);

        const newLeaves = [];

        for (let leaf of leaves) {
            // Skip physics/aging for settled leaves - just draw them
            if (leaf.isSettled) {
                // Draw settled leaf (uses cached color)
                if (leaf.size > 0.1) {
                    leafCtx.save();
                    leafCtx.translate(leaf.x, leaf.y);
                    leafCtx.rotate(leaf.angle);
                    leafCtx.fillStyle = leaf.cachedColor;
                    leafCtx.beginPath();
                    leafCtx.ellipse(leaf.size / 2, 0, leaf.size / 2, leaf.size * 0.25, 0, 0, Math.PI * 2);
                    leafCtx.fill();
                    leafCtx.restore();
                }
                newLeaves.push(leaf);
                continue;
            }

            // Grow leaf until it reaches target size
            if (leaf.size < leaf.targetSize) {
                leaf.size += config.leafGrowthRate;
                if (leaf.size > leaf.targetSize) {
                    leaf.size = leaf.targetSize;
                }
            }

            leaf.age++;

            // Fall effect logic (only if animation is complete and fall is enabled)
            if (config.enableFall && animationComplete) {
                // Start changing color after colorChangeDelay
                if (!leaf.isColorChanging && leaf.age >= leaf.colorChangeDelay) {
                    leaf.isColorChanging = true;
                }

                // Gradually change color
                if (leaf.isColorChanging && leaf.colorTransition < 1) {
                    leaf.colorTransition += leaf.colorChangeRate;
                    if (leaf.colorTransition >= 1) {
                        leaf.colorTransition = 1;
                        leaf.colorChangeCompleteAge = leaf.age; // Track when color change finished
                    }
                }

                // Start falling after color change completes and fallDelay passes
                if (leaf.colorTransition >= 1 && !leaf.isFalling) {
                    if (leaf.age >= leaf.colorChangeCompleteAge + leaf.fallDelay) {
                        leaf.isFalling = true;
                    }
                }

                // Apply falling physics
                if (leaf.isFalling && !leaf.isSettled) {
                    leaf.fallVelocityY += config.fallGravity;
                    // Cap at maximum fall speed (terminal velocity)
                    if (leaf.fallVelocityY > config.maxFallSpeed) {
                        leaf.fallVelocityY = config.maxFallSpeed;
                    }

                    const newY = leaf.y + leaf.fallVelocityY;
                    const newX = leaf.x + leaf.fallVelocityX;

                    // Check if leaf would hit the bottom or another leaf
                    let collided = false;
                    const minAllowedY = height - config.maxLeafPileHeight; // Minimum Y where leaves can settle

                    // Check ground collision
                    if (newY >= height - leaf.size) {
                        leaf.y = height - leaf.size;
                        leaf.isSettled = true;
                        unsettledLeafCount--;
                        leaf.fallVelocityY = 0;
                        leaf.fallVelocityX = 0;
                        collided = true;
                    }

                    // Check collision using height map (O(1) lookup, replaces slow getImageData)
                    if (!collided && newY >= minAllowedY - leaf.size) {
                        const checkX = Math.floor(Math.max(0, Math.min(width - 1, newX)));
                        const groundHeight = leafHeightMap[checkX];

                        // Check if leaf would hit the pile at this x position
                        if (newY + leaf.size / 2 >= groundHeight) {
                            const settleY = groundHeight - leaf.size / 2;

                            if (settleY >= minAllowedY) {
                                // Settle on top of existing leaves
                                leaf.y = settleY;
                                leaf.x = newX;
                                leaf.isSettled = true;
                                unsettledLeafCount--;
                                leaf.fallVelocityY = 0;
                                leaf.fallVelocityX = 0;
                                collided = true;
                            } else {
                                // Pile is too high - drift through to random position
                                if (!leaf.driftTargetY) {
                                    leaf.driftTargetY = minAllowedY + Math.random() * config.maxLeafPileHeight;
                                }
                                if (newY >= leaf.driftTargetY) {
                                    leaf.y = leaf.driftTargetY;
                                    leaf.x = newX;
                                    leaf.isSettled = true;
                                    unsettledLeafCount--;
                                    leaf.fallVelocityY = 0;
                                    leaf.fallVelocityX = 0;
                                    collided = true;
                                }
                            }
                        }
                    }

                    // If no collision, continue falling
                    if (!collided) {
                        leaf.y = newY;
                        leaf.x = newX;
                        leaf.angle += config.fallRotationSpeed; // Rotate while falling
                    }
                }
            }

            // Draw leaf as an ellipse (only if visible)
            if (leaf.size > 0.1) {
                leafCtx.save();
                leafCtx.translate(leaf.x, leaf.y);
                leafCtx.rotate(leaf.angle);

                // Use cached color for settled leaves, calculate for others
                if (!leaf.cachedColor) {
                    // Interpolate between green and fall color based on colorTransition
                    const fallColorParsed = parsedFallColors[leaf.fallColorIndex];

                    const greenR = parsedLeafColor.r * leaf.brightness;
                    const greenG = parsedLeafColor.g * leaf.brightness;
                    const greenB = parsedLeafColor.b * leaf.brightness;

                    const fallR = fallColorParsed.r * leaf.brightness;
                    const fallG = fallColorParsed.g * leaf.brightness;
                    const fallB = fallColorParsed.b * leaf.brightness;

                    const r = Math.min(255, Math.floor(greenR + (fallR - greenR) * leaf.colorTransition));
                    const g = Math.min(255, Math.floor(greenG + (fallG - greenG) * leaf.colorTransition));
                    const b = Math.min(255, Math.floor(greenB + (fallB - greenB) * leaf.colorTransition));
                    const a = parsedLeafColor.a;

                    const colorStr = `rgba(${r}, ${g}, ${b}, ${a})`;

                    // Cache color once leaf is settled (no more changes)
                    if (leaf.isSettled) {
                        leaf.cachedColor = colorStr;
                    }

                    leafCtx.fillStyle = colorStr;
                } else {
                    leafCtx.fillStyle = leaf.cachedColor;
                }

                // Draw leaf shape
                leafCtx.beginPath();
                leafCtx.ellipse(leaf.size / 2, 0, leaf.size / 2, leaf.size * 0.25, 0, 0, Math.PI * 2);
                leafCtx.fill();

                leafCtx.restore();

                // Update height map when leaf settles (O(1) operation, replaces slow canvas drawing)
                if (leaf.isSettled && !leaf.addedToHeightMap) {
                    const leafX = Math.floor(leaf.x);
                    const leafTop = leaf.y - leaf.size / 2;
                    const leafWidth = Math.ceil(leaf.size);

                    // Update height map for the width of the leaf
                    for (let dx = -leafWidth / 2; dx <= leafWidth / 2; dx++) {
                        const x = Math.floor(leafX + dx);
                        if (x >= 0 && x < width && leafTop < leafHeightMap[x]) {
                            leafHeightMap[x] = leafTop;
                        }
                    }
                    leaf.addedToHeightMap = true;
                }
            }

            // Always keep leaf alive (even if not visible yet) unless it fell off screen
            newLeaves.push(leaf);
        }

        leaves = newLeaves;
    }

    /**
     * Initialize with starting trees and set random target
     */
    function initializeTrees() {
        growthTips = [];
        leaves = []; // Clear leaves when reinitializing
        unsettledLeafCount = 0; // Reset leaf counter
        animationComplete = false; // Reset animation state

        // Initialize height map for leaf collision detection
        // Each element represents the highest (lowest Y value) settled leaf at that x coordinate
        // Start at ground level (height = bottom of screen)
        leafHeightMap = new Float32Array(width);
        leafHeightMap.fill(height);

        // Set random target number of trees to create
        targetTreeCount = config.minTrees + Math.floor(Math.random() * (config.maxTrees - config.minTrees + 1));
        totalTreesCreated = 0;

        if (config.enableDebugLogging) console.log('Target tree count:', targetTreeCount);

        // Start with minTrees
        for (let i = 0; i < config.minTrees; i++) {
            createNewTree();
        }
    }

    /**
     * Create a new tree at the bottom
     */
    function createNewTree() {
        const x = Math.random() * width;
        const y = height; // Start at bottom

        // Calculate initial width based on distance to content directly above
        const distanceToContent = getDistanceToContentAbove(x, y);

        // Start with random width between min and max
        const baseWidth = config.initialMinWidth + Math.random() * (config.initialMaxWidth - config.initialMinWidth);

        // Scale based on distance - closer to content = scaled down more
        // Use page height as reference distance with configurable multiplier
        // If no content above (Infinity), use full width (scale = 1.0)
        const distanceScaleFactor = isFinite(distanceToContent)
            ? Math.min(1.0, (distanceToContent / height) * config.trunkWidthDistanceScale)
            : 1.0;

        // Apply distance scaling to the random base width
        const tipWidth = baseWidth * distanceScaleFactor;

        // Start with random trunk height between min and max
        const baseHeight = config.minTrunkHeight + Math.random() * (config.maxTrunkHeight - config.minTrunkHeight);

        // Apply same distance scaling to trunk height (closer to content = shorter trunk)
        const trunkHeight = baseHeight * distanceScaleFactor;

        const vx = (Math.random() - 0.5) * config.horizontalVariance;
        const vy = config.upwardBias;

        growthTips.push(createTip(x, y, vx, vy, tipWidth, x, y, 0, trunkHeight));
        totalTreesCreated++;
    }

    /**
     * Update and draw all growth tips
     */
    function updateGrowth() {
        const newTips = [];
        let avoidanceCount = 0;

        for (let tip of growthTips) {
            // Store old position for drawing
            const oldX = tip.x;
            const oldY = tip.y;

            // Check distance in direction of travel for both bending and width reduction
            const distanceAhead = getDistanceInDirection(tip.x, tip.y, tip.vx, tip.vy);

            const bendingFactor = distanceAhead < config.bendingRange
                ? 1 - (distanceAhead / config.bendingRange)
                : 0;

            const attenuationFactor = distanceAhead < config.attenuationRange
                ? 1 - (distanceAhead / config.attenuationRange)
                : 0;

            // If we're within the bending range, start avoiding (only if content collision is enabled)
            if (config.enableContentCollision && distanceAhead < config.bendingRange) {
                // Find which direction to avoid
                let nearestRect = null;
                let minDist = Infinity;

                for (let rect of contentRects) {
                    const centerX = (rect.left + rect.right) / 2;
                    const centerY = (rect.top + rect.bottom) / 2;
                    const dx = centerX - tip.x;
                    const dy = centerY - tip.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < minDist) {
                        minDist = dist;
                        nearestRect = rect;
                    }
                }

                if (nearestRect) {
                    avoidanceCount++;

                    // Calculate direction to content center
                    const centerX = (nearestRect.left + nearestRect.right) / 2;
                    const dx = centerX - tip.x;

                    // Determine which side(s) we're approaching from
                    const approachingFromLeft = tip.x < nearestRect.left;
                    const approachingFromRight = tip.x > nearestRect.right;
                    const approachingFromBottom = tip.y > nearestRect.bottom;
                    const approachingFromTop = tip.y < nearestRect.top;

                    // Check if tip is inside the bounding box
                    const insideRect = tip.x >= nearestRect.left && tip.x <= nearestRect.right &&
                                       tip.y >= nearestRect.top && tip.y <= nearestRect.bottom;

                    if (insideRect) {
                        // Inside content - push toward nearest edge (away from center)
                        const centerY = (nearestRect.top + nearestRect.bottom) / 2;
                        const dy = centerY - tip.y;

                        // Push away from center in both directions
                        const directionX = dx < 0 ? 1 : -1;  // Away from center
                        const directionY = dy < 0 ? 1 : -1;  // Away from center
                        tip.vx += directionX * config.bendStrength * bendingFactor * 2;  // Stronger push when inside
                        tip.vy += directionY * config.bendStrength * bendingFactor * 2;
                    } else {
                        // Apply avoidance forces away from content (scaled by bendingFactor)
                        if (approachingFromLeft || approachingFromRight) {
                            // Approaching horizontally - push away horizontally
                            const directionX = approachingFromLeft ? -1 : 1;
                            tip.vx += directionX * config.bendStrength * bendingFactor;
                        } else {
                            // Inside horizontal bounds - use distance to determine direction
                            const directionX = dx < 0 ? -1 : 1;
                            tip.vx += directionX * config.bendStrength * bendingFactor;
                        }

                        if (approachingFromBottom || approachingFromTop) {
                            // Approaching vertically - push away vertically
                            const directionY = approachingFromBottom ? 1 : -1;
                            tip.vy += directionY * config.bendStrength * bendingFactor;
                        } else {
                            // Inside vertical bounds - push away from center
                            const centerY = (nearestRect.top + nearestRect.bottom) / 2;
                            const dy = centerY - tip.y;
                            const directionY = dy < 0 ? -1 : 1;
                            tip.vy += directionY * config.bendStrength * bendingFactor;
                        }
                    }
                }
            }

            // Apply natural curvature using Perlin noise
            if (config.branchCurvature > 0) {
                // Use 2D Perlin noise with parent position and age
                // Each branch gets unique curves based on where it originated
                const noiseX = tip.parentX * 0.01;
                const noiseY = tip.age * config.curvatureFrequency;
                const noiseValue = noise.noise2D(noiseX, noiseY);

                // Scale noise output (-1 to 1) to desired curvature angle
                const curvatureAngle = noiseValue * config.branchCurvature;

                // Apply rotation to current velocity direction
                const currentAngle = Math.atan2(tip.vy, tip.vx);
                const newAngle = currentAngle + curvatureAngle;

                // Convert back to velocity components (unnormalized)
                const currentSpeed = Math.sqrt(tip.vx * tip.vx + tip.vy * tip.vy);
                tip.vx = Math.cos(newAngle) * currentSpeed;
                tip.vy = Math.sin(newAngle) * currentSpeed;
            }

            // Normalize velocity to maintain consistent speed
            const speed = Math.sqrt(tip.vx * tip.vx + tip.vy * tip.vy);
            if (speed > 0) {
                tip.vx = (tip.vx / speed) * config.growthSpeed;
                tip.vy = (tip.vy / speed) * config.growthSpeed;
            }

            // Update position
            tip.x += tip.vx;
            tip.y += tip.vy;
            tip.age++;

            // Natural width attenuation - controlled by generation ratio
            // Higher ratio = smaller branches thin faster (shorter)
            // Lower/negative ratio = smaller branches thin slower (longer)
            let attenuationRate = config.widthAttenuation * (1 + tip.generation * config.generationAttenuationRatio);

            // Apply twig attenuation multiplier if this is a twig
            if (tip.isTwig) {
                attenuationRate *= config.twigAttenuationMultiplier;
            }

            // Additional attenuation based on proximity to content ahead in direction of travel
            if (attenuationFactor > 0) {
                // Add extra attenuation when approaching content ahead
                // Uses configurable widthReduction parameter
                const proximityAttenuation = config.widthReduction * attenuationFactor;
                attenuationRate += proximityAttenuation;
            }

            tip.width -= attenuationRate;

            // Only draw if width is above sub-pixel threshold
            // This prevents rendering caps on invisible branches
            if (tip.width > 0.15 && isFinite(tip.x) && isFinite(tip.y) && isFinite(tip.width)) {
                // Calculate fade-in opacity based on age and initial width
                // Smaller branches fade faster than larger branches
                let opacity = 0.85; // Default full opacity
                if (config.branchFade > 0) {
                    // Scale fade duration based on branch width (larger = longer fade)
                    const widthRatio = tip.initialWidth / config.initialMaxWidth;
                    const fadeDuration = config.branchFade * widthRatio;

                    if (tip.age < fadeDuration) {
                        // Fade from 0 to 0.85 over scaled fade duration
                        opacity = 0.85 * (tip.age / fadeDuration);
                    }
                }

                // Use pre-parsed branch color for gradient shading
                const r = parsedBranchColor.r;
                const g = parsedBranchColor.g;
                const b = parsedBranchColor.b;

                // Create gradient - lighter on left, darker on right
                const gradient = ctx.createLinearGradient(
                    tip.x - tip.width / 2, tip.y,
                    tip.x + tip.width / 2, tip.y
                );
                gradient.addColorStop(0, `rgba(${Math.min(255, r * 1.2)}, ${Math.min(255, g * 1.2)}, ${Math.min(255, b * 1.2)}, ${opacity})`);
                gradient.addColorStop(1, `rgba(${r * 0.6}, ${g * 0.6}, ${b * 0.6}, ${opacity})`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = tip.width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(oldX, oldY);
                ctx.lineTo(tip.x, tip.y);
                ctx.stroke();
            }

            // Check if should sprout a twig (small side branch)
            if (tip.age > config.minTwigAge &&
                Math.random() < config.twigChance &&
                tip.width > config.minWidth * 3) {

                const currentAngle = Math.atan2(tip.vy, tip.vx);

                // Random twig width within configured ratio range
                const widthRange = config.maxTwigWidthRatio - config.minTwigWidthRatio;
                const twigWidthRatio = config.minTwigWidthRatio + Math.random() * widthRange;
                const twigWidth = tip.width * twigWidthRatio;

                // Random angle within configured range, randomly left or right
                const angleRange = config.maxTwigAngle - config.minTwigAngle;
                const twigAngleDeg = config.minTwigAngle + Math.random() * angleRange;
                const direction = Math.random() < 0.5 ? -1 : 1; // Random side
                const twigAngle = currentAngle + (direction * twigAngleDeg * Math.PI / 180);

                // Twig velocity
                const twigVx = Math.cos(twigAngle) * config.growthSpeed;
                const twigVy = Math.sin(twigAngle) * config.growthSpeed;

                // Position twig offset from parent center
                const parentOffset = tip.width * config.branchOffsetRatio;
                const twigX = tip.x + (direction * parentOffset);

                // Offset by twig radius in direction of travel
                const twigOffsetX = Math.cos(twigAngle) * (twigWidth / 2);
                const twigOffsetY = Math.sin(twigAngle) * (twigWidth / 2);

                // Spawn twig (same generation as parent - it's a side shoot, not a child)
                // Mark as twig for special forking rules
                newTips.push(createTip(
                    twigX + twigOffsetX, tip.y + twigOffsetY,
                    twigVx, twigVy,
                    twigWidth,
                    twigX, tip.y,
                    tip.generation,
                    undefined,  // trunkForkAge (not applicable for twigs)
                    true  // isTwig flag
                ));
            }

            // Calculate width ratio for forking
            const widthRatio = tip.width / config.initialMaxWidth; // 1.0 at base, decreases as it thins

            // Check if should fork - thinner branches fork much more often
            // Fork chance increases dramatically as width decreases (inverse relationship)
            const dynamicForkChance = config.forkChance * (5 - widthRatio * 4); // Much higher chance when thin

            // Check if should fork (twigs never fork)
            let shouldFork = false;
            if (!tip.isTwig) {
                if (tip.generation === 0) {
                    // Trunk: fork at predetermined random age (between min and max trunk height)
                    shouldFork = tip.age >= tip.trunkForkAge && tip.width > config.minWidth * 2;
                } else {
                    // Branch: probability-based with forced forking at max age
                    shouldFork = (tip.age > config.minForkAge &&
                                 Math.random() < dynamicForkChance &&
                                 tip.width > config.minWidth * 2) ||
                                (tip.age >= config.maxForkAge && tip.width > config.minWidth * 2);
                }
            }

            if (shouldFork) {
                // Create two new branches using configured width ratios
                const currentAngle = Math.atan2(tip.vy, tip.vx);
                const nextGeneration = tip.generation + 1;

                // Calculate branch widths using min/max ratio settings
                const widthRange = config.maxBranchWidthRatio - config.minBranchWidthRatio;
                const leftRatio = config.minBranchWidthRatio + Math.random() * widthRange;
                const leftWidth = tip.width * leftRatio;

                const rightRatio = config.minBranchWidthRatio + Math.random() * widthRange;
                const rightWidth = tip.width * rightRatio;

                // Position branches based on configurable offset from parent center
                const parentOffset = tip.width * config.branchOffsetRatio;
                const leftX = tip.x - parentOffset + leftWidth / 2;
                const rightX = tip.x + parentOffset - rightWidth / 2;

                // Calculate random fork angles within configured range
                const angleRange = config.maxBranchAngle - config.minBranchAngle;
                const leftAngleDeg = config.minBranchAngle + Math.random() * angleRange;
                const rightAngleDeg = config.minBranchAngle + Math.random() * angleRange;

                // Left branch
                const leftAngle = currentAngle - (leftAngleDeg * Math.PI / 180);
                const leftVx = Math.cos(leftAngle) * config.growthSpeed;
                const leftVy = Math.sin(leftAngle) * config.growthSpeed;
                // Offset by branch radius in direction of travel
                const leftOffsetX = Math.cos(leftAngle) * (leftWidth / 2);
                const leftOffsetY = Math.sin(leftAngle) * (leftWidth / 2);
                newTips.push(createTip(
                    leftX + leftOffsetX, tip.y + leftOffsetY,
                    leftVx, leftVy,
                    leftWidth,
                    leftX, tip.y,
                    nextGeneration
                ));

                // Right branch
                const rightAngle = currentAngle + (rightAngleDeg * Math.PI / 180);
                const rightVx = Math.cos(rightAngle) * config.growthSpeed;
                const rightVy = Math.sin(rightAngle) * config.growthSpeed;
                // Offset by branch radius in direction of travel
                const rightOffsetX = Math.cos(rightAngle) * (rightWidth / 2);
                const rightOffsetY = Math.sin(rightAngle) * (rightWidth / 2);
                newTips.push(createTip(
                    rightX + rightOffsetX, tip.y + rightOffsetY,
                    rightVx, rightVy,
                    rightWidth,
                    rightX, tip.y,
                    nextGeneration
                ));

            } else if (tip.width > config.minWidth &&
                       tip.y > -50 &&
                       tip.y < height &&
                       tip.x > -50 &&
                       tip.x < width + 50) {
                // Keep growing if still viable and width is above invisible threshold
                newTips.push(tip);
            } else {
                // Branch is dying - spawn leaves at this position
                // Only spawn leaves for branches that are on-screen and died naturally (not off-screen)
                if (tip.y > -50 && tip.y < height + 50 &&
                    tip.x > -50 && tip.x < width + 50) {
                    spawnLeaves(tip.x, tip.y);
                }
            }
        }

        // Count generation-0 tips (trees) before and after, excluding twigs
        const oldTreeCount = growthTips.filter(tip => tip.generation === 0 && !tip.isTwig).length;
        const newTreeCount = newTips.filter(tip => tip.generation === 0 && !tip.isTwig).length;
        const treesFinished = oldTreeCount - newTreeCount;

        growthTips = newTips;

        // Log avoidance activity every 60 frames
        if (config.enableDebugLogging && frameCount % 60 === 0 && avoidanceCount > 0) {
            console.log('Frame', frameCount, '- Avoiding content:', avoidanceCount, 'tips,', contentRects.length, 'content rects');
        }

        // Debug: log status every 100 frames
        if (config.enableDebugLogging && frameCount % 100 === 0) {
            console.log('Frame', frameCount, '- growthTips:', growthTips.length, 'pendingTimers:', pendingTreeTimers.length, 'created:', totalTreesCreated, '/', targetTreeCount);
        }

        // When trees finish, create individual pause timers for each one
        if (treesFinished > 0 && totalTreesCreated < targetTreeCount) {
            const treesToQueue = Math.min(treesFinished, targetTreeCount - totalTreesCreated);

            for (let i = 0; i < treesToQueue; i++) {
                const randomPause = Math.floor(config.minTreePause + Math.random() * (config.maxTreePause - config.minTreePause));
                pendingTreeTimers.push(randomPause);
                if (config.enableDebugLogging) console.log('Tree finished! Starting pause for', randomPause, 'frames. Total pending:', pendingTreeTimers.length);
            }
        }

        // Decrement all pause timers and create trees when they expire
        const newTimers = [];
        for (let timer of pendingTreeTimers) {
            timer--;
            if (timer <= 0) {
                if (config.enableDebugLogging) console.log('Pause ended! Creating new tree. Total created:', totalTreesCreated + 1, '/', targetTreeCount);
                createNewTree();
            } else {
                newTimers.push(timer);
            }
        }
        pendingTreeTimers = newTimers;

        // Check if growth animation should end
        if (totalTreesCreated >= targetTreeCount && growthTips.length === 0 && pendingTreeTimers.length === 0) {
            if (!animationComplete) {
                if (config.enableDebugLogging) {
                    console.log('Growth animation complete! Created', totalTreesCreated, 'trees (target:', targetTreeCount + ')');
                    console.log('Leaves will now begin falling...');
                }
                animationComplete = true;
            }
            // Don't stop - continue for fall effect
        }

        frameCount++;
        return true; // Continue animation
    }

    /**
     * Start fading out the canvases for page transition
     */
    function startFadeOut() {
        if (!isFadingOut) {
            if (config.enableDebugLogging) console.log('Starting canvas fade out for page transition');
            isFadingOut = true;
            // Restart animation loop if it was stopped
            if (animationFrameId === null) {
                animationFrameId = requestAnimationFrame(animate);
            }
        }
    }

    /**
     * Create and update FPS counter display
     */
    function updateFpsCounter() {
        if (!config.showFpsCounter) return;

        fpsFrameCount++;
        const now = performance.now();
        const elapsed = now - fpsLastTime;

        // Update FPS calculation every 500ms for stability
        if (elapsed >= 500) {
            currentFps = Math.round((fpsFrameCount * 1000) / elapsed);
            // Only track min FPS after 3 seconds to ignore initialization
            if (currentFps > 0 && currentFps < minFps && (now - fpsStartTime) > 3000) {
                minFps = currentFps;
            }
            fpsFrameCount = 0;
            fpsLastTime = now;

            // Create FPS element if it doesn't exist
            if (!fpsElement) {
                fpsElement = document.createElement('div');
                fpsElement.id = 'growth-fps-counter';
                fpsElement.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: black;
                    color: white;
                    font-family: monospace;
                    font-size: 12px;
                    padding: 8px 10px;
                    z-index: 10000;
                    pointer-events: none;
                    line-height: 1.5;
                    text-shadow: none;
                `;
                document.body.appendChild(fpsElement);
            }

            const minDisplay = minFps === Infinity ? '--' : minFps;
            fpsElement.innerHTML = `
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 2px;">${currentFps} FPS</div>
                <div>Min: ${minDisplay}</div>
                <div>Frame: ${frameTime.toFixed(1)}ms</div>
                <div>Tips: ${growthTips.length}</div>
                <div>Leaves: ${leaves.length}</div>
            `;
        }
    }

    /**
     * Preload all assets (images) before starting animation
     * Returns a Promise that resolves when all assets are loaded
     */
    function preloadAssets() {
        const assets = [];

        // Preload chapel image if enabled
        if (config.chapelEnabled && config.chapelImage) {
            assets.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    if (config.enableDebugLogging) console.log('Chapel image preloaded');
                    resolve(img);
                };
                img.onerror = () => {
                    console.warn('Failed to preload chapel image:', config.chapelImage);
                    resolve(null);  // Resolve anyway to not block animation
                };
                img.src = config.chapelImage;
            }));
        }

        // Add more assets here as needed
        // assets.push(loadImage('path/to/image.png'));

        if (assets.length === 0) {
            return Promise.resolve();
        }

        return Promise.all(assets).then(() => {
            assetsLoaded = true;
            if (config.enableDebugLogging) console.log('All assets preloaded');
        });
    }

    /**
     * Create/update the chapel as a fixed HTML element (behind trees, like the gradient background)
     */
    function setupChapel() {
        if (!config.chapelEnabled) return;

        let chapelElement = document.getElementById('chapel-image');
        if (!chapelElement) {
            chapelElement = document.createElement('img');
            chapelElement.id = 'chapel-image';
            chapelElement.src = config.chapelImage;
            chapelElement.style.position = 'fixed';
            chapelElement.style.bottom = config.chapelOffsetY + 'px';
            chapelElement.style.zIndex = '-2';  // Behind trees (canvas is -1)
            chapelElement.style.pointerEvents = 'none';
            chapelElement.style.opacity = '0';  // Start hidden for fade-in
            document.body.appendChild(chapelElement);

            // Wait for image to load to get natural dimensions for aspect ratio
            chapelElement.onload = function() {
                updateChapelSize(chapelElement);
            };
        } else {
            updateChapelSize(chapelElement);
        }
    }

    /**
     * Update chapel size based on width and height constraints
     */
    function updateChapelSize(chapelElement) {
        // Get natural aspect ratio of the image
        const naturalWidth = chapelElement.naturalWidth || 1;
        const naturalHeight = chapelElement.naturalHeight || 1;
        const aspectRatio = naturalWidth / naturalHeight;

        // Calculate max dimensions based on percentage constraints
        const maxWidthPx = window.innerWidth * (config.chapelWidthPercent / 100);
        const maxHeightPx = window.innerHeight * (config.chapelHeightPercent / 100);

        // Calculate what dimensions would be if constrained by each
        const widthIfHeightConstrained = maxHeightPx * aspectRatio;
        const heightIfWidthConstrained = maxWidthPx / aspectRatio;

        // Use the smaller constraint to ensure both limits are respected
        let finalWidth, finalHeight;
        if (widthIfHeightConstrained <= maxWidthPx) {
            // Height is the limiting factor
            finalHeight = maxHeightPx;
            finalWidth = widthIfHeightConstrained;
        } else {
            // Width is the limiting factor
            finalWidth = maxWidthPx;
            finalHeight = heightIfWidthConstrained;
        }

        chapelElement.style.width = finalWidth + 'px';
        chapelElement.style.height = finalHeight + 'px';
        chapelElement.style.bottom = config.chapelOffsetY + 'px';  // Apply vertical offset

        // Position horizontally (centered on offsetX position)
        const leftPos = (window.innerWidth * config.chapelOffsetX) - (finalWidth / 2);
        chapelElement.style.left = leftPos + 'px';
    }

    /**
     * Animation loop - uses requestAnimationFrame for smooth, efficient rendering
     */
    function animate(timestamp) {
        // Schedule next frame first (ensures consistent timing)
        animationFrameId = requestAnimationFrame(animate);

        // Frame rate limiting using rAF timestamp (more accurate than performance.now)
        if (config.targetFps > 0) {
            const targetInterval = 1000 / config.targetFps;
            const elapsed = timestamp - lastUpdateTime;
            if (elapsed < targetInterval) {
                return; // Skip this frame
            }
            lastUpdateTime = timestamp - (elapsed % targetInterval); // Prevent drift
        }

        // Measure time between actual updates
        const now = performance.now();
        if (lastFrameTime > 0) {
            frameTime = now - lastFrameTime;
        }
        lastFrameTime = now;

        // Handle fade in after assets load
        if (isFadingIn) {
            canvasOpacity += config.fadeInSpeed;

            if (canvasOpacity >= 1) {
                canvasOpacity = 1;
                isFadingIn = false;
                if (config.enableDebugLogging) console.log('Fade in complete');
            }

            // Apply opacity to all elements
            canvas.style.opacity = canvasOpacity.toString();
            leafCanvas.style.opacity = canvasOpacity.toString();
            const chapel = document.getElementById('chapel-image');
            if (chapel) chapel.style.opacity = canvasOpacity.toString();
            const gradient = document.getElementById('gradient-background');
            if (gradient) gradient.style.opacity = canvasOpacity.toString();
        }

        // Handle fade out for page transitions
        if (isFadingOut) {
            canvasOpacity -= config.fadeOutSpeed;

            // Apply opacity to all elements
            const opacityStr = Math.max(0, canvasOpacity).toString();
            canvas.style.opacity = opacityStr;
            leafCanvas.style.opacity = opacityStr;
            const chapelFade = document.getElementById('chapel-image');
            if (chapelFade) chapelFade.style.opacity = opacityStr;
            const gradientFade = document.getElementById('gradient-background');
            if (gradientFade) gradientFade.style.opacity = opacityStr;

            if (canvasOpacity <= 0) {
                canvasOpacity = 0;

                // Clear both canvases and reinitialize
                if (config.enableDebugLogging) console.log('Fade out complete. Reinitializing...');
                ctx.clearRect(0, 0, width, height);
                leafCtx.clearRect(0, 0, width, height);
                initializeTrees();

                // Start fade in
                isFadingOut = false;
                isFadingIn = true;
                return;
            }
            return;
        }

        updateGrowth();
        updateLeaves();
        updateFpsCounter();

        // Check if animation should stop (growth complete and all leaves settled)
        if (animationComplete && leaves.length > 0 && unsettledLeafCount === 0) {
            if (config.enableDebugLogging) console.log('All leaves have settled. Animation complete!');
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            return;
        }
    }

    /**
     * Resize canvas
     */
    function resize() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // On mobile, ignore small height changes (likely URL bar showing/hiding)
        // Only reinitialize if width changed or height changed significantly
        if (isMobile() && initialized) {
            const widthChanged = Math.abs(newWidth - width) > 10;
            const heightChanged = Math.abs(newHeight - height) > 150; // URL bar is typically 50-100px

            // If only height changed by a small amount, ignore it completely
            // Don't update canvas dimensions as that would clear the canvas
            if (!widthChanged && !heightChanged) {
                if (config.enableDebugLogging) console.log('Mobile resize ignored (likely URL bar), keeping current dimensions');
                return; // Don't change anything
            }
        }

        width = canvas.width = leafCanvas.width = newWidth;
        height = canvas.height = leafCanvas.height = newHeight;

        // Reposition chapel on resize
        setupChapel();

        // Only reinitialize trees if already initialized (not during first setup)
        if (initialized) {
            ctx.clearRect(0, 0, width, height);
            leafCtx.clearRect(0, 0, width, height);
            initializeTrees();
            if (config.enableDebugLogging) console.log('Resize triggered tree reinit');
        }
    }

    // Track if initialized to prevent double-init
    let initialized = false;

    /**
     * Initialize
     */
    function init() {
        if (initialized) {
            if (config.enableDebugLogging) console.log('Already initialized, skipping...');
            return;
        }

        if (config.enableDebugLogging) console.log('Hope theme initializing...');

        // Ensure document.body exists
        if (!document.body) {
            console.error('document.body not available yet');
            return;
        }

        // Set background gradient (or solid color if gradientHeight is 0)
        // Start with white background, gradient will fade in
        document.body.style.backgroundColor = 'white';

        if (config.backgroundGradientHeight > 0) {
            // Create HTML element to hold gradient background
            let gradientDiv = document.getElementById('gradient-background');
            if (!gradientDiv) {
                gradientDiv = document.createElement('div');
                gradientDiv.id = 'gradient-background';
                gradientDiv.style.position = 'fixed';
                gradientDiv.style.top = '0';
                gradientDiv.style.left = '0';
                gradientDiv.style.width = '100%';
                gradientDiv.style.height = '100vh';
                gradientDiv.style.zIndex = '-2';
                gradientDiv.style.pointerEvents = 'none';
                gradientDiv.style.opacity = '0';  // Start hidden for fade-in
                document.body.insertBefore(gradientDiv, document.body.firstChild);
                if (config.enableDebugLogging) console.log('Created gradient background div');
            }
            gradientDiv.style.background = `linear-gradient(to bottom, ${config.backgroundColor} 0%, white 100%)`;
            gradientDiv.style.height = `${config.backgroundGradientHeight}px`;
            if (config.enableDebugLogging) console.log('Applied gradient background');
        }

        // Set up chapel image (fixed element like gradient)
        setupChapel();

        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        if (!ctx) {
            console.error('Canvas context not found!');
            return;
        }


        // Parse colors once for performance (avoid regex in animation loop)
        parsedLeafColor = parseColor(config.leafColor);
        parsedFallColors = config.fallColors.map(parseColor);
        parsedBranchColor = parseColor(config.color);
        if (config.enableDebugLogging) console.log('Colors pre-parsed for performance');

        // Set canvas size and start hidden for fade-in
        width = canvas.width = leafCanvas.width = window.innerWidth;
        height = canvas.height = leafCanvas.height = window.innerHeight;
        canvas.style.opacity = '0';
        leafCanvas.style.opacity = '0';
        if (config.enableDebugLogging) console.log('Canvas size:', width, 'x', height);

        // Detect content boundaries BEFORE creating trees (only if collision detection is enabled)
        if (config.enableContentCollision) {
            detectContentBoundaries();
            if (config.enableDebugLogging) console.log('Initial content rectangles:', contentRects.length);
        }

        // Initialize trees (now with content boundaries available)
        initializeTrees();
        if (config.enableDebugLogging) console.log('Initial growth tips:', growthTips.length);

        // PRE-RENDER: Run frames instantly to show mature trees
        if (config.enableDebugLogging) console.log('Pre-rendering', config.preRenderFrames, 'frames...');
        for (let i = 0; i < config.preRenderFrames; i++) {
            updateGrowth();
            if (config.enableContentCollision && i % 100 === 0) {
                detectContentBoundaries(); // Update content detection during pre-render
            }
        }
        if (config.enableDebugLogging) console.log('Pre-render complete, active tips:', growthTips.length);

        // Mark as initialized after setup is complete
        initialized = true;
        initTime = Date.now();  // Record init time for grace period

        // Handle window resize
        window.addEventListener('resize', resize);

        // Observe page content changes for both fade out and content detection
        const contentA = document.getElementById('a');
        const contentB = document.getElementById('b');

        if (contentA && contentB) {
            const observerConfig = {
                childList: true,
                subtree: true,
                characterData: true
            };

            let contentDetectionTimeout = null;

            const pageChangeObserver = new MutationObserver((mutations) => {
                const now = Date.now();

                // Count significant changes (added/removed nodes)
                let significantChange = false;
                let totalNodesChanged = 0;

                for (let mutation of mutations) {
                    totalNodesChanged += mutation.addedNodes.length + mutation.removedNodes.length;
                }

                // Higher threshold on mobile to avoid false positives from scrolling
                // Desktop: 5 nodes, Mobile: 20 nodes (major page content change)
                const threshold = isMobile() ? 20 : 5;
                significantChange = totalNodesChanged >= threshold;

                // Trigger page fade out (debounced to 500ms, only on significant changes)
                // Skip during grace period after initialization (2 seconds) to avoid false triggers on page load
                const gracePeriod = 2000;
                if (significantChange && now - lastPageChange > 500 && now - initTime > gracePeriod) {
                    lastPageChange = now;
                    startFadeOut();
                }

                // Trigger content detection (debounced to 200ms to avoid excessive calls)
                if (config.enableContentCollision) {
                    if (contentDetectionTimeout) clearTimeout(contentDetectionTimeout);
                    contentDetectionTimeout = setTimeout(() => {
                        detectContentBoundaries();
                        contentDetectionTimeout = null;
                    }, 200);
                }
            });

            pageChangeObserver.observe(contentA, observerConfig);
            pageChangeObserver.observe(contentB, observerConfig);
            if (config.enableDebugLogging) console.log('Page change and content detection observer initialized');

            // Detect once more after 2 seconds (initial content may still be loading)
            if (config.enableContentCollision) {
                setTimeout(detectContentBoundaries, 2000);
            }
        }

        // Preload assets then start animation with fade-in
        if (config.enableDebugLogging) console.log('Preloading assets...');
        preloadAssets().then(() => {
            if (config.enableDebugLogging) console.log('Starting animation loop...');
            isFadingIn = true;
            canvasOpacity = 0;
            animationFrameId = requestAnimationFrame(animate);
        });
    }

    // Retry initialization if it fails
    let initRetryCount = 0;
    const maxInitRetries = 5;

    function tryInit() {
        if (initialized) {
            return; // Already initialized successfully
        }

        initRetryCount++;
        if (config.enableDebugLogging) console.log(`Attempting initialization (attempt ${initRetryCount}/${maxInitRetries})...`);

        // Check if document.body and canvas exist before calling init
        if (!document.body) {
            if (initRetryCount < maxInitRetries) {
                if (config.enableDebugLogging) console.log('document.body not ready, retrying in 500ms...');
                setTimeout(tryInit, 500);
            } else {
                console.error('Failed to initialize Growth theme: document.body not available after', maxInitRetries, 'attempts');
            }
            return;
        }

        if (!document.getElementById('background')) {
            if (initRetryCount < maxInitRetries) {
                if (config.enableDebugLogging) console.log('Canvas not found, retrying in 500ms...');
                setTimeout(tryInit, 500);
            } else {
                console.error('Failed to initialize Growth theme: canvas element not found after', maxInitRetries, 'attempts');
            }
            return;
        }

        init();

        // Verify initialization succeeded
        if (!initialized && initRetryCount < maxInitRetries) {
            if (config.enableDebugLogging) console.log('Initialization incomplete, retrying in 500ms...');
            setTimeout(tryInit, 500);
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(tryInit, 100);
        });
    } else {
        // DOM already loaded
        setTimeout(tryInit, 100);
    }

    // Also try on window load as backup
    window.addEventListener('load', function() {
        if (!initialized) {
            setTimeout(tryInit, 500);
        }
    });

    // Expose init function globally for manual initialization if needed
    window.growthThemeInit = tryInit;
})();
