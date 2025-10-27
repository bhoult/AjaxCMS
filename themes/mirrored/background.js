/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: brandon.hoult@softwyre.com */

velocity = 8;
padding = 200;    	// How far from the edge does repulsion starts (reduced for more edge visibility)
magnet = 10;      	// Strength of repulsion greater = less repulsion.
attraction = 0.02; 	// Gentle attraction between nodes
horizontal_bias = 0.015; // Push nodes toward horizontal edges
colorspeed = 175; 	// Greater is slower
num_nodes = 8;    	// Number of nodes to animate (increased for complexity)
saturation = 1;		// Color saturation range 0-1
lightness = 0.5;	// Brightness value of colors 0-1
max_distance = 800; // Distance threshold for line opacity/width
pulse_chance = 0.02; // Probability per frame of creating traveling pulse

$('#background').css('background', '#000');

////////////////////////////////////////////////////////////////////

function node(x,y, vx,vy, size, depth) {
  this.x = x;
  this.y = y;
  this.velocity = new Victor(vx, vy);
  this.depth = depth;
  this.size = size;
  this.baseSize = 5; // Base node size
  this.pulsePhase = Math.random() * Math.PI * 2; // Random starting phase for pulse
  this.pulseSpeed = 0.03 + Math.random() * 0.02; // Varying pulse speeds
  this.speedMultiplier = 0.7 + Math.random() * 0.6; // Vary movement speed (0.7x to 1.3x)

  this.frame = function(n) {
  	// Apply Movement with speed variation
    this.x += (this.velocity.x * this.speedMultiplier);
    this.y += (this.velocity.y * this.speedMultiplier);

    // Update pulse
    this.pulsePhase += this.pulseSpeed;

	// Edge Repulsion
    if (this.x < padding) {this.velocity.x -= ((this.x - padding) / padding / magnet)}
    if (this.x > (page_width - padding)) {this.velocity.x += ((page_width - padding - this.x) / padding / magnet)}
    if (this.y < padding) {this.velocity.y -= ((this.y - padding) / padding / magnet)}
    if (this.y > (page_height - padding)) {this.velocity.y += ((page_height - padding - this.y) / padding / magnet)}

    // Horizontal spreading bias - push nodes toward left/right edges
    var centerX = page_width / 2;
    var distFromCenter = this.x - centerX;
    if (Math.abs(distFromCenter) < page_width * 0.4) { // Within center 80%
      // Push away from center horizontally
      this.velocity.x += (distFromCenter > 0 ? horizontal_bias : -horizontal_bias);
    }

    // Gentle attraction to other nodes
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] !== this) {
        var dx = nodes[i].x - this.x;
        var dy = nodes[i].y - this.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 100) { // Only attract if not too close
          this.velocity.x += (dx / dist) * attraction;
          this.velocity.y += (dy / dist) * attraction;
        }
      }
    }
  }

  this.getCurrentSize = function() {
    // Pulsing size: oscillates between 0.7x and 1.3x base size
    return this.baseSize * (1 + Math.sin(this.pulsePhase) * 0.3);
  }
}

// Traveling pulse along lines
function TravelingPulse(segmentIndex) {
  this.segmentIndex = segmentIndex; // Which line segment (0 to num_nodes-2)
  this.progress = 0; // 0 to 1 along the segment
  this.speed = 0.015 + Math.random() * 0.01; // Speed varies
  this.size = 8 + Math.random() * 4; // Size varies

  this.update = function() {
    this.progress += this.speed;
    return this.progress < 1; // Return false when pulse completes
  }

  this.draw = function(ctx, x1, y1, x2, y2, color) {
    var x = x1 + (x2 - x1) * this.progress;
    var y = y1 + (y2 - y1) * this.progress;

    // Draw glowing pulse
    ctx.save();
    ctx.globalAlpha = 0.8;
    var gradient = ctx.createRadialGradient(x, y, 0, x, y, this.size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFrame(ctx, frame) {

	// Calculate Line Color
	var lc = hslToRgb((frame/100), saturation, lightness)
	var line_color = '#' + decToHex(lc[0]) + decToHex(lc[1]) + decToHex(lc[2]);
	var line_color_rgb = 'rgb(' + lc[0] + ',' + lc[1] + ',' + lc[2] + ')';

	// Calculate Node Color
	var nc = hslToRgb(((frame+180)/100), saturation, lightness)
	var node_color = '#' + decToHex(nc[0]) + decToHex(nc[1]) + decToHex(nc[2]);

	// Clear the frame with fade
	ctx.fillStyle = "rgba(0,0,0,0.018)";
	ctx.fillRect(0,0,page_width,page_height);

	// Update Node Positions
	for (n = 0; n < nodes.length; n++) {
	  nodes[n].frame(n);
	}

	// Update traveling pulses
	for (var i = pulses.length - 1; i >= 0; i--) {
		if (!pulses[i].update()) {
			pulses.splice(i, 1); // Remove completed pulses
		}
	}

	// Maybe create new traveling pulse
	if (Math.random() < pulse_chance && nodes.length > 1) {
		var segmentIndex = Math.floor(Math.random() * (nodes.length - 1));
		pulses.push(new TravelingPulse(segmentIndex));
	}

	// Helper function to draw one quadrant
	function drawQuadrant(xTransform, yTransform) {
		// Draw Lines Connecting Nodes with distance-based styling
		for (n = 0; n < nodes.length - 1; n++) {
			var x1 = xTransform(nodes[n].x);
			var y1 = yTransform(nodes[n].y);
			var x2 = xTransform(nodes[n+1].x);
			var y2 = yTransform(nodes[n+1].y);

			// Calculate distance for opacity/width
			var dx = nodes[n+1].x - nodes[n].x;
			var dy = nodes[n+1].y - nodes[n].y;
			var dist = Math.sqrt(dx*dx + dy*dy);

			// Distance-based opacity and width
			var opacity = Math.max(0.2, 1 - (dist / max_distance));
			var lineWidth = Math.max(1, 3 * opacity);

			ctx.save();
			ctx.globalAlpha = opacity;
			ctx.strokeStyle = line_color;
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
			ctx.restore();
		}

		// Draw traveling pulses
		for (var i = 0; i < pulses.length; i++) {
			var pulse = pulses[i];
			if (pulse.segmentIndex < nodes.length - 1) {
				var n1 = nodes[pulse.segmentIndex];
				var n2 = nodes[pulse.segmentIndex + 1];
				var x1 = xTransform(n1.x);
				var y1 = yTransform(n1.y);
				var x2 = xTransform(n2.x);
				var y2 = yTransform(n2.y);
				pulse.draw(ctx, x1, y1, x2, y2, line_color_rgb);
			}
		}

		// Draw Nodes with pulsing sizes
		for (n = 0; n < nodes.length; n++) {
			var nodeSize = nodes[n].getCurrentSize();
			ctx.save();
			// Add glow to nodes
			ctx.shadowBlur = 10;
			ctx.shadowColor = node_color;
			ctx.beginPath();
			ctx.arc(Math.round(xTransform(nodes[n].x)),Math.round(yTransform(nodes[n].y)), nodeSize, 0,2*Math.PI);
			ctx.fillStyle = node_color;
			ctx.fill();
			ctx.restore();
		}
	}

	// Draw all 4 quadrants
	drawQuadrant(function(x){return x}, function(y){return y}); // Quadrant 1
	drawQuadrant(function(x){return page_width-x}, function(y){return y}); // Quadrant 2
	drawQuadrant(function(x){return page_width-x}, function(y){return page_height-y}); // Quadrant 3
	drawQuadrant(function(x){return x}, function(y){return page_height-y}); // Quadrant 4
}

////////////////////////////////////////////////////////////////////

startBackground = function() {
	nodes = [];
	pulses = []; // Initialize traveling pulses array
	frame = 0;

	// Set up the background canvas
	canvas = document.getElementById('background');
	ctx = canvas.getContext("2d");
	page_width = window.innerWidth;
	page_height = window.innerHeight;
	ctx.canvas.width = page_width;
	ctx.canvas.height = page_height;

	canvas_size = ctx.canvas.width * ctx.canvas.height;

	// Make new nodes with varied speeds and horizontal bias
	for (var i=0; i<num_nodes; i++) {
		var v = new Victor(rand(10)-5,rand(10)-5);
		v = vectorNormal(v).multiply(new Victor(rand(velocity)+1,rand(velocity)+1));

		// Bias initial placement toward left/right edges (50% left third, 50% right third)
		var x_pos;
		if (Math.random() < 0.5) {
			// Left third of screen
			x_pos = padding + Math.random() * (page_width / 3);
		} else {
			// Right third of screen
			x_pos = page_width - padding - Math.random() * (page_width / 3);
		}
		var y_pos = rand(page_height-(padding*2))+padding;

		nodes.push(new node(x_pos, y_pos, v.x, v.y, 250, 1));
	}

	// Animation Loop
	function draw() {
		requestAnimationFrame(draw);
		frame++;
		drawFrame(ctx, frame);
	}

	draw();
}

// Ping the tracking server.
hit_data = {theme: theme, user_agent: navigator.userAgent, resolution_x: window.innerWidth, resolution_y: window.innerHeight, url: document.domain};

// Start the background animation.
startBackground();