/* Plasma Fractal Theme - AjaxCMS */

$('#background').css('background', '#000');

// Configuration
var plasmaSpeed = 0.5;  // Animation speed multiplier
var colorCycle = 0;      // Color cycling offset
var pixelSize = 4;       // Size of each plasma pixel (lower = more detail, slower)

// Canvas variables
var canvas, ctx;
var imageData;
var data;
var time = 0;

////////////////////////////////////////////////////////////////////

// Generate plasma value at position with time
function plasma(x, y, time) {
    // Multiple sine waves create the plasma effect
    var value = Math.sin(x / 16.0 + time);
    value += Math.sin(y / 8.0 - time);
    value += Math.sin((x + y) / 16.0 - time);
    value += Math.sin(Math.sqrt(x * x + y * y) / 8.0 + time);

    return value / 4.0; // Normalize to -1 to 1 range
}

// Map plasma value to RGB color
function getColor(value, time) {
    // Normalize value from -1,1 to 0,1
    var v = (value + 1) / 2;

    // Create color cycling effect
    var r = Math.sin(v * Math.PI * 2 + time * 0.5 + 0) * 127 + 128;
    var g = Math.sin(v * Math.PI * 2 + time * 0.5 + 2) * 127 + 128;
    var b = Math.sin(v * Math.PI * 2 + time * 0.5 + 4) * 127 + 128;

    return {
        r: Math.floor(r),
        g: Math.floor(g),
        b: Math.floor(b)
    };
}

// Draw the plasma effect
function drawPlasma(time) {
    var width = canvas.width;
    var height = canvas.height;

    // Process in blocks for performance
    for (var y = 0; y < height; y += pixelSize) {
        for (var x = 0; x < width; x += pixelSize) {
            // Calculate plasma value at this position
            var value = plasma(x, y, time);

            // Get color for this value
            var color = getColor(value, time);

            // Fill pixel block
            ctx.fillStyle = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
            ctx.fillRect(x, y, pixelSize, pixelSize);
        }
    }
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

    // Animation Loop
    function draw(timestamp) {
        requestAnimationFrame(draw);
        drawFrame(timestamp);
    }

    draw(0);
}

// Start the background animation
startBackground();
