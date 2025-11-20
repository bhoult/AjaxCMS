/**
 * AjaxCMS Theme - Plasma
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

/* Plasma Fractal Theme - AjaxCMS */

$('#background').css('background', '#000');

// Configuration
var plasmaSpeed = 2.0;  // Animation speed multiplier
var colorCycle = 0;      // Color cycling offset
var renderScale = 0.5;   // Render at 50% resolution then scale up (0.5 = 2x faster)

// Canvas variables
var canvas, ctx;
var offscreenCanvas, offscreenCtx;
var imageData;
var data;
var time = 0;

// Sine lookup table for performance
var sineTable = [];
var tableSize = 1024;

// Pre-calculate sine values
for (var i = 0; i < tableSize; i++) {
    sineTable[i] = Math.sin(i * Math.PI * 2 / tableSize);
}

// Fast sine lookup
function fastSin(x) {
    var index = Math.floor(x * tableSize / (Math.PI * 2)) % tableSize;
    if (index < 0) index += tableSize;
    return sineTable[index];
}

////////////////////////////////////////////////////////////////////

// Generate plasma value at position with time (optimized with lookup table)
function plasma(x, y, time) {
    // Multiple overlapping sine waves with varying frequencies create complex patterns
    var value = 0;

    // Slow oscillations to change motion direction over time
    var drift1 = fastSin(time * 0.13) * 2;  // Very slow drift
    var drift2 = fastSin(time * 0.17) * 2;  // Different slow drift
    var drift3 = fastSin(time * 0.11) * 1.5;

    // Layer 1: Large horizontal waves (with vertical drift)
    value += fastSin(x / 64.0 + time + drift1);

    // Layer 2: Large vertical waves (with horizontal drift)
    value += fastSin(y / 48.0 - time * 1.3 + drift2);

    // Layer 3: Diagonal waves (direction changes over time)
    value += fastSin((x * fastSin(time * 0.1) + y * fastSin(time * 0.15)) / 64.0 - time * 0.8);

    // Layer 4: Radial waves from oscillating center
    var centerX = fastSin(time * 0.12) * 200;
    var centerY = fastSin(time * 0.09) * 200;
    value += fastSin(Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY)) / 32.0 + time);

    // Layer 5: Smaller ripples with changing direction
    value += fastSin((x + drift3 * 50) / 96.0 - time * 1.5) * 0.5;

    // Layer 6: Counter-rotating diagonal (rotation speed varies)
    var rotSpeed = 0.7 + fastSin(time * 0.08) * 0.3;
    value += fastSin((x - y) / 80.0 + time * rotSpeed) * 0.5;

    // Layer 7: Interference pattern with evolving angle
    var angle = time * 0.05;
    var rotX = x * fastSin(angle) - y * fastSin(angle + 1.57);
    var rotY = x * fastSin(angle + 1.57) + y * fastSin(angle);
    value += fastSin((rotX * 0.8 + rotY * 1.2) / 70.0 + time * 0.6) * 0.3;

    // Layer 8: Secondary radial waves from different oscillating center
    var centerX2 = fastSin(time * 0.14) * 300 + 200;
    var centerY2 = fastSin(time * 0.11) * 300 + 200;
    value += fastSin(Math.sqrt((x - centerX2) * (x - centerX2) + (y - centerY2) * (y - centerY2)) / 40.0 - time * 1.1) * 0.4;

    // Layer 9: Swirling pattern
    var swirl = Math.atan2(y - centerY, x - centerX);
    value += fastSin(swirl * 2 + time * 0.5) * 0.3;

    return value / 9.0; // Normalize to -1 to 1 range
}

// Map plasma value to RGB color (optimized with lookup table)
function getColor(value, time) {
    // Normalize value from -1,1 to 0,1
    var v = (value + 1) / 2;

    // Create color cycling effect with multiple harmonics for richer colors
    // Each color channel has its own unique cycling pattern
    var r = fastSin(v * Math.PI * 2 + time * 0.5 + 0) * 127 + 128;
    r += fastSin(v * Math.PI * 4 + time * 0.3) * 32; // Add harmonic

    var g = fastSin(v * Math.PI * 2 + time * 0.5 + 2.1) * 127 + 128;
    g += fastSin(v * Math.PI * 3 - time * 0.4) * 32; // Add harmonic

    var b = fastSin(v * Math.PI * 2 + time * 0.5 + 4.2) * 127 + 128;
    b += fastSin(v * Math.PI * 5 + time * 0.35) * 32; // Add harmonic

    // Clamp values to 0-255 range
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return {
        r: Math.floor(r),
        g: Math.floor(g),
        b: Math.floor(b)
    };
}

// Draw the plasma effect using offscreen canvas at lower resolution
function drawPlasma(time) {
    var width = offscreenCanvas.width;
    var height = offscreenCanvas.height;

    // Get the pixel buffer from offscreen canvas
    var pixels = imageData.data;

    // Process every pixel at reduced resolution
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            // Calculate plasma value at this position
            // Scale coordinates back to match original pattern size
            var value = plasma(x / renderScale, y / renderScale, time);

            // Get color for this value
            var color = getColor(value, time);

            // Calculate pixel index (RGBA = 4 bytes per pixel)
            var index = (y * width + x) * 4;

            // Set RGB values (Alpha is always 255)
            pixels[index] = color.r;     // Red
            pixels[index + 1] = color.g; // Green
            pixels[index + 2] = color.b; // Blue
            pixels[index + 3] = 255;     // Alpha
        }
    }

    // Upload the pixel buffer to offscreen canvas
    offscreenCtx.putImageData(imageData, 0, 0);

    // Scale up to main canvas with smooth interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
}

// Animation loop
function drawFrame(timestamp) {
    // Update time
    time += 0.02 * plasmaSpeed;

    // Draw plasma
    drawPlasma(time);
}

////////////////////////////////////////////////////////////////////
startBackground = function() {
    // Set up the background canvas
    canvas = document.getElementById('background');
    ctx = canvas.getContext("2d");

    var page_width = window.innerWidth;
    var page_height = window.innerHeight;

    // Set canvas dimensions to match viewport exactly
    canvas.width = page_width;
    canvas.height = page_height;
    canvas.style.setProperty('width', page_width + 'px', 'important');
    canvas.style.setProperty('height', page_height + 'px', 'important');

    // Create offscreen canvas at reduced resolution for performance
    var offscreen_width = Math.floor(page_width * renderScale);
    var offscreen_height = Math.floor(page_height * renderScale);

    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = offscreen_width;
    offscreenCanvas.height = offscreen_height;
    offscreenCtx = offscreenCanvas.getContext("2d");

    // Create ImageData buffer for offscreen canvas
    imageData = offscreenCtx.createImageData(offscreen_width, offscreen_height);

    console.log('Plasma initialized - Display:', page_width, 'x', page_height, 'Render:', offscreen_width, 'x', offscreen_height, '(' + Math.floor(renderScale * 100) + '%)');

    // Animation Loop
    function draw(timestamp) {
        requestAnimationFrame(draw);
        drawFrame(timestamp);
    }

    draw(0);
}

// Start the background animation
startBackground();
