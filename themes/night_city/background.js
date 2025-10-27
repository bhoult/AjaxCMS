/* (c) 2025 Night City Theme - Procedurally Generated Cityscape */

page_width = window.innerWidth;
page_height = window.innerHeight;

// Animation configuration
scroll_parallax_factor = 0.3; // Reduced for more subtle parallax
layer_scroll_speed = -0.5;

// Nighttime elements
moon_x = page_width * 0.75;
moon_y = page_height * 0.2;
stars = [];
clouds = [];
buildings = [];
mountains = [];

////////////////////////////////////////////////////////////////////

// Star object
function Star() {
	this.x = Math.random() * page_width;
	this.y = Math.random() * page_height * 0.6; // Upper 60% of screen
	this.size = 0.5 + Math.random() * 1.5;
	this.brightness = 0.3 + Math.random() * 0.7;
	this.twinkleSpeed = 0.02 + Math.random() * 0.03;
	this.twinklePhase = Math.random() * Math.PI * 2;
}

Star.prototype.draw = function(ctx, frame) {
	var twinkle = Math.sin(frame * this.twinkleSpeed + this.twinklePhase) * 0.3 + 0.7;
	var alpha = this.brightness * twinkle;

	ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
	ctx.fill();
};

// Cloud object
function Cloud(layer) {
	this.layer = layer; // 0 = slow/far, 1 = fast/near
	this.x = Math.random() * (page_width + 400) - 200;
	this.y = page_height * 0.1 + Math.random() * page_height * 0.2;
	this.speed = layer === 0 ? 0.2 : 0.4;
	this.scale = layer === 0 ? 0.8 : 1.2;
	this.opacity = layer === 0 ? 0.1 : 0.15;
}

Cloud.prototype.update = function() {
	this.x += this.speed;
	if (this.x > page_width + 200) {
		this.x = -200;
	}
};

Cloud.prototype.draw = function(ctx) {
	ctx.globalAlpha = this.opacity;
	ctx.fillStyle = 'rgba(200, 210, 230, 1)';

	ctx.beginPath();
	ctx.arc(this.x, this.y, 40 * this.scale, 0, Math.PI * 2);
	ctx.arc(this.x + 30 * this.scale, this.y - 10 * this.scale, 50 * this.scale, 0, Math.PI * 2);
	ctx.arc(this.x + 70 * this.scale, this.y, 40 * this.scale, 0, Math.PI * 2);
	ctx.arc(this.x + 50 * this.scale, this.y + 10 * this.scale, 35 * this.scale, 0, Math.PI * 2);
	ctx.fill();

	ctx.globalAlpha = 1.0;
};

// Building object
function Building(depth) {
	this.depth = depth; // 0 = foreground, higher = background
	this.x = Math.random() * 2000; // Random starting position
	this.width = 50 + Math.random() * 90;
	this.height = 150 + Math.random() * 300;
	this.color = this.generateColor();
	this.windows = this.generateWindows();
	this.roofType = Math.floor(Math.random() * 3); // 0=flat, 1=peaked, 2=stepped
	this.hasAntenna = Math.random() > 0.7;
	this.scrollOffset = 0;
}

Building.prototype.generateColor = function() {
	// Dark building colors - pure grays and dark blues for nighttime
	var colorType = Math.random();
	if (colorType < 0.7) {
		// Most buildings: dark gray
		var value = 18 + Math.random() * 22;
		return 'rgb(' + value + ', ' + value + ', ' + value + ')';
	} else {
		// Some buildings: very dark blue-gray
		var value = 15 + Math.random() * 18;
		return 'rgb(' + value + ', ' + (value + 2) + ', ' + (value + 8) + ')';
	}
};

Building.prototype.generateWindows = function() {
	var windows = [];
	var windowWidth = 3;
	var windowHeight = 5;
	var spacing = 10;
	var cols = Math.floor(this.width / spacing);
	var rows = Math.floor(this.height / 12);

	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < cols; col++) {
			// 65% chance of lit window
			if (Math.random() > 0.35) {
				windows.push({
					x: col * spacing + 3,
					y: row * 12 + 4,
					brightness: 0.4 + Math.random() * 0.6,
					flickerPhase: Math.random() * Math.PI * 2
				});
			}
		}
	}

	return windows;
};

Building.prototype.update = function(frame) {
	this.scrollOffset = (frame * layer_scroll_speed) / (this.depth + 1);
};

Building.prototype.draw = function(ctx, frame, scrollY) {
	// Make foreground buildings larger - adjust scale calculation
	var scale = 1 / (this.depth * 0.4 + 1);
	var width = this.width * scale;
	var height = this.height * scale;

	// Calculate position with horizontal parallax
	var x = (this.x + this.scrollOffset) % (page_width + 200);
	if (x < -200) x += (page_width + 200);

	// Center-focused parallax: middle layer (depth 2) stays fixed
	// Foreground (depth 0-1) moves UP as you scroll down (negative offset)
	// Background (depth 3-4) moves DOWN as you scroll down (positive offset)
	var centerDepth = 2;
	var depthFromCenter = this.depth - centerDepth;
	// Flip the sign and reduce intensity
	var parallax_offset = -scrollY * scroll_parallax_factor * depthFromCenter * 0.15;

	// Clamp parallax so foreground buildings' bottoms never become visible
	if (this.depth === 0) {
		// For foreground, limit upward movement to 80% of building height
		parallax_offset = Math.min(parallax_offset, height * 0.8);
	}

	var y = page_height - height - parallax_offset;

	// Apply slight transparency to foreground for depth effect (much faster than blur)
	if (this.depth === 0) {
		ctx.globalAlpha = 0.85;
	} else if (this.depth === 1) {
		ctx.globalAlpha = 0.95;
	} else {
		ctx.globalAlpha = 1.0;
	}

	// Draw building body with vertical gradient for depth
	var gradient = ctx.createLinearGradient(x, y, x, y + height);
	var baseColor = this.color;
	var rgb = baseColor.match(/\d+/g);
	gradient.addColorStop(0, 'rgb(' + Math.min(255, parseInt(rgb[0]) + 5) + ', ' + Math.min(255, parseInt(rgb[1]) + 5) + ', ' + Math.min(255, parseInt(rgb[2]) + 5) + ')');
	gradient.addColorStop(1, this.color);
	ctx.fillStyle = gradient;
	ctx.fillRect(x, y, width, height);

	// Add subtle vertical lines for architectural detail
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
	ctx.lineWidth = 1;
	var numLines = Math.floor(width / 20);
	for (var line = 1; line < numLines; line++) {
		var lineX = x + (width / numLines) * line;
		ctx.beginPath();
		ctx.moveTo(lineX, y);
		ctx.lineTo(lineX, y + height);
		ctx.stroke();
	}

	// Draw roof
	ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	if (this.roofType === 1) {
		// Peaked roof
		ctx.beginPath();
		ctx.moveTo(x - 2 * scale, y);
		ctx.lineTo(x + width / 2, y - 15 * scale);
		ctx.lineTo(x + width + 2 * scale, y);
		ctx.closePath();
		ctx.fill();
	} else if (this.roofType === 2) {
		// Stepped roof
		ctx.fillRect(x + width * 0.2, y - 10 * scale, width * 0.6, 10 * scale);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
		ctx.strokeRect(x + width * 0.2, y - 10 * scale, width * 0.6, 10 * scale);
	}

	// Draw antenna if building has one
	if (this.hasAntenna) {
		ctx.strokeStyle = 'rgba(80, 80, 80, 0.8)';
		ctx.lineWidth = 2 * scale;
		ctx.beginPath();
		ctx.moveTo(x + width / 2, y - (this.roofType === 1 ? 15 * scale : this.roofType === 2 ? 10 * scale : 0));
		ctx.lineTo(x + width / 2, y - (this.roofType === 1 ? 35 * scale : this.roofType === 2 ? 30 * scale : 20 * scale));
		ctx.stroke();
		// Antenna light with glow
		var antennaY = y - (this.roofType === 1 ? 35 * scale : this.roofType === 2 ? 30 * scale : 20 * scale);
		ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
		ctx.beginPath();
		ctx.arc(x + width / 2, antennaY, 4 * scale, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
		ctx.beginPath();
		ctx.arc(x + width / 2, antennaY, 2 * scale, 0, Math.PI * 2);
		ctx.fill();
	}

	// Draw windows with glow
	for (var i = 0; i < this.windows.length; i++) {
		var win = this.windows[i];
		var flicker = Math.sin(frame * 0.05 + win.flickerPhase) * 0.15 + 0.85;
		var alpha = win.brightness * flicker;

		var winX = x + win.x * scale;
		var winY = y + win.y * scale;

		// Window glow
		ctx.fillStyle = 'rgba(255, 200, 100, ' + (alpha * 0.2) + ')';
		ctx.fillRect(winX - 1 * scale, winY - 1 * scale, 5 * scale, 7 * scale);

		// Window
		ctx.fillStyle = 'rgba(255, 200, 100, ' + alpha + ')';
		ctx.fillRect(winX, winY, 3 * scale, 5 * scale);
	}

	// Subtle edge highlights and shadows for 3D effect
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x + 1, y + height);
	ctx.lineTo(x + 1, y);
	ctx.stroke();

	// Shadow on right edge
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x + width - 1, y);
	ctx.lineTo(x + width - 1, y + height);
	ctx.stroke();

	// Reset alpha for next building
	ctx.globalAlpha = 1.0;
};

// Mountain object
function Mountain(depth) {
	this.depth = depth;
	this.points = [];
	this.generateProfile();
	this.scrollOffset = 0;
}

Mountain.prototype.generateProfile = function() {
	// Generate smooth mountain profile using sine waves and noise
	var numPoints = 100;
	var wavelength = page_width / 3;

	for (var i = 0; i < numPoints; i++) {
		var x = (i / numPoints) * (page_width + 400);

		// Multiple sine waves for natural-looking peaks
		var baseHeight = 80 + Math.sin(i * 0.15) * 40;
		var height = baseHeight
			+ Math.sin(i * 0.3) * 30
			+ Math.sin(i * 0.5) * 20
			+ Math.sin(i * 0.8) * 15
			+ (Math.random() - 0.5) * 10; // Add some noise

		this.points.push({
			x: x,
			height: Math.max(20, height)
		});
	}
};

Mountain.prototype.update = function(frame) {
	this.scrollOffset = (frame * layer_scroll_speed * 0.2) / (this.depth + 1);
};

Mountain.prototype.draw = function(ctx, scrollY) {
	var scale = 1 / (this.depth + 2);
	var baseY = page_height * 0.7;

	// Blue atmospheric tint for distance
	var blueTint = Math.min(80, this.depth * 25);
	var darkness = Math.max(0, 30 - this.depth * 5);
	ctx.fillStyle = 'rgb(' + (darkness + blueTint) + ', ' + (darkness + blueTint) + ', ' + (darkness + blueTint * 1.3) + ')';

	// Mountains are far background, move DOWN more than background buildings
	// Center is at building depth 2, mountains are like depth 5-7
	var centerDepth = 2;
	var mountainEquivalentDepth = 5 + this.depth;
	var depthFromCenter = mountainEquivalentDepth - centerDepth;
	// Flip sign and reduce intensity
	var parallax_offset = -scrollY * scroll_parallax_factor * depthFromCenter * 0.15;

	ctx.beginPath();
	ctx.moveTo(-10, page_height);
	ctx.lineTo(-10, baseY - parallax_offset);

	// Draw smooth curve through points
	for (var i = 0; i < this.points.length; i++) {
		var point = this.points[i];
		var x = (point.x + this.scrollOffset) % (page_width + 400);
		if (x < -200) x += (page_width + 400);

		var y = baseY - (point.height * scale) - parallax_offset;

		if (i === 0) {
			ctx.lineTo(x, y);
		} else {
			// Use quadratic curves for smoothness
			var prevPoint = this.points[i - 1];
			var prevX = (prevPoint.x + this.scrollOffset) % (page_width + 400);
			if (prevX < -200) prevX += (page_width + 400);
			var prevY = baseY - (prevPoint.height * scale) - parallax_offset;

			var cpX = (prevX + x) / 2;
			var cpY = (prevY + y) / 2;
			ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
		}
	}

	ctx.lineTo(page_width + 10, baseY - parallax_offset);
	ctx.lineTo(page_width + 10, page_height);
	ctx.closePath();
	ctx.fill();
};

// Draw moon
function drawMoon(ctx) {
	// Moon glow
	var gradient = ctx.createRadialGradient(moon_x, moon_y, 20, moon_x, moon_y, 100);
	gradient.addColorStop(0, 'rgba(255, 250, 230, 0.4)');
	gradient.addColorStop(0.4, 'rgba(255, 250, 230, 0.2)');
	gradient.addColorStop(1, 'rgba(255, 250, 230, 0)');
	ctx.fillStyle = gradient;
	ctx.fillRect(moon_x - 100, moon_y - 100, 200, 200);

	// Moon body
	ctx.fillStyle = 'rgba(255, 250, 230, 0.95)';
	ctx.beginPath();
	ctx.arc(moon_x, moon_y, 40, 0, Math.PI * 2);
	ctx.fill();

	// Moon craters
	ctx.fillStyle = 'rgba(200, 200, 180, 0.3)';
	ctx.beginPath();
	ctx.arc(moon_x - 12, moon_y - 6, 10, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x + 10, moon_y + 12, 7, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x + 8, moon_y - 15, 5, 0, Math.PI * 2);
	ctx.fill();
}

////////////////////////////////////////////////////////////////////

// Main animation loop
function drawFrame(frame) {
	var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

	var canvas = document.getElementById('background');
	if (!canvas || !canvas.getContext) return;

	var ctx = canvas.getContext('2d');

	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw night sky gradient
	var skyGradient = ctx.createLinearGradient(0, 0, 0, page_height);
	skyGradient.addColorStop(0, '#0a0e27');
	skyGradient.addColorStop(0.5, '#1a1f3a');
	skyGradient.addColorStop(1, '#2d3250');
	ctx.fillStyle = skyGradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Draw moon
	drawMoon(ctx);

	// Draw stars
	for (var i = 0; i < stars.length; i++) {
		stars[i].draw(ctx, frame);
	}

	// Draw clouds (back layer)
	for (var i = 0; i < clouds.length; i++) {
		if (clouds[i].layer === 0) {
			clouds[i].update();
			clouds[i].draw(ctx);
		}
	}

	// Draw mountains (back to front)
	for (var i = mountains.length - 1; i >= 0; i--) {
		mountains[i].update(frame);
		mountains[i].draw(ctx, scrollY);
	}

	// Draw buildings (back to front)
	for (var i = buildings.length - 1; i >= 0; i--) {
		buildings[i].update(frame);
		buildings[i].draw(ctx, frame, scrollY);
	}

	// Draw clouds (front layer)
	for (var i = 0; i < clouds.length; i++) {
		if (clouds[i].layer === 1) {
			clouds[i].update();
			clouds[i].draw(ctx);
		}
	}
}

////////////////////////////////////////////////////////////////////

startBackground = function() {
	frame = 0;

	// Setup canvas
	var canvas = document.getElementById('background');
	if (canvas) {
		canvas.width = page_width;
		canvas.height = page_height;
	}

	// Generate stars
	for (var i = 0; i < 150; i++) {
		stars.push(new Star());
	}

	// Generate clouds
	for (var i = 0; i < 4; i++) {
		clouds.push(new Cloud(0)); // Slow layer
	}
	for (var i = 0; i < 5; i++) {
		clouds.push(new Cloud(1)); // Fast layer
	}

	// Generate mountains (3 layers)
	for (var i = 0; i < 3; i++) {
		mountains.push(new Mountain(i));
	}

	// Generate buildings (5 depth layers)
	for (var depth = 0; depth < 5; depth++) {
		var numBuildings = 8 + Math.floor(Math.random() * 4);
		for (var i = 0; i < numBuildings; i++) {
			buildings.push(new Building(depth));
		}
	}

	// Animation loop
	function draw() {
		requestAnimationFrame(draw);
		frame++;
		drawFrame(frame);
	}

	draw();
};

// Handle window resize
$(window).resize(function() {
	page_width = window.innerWidth;
	page_height = window.innerHeight;

	moon_x = page_width * 0.75;
	moon_y = page_height * 0.2;

	var canvas = document.getElementById('background');
	if (canvas) {
		canvas.width = page_width;
		canvas.height = page_height;
	}
});

// Start animation
startBackground();
