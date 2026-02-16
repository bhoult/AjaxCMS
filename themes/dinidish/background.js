/**
 * AjaxCMS Theme - Dinidish
 *
 * Indonesian restaurant theme with scattered food photos on a wooden table.
 * Photos are arranged as if casually placed on a surface, with a smooth
 * camera pan that loops seamlessly over the collage.
 *
 * Place your restaurant photos in themes/dinidish/images/
 *
 * Copyright (C) 2016-2026 Brandon Hoult
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

(function() {
    'use strict';

    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    // Configuration
    const config = {
        panSpeed: 0.4,              // Pixels per frame to move camera
        waypointCount: 12,          // Number of random waypoints in the spline loop
        waypointSpread: 0.7,        // How far waypoints spread across the world (0-1)
        photoScale: 0.175,          // Base scale for photos (fraction of viewport width)
        photoScaleMobile: 0.275,    // Larger on mobile so photos are visible
        photoRotationMax: 15,       // Max rotation in degrees
        photoSpacing: 0.85,         // Multiplier for spacing between photos in grid (tighter = more coverage)
        shadowBlur: 18,             // Drop shadow blur
        shadowColor: 'rgba(0,0,0,0.35)',
        borderWidth: 6,             // White polaroid-style border
        borderColor: '#faf8f0',     // Warm white
        tableColor1: '#3a4230',     // Dark olive
        tableColor2: '#4a5440',     // Medium olive
        tableGrainAlpha: 0.06,      // Subtle grain overlay opacity
        tableTint: 'rgba(30,35,25,0.12)', // Dark olive tint overlay
    };

    let width, height;
    let photos = [];         // Array of { img, x, y, rotation, scale, loaded }
    let cameraX = 0;
    let cameraY = 0;
    let worldWidth = 0;
    let worldHeight = 0;
    let animationId = null;
    let imageElements = [];
    let imagesLoaded = 0;
    let totalImages = 0;
    let initialized = false;

    // Wood grain pattern (drawn once to offscreen canvas)
    let woodPattern = null;

    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
               || window.innerWidth <= 768;
    }

    /**
     * Discover images in the theme's images directory via the API.
     * Falls back to a hardcoded scan if the API isn't available.
     */
    function discoverImages(callback) {
        const baseDir = './themes/dinidish/images';
        const imgExtensions = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;

        function extractPaths(data) {
            const paths = [];
            // Response format: { files: [ { name, path, type }, ... ] }
            var items = Array.isArray(data) ? data : (data && data.files ? data.files : []);
            items.forEach(function(item) {
                const name = typeof item === 'string' ? item : (item.name || item.path || '');
                if (imgExtensions.test(name)) {
                    // Build full path for img.src: themes/dinidish/images/filename
                    paths.push('themes/dinidish/images/' + encodeURIComponent(name));
                }
            });
            return paths;
        }

        // Try the recursive listing API (needs ./ prefix for global fallback)
        $.ajax({
            url: 'api/list-recursive?dir=' + encodeURIComponent(baseDir),
            dataType: 'json',
            success: function(data) {
                callback(extractPaths(data));
            },
            error: function() {
                // Fallback: try non-recursive listing
                $.ajax({
                    url: 'api/list?dir=' + encodeURIComponent(baseDir),
                    dataType: 'json',
                    success: function(data) {
                        callback(extractPaths(data));
                    },
                    error: function() {
                        callback([]);
                    }
                });
            }
        });
    }

    /**
     * Load all images and call back when done.
     */
    function loadImages(paths, callback) {
        if (paths.length === 0) {
            callback([]);
            return;
        }

        totalImages = paths.length;
        imagesLoaded = 0;
        imageElements = [];

        paths.forEach(function(p) {
            const img = new Image();
            img.onload = function() {
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    callback(imageElements);
                }
            };
            img.onerror = function() {
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    callback(imageElements.filter(function(el) { return el.complete && el.naturalWidth > 0; }));
                }
            };
            img.src = p;
            imageElements.push(img);
        });
    }

    /**
     * Seeded pseudo-random number generator for consistent layouts.
     */
    function seededRandom(seed) {
        let s = seed;
        return function() {
            s = (s * 16807 + 0) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    /**
     * Create the wood grain background pattern on an offscreen canvas.
     */
    function createWoodPattern() {
        const patW = 512;
        const patH = 512;
        const offscreen = document.createElement('canvas');
        offscreen.width = patW;
        offscreen.height = patH;
        const octx = offscreen.getContext('2d');

        // Base wood color gradient
        const grad = octx.createLinearGradient(0, 0, patW, 0);
        grad.addColorStop(0, config.tableColor1);
        grad.addColorStop(0.3, config.tableColor2);
        grad.addColorStop(0.5, config.tableColor1);
        grad.addColorStop(0.7, config.tableColor2);
        grad.addColorStop(1, config.tableColor1);
        octx.fillStyle = grad;
        octx.fillRect(0, 0, patW, patH);

        // Wood grain lines
        const rng = seededRandom(42);
        octx.globalAlpha = config.tableGrainAlpha;
        for (let i = 0; i < 200; i++) {
            const y = rng() * patH;
            const thickness = rng() * 2 + 0.5;
            octx.strokeStyle = rng() > 0.5 ? '#2e3528' : '#4a5440';
            octx.lineWidth = thickness;
            octx.beginPath();
            octx.moveTo(0, y);
            // Slightly wavy grain
            for (let x = 0; x < patW; x += 20) {
                octx.lineTo(x, y + (rng() - 0.5) * 4);
            }
            octx.stroke();
        }
        octx.globalAlpha = 1.0;

        // Warm tint
        octx.fillStyle = config.tableTint;
        octx.fillRect(0, 0, patW, patH);

        woodPattern = ctx.createPattern(offscreen, 'repeat');
    }

    /**
     * Scatter photos across a virtual world surface.
     * Photos are placed in a grid with jitter so they tile seamlessly.
     */
    function scatterPhotos(images) {
        const rng = seededRandom(7);
        const mobile = isMobile();
        const baseScale = mobile ? config.photoScaleMobile : config.photoScale;
        const avgPhotoSize = width * baseScale;
        const spacing = avgPhotoSize * config.photoSpacing;

        // Calculate grid to fill a world that's significantly larger than viewport
        // We need at least 3x viewport in each dimension for seamless wrapping
        const cols = Math.max(4, Math.ceil((width * 3) / spacing));
        const rows = Math.max(4, Math.ceil((height * 3) / spacing));

        worldWidth = cols * spacing;
        worldHeight = rows * spacing;

        photos = [];
        let imgIndex = 0;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (images.length === 0) break;

                const img = images[imgIndex % images.length];
                imgIndex++;

                // Vary scale per photo
                const scale = baseScale * (0.8 + rng() * 0.4);
                const photoW = width * scale;
                const photoH = (img.naturalHeight / img.naturalWidth) * photoW;

                // Position with jitter
                const jitterX = (rng() - 0.5) * spacing * 0.5;
                const jitterY = (rng() - 0.5) * spacing * 0.5;

                photos.push({
                    img: img,
                    x: col * spacing + jitterX,
                    y: row * spacing + jitterY,
                    width: photoW,
                    height: photoH,
                    rotation: (rng() - 0.5) * 2 * config.photoRotationMax,
                    scale: scale
                });
            }
        }
    }

    /**
     * Draw a single photo with border and shadow, like a printed photo on a table.
     */
    function drawPhoto(photo, offsetX, offsetY) {
        const cx = photo.x - offsetX + photo.width / 2;
        const cy = photo.y - offsetY + photo.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(photo.rotation * Math.PI / 180);

        const bw = config.borderWidth;
        const totalW = photo.width + bw * 2;
        const totalH = photo.height + bw * 2;

        // Shadow
        ctx.shadowColor = config.shadowColor;
        ctx.shadowBlur = config.shadowBlur;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;

        // White border (like a printed photo)
        ctx.fillStyle = config.borderColor;
        ctx.fillRect(-totalW / 2, -totalH / 2, totalW, totalH);

        // Clear shadow for image draw
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Photo image
        ctx.drawImage(photo.img, -photo.width / 2, -photo.height / 2, photo.width, photo.height);

        ctx.restore();
    }

    /**
     * Catmull-Rom spline interpolation between four points.
     * Returns a point between p1 and p2, with p0 and p3 providing curvature.
     * @param {number} t - Parameter 0-1 between p1 and p2
     */
    function catmullRom(p0, p1, p2, p3, t) {
        var t2 = t * t;
        var t3 = t2 * t;
        return 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }

    /**
     * Generate random waypoints for the camera spline path.
     * The path loops seamlessly by wrapping the waypoint array.
     */
    let waypoints = [];
    let splineT = 0;           // Current position along the spline (0 to waypointCount)
    let splineSegment = 0;     // Current segment index

    function generateWaypoints() {
        var rng = seededRandom(31);
        var count = config.waypointCount;
        var spreadX = worldWidth * config.waypointSpread;
        var spreadY = worldHeight * config.waypointSpread;
        var offsetX = (worldWidth - spreadX) / 2;
        var offsetY = (worldHeight - spreadY) / 2;

        waypoints = [];
        for (var i = 0; i < count; i++) {
            waypoints.push({
                x: offsetX + rng() * spreadX,
                y: offsetY + rng() * spreadY
            });
        }
        splineT = 0;
        splineSegment = 0;
    }

    /**
     * Get the camera position along the Catmull-Rom spline.
     * Wraps indices so the path loops seamlessly.
     */
    function getSplinePosition(segment, t) {
        var n = waypoints.length;
        var p0 = waypoints[((segment - 1) % n + n) % n];
        var p1 = waypoints[segment % n];
        var p2 = waypoints[(segment + 1) % n];
        var p3 = waypoints[(segment + 2) % n];
        return {
            x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
            y: catmullRom(p0.y, p1.y, p2.y, p3.y, t)
        };
    }

    /**
     * Calculate the length of a spline segment by sampling it.
     */
    function segmentLength(segment) {
        var steps = 20;
        var len = 0;
        var prev = getSplinePosition(segment, 0);
        for (var i = 1; i <= steps; i++) {
            var curr = getSplinePosition(segment, i / steps);
            var dx = curr.x - prev.x;
            var dy = curr.y - prev.y;
            len += Math.sqrt(dx * dx + dy * dy);
            prev = curr;
        }
        return len;
    }

    /**
     * Draw the full scene for one frame.
     * The camera follows a smooth Catmull-Rom spline through random waypoints.
     */
    function drawFrame() {
        // Advance along spline at constant speed
        var segLen = segmentLength(splineSegment);
        var tStep = (segLen > 0) ? config.panSpeed / segLen : 0.001;
        splineT += tStep;

        // Move to next segment when t exceeds 1
        while (splineT >= 1) {
            splineT -= 1;
            splineSegment = (splineSegment + 1) % waypoints.length;
        }

        // Get camera position from spline
        var pos = getSplinePosition(splineSegment, splineT);
        cameraX = ((pos.x % worldWidth) + worldWidth) % worldWidth;
        cameraY = ((pos.y % worldHeight) + worldHeight) % worldHeight;

        // Clear and draw wood background
        ctx.fillStyle = woodPattern || config.tableColor1;
        ctx.fillRect(0, 0, width, height);

        // Draw photos - we need to draw at offset positions to handle wrapping
        // Check a 3x3 grid of world copies around the camera
        for (let wy = -1; wy <= 1; wy++) {
            for (let wx = -1; wx <= 1; wx++) {
                const offsetX = cameraX - wx * worldWidth;
                const offsetY = cameraY - wy * worldHeight;

                for (let i = 0; i < photos.length; i++) {
                    const p = photos[i];
                    // Cull photos not visible on screen
                    const screenX = p.x - offsetX;
                    const screenY = p.y - offsetY;
                    const margin = Math.max(p.width, p.height) * 1.5;

                    if (screenX + margin > 0 && screenX - margin < width &&
                        screenY + margin > 0 && screenY - margin < height) {
                        drawPhoto(p, offsetX, offsetY);
                    }
                }
            }
        }

        // Subtle vignette overlay for depth
        const vignette = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.2,
            width / 2, height / 2, width * 0.8
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        animationId = requestAnimationFrame(drawFrame);
    }

    /**
     * Resize canvas and re-scatter if needed.
     */
    let prevWidth = 0;
    let resizeTimer = null;
    function handleResize() {
        // Debounce to avoid reacting to transient layout shifts
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Don't resize during page transitions
            if (window.in_transition) return;

            var newWidth = window.innerWidth;
            var newHeight = window.innerHeight;

            // Skip if width hasn't changed (mobile URL bar, content reflow)
            if (newWidth === width) return;

            width = newWidth;
            height = newHeight;
            canvas.width = width;
            canvas.height = height;

            // Only re-scatter if width changed significantly
            if (Math.abs(width - prevWidth) > 50 && imageElements.length > 0) {
                prevWidth = width;
                createWoodPattern();
                scatterPhotos(imageElements.filter(function(el) { return el.complete && el.naturalWidth > 0; }));
                generateWaypoints();
            }
        }, 300);
    }

    /**
     * Initialize the theme.
     */
    function init() {
        if (initialized) return;
        initialized = true;

        width = window.innerWidth;
        height = window.innerHeight;
        prevWidth = width;
        canvas.width = width;
        canvas.height = height;

        createWoodPattern();

        // Draw wood table immediately while images load
        ctx.fillStyle = woodPattern || config.tableColor1;
        ctx.fillRect(0, 0, width, height);

        discoverImages(function(paths) {
            if (paths.length === 0) {
                // No images yet - just show the wood table
                console.log('Dinidish theme: No images found in themes/dinidish/images/. Add photos and refresh.');
                generateWaypoints();
                animationId = requestAnimationFrame(drawFrame);
                return;
            }

            loadImages(paths, function(loadedImages) {
                if (loadedImages.length === 0) {
                    console.log('Dinidish theme: Failed to load images.');
                    return;
                }

                imageElements = loadedImages;
                scatterPhotos(loadedImages);
                generateWaypoints();
                animationId = requestAnimationFrame(drawFrame);
            });
        });

        window.addEventListener('resize', handleResize);
    }

    // Start with a brief delay to let AjaxCMS content load first
    setTimeout(init, 600);

    // Cleanup function for theme switching
    window.stopBackground = function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        window.removeEventListener('resize', handleResize);
        initialized = false;
        photos = [];
        imageElements = [];
        woodPattern = null;
    };

})();
