/**
 * Growth Theme - Trees that grow from bottom, avoiding content areas
 */

(function() {
    'use strict';

    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    // Canvas dimensions
    let width, height;

    // Content rectangles for collision detection
    let contentRects = [];

    // Active growth tips - only track points that are currently growing
    let growthTips = [];

    // Configuration
    const config = {
        // === TREE POPULATION ===
        initialTips: 8,              // Number of trees to start with
        minTrees: 0,                 // Minimum number of trees (0 = allow all to die out)
        maxTrees: 100,               // Maximum number of trees (0 = unlimited)
        newTipInterval: 180,         // Frames between new trees

        // === ANIMATION SPEED ===
        growthSpeed: 1.5,            // Pixels per frame
        frameDelay: 1,               // Milliseconds between updates (0 = as fast as possible, 16 ≈ 60fps, 33 ≈ 30fps)
        preRenderFrames: 100,        // Number of frames to pre-render before animation starts

        // === TRUNK PROPERTIES (Generation 0) ===
        minTrunkHeight: 50,          // Minimum trunk age before first fork (generation 0)
        maxTrunkHeight: 200,         // Maximum trunk age before first fork (generation 0) - fork age randomly chosen between min and max
        initialMinWidth: 3,          // Minimum initial trunk width
        initialMaxWidth: 30,         // Maximum initial trunk width (based on distance to content)
        upwardBias: -0.8,            // Negative Y velocity (upward)
        horizontalVariance: 0.3,     // Random horizontal movement

        // === BRANCH FORKING ===
        forkChance: 0.008,           // Chance to fork per frame (for branches, not trunks)
        minForkAge: 15,              // Minimum age before forking (branches after trunk)
        maxForkAge: 100,             // Maximum age before forced forking (branches after trunk)
        minBranchAngle: 15,          // Minimum fork angle in degrees
        maxBranchAngle: 55,          // Maximum fork angle in degrees
        minBranchWidthRatio: 0.7,    // Minimum branch width as ratio of parent
        maxBranchWidthRatio: 0.9,    // Maximum branch width as ratio of parent
        branchOffsetRatio: 0.3,      // How far from parent center to position branches (0.5 = edge, 0 = center, 1 = beyond edge)

        // === WIDTH/THICKNESS ===
        minWidth: 0.01,              // Stop growing when width is nearly invisible
        widthAttenuation: 0.03,      // Natural width reduction per frame
        generationAttenuationRatio: 0.7, // Attenuation multiplier per generation (<1 = slower for smaller branches, >1 = faster)

        // === CONTENT AVOIDANCE ===
        contentBuffer: 60,           // Distance to start avoiding content
        bendStrength: 0.05,          // How much to bend away from content
        widthReduction: 0.9,         // Width reduction when near content
        widthReductionConeAngle: 90, // Cone angle in degrees for detecting content ahead (0-180)

        // === VISUAL EFFECTS ===
        branchFade: 7,               // Number of frames to fade in new branches (0 to 100% opacity)
        color: 'rgba(60, 40, 20, 0.85)' // Brown tree color (darker and more opaque)
    };

    let frameCount = 0;

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

        if (contentRects.length !== oldCount) {
            console.log('Content boundaries updated:', oldCount, '->', contentRects.length, 'rectangles');
        }
    }

    /**
     * Check if a point would collide with content
     * Returns { collision: boolean, directionX: -1|0|1 }
     */
    function checkCollision(x, y) {
        for (let rect of contentRects) {
            // Check if point is inside or very close to content
            const expandedBuffer = config.contentBuffer;
            if (x >= rect.left - expandedBuffer &&
                x <= rect.right + expandedBuffer &&
                y >= rect.top - expandedBuffer &&
                y <= rect.bottom + expandedBuffer) {

                // Determine which direction to go to avoid
                const centerX = (rect.left + rect.right) / 2;
                return {
                    collision: true,
                    directionX: x < centerX ? -1 : 1,
                    rect: rect
                };
            }
        }
        return { collision: false, directionX: 0 };
    }

    /**
     * Get distance to nearest content from a point
     */
    function getDistanceToNearestContent(x, y) {
        let minDistance = Infinity;

        for (let rect of contentRects) {
            // Calculate distance to rect center
            const centerX = (rect.left + rect.right) / 2;
            const centerY = (rect.top + rect.bottom) / 2;
            const dx = centerX - x;
            const dy = centerY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        return minDistance;
    }

    /**
     * Get distance to nearest content directly above a point
     */
    function getDistanceToContentAbove(x, y) {
        let minDistance = Infinity;

        for (let rect of contentRects) {
            // Only consider content that is above this point
            if (rect.bottom < y) {
                // Check if horizontally aligned (within the x range of the rect)
                if (x >= rect.left - 50 && x <= rect.right + 50) {
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
            // Calculate vector to rect center
            const centerX = (rect.left + rect.right) / 2;
            const centerY = (rect.top + rect.bottom) / 2;
            const toContentX = centerX - x;
            const toContentY = centerY - y;

            // Calculate dot product to see if content is ahead in direction of travel
            const dotProduct = toContentX * dirX + toContentY * dirY;

            // Only consider content that is ahead (dot product > 0)
            if (dotProduct > 0) {
                // Calculate actual distance
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
    function createTip(x, y, vx, vy, width, parentX, parentY, generation) {
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
            generation: gen  // Track branch depth for attenuation
        };

        // For trunks (generation 0), assign a random fork age between min and max trunk height
        if (gen === 0) {
            tip.trunkForkAge = config.minTrunkHeight +
                Math.random() * (config.maxTrunkHeight - config.minTrunkHeight);
        }

        return tip;
    }

    /**
     * Initialize with starting trees
     */
    function initializeTrees() {
        growthTips = [];

        for (let i = 0; i < config.initialTips; i++) {
            const x = Math.random() * width;
            const y = height; // Start at bottom

            // Calculate initial width based on distance to content directly above
            const distanceToContent = getDistanceToContentAbove(x, y);
            // Scale width directly proportional to distance - linear with no cap
            // If no content above (Infinity), use full initialMaxWidth
            const widthMultiplier = isFinite(distanceToContent) ? distanceToContent / 300 : 1.0;
            const scaledWidth = config.initialMaxWidth * widthMultiplier * (0.9 + Math.random() * 0.2);
            const tipWidth = Math.max(config.initialMinWidth, scaledWidth);

            const vx = (Math.random() - 0.5) * config.horizontalVariance;
            const vy = config.upwardBias;

            growthTips.push(createTip(x, y, vx, vy, tipWidth, x, y, 0));
        }
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

            // Check proximity to content - use for both avoidance and attenuation
            const proximityThreshold = config.contentBuffer * 6; // Start at 6x the buffer distance
            const distanceToContent = getDistanceToNearestContent(tip.x, tip.y);
            const proximityFactor = distanceToContent < proximityThreshold
                ? 1 - (distanceToContent / proximityThreshold)
                : 0;

            // Also check distance in direction of travel for width reduction
            const distanceAhead = getDistanceInDirection(tip.x, tip.y, tip.vx, tip.vy);
            const aheadProximityFactor = distanceAhead < proximityThreshold
                ? 1 - (distanceAhead / proximityThreshold)
                : 0;

            // If we're within the proximity threshold, start avoiding
            if (distanceToContent < proximityThreshold) {
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

                    // Apply avoidance forces away from content
                    if (approachingFromLeft || approachingFromRight) {
                        // Approaching horizontally - push away horizontally
                        const directionX = approachingFromLeft ? -1 : 1;
                        tip.vx += directionX * config.bendStrength * proximityFactor;
                    } else {
                        // Inside horizontal bounds - use distance to determine direction
                        const directionX = dx < 0 ? -1 : 1;
                        tip.vx += directionX * config.bendStrength * proximityFactor;
                    }

                    if (approachingFromBottom || approachingFromTop) {
                        // Approaching vertically - push away vertically
                        const directionY = approachingFromBottom ? 1 : -1;
                        tip.vy += directionY * config.bendStrength * proximityFactor;
                    }
                }
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

            // Additional attenuation based on proximity to content ahead in direction of travel
            if (aheadProximityFactor > 0) {
                // Add extra attenuation when approaching content ahead
                // Uses configurable widthReduction parameter
                const proximityAttenuation = config.widthReduction * aheadProximityFactor;
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

                // Create gradient for shading - lighter on left, darker on right
                const gradient = ctx.createLinearGradient(
                    tip.x - tip.width / 2, tip.y,
                    tip.x + tip.width / 2, tip.y
                );
                gradient.addColorStop(0, `rgba(80, 60, 40, ${opacity})`);  // Lighter left
                gradient.addColorStop(1, `rgba(40, 20, 10, ${opacity})`);  // Darker right

                ctx.strokeStyle = gradient;
                ctx.lineWidth = tip.width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(oldX, oldY);
                ctx.lineTo(tip.x, tip.y);
                ctx.stroke();
            }

            // Calculate width ratio for forking
            const widthRatio = tip.width / config.initialMaxWidth; // 1.0 at base, decreases as it thins

            // Check if should fork - thinner branches fork much more often
            // Fork chance increases dramatically as width decreases (inverse relationship)
            const dynamicForkChance = config.forkChance * (5 - widthRatio * 4); // Much higher chance when thin

            // Check if should fork
            let shouldFork = false;
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
                       tip.x > -50 &&
                       tip.x < width + 50) {
                // Keep growing if still viable and width is above invisible threshold
                newTips.push(tip);
            }
            // If width <= minWidth, branch has tapered to invisible - just stop, no cap visible
        }

        growthTips = newTips;

        // Log avoidance activity every 60 frames
        if (frameCount % 60 === 0 && avoidanceCount > 0) {
            console.log('Frame', frameCount, '- Avoiding content:', avoidanceCount, 'tips,', contentRects.length, 'content rects');
        }

        // Occasionally add new trees from the bottom
        const canAddTree = config.maxTrees === 0 || growthTips.length < config.maxTrees;
        if (frameCount % config.newTipInterval === 0 && canAddTree) {
            const x = Math.random() * width;

            // Calculate initial width based on distance to content directly above
            const distanceToContent = getDistanceToContentAbove(x, height);
            // Scale width directly proportional to distance - linear with no cap
            // If no content above (Infinity), use full initialMaxWidth
            const widthMultiplier = isFinite(distanceToContent) ? distanceToContent / 300 : 1.0;
            const scaledWidth = config.initialMaxWidth * widthMultiplier * (0.9 + Math.random() * 0.2);
            const tipWidth = Math.max(config.initialMinWidth, scaledWidth);

            const vx = (Math.random() - 0.5) * config.horizontalVariance;
            const vy = config.upwardBias;

            growthTips.push(createTip(x, height, vx, vy, tipWidth, x, height, 0));
        }

        // Safety: restart if trees fall below minimum
        if (growthTips.length < config.minTrees && frameCount % 60 === 0) {
            console.log('Trees below minimum, restarting...');
            initializeTrees();
        }

        frameCount++;
    }

    /**
     * Animation loop - basic loop with frame delay control
     */
    function animate() {
        updateGrowth();
        setTimeout(animate, config.frameDelay);
    }

    /**
     * Resize canvas
     */
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        // Only reinitialize trees if already initialized (not during first setup)
        if (initialized) {
            ctx.clearRect(0, 0, width, height);
            initializeTrees();
        }
    }

    // Track if initialized to prevent double-init
    let initialized = false;

    /**
     * Initialize
     */
    function init() {
        if (initialized) {
            console.log('Already initialized, skipping...');
            return;
        }

        console.log('Growth theme initializing...');

        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        if (!ctx) {
            console.error('Canvas context not found!');
            return;
        }

        // Set canvas size
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        console.log('Canvas size:', width, 'x', height);

        // Initialize trees
        initializeTrees();
        console.log('Initial growth tips:', growthTips.length);

        // Detect content boundaries immediately
        detectContentBoundaries();
        console.log('Initial content rectangles:', contentRects.length);

        // PRE-RENDER: Run frames instantly to show mature trees
        console.log('Pre-rendering', config.preRenderFrames, 'frames...');
        for (let i = 0; i < config.preRenderFrames; i++) {
            updateGrowth();
            if (i % 100 === 0) {
                detectContentBoundaries(); // Update content detection during pre-render
            }
        }
        console.log('Pre-render complete, active tips:', growthTips.length);

        // Mark as initialized after setup is complete
        initialized = true;

        // Re-detect content frequently for the first 10 seconds (content loads dynamically)
        let detectionCount = 0;
        const frequentDetection = setInterval(() => {
            detectContentBoundaries();
            detectionCount++;
            if (detectionCount >= 20) {
                clearInterval(frequentDetection);
                // Then continue at slower rate
                setInterval(detectContentBoundaries, 2000);
                console.log('Switched to slow content detection');
            }
        }, 500); // Every 500ms for first 10 seconds

        // Handle window resize
        window.addEventListener('resize', resize);

        // Start animation
        console.log('Starting animation loop...');
        animate();
    }

    // Start when page loads
    window.addEventListener('load', function() {
        setTimeout(init, 1000); // Delay to ensure content is rendered
    });
})();
