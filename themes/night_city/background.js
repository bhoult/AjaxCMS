/* (c) 2025 Night City Theme - Procedurally Generated Cityscape */

page_width = window.innerWidth;
page_height = window.innerHeight;

// Animation configuration
scroll_parallax_factor = 0.3; // Reduced for more subtle parallax
layer_scroll_speed = -0.5;

// Animation loop tracking
var animationFrameId = null;

// Nighttime elements
moon_x = page_width * 0.08;
moon_y = page_height * 0.10;
stars = [];
shootingStars = [];
ufos = [];
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
	// More noticeable flicker with occasional dimming
	var twinkle = Math.sin(frame * this.twinkleSpeed + this.twinklePhase) * 0.5 + 0.5;
	var alpha = this.brightness * twinkle;

	ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
	ctx.fill();
};

// Shooting Star object
function ShootingStar() {
	this.x = Math.random() * page_width;
	this.y = Math.random() * page_height * 0.4; // Upper 40% only
	this.length = 30 + Math.random() * 210; // Vary from 30 to 240 pixels (3x variation)
	this.speed = 3 + Math.random() * 4;
	this.angle = Math.PI / 6 + Math.random() * Math.PI / 12; // Diagonal down-right
	this.brightness = 0.8 + Math.random() * 0.2;
	this.life = 60; // Frames to live
	this.maxLife = this.life;
}

ShootingStar.prototype.update = function() {
	this.x += Math.cos(this.angle) * this.speed;
	this.y += Math.sin(this.angle) * this.speed;
	this.life--;
};

ShootingStar.prototype.isAlive = function() {
	return this.life > 0 && this.x < page_width + 100 && this.y < page_height;
};

ShootingStar.prototype.draw = function(ctx) {
	// Fade in/out based on life
	var fadeIn = Math.min(1, (this.maxLife - this.life) / 10);
	var fadeOut = Math.min(1, this.life / 20);
	var alpha = this.brightness * fadeIn * fadeOut;

	// Draw the shooting star trail
	var gradient = ctx.createLinearGradient(
		this.x,
		this.y,
		this.x - Math.cos(this.angle) * this.length,
		this.y - Math.sin(this.angle) * this.length
	);
	gradient.addColorStop(0, 'rgba(255, 255, 255, ' + alpha + ')');
	gradient.addColorStop(0.5, 'rgba(200, 220, 255, ' + (alpha * 0.5) + ')');
	gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');

	ctx.strokeStyle = gradient;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(this.x, this.y);
	ctx.lineTo(
		this.x - Math.cos(this.angle) * this.length,
		this.y - Math.sin(this.angle) * this.length
	);
	ctx.stroke();

	// Bright head
	ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
	ctx.beginPath();
	ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
	ctx.fill();
};

// UFO object
function UFO() {
	// UFOs fly from left to right or right to left
	this.direction = Math.random() > 0.5 ? 1 : -1;
	this.x = this.direction > 0 ? -100 : page_width + 100;
	this.y = Math.random() * page_height * 0.3 + 50; // Upper third of screen
	this.speed = 2 + Math.random() * 2;
	this.size = 20 + Math.random() * 15;
	this.wobble = Math.random() * Math.PI * 2; // For wobbling motion
	this.lightPhase = Math.random() * Math.PI * 2; // For blinking lights
}

UFO.prototype.update = function(frame) {
	this.x += this.speed * this.direction;
	this.wobble = frame * 0.05;
	this.lightPhase = frame * 0.1;
};

UFO.prototype.isAlive = function() {
	if (this.direction > 0) {
		return this.x < page_width + 100;
	} else {
		return this.x > -100;
	}
};

UFO.prototype.draw = function(ctx, frame) {
	var wobbleY = Math.sin(this.wobble) * 3;
	var y = this.y + wobbleY;

	// UFO shadow/glow underneath
	var glowGradient = ctx.createRadialGradient(this.x, y + this.size * 0.5, 0, this.x, y + this.size * 0.5, this.size * 1.5);
	glowGradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
	glowGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
	ctx.fillStyle = glowGradient;
	ctx.beginPath();
	ctx.arc(this.x, y + this.size * 0.5, this.size * 1.5, 0, Math.PI * 2);
	ctx.fill();

	// UFO dome (top)
	ctx.fillStyle = 'rgba(150, 160, 170, 0.8)';
	ctx.beginPath();
	ctx.ellipse(this.x, y - this.size * 0.2, this.size * 0.5, this.size * 0.35, 0, 0, Math.PI * 2);
	ctx.fill();

	// Dome highlight
	ctx.fillStyle = 'rgba(200, 220, 240, 0.4)';
	ctx.beginPath();
	ctx.ellipse(this.x - this.size * 0.15, y - this.size * 0.25, this.size * 0.2, this.size * 0.15, 0, 0, Math.PI * 2);
	ctx.fill();

	// UFO body (saucer)
	ctx.fillStyle = 'rgba(120, 130, 140, 0.9)';
	ctx.beginPath();
	ctx.ellipse(this.x, y, this.size, this.size * 0.3, 0, 0, Math.PI * 2);
	ctx.fill();

	// Body edge highlight
	ctx.strokeStyle = 'rgba(180, 190, 200, 0.6)';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.ellipse(this.x, y, this.size, this.size * 0.3, 0, 0, Math.PI);
	ctx.stroke();

	// Colored lights around the rim
	var numLights = 5;
	for (var i = 0; i < numLights; i++) {
		var angle = (i / numLights) * Math.PI * 2 + this.lightPhase;
		var lightX = this.x + Math.cos(angle) * this.size * 0.8;
		var lightY = y + Math.sin(angle) * this.size * 0.24;

		// Alternate between colors
		var brightness = Math.sin(this.lightPhase + i) * 0.3 + 0.7;
		var colors = [
			'rgba(255, 100, 100, ' + brightness + ')',
			'rgba(100, 255, 100, ' + brightness + ')',
			'rgba(100, 100, 255, ' + brightness + ')',
			'rgba(255, 255, 100, ' + brightness + ')'
		];
		var color = colors[i % colors.length];

		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(lightX, lightY, 2, 0, Math.PI * 2);
		ctx.fill();

		// Light glow
		ctx.fillStyle = color.replace(/[\d.]+\)/, '0.2)');
		ctx.beginPath();
		ctx.arc(lightX, lightY, 4, 0, Math.PI * 2);
		ctx.fill();
	}

	// Beam underneath (occasionally)
	if (Math.sin(this.lightPhase * 0.5) > 0.6) {
		var beamGradient = ctx.createLinearGradient(this.x, y + this.size * 0.3, this.x, y + this.size * 3);
		beamGradient.addColorStop(0, 'rgba(200, 255, 255, 0.2)');
		beamGradient.addColorStop(1, 'rgba(200, 255, 255, 0)');
		ctx.fillStyle = beamGradient;
		ctx.beginPath();
		ctx.moveTo(this.x - this.size * 0.3, y + this.size * 0.3);
		ctx.lineTo(this.x + this.size * 0.3, y + this.size * 0.3);
		ctx.lineTo(this.x + this.size * 0.8, y + this.size * 3);
		ctx.lineTo(this.x - this.size * 0.8, y + this.size * 3);
		ctx.closePath();
		ctx.fill();
	}
};

// Pre-computed blurred cloud canvases (initialized in startBackground)
var cloudCanvases = [];

// Cloud object
function Cloud(layer) {
	this.layer = layer; // 0 = slow/far, 1 = fast/near
	this.x = Math.random() * (page_width + 1000) - 500;
	this.y = page_height * 0.1 + Math.random() * page_height * 0.2;
	this.speed = layer === 0 ? 0.2 : 0.4;
	this.scale = layer === 0 ? 0.8 : 1.2;
	this.opacity = layer === 0 ? 0.1 : 0.15;
	this.shapeType = Math.floor(Math.random() * 5); // 5 different cloud shapes
}

Cloud.prototype.update = function() {
	this.x += this.speed;
	if (this.x > page_width + 500) {
		this.x = -500;
	}
};

Cloud.prototype.draw = function(ctx) {
	// Use pre-computed blurred cloud canvas
	var cloudCanvas = cloudCanvases[this.shapeType];
	if (!cloudCanvas) return;

	// Scale factors: 50% larger overall, plus 50% horizontal stretch
	var scaleX = this.scale * 2.25;
	var scaleY = this.scale * 1.5;

	ctx.globalAlpha = this.opacity;

	// Draw the pre-blurred cloud canvas scaled to current position
	ctx.drawImage(
		cloudCanvas,
		this.x - cloudCanvas.width * scaleX / 2,
		this.y - cloudCanvas.height * scaleY / 2,
		cloudCanvas.width * scaleX,
		cloudCanvas.height * scaleY
	);

	ctx.globalAlpha = 1.0;
};

// Generate pre-blurred cloud shapes
function generateCloudCanvases() {
	cloudCanvases = [];

	var shapes = [
		// Shape 0: Fluffy round cloud
		function(ctx, cx, cy) {
			ctx.ellipse(cx, cy, 40, 40, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 30, cy - 10, 50, 50, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 70, cy, 40, 40, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 50, cy + 10, 35, 35, 0, 0, Math.PI * 2);
		},
		// Shape 1: Long stretched cloud
		function(ctx, cx, cy) {
			ctx.ellipse(cx, cy, 35, 35, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 40, cy - 5, 38, 38, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 80, cy, 35, 35, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 115, cy + 5, 32, 32, 0, 0, Math.PI * 2);
		},
		// Shape 2: Compact clustered cloud
		function(ctx, cx, cy) {
			ctx.ellipse(cx, cy, 45, 45, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 25, cy - 15, 40, 40, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 50, cy - 8, 38, 38, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 35, cy + 12, 30, 30, 0, 0, Math.PI * 2);
		},
		// Shape 3: Wispy cloud
		function(ctx, cx, cy) {
			ctx.ellipse(cx, cy, 30, 30, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 35, cy + 8, 42, 42, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 75, cy + 5, 28, 28, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 55, cy - 10, 25, 25, 0, 0, Math.PI * 2);
		},
		// Shape 4: Tall puffy cloud
		function(ctx, cx, cy) {
			ctx.ellipse(cx, cy, 38, 38, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 20, cy - 20, 45, 45, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 45, cy - 10, 42, 42, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 60, cy + 8, 35, 35, 0, 0, Math.PI * 2);
			ctx.ellipse(cx + 30, cy + 15, 30, 30, 0, 0, Math.PI * 2);
		}
	];

	for (var i = 0; i < shapes.length; i++) {
		// Create off-screen canvas for this cloud shape
		// Larger canvas to accommodate blur spread (8px blur extends ~16-24px beyond shapes)
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 250;
		var ctx = canvas.getContext('2d');

		// Draw cloud shape with blur - centered with extra padding for blur
		ctx.filter = 'blur(8px)';
		ctx.fillStyle = 'rgba(200, 210, 230, 1)';
		ctx.beginPath();
		shapes[i](ctx, 200, 125);
		ctx.fill();
		ctx.filter = 'none';

		cloudCanvases.push(canvas);
	}
}

// Building object
function Building(depth) {
	this.depth = depth; // 0 = foreground, higher = background
	this.x = Math.random() * page_width * 1.5; // Random starting position proportional to screen width
	// Building sizes proportional to screen width
	var widthScale = page_width / 1920; // Base scale on 1920px width
	this.width = (50 + Math.random() * 90) * widthScale;
	this.height = (150 + Math.random() * 300) * widthScale;
	this.color = this.generateColor();
	this.windows = this.generateWindows();
	this.roofType = Math.floor(Math.random() * 3); // 0=flat, 1=peaked, 2=stepped
	this.hasAntenna = Math.random() > 0.6;
	// Rooftop structures - most buildings have at least one
	this.hasSolarPanels = Math.random() > 0.5;
	this.hasWaterTower = Math.random() > 0.6;
	this.hasBillboard = Math.random() > 0.7;
	this.billboardIsLit = Math.random() > 0.5; // Fixed at construction - no flickering
	this.hasHVAC = Math.random() > 0.5;
	this.scrollOffset = 0;
}

Building.prototype.generateColor = function() {
	// Realistic nighttime building colors - dark grays, blues, and browns
	var colorType = Math.random();
	if (colorType < 0.5) {
		// Pure dark gray buildings
		var value = 25 + Math.floor(Math.random() * 25);
		return 'rgb(' + value + ', ' + value + ', ' + value + ')';
	} else if (colorType < 0.8) {
		// Dark blue-gray buildings
		var value = 20 + Math.floor(Math.random() * 20);
		return 'rgb(' + value + ', ' + (value + 5) + ', ' + (value + 12) + ')';
	} else {
		// Dark brown/tan buildings
		var value = 25 + Math.floor(Math.random() * 20);
		return 'rgb(' + (value + 8) + ', ' + (value + 3) + ', ' + value + ')';
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
				var blinkWindow = Math.random() < 0.03; // 3% of windows turn on/off
				windows.push({
					x: col * spacing + 3,
					y: row * 12 + 4,
					brightness: 0.4 + Math.random() * 0.6,
					flickerPhase: Math.random() * Math.PI * 2,
					blinkWindow: blinkWindow,
					// For blinking windows
					isOn: true,
					nextBlinkTime: Math.random() * 300 + 100, // Random time until next blink (100-400 frames)
					onDuration: Math.random() * 200 + 150, // Stay on for 150-350 frames
					offDuration: Math.random() * 100 + 50 // Stay off for 50-150 frames
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
	// Scaling: foreground 10% larger, background 20% smaller than before
	// depth 0: 1.65, depth 9: 0.46
	var scale = 1.65 / (this.depth * 0.287 + 1);
	var width = this.width * scale;
	var height = this.height * scale;

	// Calculate position with horizontal parallax
	var wrapWidth = page_width * 1.5;
	var x = (this.x + this.scrollOffset) % wrapWidth;
	if (x < -width) x += wrapWidth;

	// Center-focused parallax: middle layer (depth 4-5) stays fixed
	// Foreground (depth 0-3) moves UP as you scroll down (negative offset)
	// Background (depth 6-9) moves DOWN as you scroll down (positive offset)
	var centerDepth = 4.5;
	var depthFromCenter = this.depth - centerDepth;
	// Reduced parallax intensity by 50%: 0.15 → 0.075
	var parallax_offset = -scrollY * scroll_parallax_factor * depthFromCenter * 0.075;

	// Clamp parallax so foreground buildings' bottoms never become visible
	if (this.depth === 0) {
		// For foreground, limit upward movement to 80% of building height
		parallax_offset = Math.min(parallax_offset, height * 0.8);
	}

	// Start background layers higher to show more depth initially
	// More distant layers (higher depth) positioned higher up
	var depthOffset = this.depth * 40; // Each depth layer starts 40px higher (10 layers total)

	// Buildings anchored to bottom of screen with depth offset, moved down 5%
	var y = page_height - height - parallax_offset - depthOffset + (page_height * 0.05);

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

	// Draw roof (slightly darker than building)
	var rgb = this.color.match(/\d+/g);
	var roofColor = 'rgb(' + Math.max(0, parseInt(rgb[0]) - 10) + ', ' + Math.max(0, parseInt(rgb[1]) - 10) + ', ' + Math.max(0, parseInt(rgb[2]) - 10) + ')';
	ctx.fillStyle = roofColor;
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

	// Rooftop base Y position
	var roofY = y - (this.roofType === 1 ? 15 * scale : this.roofType === 2 ? 10 * scale : 0);

	// Draw antenna if building has one
	if (this.hasAntenna) {
		ctx.strokeStyle = 'rgba(80, 80, 80, 1.0)';
		ctx.lineWidth = 2 * scale;
		ctx.beginPath();
		ctx.moveTo(x + width / 2, roofY);
		ctx.lineTo(x + width / 2, roofY - 20 * scale);
		ctx.stroke();
		// Antenna light with glow
		var antennaY = roofY - 20 * scale;
		ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
		ctx.beginPath();
		ctx.arc(x + width / 2, antennaY, 4 * scale, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
		ctx.beginPath();
		ctx.arc(x + width / 2, antennaY, 2 * scale, 0, Math.PI * 2);
		ctx.fill();
	}

	// Draw solar panels
	if (this.hasSolarPanels && this.roofType !== 1) {
		ctx.fillStyle = 'rgba(20, 30, 60, 1.0)';
		var panelWidth = width * 0.6;
		var panelHeight = 8 * scale;
		ctx.fillRect(x + width * 0.2, roofY - panelHeight - 2 * scale, panelWidth, panelHeight);
		// Panel grid lines
		ctx.strokeStyle = 'rgba(100, 120, 150, 0.5)';
		ctx.lineWidth = 1;
		for (var i = 1; i < 4; i++) {
			ctx.beginPath();
			ctx.moveTo(x + width * 0.2 + (panelWidth / 4) * i, roofY - panelHeight - 2 * scale);
			ctx.lineTo(x + width * 0.2 + (panelWidth / 4) * i, roofY - 2 * scale);
			ctx.stroke();
		}
	}

	// Draw water tower
	if (this.hasWaterTower && this.roofType !== 1) {
		var towerX = x + width * 0.25;
		var towerWidth = width * 0.15;
		var towerHeight = 18 * scale;
		// Tank
		ctx.fillStyle = 'rgba(40, 40, 40, 1.0)';
		ctx.fillRect(towerX, roofY - towerHeight, towerWidth, towerHeight * 0.6);
		// Support legs
		ctx.strokeStyle = 'rgba(60, 60, 60, 1.0)';
		ctx.lineWidth = 2 * scale;
		ctx.beginPath();
		ctx.moveTo(towerX, roofY);
		ctx.lineTo(towerX + towerWidth / 2, roofY - towerHeight);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(towerX + towerWidth, roofY);
		ctx.lineTo(towerX + towerWidth / 2, roofY - towerHeight);
		ctx.stroke();
	}

	// Draw billboard
	if (this.hasBillboard && this.roofType !== 1) {
		var billboardX = x + width * 0.65;
		var billboardWidth = width * 0.3;
		var billboardHeight = 12 * scale;
		// Billboard structure
		ctx.fillStyle = 'rgba(30, 30, 30, 1.0)';
		ctx.fillRect(billboardX, roofY - billboardHeight - 8 * scale, billboardWidth, billboardHeight);
		// Support pole
		ctx.fillStyle = 'rgba(50, 50, 50, 1.0)';
		ctx.fillRect(billboardX + billboardWidth / 2 - 1 * scale, roofY - 8 * scale, 2 * scale, 8 * scale);
		// Illumination (some billboards are lit - fixed, no flickering)
		if (this.billboardIsLit) {
			ctx.fillStyle = 'rgba(255, 220, 150, 0.3)';
			ctx.fillRect(billboardX, roofY - billboardHeight - 8 * scale, billboardWidth, billboardHeight);
		}
	}

	// Draw HVAC units
	if (this.hasHVAC && this.roofType !== 1) {
		var hvacX = x + width * 0.7;
		var hvacWidth = width * 0.2;
		var hvacHeight = 6 * scale;
		// HVAC box
		ctx.fillStyle = 'rgba(50, 50, 50, 1.0)';
		ctx.fillRect(hvacX, roofY - hvacHeight, hvacWidth, hvacHeight);
		// Vent lines
		ctx.strokeStyle = 'rgba(80, 80, 80, 1.0)';
		ctx.lineWidth = 1;
		for (var i = 0; i < 3; i++) {
			ctx.beginPath();
			ctx.moveTo(hvacX + 2 * scale, roofY - hvacHeight + (i + 1) * (hvacHeight / 4));
			ctx.lineTo(hvacX + hvacWidth - 2 * scale, roofY - hvacHeight + (i + 1) * (hvacHeight / 4));
			ctx.stroke();
		}
	}

	// Draw windows with glow
	for (var i = 0; i < this.windows.length; i++) {
		var win = this.windows[i];
		var alpha;

		if (win.blinkWindow) {
			// Window turns on/off
			win.nextBlinkTime--;
			if (win.nextBlinkTime <= 0) {
				win.isOn = !win.isOn;
				win.nextBlinkTime = win.isOn ? win.onDuration : win.offDuration;
			}
			alpha = win.isOn ? win.brightness : 0;
		} else {
			// Window flickers (more noticeable now)
			var flicker = Math.sin(frame * 0.05 + win.flickerPhase) * 0.4 + 0.6;
			alpha = win.brightness * flicker;
		}

		// Skip drawing if window is off
		if (alpha < 0.05) continue;

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
};

// Mountain object
function Mountain(depth) {
	this.depth = depth;
	this.points = [];
	this.generateProfile();
	this.scrollOffset = 0;
}

Mountain.prototype.generateProfile = function() {
	// Generate mountain profile using sine waves and noise
	// Distant mountains (higher depth) are rougher than front ones
	var numPoints = 100;
	var wavelength = page_width / 3;

	// Roughness increases with depth
	var roughnessFactor = 1 + (this.depth * 0.5);
	var noiseAmount = 10 + (this.depth * 15); // More noise for distant mountains

	for (var i = 0; i < numPoints; i++) {
		var x = (i / numPoints) * (page_width + 400);

		// Multiple sine waves for natural-looking peaks
		var baseHeight = 80 + Math.sin(i * 0.15) * 40;
		var height = baseHeight
			+ Math.sin(i * 0.3) * 30
			+ Math.sin(i * 0.5) * 20
			+ Math.sin(i * 0.8) * 15;

		// Add high-frequency variation for distant mountains (rougher peaks)
		if (this.depth > 0) {
			height += Math.sin(i * 1.2 * roughnessFactor) * (8 * roughnessFactor);
			height += Math.sin(i * 2.0 * roughnessFactor) * (5 * roughnessFactor);
		}

		// Random noise increases with distance
		height += (Math.random() - 0.5) * noiseAmount;

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

	// First layer stays at 0.7, successive layers move progressively higher (further back/toward horizon)
	// Each mountain layer starts progressively higher so they're visible above front mountains
	var depthOffset = this.depth * 30; // Each depth layer starts 30px higher (6 layers total)
	var baseY = page_height * 0.7 - depthOffset;

	// Blue atmospheric tint for distance
	var blueTint = Math.min(80, this.depth * 15);
	var darkness = Math.max(0, 30 - this.depth * 3);
	ctx.fillStyle = 'rgb(' + (darkness + blueTint) + ', ' + (darkness + blueTint) + ', ' + (darkness + blueTint * 1.3) + ')';

	// Mountains are far background, move DOWN more than background buildings
	// Center is at building depth 4.5, mountains are like depth 10-15
	var centerDepth = 4.5;
	var mountainEquivalentDepth = 10 + this.depth;
	var depthFromCenter = mountainEquivalentDepth - centerDepth;
	// Reduced parallax intensity by 50%: 0.15 → 0.075
	var parallax_offset = -scrollY * scroll_parallax_factor * depthFromCenter * 0.075;

	ctx.beginPath();
	ctx.moveTo(-10, page_height);

	var firstPointDrawn = false;
	var lastX = -10;
	var lastY = baseY - parallax_offset;

	// Draw smooth curve through points, handling wrapping properly
	for (var i = 0; i < this.points.length; i++) {
		var point = this.points[i];
		var rawX = point.x + this.scrollOffset;

		// Simple modulo wrapping
		while (rawX < -200) rawX += (page_width + 400);
		while (rawX > page_width + 200) rawX -= (page_width + 400);

		var x = rawX;
		var y = baseY - (point.height * scale) - parallax_offset;

		// Check if there's a wrap discontinuity (large jump)
		if (Math.abs(x - lastX) > page_width / 2) {
			// Wrapping occurred, close path and start new one
			ctx.lineTo(lastX < page_width / 2 ? -10 : page_width + 10, lastY);
			ctx.lineTo(lastX < page_width / 2 ? -10 : page_width + 10, page_height);
			ctx.closePath();
			ctx.fill();

			// Start new path
			ctx.beginPath();
			ctx.moveTo(x < page_width / 2 ? -10 : page_width + 10, page_height);
			ctx.lineTo(x, y);
			firstPointDrawn = true;
		} else {
			// Normal drawing
			if (!firstPointDrawn) {
				ctx.lineTo(x, y);
				firstPointDrawn = true;
			} else {
				var cpX = (lastX + x) / 2;
				var cpY = (lastY + y) / 2;
				ctx.quadraticCurveTo(lastX, lastY, cpX, cpY);
			}
		}

		lastX = x;
		lastY = y;
	}

	ctx.lineTo(page_width + 10, baseY - parallax_offset);
	ctx.lineTo(page_width + 10, page_height);
	ctx.closePath();
	ctx.fill();
};

// Draw moon
function drawMoon(ctx) {
	// Moon glow - 50% larger than previous (170 * 1.5 = 255)
	var gradient = ctx.createRadialGradient(moon_x, moon_y, 41, moon_x, moon_y, 255);
	gradient.addColorStop(0, 'rgba(255, 250, 230, 0.4)');
	gradient.addColorStop(0.4, 'rgba(255, 250, 230, 0.2)');
	gradient.addColorStop(1, 'rgba(255, 250, 230, 0)');
	ctx.fillStyle = gradient;
	ctx.fillRect(moon_x - 255, moon_y - 255, 510, 510);

	// Moon body - 20% larger than previous (68 * 1.2 = 81.6)
	ctx.fillStyle = 'rgba(255, 250, 230, 0.95)';
	ctx.beginPath();
	ctx.arc(moon_x, moon_y, 81.6, 0, Math.PI * 2);
	ctx.fill();

	// Moon craters - tripled from 3 to 9 craters
	ctx.fillStyle = 'rgba(200, 200, 180, 0.3)';
	ctx.beginPath();
	ctx.arc(moon_x - 24, moon_y - 12, 20.4, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x + 20.4, moon_y + 24, 14.4, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x + 16.8, moon_y - 31.2, 10.2, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x - 40, moon_y + 15, 12, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x + 35, moon_y - 8, 9, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x - 10, moon_y + 35, 11, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x + 8, moon_y + 5, 7, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x - 32, moon_y - 28, 8.5, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(moon_x + 42, moon_y + 18, 6.5, 0, Math.PI * 2);
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

	// Spawn new shooting stars occasionally (roughly every 3-6 seconds)
	if (Math.random() < 0.008) {
		shootingStars.push(new ShootingStar());
	}

	// Update and draw shooting stars
	for (var i = shootingStars.length - 1; i >= 0; i--) {
		shootingStars[i].update();
		if (!shootingStars[i].isAlive()) {
			shootingStars.splice(i, 1);
		} else {
			shootingStars[i].draw(ctx);
		}
	}

	// Spawn new UFOs occasionally (roughly every 1-2 minutes)
	if (Math.random() < 0.0002) {
		ufos.push(new UFO());
	}

	// Update and draw UFOs
	for (var i = ufos.length - 1; i >= 0; i--) {
		ufos[i].update(frame);
		if (!ufos[i].isAlive()) {
			ufos.splice(i, 1);
		} else {
			ufos[i].draw(ctx, frame);
		}
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
	// Cancel previous animation loop if it exists
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

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

	// Pre-compute blurred cloud canvases for performance
	generateCloudCanvases();

	// Generate clouds (30% more: was 9, now 12)
	for (var i = 0; i < 5; i++) {
		clouds.push(new Cloud(0)); // Slow layer
	}
	for (var i = 0; i < 7; i++) {
		clouds.push(new Cloud(1)); // Fast layer
	}

	// Generate mountains (3 layers)
	for (var i = 0; i < 3; i++) {
		mountains.push(new Mountain(i));
	}

	// Generate buildings (10 depth layers)
	// Scale building count with screen width to ensure full coverage
	var buildingDensity = Math.max(8, Math.floor(page_width / 100));
	for (var depth = 0; depth < 10; depth++) {
		var numBuildings = buildingDensity + Math.floor(Math.random() * 4);
		for (var i = 0; i < numBuildings; i++) {
			buildings.push(new Building(depth));
		}
	}

	// Animation loop
	function draw() {
		animationFrameId = requestAnimationFrame(draw);
		frame++;
		drawFrame(frame);
	}

	draw();
};

// Handle window resize
$(window).resize(function() {
	page_width = window.innerWidth;
	page_height = window.innerHeight;

	moon_x = page_width * 0.08;
	moon_y = page_height * 0.10;

	var canvas = document.getElementById('background');
	if (canvas) {
		canvas.width = page_width;
		canvas.height = page_height;
	}

	// Regenerate entire scene with new dimensions
	stars = [];
	shootingStars = [];
	ufos = [];
	clouds = [];
	buildings = [];
	mountains = [];
	startBackground();
});

// Start animation
startBackground();
