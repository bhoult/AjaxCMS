/* (c) 2025 Night City Theme - Procedurally Generated Cityscape */

page_width = window.innerWidth;
page_height = window.innerHeight;

// Animation configuration
scroll_parallax_factor = 0.3;
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
	this.width = 40 + Math.random() * 80;
	this.height = 100 + Math.random() * 200;
	this.color = this.generateColor();
	this.windows = this.generateWindows();
	this.scrollOffset = 0;
}

Building.prototype.generateColor = function() {
	// Dark building colors with slight variation
	var value = 20 + Math.random() * 30;
	return 'rgb(' + value + ', ' + value + ', ' + (value + 5) + ')';
};

Building.prototype.generateWindows = function() {
	var windows = [];
	var windowWidth = 4;
	var windowHeight = 6;
	var cols = Math.floor(this.width / 12);
	var rows = Math.floor(this.height / 15);

	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < cols; col++) {
			// 70% chance of lit window
			if (Math.random() > 0.3) {
				windows.push({
					x: col * 12 + 4,
					y: row * 15 + 5,
					brightness: 0.5 + Math.random() * 0.5,
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
	var scale = 1 / (this.depth * 0.5 + 1);
	var width = this.width * scale;
	var height = this.height * scale;

	// Calculate position with parallax
	var x = (this.x + this.scrollOffset) % (page_width + 200);
	if (x < -200) x += (page_width + 200);

	var parallax_offset = scrollY * scroll_parallax_factor * (1 / (this.depth + 1));
	var y = page_height - height - parallax_offset;

	// Draw building
	ctx.fillStyle = this.color;
	ctx.fillRect(x, y, width, height);

	// Draw windows
	for (var i = 0; i < this.windows.length; i++) {
		var win = this.windows[i];
		var flicker = Math.sin(frame * 0.05 + win.flickerPhase) * 0.15 + 0.85;
		var alpha = win.brightness * flicker;

		ctx.fillStyle = 'rgba(255, 200, 100, ' + alpha + ')';
		ctx.fillRect(
			x + win.x * scale,
			y + win.y * scale,
			4 * scale,
			6 * scale
		);
	}

	// Building outline for depth
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
	ctx.lineWidth = 1;
	ctx.strokeRect(x, y, width, height);
};

// Mountain object
function Mountain(depth) {
	this.depth = depth;
	this.peaks = [];
	this.generatePeaks();
	this.scrollOffset = 0;
}

Mountain.prototype.generatePeaks = function() {
	var numPeaks = 8 + Math.floor(Math.random() * 5);
	for (var i = 0; i < numPeaks; i++) {
		this.peaks.push({
			x: (i / numPeaks) * 2000,
			height: 100 + Math.random() * 150,
			width: 100 + Math.random() * 100
		});
	}
};

Mountain.prototype.update = function(frame) {
	this.scrollOffset = (frame * layer_scroll_speed * 0.3) / (this.depth + 1);
};

Mountain.prototype.draw = function(ctx, scrollY) {
	var scale = 1 / (this.depth + 2);
	var baseY = page_height * 0.7;

	// Blue atmospheric tint for distance
	var blueTint = Math.min(100, this.depth * 20);
	ctx.fillStyle = 'rgb(' + (40 + blueTint) + ', ' + (45 + blueTint) + ', ' + (60 + blueTint) + ')';

	ctx.beginPath();
	ctx.moveTo(-10, page_height);

	for (var i = 0; i < this.peaks.length; i++) {
		var peak = this.peaks[i];
		var x = (peak.x + this.scrollOffset) % (page_width + 400);
		if (x < -200) x += (page_width + 400);

		var parallax_offset = scrollY * scroll_parallax_factor * 0.2 * (1 / (this.depth + 1));
		var peakY = baseY - (peak.height * scale) + parallax_offset;

		// Draw triangular peak
		ctx.lineTo(x - peak.width * scale * 0.5, baseY + parallax_offset);
		ctx.lineTo(x, peakY);
		ctx.lineTo(x + peak.width * scale * 0.5, baseY + parallax_offset);
	}

	ctx.lineTo(page_width + 10, baseY);
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
