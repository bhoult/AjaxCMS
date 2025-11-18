/**
 * Growth Theme - Debug: detect content using text ranges for precise boundaries
 */

(function() {
    'use strict';

    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    // Create overlay canvas for visualization
    let overlayCanvas = null;
    let overlayCtx = null;

    // Canvas dimensions
    let width, height;

    // Content rectangles (actual text bounds)
    let contentRects = [];

    // Debug mode toggle
    let debugMode = false;

    /**
     * Get actual text boundaries for an element
     */
    function getTextBoundaries(element) {
        const rects = [];

        // Get all text nodes in this element
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
     * Detect all actual text boundaries on the page
     */
    function detectTextBoundaries() {
        contentRects = [];

        // Find all text-containing elements
        const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LI', 'TD', 'TH', 'LABEL', 'BUTTON', 'TIME', 'STRONG', 'B', 'I', 'EM', 'DIV'];

        textTags.forEach(tag => {
            const elements = document.querySelectorAll(tag);
            elements.forEach(element => {
                // Skip our canvases and containers
                if (element.id === 'background' ||
                    element.id === 'background-div' ||
                    element.id === 'growth-overlay' ||
                    element.id === 'a' ||
                    element.id === 'b') {
                    return;
                }

                // Get precise text boundaries
                const rects = getTextBoundaries(element);
                contentRects.push(...rects);
            });
        });

        // Also add images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.offsetWidth > 0 && img.offsetHeight > 0) {
                const rect = img.getBoundingClientRect();
                contentRects.push({
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom
                });
            }
        });

        console.log('Detected', contentRects.length, 'content rectangles');
        return contentRects;
    }

    /**
     * Check if a point collides with any content rectangle
     */
    function pointInContent(x, y, buffer = 0) {
        for (let rect of contentRects) {
            if (x >= rect.left - buffer &&
                x <= rect.right + buffer &&
                y >= rect.top - buffer &&
                y <= rect.bottom + buffer) {
                return true;
            }
        }
        return false;
    }

    /**
     * Draw growth area visualization on overlay
     */
    function drawVisualization() {
        // Clear overlay
        overlayCtx.clearRect(0, 0, width, height);

        // Only show visualization in debug mode
        if (!debugMode) {
            return;
        }

        // Detect content boundaries
        const rects = detectTextBoundaries();

        if (rects.length === 0) {
            overlayCtx.fillStyle = '#000000';
            overlayCtx.font = '24px monospace';
            overlayCtx.fillText('Waiting for content to load...', 50, 50);
            return;
        }

        const buffer = 30; // 30px buffer around content
        const gridSize = 20; // Larger grid for visualization

        // Sample grid and visualize
        let contentCells = 0;
        let bufferCells = 0;
        let growthCells = 0;

        for (let y = 0; y < height; y += gridSize) {
            for (let x = 0; x < width; x += gridSize) {
                const inContent = pointInContent(x, y, 0);
                const inBuffer = !inContent && pointInContent(x, y, buffer);

                if (inContent) {
                    // Direct content
                    overlayCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    overlayCtx.fillRect(x, y, gridSize, gridSize);
                    contentCells++;
                } else if (inBuffer) {
                    // Buffer zone
                    overlayCtx.fillStyle = 'rgba(255, 100, 0, 0.2)';
                    overlayCtx.fillRect(x, y, gridSize, gridSize);
                    bufferCells++;
                } else {
                    // Growth zone
                    overlayCtx.fillStyle = 'rgba(100, 255, 100, 0.15)';
                    overlayCtx.fillRect(x, y, gridSize, gridSize);
                    growthCells++;
                }
            }
        }

        // Draw actual text boundaries as thin lines
        overlayCtx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
        overlayCtx.lineWidth = 1;
        contentRects.forEach(rect => {
            overlayCtx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
        });

        // Draw legend
        overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        overlayCtx.fillRect(10, height - 140, 540, 130);

        overlayCtx.fillStyle = 'rgba(100, 255, 100, 0.8)';
        overlayCtx.fillRect(20, height - 125, 30, 20);
        overlayCtx.fillStyle = '#000000';
        overlayCtx.font = '14px monospace';
        overlayCtx.fillText('= Growth areas (plants will grow here)', 55, height - 110);

        overlayCtx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        overlayCtx.fillRect(20, height - 95, 30, 20);
        overlayCtx.fillStyle = '#000000';
        overlayCtx.fillText('= Actual text content (precise boundaries)', 55, height - 80);

        overlayCtx.fillStyle = 'rgba(255, 100, 0, 0.4)';
        overlayCtx.fillRect(20, height - 65, 30, 20);
        overlayCtx.fillStyle = '#000000';
        overlayCtx.fillText('= Buffer zone (30px around content)', 55, height - 50);

        overlayCtx.strokeStyle = 'rgba(0, 0, 255, 0.6)';
        overlayCtx.lineWidth = 2;
        overlayCtx.strokeRect(20, height - 35, 30, 20);
        overlayCtx.fillStyle = '#000000';
        overlayCtx.fillText('= Actual text boundaries (blue outlines)', 55, height - 20);

        overlayCtx.fillStyle = '#666666';
        overlayCtx.font = '12px monospace';
        const total = contentCells + bufferCells + growthCells;
        const growthPct = Math.round((growthCells / total) * 100);
        overlayCtx.fillText(`${contentRects.length} text rects | ${growthPct}% growth area | Grid: ${gridSize}px`, 20, height - 5);
    }

    /**
     * Resize canvas
     */
    function resize() {
        width = overlayCanvas.width = window.innerWidth;
        height = overlayCanvas.height = window.innerHeight;
        drawVisualization();
    }

    /**
     * Initialize
     */
    function init() {
        console.log('Growth theme initializing (precise text boundary detection)...');

        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        // Create overlay canvas for visualization (on top of content)
        overlayCanvas = document.createElement('canvas');
        overlayCanvas.id = 'growth-overlay';
        overlayCanvas.style.position = 'fixed';
        overlayCanvas.style.top = '0';
        overlayCanvas.style.left = '0';
        overlayCanvas.style.width = '100%';
        overlayCanvas.style.height = '100%';
        overlayCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
        overlayCanvas.style.zIndex = '9999'; // On top of everything
        document.body.appendChild(overlayCanvas);

        overlayCtx = overlayCanvas.getContext('2d');

        if (!overlayCtx) {
            console.error('Could not get overlay canvas context!');
            return;
        }

        resize();
        console.log('Canvas size:', width, 'x', height);

        // Redraw on window resize
        window.addEventListener('resize', resize);

        // Redraw periodically to catch content changes
        setInterval(() => {
            drawVisualization();
        }, 1000);

        // Debug mode toggle: Shift + Alt + D
        window.addEventListener('keydown', (e) => {
            if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'd') {
                debugMode = !debugMode;
                console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
                drawVisualization();
            }
        });
    }

    // Start when page loads
    window.addEventListener('load', function() {
        setTimeout(init, 1000); // Extra delay to ensure content is rendered
    });
})();
