/* Schematic Theme Background Animation */
/* Dynamically generates animated electrical schematics */

// Configuration
var grid_size = 40;
var component_lifetime = 300; // frames before component fades
var fade_duration = 60; // frames to fade in/out
var line_color = "#333";
var component_color = "#000";
var trace_color = "#2a5";
var background_color = "#f5f5f0";
var new_component_chance = 0.02; // probability per frame
var max_components = 15;

// Component types
var component_types = ['resistor', 'capacitor', 'ic', 'transistor', 'diode', 'ground', 'vcc'];

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
            var values = ['1k', '10k', '100k', '1M', '10R', '100R'];
            return values[Math.floor(Math.random() * values.length)];
        case 'capacitor':
            var values = ['10µF', '100µF', '1µF', '10nF', '100nF', '1nF'];
            return values[Math.floor(Math.random() * values.length)];
        case 'transistor':
            var values = ['2N2222', 'BC547', '2N3904', 'TIP31'];
            return values[Math.floor(Math.random() * values.length)];
        case 'diode':
            var values = ['1N4148', '1N4007', 'LED'];
            return values[Math.floor(Math.random() * values.length)];
        case 'ic':
            var values = ['555', 'LM358', 'LM7805', 'ATmega'];
            return values[Math.floor(Math.random() * values.length)];
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

// Wire connection class
function Wire(comp1, comp2) {
    this.comp1 = comp1;
    this.comp2 = comp2;
    this.age = 0;
}

Wire.prototype.draw = function(ctx) {
    var alpha = Math.min(this.comp1.calculateAlpha(), this.comp2.calculateAlpha());
    if (alpha <= 0) return;
    
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = trace_color;
    ctx.lineWidth = 2;
    
    // Draw orthogonal wire (Manhattan routing)
    ctx.beginPath();
    ctx.moveTo(this.comp1.x, this.comp1.y);
    
    var midX = (this.comp1.x + this.comp2.x) / 2;
    var midY = (this.comp1.y + this.comp2.y) / 2;
    
    if (Math.random() > 0.5) {
        ctx.lineTo(midX, this.comp1.y);
        ctx.lineTo(midX, this.comp2.y);
    } else {
        ctx.lineTo(this.comp1.x, midY);
        ctx.lineTo(this.comp2.x, midY);
    }
    
    ctx.lineTo(this.comp2.x, this.comp2.y);
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
    
    // Draw wires
    for (var i = wires.length - 1; i >= 0; i--) {
        // Remove wires if either component is gone
        if (!components.includes(wires[i].comp1) || !components.includes(wires[i].comp2)) {
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
