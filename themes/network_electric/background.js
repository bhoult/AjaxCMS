/**
 * AjaxCMS Theme - Network Electric
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


x_velocity = 3;
y_velocity = 1;
padding = 100;    	// How far from the edge does repulsion start.
magnet = 1;      	// Strength of repulsion greater = less repulsion.
node_density = 30;  // Less is higher density.
line_hue = 200;     // Blue hue (180-240 is blue range)
hue_spread = 20;
node_color = "#00AAFF"; // Electric blue
background_color = "#000";
max_distance = 250;
max_sparks = 5;
spark_spread = 7;
lightning_chance = 0.01; // Probability per frame per node (increased frequency)
lightning_length = 150;   // How far lightning bolts reach
lightning_segments = 5;   // Number of segments in lightning bolt
lightning_jitter = 30;    // How jagged the lightning is
red_line_chance = 0.15;   // Probability that a line will be red instead of blue

////////////////////////////////////////////////////////////////////

function node(x,y, vx,vy, size, depth) {
  this.x = x;
  this.y = y;
  this.velocity = new Victor(vx, vy);
  this.depth = depth;
  this.size = size;
  this.pulse = Math.random() * Math.PI * 2; // Random starting phase
  this.pulseSpeed = 0.02 + Math.random() * 0.03; // Random pulse speed
  this.lightningTimer = 0; // Countdown to next lightning bolt

  this.frame = function(n) {
  	// Apply Movement
    this.x += (this.velocity.x);
    this.y += (this.velocity.y);

    // Update pulse
    this.pulse += this.pulseSpeed;

	// Repel
    if (this.x < padding) {this.velocity.x -= ((this.x - padding) / padding / magnet)}
    if (this.x > (page_width - padding)) {this.velocity.x += ((page_width - padding - this.x) / padding / magnet)}
    if (this.y < padding) {this.velocity.y -= ((this.y - padding) / padding / magnet)}
    if (this.y > (page_height - padding)) {this.velocity.y += ((page_height - padding - this.y) / padding / magnet)}

    // Bounce
    //if (this.x > page_width) {this.velocity.x = -this.velocity.x}
    //if (this.x < 0) {this.velocity.x = -this.velocity.x}
    //if (this.y > page_height) {this.velocity.y = -this.velocity.y}
    //if (this.y < 0) {this.velocity.y = -this.velocity.y}


  }
}

// Rotate around point
function rotatePoint(pointX, pointY, originX, originY, angle) {
	angle = angle * Math.PI / 180.0;
	return {
		x: Math.cos(angle) * (pointX-originX) - Math.sin(angle) * (pointY-originY) + originX,
		y: Math.sin(angle) * (pointX-originX) + Math.cos(angle) * (pointY-originY) + originY
	};
}

// Distance Between Two Points
function distance(x1,y1,x2,y2) {
	return Math.sqrt( (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) );
}

// Draw a lightning bolt from a node
function drawLightning(ctx, startX, startY, angle) {
	var x = startX;
	var y = startY;
	var segmentLength = lightning_length / lightning_segments;

	// Randomly decide how many forks (0-4)
	var numForks = Math.floor(Math.random() * 5);
	var forksCreated = 0;

	ctx.strokeStyle = "rgba(200, 230, 255, 0.9)"; // White-blue
	ctx.lineWidth = 2;
	ctx.shadowBlur = 15;
	ctx.shadowColor = "#00AAFF";

	ctx.beginPath();
	ctx.moveTo(x, y);

	// Draw jagged lightning segments
	for (var i = 0; i < lightning_segments; i++) {
		var nextX = x + Math.cos(angle) * segmentLength + (Math.random() - 0.5) * lightning_jitter;
		var nextY = y + Math.sin(angle) * segmentLength + (Math.random() - 0.5) * lightning_jitter;

		ctx.lineTo(nextX, nextY);

		// Create forks at random segments (up to numForks)
		if (forksCreated < numForks && i < lightning_segments - 1) {
			// Random chance of forking at this segment
			if (Math.random() < 0.5) {
				var numBranches = Math.floor(Math.random() * 2) + 1; // 1-2 branches per fork
				for (var b = 0; b < numBranches; b++) {
					var branchAngle = angle + (Math.random() - 0.5) * 2.0;
					var branchLength = segmentLength * (0.5 + Math.random() * 0.4); // Random length
					var branchSegments = Math.floor(Math.random() * 2) + 2; // 2-3 segments

					// Draw branch
					var branchX = nextX;
					var branchY = nextY;
					for (var s = 0; s < branchSegments; s++) {
						var branchNextX = branchX + Math.cos(branchAngle) * branchLength + (Math.random() - 0.5) * lightning_jitter * 0.7;
						var branchNextY = branchY + Math.sin(branchAngle) * branchLength + (Math.random() - 0.5) * lightning_jitter * 0.7;
						ctx.moveTo(branchX, branchY);
						ctx.lineTo(branchNextX, branchNextY);
						branchX = branchNextX;
						branchY = branchNextY;
					}
				}
				forksCreated++;
			}
			ctx.moveTo(nextX, nextY);
		}

		x = nextX;
		y = nextY;
	}

	ctx.stroke();
	ctx.shadowBlur = 0; // Reset shadow
}

// Draw the nodes and other effects
function drawFrame(ctx, frame) {

	// Partial clear for fading trail effect (lightning glow persists, lines don't)
	// Higher opacity (0.4) means connecting lines fade quickly while lightning still trails
	ctx.fillStyle = "rgba(0,0,0,0.4)";
	ctx.fillRect(0,0,page_width,page_height);
	
	// Update Node Positions
	for (n = 0; n < nodes.length; n++) {
	  nodes[n].frame(n);
	}
	
	// Draw Lines Connecting Nodes
	for (a=0; a<nodes.length; a++) {
		for (b=0; b<nodes.length; b++) {
			if (b == a) {continue} // don't spark on self.
			
			var dist = distance(nodes[a].x,nodes[a].y,nodes[b].x,nodes[b].y);
			if (dist < 1){continue} // don't spark when touching (prevent divide by 0) 
			
			// Make sparks if close enough
			if (dist < max_distance) {
				var xcent = (nodes[b].x + nodes[a].x)/2;
				var ycent = (nodes[b].y + nodes[a].y)/2;

				var num_sparks = Math.round(max_distance / dist);
				if (num_sparks > max_sparks) {num_sparks = max_sparks}

				// Randomly choose red or blue for this connection
				var use_red = Math.random() < red_line_chance;
				var base_hue = use_red ? 0 : line_hue; // 0 = red, 200 = blue

				for(i=0; i<num_sparks;i++) {
					line_saturation = 1;
					line_lightness = 1-(dist/max_distance);
					line_color = "hsla("+Math.round(base_hue + rand(hue_spread*2) - hue_spread)+","+(line_saturation*100)+"%,"+Math.round(line_lightness*100)+"%,0.5)";
					//debugger
					ctx.strokeStyle = line_color;
					ctx.beginPath();
				    ctx.moveTo(nodes[a].x, nodes[a].y);
				    ctx.lineTo(xcent+rand(spark_spread*2)-spark_spread, ycent+rand(spark_spread*2)-spark_spread);
				    ctx.lineTo(nodes[b].x, nodes[b].y);
				    ctx.stroke();
				}
			}
			
		}
	}
	
	// Generate and draw lightning bolts
	for (n = 0; n < nodes.length; n++) {
		if (Math.random() < lightning_chance) {
			// Spawn lightning bolt in random direction
			var angle = Math.random() * Math.PI * 2;
			drawLightning(ctx, nodes[n].x, nodes[n].y, angle);
		}
	}

	// Draw Nodes with pulsing glow
	for (n = 0; n < nodes.length; n++) {
		// Calculate pulse intensity (0.5 to 1.5)
		var pulseIntensity = 1 + Math.sin(nodes[n].pulse) * 0.5;
		var nodeSize = 5 * pulseIntensity * 0.7 + 3; // Size varies from 3 to 5.5
		var glowSize = 10 + pulseIntensity * 10; // Glow varies from 10 to 20

		// Draw glow
		ctx.shadowBlur = glowSize;
		ctx.shadowColor = "#00AAFF";

		ctx.beginPath();
		ctx.arc(nodes[n].x, nodes[n].y, nodeSize, 0, 2*Math.PI);
		ctx.fillStyle = node_color;
		ctx.fill();

		// Draw bright center
		ctx.shadowBlur = 5;
		ctx.beginPath();
		ctx.arc(nodes[n].x, nodes[n].y, nodeSize * 0.5, 0, 2*Math.PI);
		ctx.fillStyle = "#FFFFFF";
		ctx.fill();
	}

	// Reset shadow
	ctx.shadowBlur = 0;
}

///////////////////////////////////////////////////////////////////

startBackground = function() {
	nodes = [];
	frame = 0;
	
	$('#background').css('background', background_color);
	
	// Set up the background canvas
	canvas = document.getElementById('background');
	ctx = canvas.getContext("2d");
	page_width = window.innerWidth;
	page_height = window.innerHeight;
	center_x = page_width / 2;
	center_y = page_height / 2;
	ctx.canvas.width = page_width;
	ctx.canvas.height = page_height;
	
	num_nodes = Math.round((page_width * page_height) / (node_density * 1000));

	canvas_size = ctx.canvas.width * ctx.canvas.height;
	
	// Make new nodes
	for (var i=0; i<num_nodes; i++) {
		var v = new Victor(rand(10)-5,rand(10)-5);
		v = vectorNormal(v).multiply(new Victor(rand(x_velocity)+1,rand(y_velocity)));
		nodes.push(new node(rand(page_width-(padding*2))+padding,rand(page_height-(padding*2))+padding, v.x,v.y, 250,1));
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
$( document ).ready(function() {
	startBackground();
});