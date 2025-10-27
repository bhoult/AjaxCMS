/* Schematic Theme Background Animation */
/* Dynamically generates animated electrical schematics */

// Configuration
var grid_size = 35;
var component_lifetime = 600; // frames before component fades (doubled for longer persistence)
var wire_lifetime = 1200; // frames before wire fades (twice component lifetime)
var fade_duration = 60; // frames to fade in/out
var line_color = "#333";
var component_color = "#000";
var trace_color = "#2a5";
var background_color = "#f5f5f0";
var new_component_chance = 0.06; // probability per frame (increased for more density)
var max_components = 35; // increased for more components on screen

// Component types
var component_types = ['resistor', 'capacitor', 'ic', 'transistor', 'diode', 'ground', 'vcc', 'led', 'inductor', 'fuse', 'switch', 'potentiometer', 'crystal', 'opamp', 'battery', 'relay'];

// Component class
function Component(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.age = 0;
    this.connections = [];
    this.value = this.generateValue();
    this.rotation = Math.floor(Math.random() * 4) * 90; // 0, 90, 180, 270
}

Component.prototype.generateValue = function() {
    switch(this.type) {
        case 'resistor':
            var values = ['1k', '10k', '100k', '1M', '10R', '100R', '4k7', '2k2'];
            return values[Math.floor(Math.random() * values.length)];
        case 'capacitor':
            var values = ['10µF', '100µF', '1µF', '10nF', '100nF', '1nF', '22pF'];
            return values[Math.floor(Math.random() * values.length)];
        case 'transistor':
            var values = ['2N2222', 'BC547', '2N3904', 'TIP31', 'IRF540'];
            return values[Math.floor(Math.random() * values.length)];
        case 'diode':
            var values = ['1N4148', '1N4007', '1N5819'];
            return values[Math.floor(Math.random() * values.length)];
        case 'led':
            var values = ['Red', 'Green', 'Blue', 'Yellow'];
            return values[Math.floor(Math.random() * values.length)];
        case 'inductor':
            var values = ['10µH', '100µH', '1mH', '10mH'];
            return values[Math.floor(Math.random() * values.length)];
        case 'ic':
            var values = ['555', 'LM358', 'LM7805', 'ATmega', '74HC00'];
            return values[Math.floor(Math.random() * values.length)];
        case 'fuse':
            var values = ['1A', '2A', '5A', '500mA'];
            return values[Math.floor(Math.random() * values.length)];
        case 'potentiometer':
            var values = ['10k', '100k', '1M'];
            return values[Math.floor(Math.random() * values.length)];
        case 'crystal':
            var values = ['16MHz', '8MHz', '32kHz'];
            return values[Math.floor(Math.random() * values.length)];
        case 'opamp':
            var values = ['LM741', 'TL071', 'LM358'];
            return values[Math.floor(Math.random() * values.length)];
        case 'battery':
            var values = ['9V', '5V', '3.3V'];
            return values[Math.floor(Math.random() * values.length)];
        case 'relay':
            var values = ['SPDT', 'DPDT', '5V'];
            return values[Math.floor(Math.random() * values.length)];
        case 'switch':
            return 'SW';
        default:
            return '';
    }
};

Component.prototype.draw = function(ctx) {
    var alpha = this.calculateAlpha();
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.globalAlpha = alpha;
    
    ctx.strokeStyle = component_color;
    ctx.fillStyle = component_color;
    ctx.lineWidth = 2;
    
    switch(this.type) {
        case 'resistor':
            this.drawResistor(ctx);
            break;
        case 'capacitor':
            this.drawCapacitor(ctx);
            break;
        case 'ic':
            this.drawIC(ctx);
            break;
        case 'transistor':
            this.drawTransistor(ctx);
            break;
        case 'diode':
            this.drawDiode(ctx);
            break;
        case 'ground':
            this.drawGround(ctx);
            break;
        case 'vcc':
            this.drawVCC(ctx);
            break;
        case 'led':
            this.drawLED(ctx);
            break;
        case 'inductor':
            this.drawInductor(ctx);
            break;
        case 'fuse':
            this.drawFuse(ctx);
            break;
        case 'switch':
            this.drawSwitch(ctx);
            break;
        case 'potentiometer':
            this.drawPotentiometer(ctx);
            break;
        case 'crystal':
            this.drawCrystal(ctx);
            break;
        case 'opamp':
            this.drawOpAmp(ctx);
            break;
        case 'battery':
            this.drawBattery(ctx);
            break;
        case 'relay':
            this.drawRelay(ctx);
            break;
    }
    
    // Draw label
    ctx.font = '10px monospace';
    ctx.fillText(this.value, -15, 25);
    
    ctx.restore();
};

Component.prototype.calculateAlpha = function() {
    if (this.age < fade_duration) {
        return this.age / fade_duration;
    } else if (this.age > component_lifetime - fade_duration) {
        return (component_lifetime - this.age) / fade_duration;
    }
    return 1;
};

Component.prototype.drawResistor = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-15, -8);
    ctx.lineTo(-5, 8);
    ctx.lineTo(5, -8);
    ctx.lineTo(15, 8);
    ctx.lineTo(20, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
};

Component.prototype.drawCapacitor = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-5, 0);
    ctx.moveTo(-5, -15);
    ctx.lineTo(-5, 15);
    ctx.moveTo(5, -15);
    ctx.lineTo(5, 15);
    ctx.moveTo(5, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
};

Component.prototype.drawIC = function(ctx) {
    ctx.strokeRect(-25, -20, 50, 40);
    // Draw pins
    for (var i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-25, i * 12);
        ctx.lineTo(-30, i * 12);
        ctx.moveTo(25, i * 12);
        ctx.lineTo(30, i * 12);
        ctx.stroke();
    }
    // Draw notch
    ctx.beginPath();
    ctx.arc(0, -20, 5, 0, Math.PI, true);
    ctx.stroke();
};

Component.prototype.drawTransistor = function(ctx) {
    // Circle
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Base line
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-5, 0);
    ctx.moveTo(-5, -10);
    ctx.lineTo(-5, 10);
    ctx.stroke();
    
    // Collector
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(10, -15);
    ctx.lineTo(10, -30);
    ctx.stroke();
    
    // Emitter
    ctx.beginPath();
    ctx.moveTo(-5, 8);
    ctx.lineTo(10, 15);
    ctx.lineTo(10, 30);
    ctx.stroke();
    
    // Arrow
    ctx.beginPath();
    ctx.moveTo(8, 13);
    ctx.lineTo(10, 15);
    ctx.lineTo(12, 11);
    ctx.stroke();
};

Component.prototype.drawDiode = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-10, 0);
    ctx.moveTo(-10, -10);
    ctx.lineTo(-10, 10);
    ctx.lineTo(10, 0);
    ctx.lineTo(-10, -10);
    ctx.moveTo(10, -10);
    ctx.lineTo(10, 10);
    ctx.moveTo(10, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
};

Component.prototype.drawGround = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(0, 0);
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.moveTo(-12, 5);
    ctx.lineTo(12, 5);
    ctx.moveTo(-6, 10);
    ctx.lineTo(6, 10);
    ctx.stroke();
};

Component.prototype.drawVCC = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(0, 5);
    ctx.moveTo(-15, 5);
    ctx.lineTo(15, 5);
    ctx.stroke();
    ctx.font = '12px monospace';
    ctx.fillText('+5V', -10, -5);
};

Component.prototype.drawLED = function(ctx) {
    // Same as diode but with arrows showing light emission
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-10, 0);
    ctx.moveTo(-10, -10);
    ctx.lineTo(-10, 10);
    ctx.lineTo(10, 0);
    ctx.lineTo(-10, -10);
    ctx.moveTo(10, -10);
    ctx.lineTo(10, 10);
    ctx.moveTo(10, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    // Light arrows
    ctx.beginPath();
    ctx.moveTo(5, -15);
    ctx.lineTo(10, -20);
    ctx.lineTo(7, -20);
    ctx.lineTo(8, -17);
    ctx.moveTo(12, -15);
    ctx.lineTo(17, -20);
    ctx.lineTo(14, -20);
    ctx.lineTo(15, -17);
    ctx.stroke();
};

Component.prototype.drawInductor = function(ctx) {
    // Coiled line
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-20, 0);
    for (var i = -3; i <= 3; i++) {
        ctx.arc(-20 + i * 7 + 3.5, 0, 3.5, Math.PI, 0, false);
    }
    ctx.lineTo(30, 0);
    ctx.stroke();
};

Component.prototype.drawFuse = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-15, 0);
    ctx.rect(-15, -8, 30, 16);
    ctx.moveTo(15, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
};

Component.prototype.drawSwitch = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-10, 0);
    ctx.moveTo(-10, 0);
    ctx.lineTo(5, -12);
    ctx.moveTo(10, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    // Terminals
    ctx.beginPath();
    ctx.arc(-10, 0, 2, 0, Math.PI * 2);
    ctx.arc(10, 0, 2, 0, Math.PI * 2);
    ctx.fill();
};

Component.prototype.drawPotentiometer = function(ctx) {
    // Resistor with arrow
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-15, -8);
    ctx.lineTo(-5, 8);
    ctx.lineTo(5, -8);
    ctx.lineTo(15, 8);
    ctx.lineTo(20, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    // Arrow
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, -5);
    ctx.lineTo(-3, -8);
    ctx.moveTo(0, -5);
    ctx.lineTo(3, -8);
    ctx.stroke();
};

Component.prototype.drawCrystal = function(ctx) {
    // Rectangle with vertical lines
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-15, 0);
    ctx.moveTo(-10, -12);
    ctx.lineTo(-10, 12);
    ctx.rect(-8, -10, 16, 20);
    ctx.moveTo(10, -12);
    ctx.lineTo(10, 12);
    ctx.moveTo(15, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
};

Component.prototype.drawOpAmp = function(ctx) {
    // Triangle with inputs
    ctx.beginPath();
    ctx.moveTo(-20, -20);
    ctx.lineTo(-20, 20);
    ctx.lineTo(20, 0);
    ctx.lineTo(-20, -20);
    ctx.stroke();
    // Inputs
    ctx.beginPath();
    ctx.moveTo(-30, -10);
    ctx.lineTo(-20, -10);
    ctx.moveTo(-30, 10);
    ctx.lineTo(-20, 10);
    ctx.moveTo(20, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    // + and - signs
    ctx.font = '12px monospace';
    ctx.fillText('+', -16, -6);
    ctx.fillText('-', -16, 14);
};

Component.prototype.drawBattery = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-10, 0);
    ctx.moveTo(-10, -15);
    ctx.lineTo(-10, 15);
    ctx.moveTo(-5, -10);
    ctx.lineTo(-5, 10);
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.moveTo(5, -10);
    ctx.lineTo(5, 10);
    ctx.moveTo(10, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
};

Component.prototype.drawRelay = function(ctx) {
    // Coil
    ctx.strokeRect(-15, -18, 30, 16);
    // Contacts
    ctx.beginPath();
    ctx.moveTo(-30, 10);
    ctx.lineTo(-15, 10);
    ctx.moveTo(-15, 10);
    ctx.lineTo(-5, 3);
    ctx.moveTo(0, 10);
    ctx.lineTo(15, 10);
    ctx.moveTo(15, 10);
    ctx.lineTo(30, 10);
    ctx.stroke();
    // Terminals
    ctx.beginPath();
    ctx.arc(-15, 10, 2, 0, Math.PI * 2);
    ctx.arc(0, 10, 2, 0, Math.PI * 2);
    ctx.arc(15, 10, 2, 0, Math.PI * 2);
    ctx.fill();
};

// Wire connection class - stores positions for permanent connections
function Wire(comp1, comp2) {
    this.x1 = comp1.x;
    this.y1 = comp1.y;
    this.x2 = comp2.x;
    this.y2 = comp2.y;
    this.age = 0;
    this.seekingDuration = 60 + Math.floor(Math.random() * 60); // 60-120 frames of seeking

    // Route will be determined during seeking, then locked in
    this.routeHorizontalFirst = null; // Will be set when seeking completes
    this.midX = null;
    this.midY = null;
}

Wire.prototype.draw = function(ctx) {
    var routeHorizontalFirst;
    var midX, midY;
    var alpha = 1;

    // Seeking phase - flicker as connection is established with varying routes
    if (this.age < this.seekingDuration) {
        // Randomly skip drawing to create flicker effect
        if (Math.random() < 0.4) {
            return; // Skip this frame
        }

        // Vary opacity during seeking
        alpha = 0.3 + Math.random() * 0.5;

        // Try different routes while seeking
        routeHorizontalFirst = Math.random() > 0.5;
        midX = (this.x1 + this.x2) / 2 + (Math.random() - 0.5) * grid_size * 2;
        midY = (this.y1 + this.y2) / 2 + (Math.random() - 0.5) * grid_size * 2;
    } else {
        // Stable connection - lock in the route if not already set
        if (this.routeHorizontalFirst === null) {
            this.routeHorizontalFirst = Math.random() > 0.5;
            this.midX = (this.x1 + this.x2) / 2;
            this.midY = (this.y1 + this.y2) / 2;
        }

        routeHorizontalFirst = this.routeHorizontalFirst;
        midX = this.midX;
        midY = this.midY;

        // Fade out at end of lifetime
        if (this.age > wire_lifetime - fade_duration) {
            var fadeProgress = (wire_lifetime - this.age) / fade_duration;
            alpha = fadeProgress;
        } else {
            alpha = 1;
        }
    }

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = trace_color;
    ctx.lineWidth = 2;

    // Draw orthogonal wire (Manhattan routing) using stored positions
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);

    if (routeHorizontalFirst) {
        ctx.lineTo(midX, this.y1);
        ctx.lineTo(midX, this.y2);
    } else {
        ctx.lineTo(this.x1, midY);
        ctx.lineTo(this.x2, midY);
    }

    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();

    ctx.globalAlpha = 1;
};

// Global arrays
var components = [];
var wires = [];

// Snap to grid
function snapToGrid(value) {
    return Math.round(value / grid_size) * grid_size;
}

// Find nearest component
function findNearestComponent(x, y, exclude) {
    var nearest = null;
    var minDist = Infinity;
    
    for (var i = 0; i < components.length; i++) {
        if (components[i] === exclude) continue;
        if (components[i].age < fade_duration) continue; // Not fully visible yet
        
        var dx = components[i].x - x;
        var dy = components[i].y - y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < minDist && dist > grid_size * 2) {
            minDist = dist;
            nearest = components[i];
        }
    }
    
    return nearest;
}

// Draw frame
function drawFrame(ctx, frame) {
    // Clear with solid background
    ctx.fillStyle = background_color;
    ctx.fillRect(0, 0, page_width, page_height);
    
    // Draw subtle grid
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    ctx.lineWidth = 1;
    for (var x = 0; x < page_width; x += grid_size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, page_height);
        ctx.stroke();
    }
    for (var y = 0; y < page_height; y += grid_size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(page_width, y);
        ctx.stroke();
    }
    
    // Update component ages
    for (var i = components.length - 1; i >= 0; i--) {
        components[i].age++;
        if (components[i].age > component_lifetime) {
            components.splice(i, 1);
        }
    }
    
    // Maybe add new component
    if (Math.random() < new_component_chance && components.length < max_components) {
        var type = component_types[Math.floor(Math.random() * component_types.length)];
        var x = snapToGrid(grid_size * 2 + Math.random() * (page_width - grid_size * 4));
        var y = snapToGrid(grid_size * 2 + Math.random() * (page_height - grid_size * 4));
        
        var comp = new Component(type, x, y);
        components.push(comp);
        
        // Maybe connect to nearest component
        if (components.length > 1 && Math.random() > 0.3) {
            var nearest = findNearestComponent(x, y, comp);
            if (nearest) {
                wires.push(new Wire(comp, nearest));
            }
        }
    }
    
    // Update and draw wires (remove old ones)
    for (var i = wires.length - 1; i >= 0; i--) {
        wires[i].age++;
        if (wires[i].age > wire_lifetime) {
            wires.splice(i, 1);
            continue;
        }
        wires[i].draw(ctx);
    }
    
    // Draw components
    for (var i = 0; i < components.length; i++) {
        components[i].draw(ctx);
    }
}

// Start background
startBackground = function() {
    components = [];
    wires = [];
    frame = 0;

    $('#background').css('background', background_color);

    // Set up canvas
    canvas = document.getElementById('background');
    ctx = canvas.getContext("2d");
    page_width = window.innerWidth;
    page_height = window.innerHeight;
    ctx.canvas.width = page_width;
    ctx.canvas.height = page_height;

    // Pre-populate with 10 initial components
    for (var i = 0; i < 10; i++) {
        var type = component_types[Math.floor(Math.random() * component_types.length)];
        var x = snapToGrid(grid_size * 2 + Math.random() * (page_width - grid_size * 4));
        var y = snapToGrid(grid_size * 2 + Math.random() * (page_height - grid_size * 4));

        var comp = new Component(type, x, y);
        // Give initial components varying ages so they don't all fade at once
        comp.age = Math.floor(Math.random() * fade_duration);
        components.push(comp);
    }

    // Animation loop
    function draw() {
        requestAnimationFrame(draw);
        frame++;
        drawFrame(ctx, frame);
    }

    draw();
}

// Start on document ready
$(document).ready(function() {
    startBackground();
});
