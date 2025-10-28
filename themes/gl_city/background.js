/* (c) 2025 GL-City Theme - Three.js 3D Cityscape with Shadow Mapping */

// Global variables
var scene, camera, renderer;
var page_width = window.innerWidth;
var page_height = window.innerHeight;
var frame = 0;
var animationFrameId = null;

// Scene objects
var buildings = [];
var buildingMeshes = [];
var stars = null;  // Changed from [] to null for proper cleanup check
var moon = null;
var moonLight = null;
var ground = null;
var cameraMarker = null;
var cameraFrustum = null;

// Camera tracking
var cameraStartY = 170;
var cameraStartZ = 25;
var cameraTargetStartY = 170;
var cameraTargetStartZ = -100;
var normalViewCameraPos = [0, 170, 25];

// Overhead view toggle
var overheadView = false;
var overheadHeight = 800;
var overheadPanX = 0;
var overheadPanZ = -580;  // Center of city (depth 0-16, center at depth 8)
var overheadZoomMin = 200;
var overheadZoomMax = 2000;

// Mouse state for overhead view controls
var mouseDown = false;
var mouseLastX = 0;
var mouseLastY = 0;

// Building animation
var buildingPanSpeed = 0.5;  // Units per frame to pan left

////////////////////////////////////////////////////////////////////
// Initialization
////////////////////////////////////////////////////////////////////

function initThreeJS() {
	console.log('initThreeJS called');

	// Check if THREE is loaded
	if (typeof THREE === 'undefined') {
		console.error('THREE.js is not loaded!');
		return false;
	}
	console.log('THREE.js is loaded, version:', THREE.REVISION);

	canvas = document.getElementById('background');
	if (!canvas) {
		console.error('Canvas element not found');
		return false;
	}
	console.log('Canvas found:', canvas);

	// Create scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x0a0c1e);  // Dark blue background
	scene.fog = new THREE.Fog(0x0a0c1e, 500, 2000);  // Atmospheric fog

	// Create camera
	camera = new THREE.PerspectiveCamera(
		45,  // FOV
		page_width / page_height,  // Aspect
		0.1,  // Near
		2000  // Far
	);
	camera.position.set(0, cameraStartY, cameraStartZ);
	camera.lookAt(0, cameraTargetStartY, cameraTargetStartZ);

	// Create renderer with shadow mapping
	renderer = new THREE.WebGLRenderer({
		canvas: canvas,
		antialias: true,
		alpha: false
	});
	renderer.setSize(page_width, page_height);
	renderer.setPixelRatio(window.devicePixelRatio);

	// Enable shadow mapping
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Soft shadows

	console.log('Three.js initialized with shadow mapping');
	return true;
}

////////////////////////////////////////////////////////////////////
// Lighting
////////////////////////////////////////////////////////////////////

function createLighting() {
	// Remove existing lights if they exist
	if (moonLight) {
		scene.remove(moonLight);
		moonLight = null;
	}

	// Remove all ambient lights from scene
	var lightsToRemove = [];
	scene.traverse(function(child) {
		if (child instanceof THREE.AmbientLight) {
			lightsToRemove.push(child);
		}
	});
	lightsToRemove.forEach(function(light) {
		scene.remove(light);
	});

	// Ambient light (global illumination)
	var ambientLight = new THREE.AmbientLight(0x2a2b38, 0.3);  // Dim blue-ish ambient
	scene.add(ambientLight);

	// Moon light (main light source with shadows) - brighter to match the moon
	moonLight = new THREE.PointLight(0xccd9e6, 2.5, 3000);  // Brighter pale blue-white moonlight
	moonLight.position.set(-640, 600, -1258);  // 20% to the right and 10% closer (was -800, -1400)
	moonLight.castShadow = true;

	// Configure shadow properties for quality
	moonLight.shadow.mapSize.width = 4096;
	moonLight.shadow.mapSize.height = 4096;
	moonLight.shadow.camera.near = 100;
	moonLight.shadow.camera.far = 2500;
	moonLight.shadow.bias = -0.001;

	scene.add(moonLight);

	console.log('Lighting created with shadow-casting moon light');
}

////////////////////////////////////////////////////////////////////
// Ground Plane
////////////////////////////////////////////////////////////////////

function createGround() {
	// Remove existing ground if it exists
	if (ground) {
		scene.remove(ground);
		ground.geometry.dispose();
		ground.material.dispose();
		ground = null;
	}

	var geometry = new THREE.PlaneGeometry(5000, 5000);
	var material = new THREE.MeshStandardMaterial({
		color: 0x4a5a6a,  // Match mountain color
		roughness: 0.9,
		metalness: 0.1
	});

	ground = new THREE.Mesh(geometry, material);
	ground.rotation.x = -Math.PI / 2;  // Rotate to horizontal
	ground.position.y = 0;
	ground.receiveShadow = true;  // Ground receives shadows

	scene.add(ground);
	console.log('Ground plane created with shadow receiving');
}

////////////////////////////////////////////////////////////////////
// Buildings
////////////////////////////////////////////////////////////////////

// Shared texture pools to avoid recreating textures for every building
var windowTexturePool = [];
var sidesBumpTexturePool = [];
var roofBumpTexturePool = [];

// Initialize texture pools
function initializeTexturePools() {
	// Create 20 window texture variations
	for (var i = 0; i < 20; i++) {
		windowTexturePool.push(createWindowTexture());
	}

	// Create 10 sides bump texture variations
	for (var i = 0; i < 10; i++) {
		sidesBumpTexturePool.push(createSidesBumpTexture());
	}

	// Create 10 roof bump texture variations
	for (var i = 0; i < 10; i++) {
		roofBumpTexturePool.push(createRoofBumpTexture());
	}

	console.log('Texture pools initialized:', windowTexturePool.length, 'window textures,',
	            sidesBumpTexturePool.length, 'sides bumps,', roofBumpTexturePool.length, 'roof bumps');
}

function Building(depth) {
	this.depth = depth;
	this.z = -depth * 60 - 100;

	// Calculate frustum width for uniform distribution
	var camZ = 25;
	var depthFromCamera = camZ - this.z;
	var fov = 45 * Math.PI / 180;
	var aspect = window.innerWidth / window.innerHeight;
	var frustumHalfWidth = depthFromCamera * Math.tan(fov / 2) * aspect;

	this.x = (Math.random() - 0.5) * (frustumHalfWidth * 2 * 1.2);
	this.width = 20 + Math.random() * 10;
	this.height = 16 + Math.random() * 117;
	this.depth_size = 20 + Math.random() * 10;

	// Dark building color
	var value = 25 + Math.floor(Math.random() * 25);
	this.color = new THREE.Color().setRGB(value / 255, value / 255, (value + 12) / 255);

	// Pick random textures from shared pools (no need to create new ones)
	this.windowTextures = [
		windowTexturePool[Math.floor(Math.random() * windowTexturePool.length)],
		windowTexturePool[Math.floor(Math.random() * windowTexturePool.length)],
		windowTexturePool[Math.floor(Math.random() * windowTexturePool.length)],
		windowTexturePool[Math.floor(Math.random() * windowTexturePool.length)]
	];
	this.currentTextureIndex = 0;
	this.textureChangeTimer = Math.random() * 120; // Random start offset

	// Pick random bump textures from shared pools
	this.sidesBumpTexture = sidesBumpTexturePool[Math.floor(Math.random() * sidesBumpTexturePool.length)];
	this.roofBumpTexture = roofBumpTexturePool[Math.floor(Math.random() * roofBumpTexturePool.length)];

	// Create mesh with multiple materials - one for sides (with windows), one for top/bottom (no windows)
	var geometry = new THREE.BoxGeometry(this.width, this.height, this.depth_size);

	// Material with windows for sides - use first texture
	var sidesMaterial = new THREE.MeshStandardMaterial({
		color: this.color,
		roughness: 0.8,
		metalness: 0.2,
		map: this.windowTextures[0],
		emissiveMap: this.windowTextures[0],
		emissive: 0xffcc66,
		emissiveIntensity: 0.8,
		bumpMap: this.sidesBumpTexture,
		bumpScale: 2.0
	});

	// Store reference to sides material for texture updates
	this.sidesMaterial = sidesMaterial;

	// Material without windows for top and bottom - different bump texture
	var topBottomMaterial = new THREE.MeshStandardMaterial({
		color: this.color,
		roughness: 0.9,
		metalness: 0.1,
		bumpMap: this.roofBumpTexture,
		bumpScale: 1.5
	});

	// BoxGeometry face order: right, left, top, bottom, front, back
	var materials = [
		sidesMaterial,     // right
		sidesMaterial,     // left
		topBottomMaterial, // top (roof)
		topBottomMaterial, // bottom
		sidesMaterial,     // front
		sidesMaterial      // back
	];

	this.mesh = new THREE.Mesh(geometry, materials);
	this.mesh.position.set(this.x, this.height / 2, this.z);  // Position on ground
	this.mesh.castShadow = true;  // Buildings cast shadows
	this.mesh.receiveShadow = true;  // Buildings receive shadows from other buildings

	scene.add(this.mesh);

	// Add rooftop elements
	this.rooftopElements = [];
	this.addRooftopElements();
}

// Standalone texture creation functions (used by texture pools)
function createWindowTexture() {
	// Create a canvas for the window texture
	var canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 256;
	var ctx = canvas.getContext('2d');

	// Fill with black (will be multiplied with building color)
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Window grid parameters
	var cols = 4;
	var rows = 6 + Math.floor(Math.random() * 12);  // 6-18 rows for variety (no longer building-specific)

	var roofMargin = 0.02;  // Small margin at top (2%)
	var bottomMargin = 0.05; // 5% at bottom for ground floor
	var windowWidth = 8;     // Narrower windows
	var windowHeight = 6;    // Much shorter windows
	var spacingX = canvas.width / cols;
	var windowAreaHeight = canvas.height * (1 - roofMargin - bottomMargin);
	var spacingY = windowAreaHeight / rows;
	var startY = canvas.height * roofMargin;  // Start near top

	// Draw windows with varying brightness
	for (var ix = 0; ix < cols; ix++) {
		for (var iy = 0; iy < rows; iy++) {
			// Randomly skip some windows (50% chance)
			if (Math.random() < 0.5) continue;

			var x = ix * spacingX + (spacingX - windowWidth) / 2;
			var y = startY + iy * spacingY + (spacingY - windowHeight) / 2;

			// Make sure window doesn't extend into roof
			if (y < canvas.height * roofMargin) continue;
			if (y + windowHeight > canvas.height * (1 - bottomMargin)) continue;

			// Random brightness variation - from dim to very bright
			var brightness = 0.3 + Math.random() * 0.7; // 0.3 to 1.0
			var r = Math.floor(255 * brightness);
			var g = Math.floor(204 * brightness);
			var b = Math.floor(102 * brightness);
			ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';

			ctx.fillRect(x, y, windowWidth, windowHeight);
		}
	}

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	return texture;
}

function createSidesBumpTexture() {
	// Create a canvas for the bump map
	var canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 512;
	var ctx = canvas.getContext('2d');

	// Fill with darker gray (recessed surface)
	ctx.fillStyle = '#606060';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Add panel grid pattern for architectural detail
	var panelCols = 4;
	var panelRows = 8 + Math.floor(Math.random() * 12);  // 8-20 rows for variety

	var panelWidth = canvas.width / panelCols;
	var panelHeight = canvas.height / panelRows;

	// Draw recessed panel edges (darker lines)
	ctx.strokeStyle = '#303030';
	ctx.lineWidth = 4;

	for (var ix = 0; ix <= panelCols; ix++) {
		ctx.beginPath();
		ctx.moveTo(ix * panelWidth, 0);
		ctx.lineTo(ix * panelWidth, canvas.height);
		ctx.stroke();
	}

	for (var iy = 0; iy <= panelRows; iy++) {
		ctx.beginPath();
		ctx.moveTo(0, iy * panelHeight);
		ctx.lineTo(canvas.width, iy * panelHeight);
		ctx.stroke();
	}

	// Draw raised panel centers (lighter)
	ctx.fillStyle = '#a0a0a0';
	var inset = 6;
	for (var ix = 0; ix < panelCols; ix++) {
		for (var iy = 0; iy < panelRows; iy++) {
			ctx.fillRect(
				ix * panelWidth + inset,
				iy * panelHeight + inset,
				panelWidth - inset * 2,
				panelHeight - inset * 2
			);
		}
	}

	// Add stronger noise for concrete/metal texture
	var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	var data = imageData.data;
	for (var i = 0; i < data.length; i += 4) {
		var noise = (Math.random() - 0.5) * 40;
		data[i] = Math.max(0, Math.min(255, data[i] + noise));
		data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
		data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
	}
	ctx.putImageData(imageData, 0, 0);

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	return texture;
}

function createRoofBumpTexture() {
	// Create a canvas for the roof bump map
	var canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	var ctx = canvas.getContext('2d');

	// Fill with medium gray base
	ctx.fillStyle = '#707070';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Create rooftop equipment/HVAC unit pattern
	var numUnits = 2 + Math.floor(Math.random() * 3); // 2-4 units
	for (var i = 0; i < numUnits; i++) {
		var unitX = Math.random() * (canvas.width - 60) + 20;
		var unitY = Math.random() * (canvas.height - 60) + 20;
		var unitW = 30 + Math.random() * 40;
		var unitH = 30 + Math.random() * 40;

		// Draw raised unit (lighter)
		ctx.fillStyle = '#a0a0a0';
		ctx.fillRect(unitX, unitY, unitW, unitH);

		// Draw shadow edge (darker)
		ctx.fillStyle = '#404040';
		ctx.fillRect(unitX + unitW, unitY + 2, 3, unitH);
		ctx.fillRect(unitX + 2, unitY + unitH, unitW, 3);
	}

	// Add gravel/concrete texture with noise
	var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	var data = imageData.data;
	for (var i = 0; i < data.length; i += 4) {
		var noise = (Math.random() - 0.5) * 50;
		data[i] = Math.max(0, Math.min(255, data[i] + noise));
		data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
		data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
	}
	ctx.putImageData(imageData, 0, 0);

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	return texture;
}

Building.prototype.addRooftopElements = function() {
	// Add rooftop elements to 31.25% of buildings (25% increased by 25%)
	if (Math.random() > 0.3125) return;

	// Roof is at the top of the building in local coordinates (building mesh center is at origin)
	var roofY = this.height / 2;

	// Only 1 element per building
	var type = Math.random();
	var element;

	// Random position on roof (relative to building center)
	var offsetX = (Math.random() - 0.5) * this.width * 0.6;
	var offsetZ = (Math.random() - 0.5) * this.depth_size * 0.6;

	if (type < 0.425) {
		// HVAC Unit (42.5% of rooftop elements)
		element = this.createHVACUnit();
		element.position.set(offsetX, roofY, offsetZ);
	} else if (type < 0.8) {
		// Water Tower (37.5% of rooftop elements)
		element = this.createWaterTower();
		element.position.set(offsetX, roofY, offsetZ);
	} else if (type < 0.95) {
		// Antenna (15% - tripled from 5%)
		element = this.createAntenna();
		element.position.set(offsetX, roofY, offsetZ);
	} else {
		// Billboard (5% - rare)
		element = this.createBillboard();
		element.position.set(offsetX, roofY, offsetZ);
	}

	// Add as child of building mesh so it moves automatically
	this.mesh.add(element);
	this.rooftopElements.push(element);
}

Building.prototype.createHVACUnit = function() {
	var group = new THREE.Group();

	// Main unit box
	var width = 4 + Math.random() * 4;
	var height = 3 + Math.random() * 2;
	var depth = 4 + Math.random() * 4;

	var geometry = new THREE.BoxGeometry(width, height, depth);
	var material = new THREE.MeshStandardMaterial({
		color: 0x505050,
		roughness: 0.7,
		metalness: 0.3
	});

	var mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = height / 2; // Raise so bottom sits at y=0
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	group.add(mesh);

	// Vents on top
	var ventGeometry = new THREE.BoxGeometry(width * 0.8, 0.5, depth * 0.8);
	var ventMaterial = new THREE.MeshStandardMaterial({
		color: 0x303030,
		roughness: 0.8
	});
	var vent = new THREE.Mesh(ventGeometry, ventMaterial);
	vent.position.y = height + 0.25;
	vent.castShadow = true;
	group.add(vent);

	return group;
}

Building.prototype.createWaterTower = function() {
	var group = new THREE.Group();

	// Tank (cylinder)
	var radius = 3 + Math.random() * 2;
	var tankHeight = 4 + Math.random() * 2;
	var legHeight = 6 + Math.random() * 4;

	var tankGeometry = new THREE.CylinderGeometry(radius, radius, tankHeight, 12);
	var tankMaterial = new THREE.MeshStandardMaterial({
		color: 0x606060,
		roughness: 0.6,
		metalness: 0.4
	});

	var tank = new THREE.Mesh(tankGeometry, tankMaterial);
	tank.position.y = legHeight + tankHeight / 2; // Tank sits on top of legs
	tank.castShadow = true;
	tank.receiveShadow = true;
	group.add(tank);

	// Support legs (4 cylinders)
	var legGeometry = new THREE.CylinderGeometry(0.3, 0.3, legHeight, 6);
	var legMaterial = new THREE.MeshStandardMaterial({
		color: 0x404040,
		roughness: 0.8,
		metalness: 0.5
	});

	for (var i = 0; i < 4; i++) {
		var angle = (i / 4) * Math.PI * 2;
		var leg = new THREE.Mesh(legGeometry, legMaterial);
		leg.position.set(
			Math.cos(angle) * (radius * 0.7),
			legHeight / 2, // Legs sit on ground
			Math.sin(angle) * (radius * 0.7)
		);
		leg.castShadow = true;
		group.add(leg);
	}

	return group;
}

Building.prototype.createAntenna = function() {
	var group = new THREE.Group();

	// Main pole
	var height = 15 + Math.random() * 20;
	var poleGeometry = new THREE.CylinderGeometry(0.2, 0.3, height, 6);
	var poleMaterial = new THREE.MeshStandardMaterial({
		color: 0x707070,
		roughness: 0.5,
		metalness: 0.6
	});

	var pole = new THREE.Mesh(poleGeometry, poleMaterial);
	pole.position.y = height / 2; // Pole base at y=0
	pole.castShadow = true;
	group.add(pole);

	// Blinking light on top
	var lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
	var lightMaterial = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		emissive: 0xff0000,
		emissiveIntensity: 1.0
	});

	var light = new THREE.Mesh(lightGeometry, lightMaterial);
	light.position.y = height + 0.5; // Light at top of pole
	group.add(light);

	return group;
}

Building.prototype.createBillboard = function() {
	var group = new THREE.Group();

	// Support structure
	var supportHeight = 8;
	var supportGeometry = new THREE.BoxGeometry(0.5, supportHeight, 0.5);
	var supportMaterial = new THREE.MeshStandardMaterial({
		color: 0x404040,
		roughness: 0.8
	});

	var support1 = new THREE.Mesh(supportGeometry, supportMaterial);
	support1.position.set(-4, supportHeight / 2, 0); // Support base at y=0
	support1.castShadow = true;
	group.add(support1);

	var support2 = new THREE.Mesh(supportGeometry, supportMaterial);
	support2.position.set(4, supportHeight / 2, 0); // Support base at y=0
	support2.castShadow = true;
	group.add(support2);

	// Billboard panel
	var panelWidth = 10;
	var panelHeight = 6;
	var panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
	var panelMaterial = new THREE.MeshStandardMaterial({
		color: 0x2244ff,
		emissive: 0x1133aa,
		emissiveIntensity: 0.5,
		side: THREE.DoubleSide
	});

	var panel = new THREE.Mesh(panelGeometry, panelMaterial);
	panel.position.set(0, supportHeight - panelHeight / 2 + 1, 0); // Panel at top of supports
	panel.castShadow = true;
	panel.receiveShadow = true;
	group.add(panel);

	return group;
}

Building.prototype.remove = function() {
	// Don't dispose textures - they're shared from pools!

	// Dispose rooftop elements (they're children of mesh, so no need to remove from scene)
	if (this.rooftopElements) {
		for (var i = 0; i < this.rooftopElements.length; i++) {
			var element = this.rooftopElements[i];
			// Dispose geometries and materials in the group
			element.traverse(function(child) {
				if (child.geometry) child.geometry.dispose();
				if (child.material) child.material.dispose();
			});
		}
		this.rooftopElements = [];
	}

	// Remove building mesh and dispose resources (but not textures!)
	if (this.mesh) {
		scene.remove(this.mesh);
		this.mesh.geometry.dispose();

		// Dispose materials (material is an array)
		if (Array.isArray(this.mesh.material)) {
			for (var i = 0; i < this.mesh.material.length; i++) {
				this.mesh.material[i].dispose();
			}
		} else {
			this.mesh.material.dispose();
		}
	}
};

Building.prototype.update = function() {
	// Move building left (rooftop elements move automatically as children)
	this.x -= buildingPanSpeed;
	if (this.mesh) {
		this.mesh.position.x = this.x;
	}

	// Animate window textures - swap textures periodically (slower - every 10-30 seconds)
	this.textureChangeTimer++;
	if (this.textureChangeTimer > 600 + Math.random() * 1200) { // Change every 10-30 seconds
		this.textureChangeTimer = 0;
		this.currentTextureIndex = (this.currentTextureIndex + 1) % this.windowTextures.length;

		// Update material textures
		if (this.sidesMaterial) {
			this.sidesMaterial.map = this.windowTextures[this.currentTextureIndex];
			this.sidesMaterial.emissiveMap = this.windowTextures[this.currentTextureIndex];
			this.sidesMaterial.needsUpdate = true;
		}
	}
};

Building.prototype.isOutOfView = function() {
	// Check if building has moved too far left (past camera)
	var camZ = 25;
	var depthFromCamera = camZ - this.z;
	var fov = 45 * Math.PI / 180;
	var aspect = window.innerWidth / window.innerHeight;
	var frustumHalfWidth = depthFromCamera * Math.tan(fov / 2) * aspect;

	// Building is out of view if it's more than 2x frustum width to the left
	return this.x < -(frustumHalfWidth * 2.5);
};

function generateBuildings() {
	// Clear existing buildings
	for (var i = 0; i < buildings.length; i++) {
		buildings[i].remove();
	}
	buildings = [];

	var camZ = 25;
	var fov = 45 * Math.PI / 180;
	var aspect = window.innerWidth / window.innerHeight;
	var tanHalfFov = Math.tan(fov / 2);
	var baseDensity = 60 / 150 * 0.5 * 0.7 * 0.7;  // Reduced density

	for (var depth = 0; depth < 17; depth++) {
		var buildingZ = -depth * 60 - 100;
		var depthFromCamera = camZ - buildingZ;
		var frustumWidth = 2 * depthFromCamera * tanHalfFov * aspect;

		var buildingsPerDepth = Math.ceil(frustumWidth * baseDensity * 1.2);
		buildingsPerDepth = Math.min(buildingsPerDepth, 200);

		for (var i = 0; i < buildingsPerDepth; i++) {
			buildings.push(new Building(depth));
		}
	}

	console.log('Generated', buildings.length, 'buildings with shadow casting');
}

function updateBuildingPositions() {
	// Update all buildings (move them left)
	for (var i = 0; i < buildings.length; i++) {
		buildings[i].update();
	}

	// Remove buildings that have moved out of view (to the left)
	for (var i = buildings.length - 1; i >= 0; i--) {
		if (buildings[i].isOutOfView()) {
			buildings[i].remove();
			buildings.splice(i, 1);
		}
	}

	// Spawn new buildings on the right side to maintain density
	// Check each depth layer and add buildings if needed
	var camZ = 25;
	var fov = 45 * Math.PI / 180;
	var aspect = window.innerWidth / window.innerHeight;
	var tanHalfFov = Math.tan(fov / 2);
	var baseDensity = 60 / 150 * 0.5 * 0.7 * 0.7;

	for (var depth = 0; depth < 17; depth++) {
		var buildingZ = -depth * 60 - 100;
		var depthFromCamera = camZ - buildingZ;
		var frustumHalfWidth = depthFromCamera * tanHalfFov * aspect;

		// Count buildings at this depth on the right side
		var rightSideBuildings = 0;
		for (var i = 0; i < buildings.length; i++) {
			if (buildings[i].depth === depth && buildings[i].x > 0) {
				rightSideBuildings++;
			}
		}

		// Calculate target number of buildings on right side
		var frustumWidth = 2 * frustumHalfWidth;
		var targetBuildings = Math.ceil((frustumWidth / 2) * baseDensity * 1.2);
		targetBuildings = Math.min(targetBuildings, 100);

		// Spawn new buildings if needed
		if (rightSideBuildings < targetBuildings) {
			for (var j = 0; j < (targetBuildings - rightSideBuildings); j++) {
				var building = new Building(depth);
				// Position on the right side
				building.x = frustumHalfWidth * 1.5 + Math.random() * 100;
				building.mesh.position.x = building.x;
				buildings.push(building);
			}
		}
	}
}

////////////////////////////////////////////////////////////////////
// Mountains
////////////////////////////////////////////////////////////////////

// Simple Perlin noise implementation
var PerlinNoise = (function() {
	var permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

	var p = new Array(512);
	for (var i = 0; i < 256; i++) {
		p[256 + i] = p[i] = permutation[i];
	}

	function fade(t) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}

	function lerp(t, a, b) {
		return a + t * (b - a);
	}

	function grad(hash, x, y, z) {
		var h = hash & 15;
		var u = h < 8 ? x : y;
		var v = h < 4 ? y : h == 12 || h == 14 ? x : z;
		return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
	}

	return {
		noise: function(x, y, z) {
			var X = Math.floor(x) & 255;
			var Y = Math.floor(y) & 255;
			var Z = Math.floor(z) & 255;

			x -= Math.floor(x);
			y -= Math.floor(y);
			z -= Math.floor(z);

			var u = fade(x);
			var v = fade(y);
			var w = fade(z);

			var A = p[X] + Y;
			var AA = p[A] + Z;
			var AB = p[A + 1] + Z;
			var B = p[X + 1] + Y;
			var BA = p[B] + Z;
			var BB = p[B + 1] + Z;

			return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
			                       lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
			               lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
			                       lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
		}
	};
})();

var mountains = null;

function createMountains() {
	// Remove existing mountains if they exist
	if (mountains) {
		scene.remove(mountains);
		mountains.geometry.dispose();
		mountains.material.dispose();
		mountains = null;
	}

	// Mountain parameters - sized to fit camera FOV
	// Camera at z=25, mountains at z=-2000, distance ~2025
	// FOV 45°, tanHalfFov ≈ 0.414, typical aspect 1.778
	// Frustum width at mountain distance ≈ 3000 units
	var width = 3500;   // Slightly wider than frustum for margin
	var depth = 800;    // Proportionally reduced
	var segments = 1200; // Reduced proportionally with size
	var maxHeight = 375; // 50% taller than 250

	// Randomize perlin noise seeds for unique mountain shapes
	var seed1 = Math.random() * 1000;
	var seed2 = Math.random() * 1000;
	var seed3 = Math.random() * 1000;
	var seed4 = Math.random() * 1000;
	var seed5 = Math.random() * 1000;

	// Create plane geometry with high detail
	var geometry = new THREE.PlaneGeometry(width, depth, segments, segments / 2);

	// Rotate to stand upright
	geometry.rotateX(-Math.PI / 2);

	// Apply perlin noise to vertices
	var vertices = geometry.attributes.position.array;
	for (var i = 0; i < vertices.length; i += 3) {
		var x = vertices[i];
		var z = vertices[i + 2];

		// Multiple octaves of noise - balanced frequencies for natural mountains
		var noise = 0;
		noise += PerlinNoise.noise(x * 0.002, z * 0.002, seed1) * 1.0;
		noise += PerlinNoise.noise(x * 0.005, z * 0.005, seed2) * 0.5;
		noise += PerlinNoise.noise(x * 0.01, z * 0.01, seed3) * 0.25;

		// Scale and bias the noise
		var height = Math.max(0, noise) * maxHeight;

		// Second pass: subtle high-frequency surface detail
		// Scale detail by height - less at ground level, more at peaks
		var heightFactor = height / maxHeight;  // 0 at ground, 1 at max height
		var surfaceDetail = 0;
		surfaceDetail += PerlinNoise.noise(x * 0.05, z * 0.05, seed4) * 0.08;
		surfaceDetail += PerlinNoise.noise(x * 0.1, z * 0.1, seed5) * 0.04;
		height += surfaceDetail * maxHeight * heightFactor;

		// Gradient fade from front (ground level) to back (full height)
		// Front edge (higher z, closer to camera) should be 0
		// Back edge (lower z, farther from camera) should be 1
		var distFromBack = depth / 2 - z;  // 0 at front, depth at back
		var fade = Math.max(0, Math.min(1, distFromBack / depth));
		height *= fade * fade;  // Squared for smoother transition

		vertices[i + 1] = height;
	}

	// Recompute normals for proper lighting
	geometry.computeVertexNormals();

	// Create material with gradient coloring
	var material = new THREE.MeshStandardMaterial({
		color: 0x4a5a6a,
		roughness: 0.9,
		metalness: 0.1,
		flatShading: false
	});

	mountains = new THREE.Mesh(geometry, material);
	// Position so front edge starts where city ends (last buildings at z=-1060)
	// Mountain depth is 800, so front edge = position.z + 400
	// For front edge at -1100: position.z = -1500
	mountains.position.set(0, 50, -1500);
	mountains.receiveShadow = true;
	mountains.castShadow = true;

	scene.add(mountains);

	console.log('Mountains created with perlin noise');
}

////////////////////////////////////////////////////////////////////
// Stars
////////////////////////////////////////////////////////////////////

function createStarTexture() {
	// Create a circular gradient texture for stars - similar to moon glow
	var canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	var ctx = canvas.getContext('2d');

	var centerX = 32;
	var centerY = 32;
	var gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 32);

	// Pure white center with glow - similar to moon glow technique
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');      // Pure white center
	gradient.addColorStop(0.1, 'rgba(255, 255, 255, 1.0)');    // Solid white core
	gradient.addColorStop(0.3, 'rgba(240, 240, 250, 0.9)');    // Very bright glow
	gradient.addColorStop(0.5, 'rgba(200, 200, 230, 0.7)');    // Bright glow
	gradient.addColorStop(0.7, 'rgba(150, 150, 200, 0.5)');    // Medium glow
	gradient.addColorStop(0.85, 'rgba(100, 100, 150, 0.3)');   // Dim glow
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');              // Transparent edge

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	return texture;
}

function createStars() {
	// Remove existing stars if they exist
	if (stars) {
		scene.remove(stars);
		stars.geometry.dispose();
		stars.material.dispose();
		stars = null;
	}

	// Create star geometry
	var starGeometry = new THREE.BufferGeometry();
	var starPositions = [];
	var starSizes = [];
	var starColors = [];

	for (var i = 0; i < 400; i++) {
		var x = (Math.random() - 0.5) * 4000;
		var y = 100 + Math.random() * 1100;
		var z = -Math.random() * 300 - 1500;

		starPositions.push(x, y, z);
		starSizes.push(6.0 + Math.random() * 9.0);  // Base sizes 6-15
		starColors.push(1, 1, 1);  // White
	}

	starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
	starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
	starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

	// Create circular star texture
	var starTexture = createStarTexture();

	// Create custom shader material for per-vertex size animation
	var starMaterial = new THREE.ShaderMaterial({
		uniforms: {
			pointTexture: { value: starTexture }
		},
		vertexShader: `
			attribute float size;
			attribute vec3 color;
			varying vec3 vColor;
			void main() {
				vColor = color;
				vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
				gl_PointSize = size * (300.0 / -mvPosition.z);
				gl_Position = projectionMatrix * mvPosition;
			}
		`,
		fragmentShader: `
			uniform sampler2D pointTexture;
			varying vec3 vColor;
			void main() {
				vec4 texColor = texture2D(pointTexture, gl_PointCoord);
				gl_FragColor = vec4(vColor, 1.0) * texColor * 2.0;
			}
		`,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});

	stars = new THREE.Points(starGeometry, starMaterial);
	scene.add(stars);

	console.log('Created 400 twinkling stars');
}

// Update star twinkle animation
function updateStars() {
	if (!stars) return;

	var positions = stars.geometry.attributes.position.array;
	var sizes = stars.geometry.attributes.size.array;
	var colors = stars.geometry.attributes.color.array;

	for (var i = 0; i < sizes.length; i++) {
		// Twinkle varies from 0.01 to 2.0 (1% to 200%) - dramatic size variation
		var twinkle = Math.sin(frame * 0.04 + i * 0.5) * 0.995 + 1.005;

		// Base size calculation
		var baseSize = 6.0 + (i % 125) / 13.5;  // 6-15 range
		sizes[i] = baseSize * twinkle;

		// Color intensity should stay more subtle (0.3 to 1.0)
		var colorTwinkle = Math.sin(frame * 0.04 + i * 0.5) * 0.35 + 0.65;
		var colorIndex = i * 3;
		colors[colorIndex] = colorTwinkle;      // R
		colors[colorIndex + 1] = colorTwinkle;  // G
		colors[colorIndex + 2] = colorTwinkle;  // B
	}

	stars.geometry.attributes.size.needsUpdate = true;
	stars.geometry.attributes.color.needsUpdate = true;
}

////////////////////////////////////////////////////////////////////
// Moon
////////////////////////////////////////////////////////////////////

function createMoon() {
	// Remove existing moon if it exists
	if (moon) {
		scene.remove(moon);
		moon.traverse(function(child) {
			if (child.geometry) child.geometry.dispose();
			if (child.material) {
				if (child.material.map) child.material.map.dispose();
				child.material.dispose();
			}
		});
		moon = null;
	}

	var moonGroup = new THREE.Group();

	// Create crater texture
	var craterTexture = createCraterTexture(512);

	// Moon sphere with crater texture (10% smaller than before)
	var moonGeometry = new THREE.SphereGeometry(72, 64, 64);  // 10% smaller (was 80)
	var moonMaterial = new THREE.MeshStandardMaterial({
		map: craterTexture,
		emissive: 0xf5f3e8,
		emissiveIntensity: 0.6,  // Balanced - some self-glow but still responds to lighting
		roughness: 1.0,
		metalness: 0.0,
		color: 0xffffff  // Bright base color to reflect light
	});

	var moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
	moonMesh.position.set(0, 0, 0);  // Position at group origin
	moonGroup.add(moonMesh);

	// Moon glow using sprite with radial gradient (brighter and larger)
	var glowTexture = createRadialGradientTexture(512);
	var glowMaterial = new THREE.SpriteMaterial({
		map: glowTexture,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		opacity: 1.5  // Brighter glow
	});

	var glowSprite = new THREE.Sprite(glowMaterial);

	// Calculate offset to position glow behind moon from camera's perspective
	// Camera is at approximately (0, 170, 25), moon at (-800, 600, -1400)
	// Direction from camera to moon: (-800, 430, -1425)
	// Normalized and scaled by 80 units: (-37.8, 20.3, -67.4)
	glowSprite.position.set(-38, 20, -67);  // Behind moon from camera perspective
	glowSprite.scale.set(360, 360, 1);  // Glow size reduced by 10% to match moon
	moonGroup.add(glowSprite);

	// Position the entire group
	moonGroup.position.set(-800, 600, -1400);  // Original position (only light is closer)

	scene.add(moonGroup);
	moon = moonGroup;

	console.log('Moon created with crater texture and glow');
}

function createCraterTexture(size) {
	var canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	var ctx = canvas.getContext('2d');

	// Base moon color
	ctx.fillStyle = '#F5F3E8';
	ctx.fillRect(0, 0, size, size);

	// Add noise
	var imageData = ctx.getImageData(0, 0, size, size);
	var data = imageData.data;
	for (var i = 0; i < data.length; i += 4) {
		var noise = (Math.random() - 0.5) * 20;
		data[i] += noise;
		data[i + 1] += noise;
		data[i + 2] += noise;
	}
	ctx.putImageData(imageData, 0, 0);

	// Generate craters - more craters and darker
	var numCraters = 80 + Math.floor(Math.random() * 40);  // 80-120 craters (was 30-50)
	for (var i = 0; i < numCraters; i++) {
		var x = Math.random() * size;
		var y = Math.random() * size;
		var radius = 5 + Math.random() * 30;

		var gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
		gradient.addColorStop(0, 'rgba(60, 55, 45, 0.6)');    // Darker center (was 100, 95, 80, 0.4)
		gradient.addColorStop(0.6, 'rgba(90, 85, 70, 0.5)');  // Darker mid (was 120, 115, 100, 0.3)
		gradient.addColorStop(0.85, 'rgba(200, 195, 180, 0.3)');  // Darker rim (was 255, 253, 240, 0.2)
		gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
	}

	// Add maria (dark patches)
	for (var i = 0; i < 5; i++) {
		var x = Math.random() * size;
		var y = Math.random() * size;
		var radius = 40 + Math.random() * 80;

		ctx.fillStyle = 'rgba(200, 195, 180, 0.15)';
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
	}

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	return texture;
}

function createRadialGradientTexture(size) {
	var canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	var ctx = canvas.getContext('2d');

	var centerX = size / 2;
	var centerY = size / 2;
	var gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);

	// Brighter glow gradient - scaled down 20% to keep opaque part inside moon
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');      // Bright white center
	gradient.addColorStop(0.16, 'rgba(240, 240, 250, 0.9)');   // Very bright (20% smaller)
	gradient.addColorStop(0.32, 'rgba(200, 200, 230, 0.7)');   // Bright (20% smaller)
	gradient.addColorStop(0.5, 'rgba(150, 150, 200, 0.5)');    // Medium
	gradient.addColorStop(0.7, 'rgba(100, 100, 150, 0.3)');    // Dim
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');              // Transparent edge

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	return texture;
}

////////////////////////////////////////////////////////////////////
// Camera Marker and Frustum (for overhead view)
////////////////////////////////////////////////////////////////////

function createCameraMarker() {
	// Remove existing camera marker if it exists
	if (cameraMarker) {
		scene.remove(cameraMarker);
		cameraMarker.geometry.dispose();
		cameraMarker.material.dispose();
		cameraMarker = null;
	}

	// Create a pyramid to represent the camera in overhead view
	var geometry = new THREE.ConeGeometry(10, 20, 4);
	var material = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		wireframe: false,
		transparent: true,
		opacity: 0.7
	});

	cameraMarker = new THREE.Mesh(geometry, material);
	cameraMarker.rotation.x = Math.PI;  // Point downward
	cameraMarker.visible = false;  // Hidden by default
	scene.add(cameraMarker);
}

function createCameraFrustum() {
	// Remove existing frustum if it exists
	if (cameraFrustum) {
		scene.remove(cameraFrustum);
		cameraFrustum.geometry.dispose();
		cameraFrustum.material.dispose();
		cameraFrustum = null;
	}

	// Create frustum visualization lines
	var geometry = new THREE.BufferGeometry();
	var vertices = new Float32Array([
		// Lines from camera position to frustum corners
		0, 0, 0,  -500, 0, -1000,
		0, 0, 0,   500, 0, -1000,
		0, 0, 0,   500, 0, -100,
		0, 0, 0,  -500, 0, -100,
		// Frustum edges at near plane
		-100, 0, -100,   100, 0, -100,
		100, 0, -100,    100, 0, -100,
		100, 0, -100,   -100, 0, -100,
		-100, 0, -100,  -100, 0, -100,
		// Frustum edges at far plane
		-500, 0, -1000,   500, 0, -1000,
		500, 0, -1000,    500, 0, -1000,
		500, 0, -1000,   -500, 0, -1000,
		-500, 0, -1000,  -500, 0, -1000
	]);

	geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

	var material = new THREE.LineBasicMaterial({
		color: 0xff00ff,
		transparent: true,
		opacity: 0.5
	});

	cameraFrustum = new THREE.LineSegments(geometry, material);
	cameraFrustum.visible = false;  // Hidden by default
	scene.add(cameraFrustum);
}

function updateCameraMarker() {
	if (cameraMarker && overheadView) {
		cameraMarker.position.set(
			normalViewCameraPos[0],
			normalViewCameraPos[1],
			normalViewCameraPos[2]
		);
		cameraMarker.visible = true;
		if (cameraFrustum) {
			cameraFrustum.position.copy(cameraMarker.position);
			cameraFrustum.visible = true;
		}
	} else {
		if (cameraMarker) cameraMarker.visible = false;
		if (cameraFrustum) cameraFrustum.visible = false;
	}
}

////////////////////////////////////////////////////////////////////
// Camera Control
////////////////////////////////////////////////////////////////////

function updateCamera(scrollY) {
	if (overheadView) {
		// Overhead view - look straight down from above at panned location
		camera.position.set(overheadPanX, overheadHeight, overheadPanZ);
		camera.lookAt(overheadPanX, 0, overheadPanZ);
		camera.fov = 60;
		camera.updateProjectionMatrix();
	} else {
		// Normal view with scroll
		var scrollFactor = scrollY / 1000;

		// Move camera backward and upward as user scrolls
		camera.position.z = cameraStartZ + scrollFactor * 50;
		camera.position.y = cameraStartY + scrollFactor * 100;
		camera.position.x = 0;

		// Store normal view position for marker
		normalViewCameraPos[0] = camera.position.x;
		normalViewCameraPos[1] = camera.position.y;
		normalViewCameraPos[2] = camera.position.z;

		// Move target to maintain horizontal view into city
		var targetZ = cameraTargetStartZ + scrollFactor * 50;
		var targetY = cameraTargetStartY + scrollFactor * 100;
		camera.lookAt(0, targetY, targetZ);
		camera.fov = 45;
		camera.updateProjectionMatrix();
	}
}

// Keyboard controls for overhead view
$(document).keypress(function(e) {
	if (e.which === 111) {  // 'o' key
		overheadView = !overheadView;
		console.log('Overhead view:', overheadView);

		// Hide/show page content in overhead view
		if (overheadView) {
			$('.container').hide();
		} else {
			$('.container').show();
		}
	}
});

// Mouse controls for overhead view
$(document).mousedown(function(e) {
	if (overheadView) {
		mouseDown = true;
		mouseLastX = e.clientX;
		mouseLastY = e.clientY;
		e.preventDefault();
	}
});

$(document).mouseup(function(e) {
	mouseDown = false;
});

$(document).mousemove(function(e) {
	if (overheadView && mouseDown) {
		var deltaX = e.clientX - mouseLastX;
		var deltaY = e.clientY - mouseLastY;

		// Pan camera (inverted for natural feel)
		var panSpeed = overheadHeight / 500;  // Scale with zoom level
		overheadPanX -= deltaX * panSpeed;
		overheadPanZ += deltaY * panSpeed;

		mouseLastX = e.clientX;
		mouseLastY = e.clientY;
		e.preventDefault();
	}
});

// Mouse wheel for zoom in overhead view
$(document).on('wheel', function(e) {
	if (overheadView) {
		var delta = e.originalEvent.deltaY;
		var zoomSpeed = overheadHeight * 0.001;

		overheadHeight += delta * zoomSpeed;
		overheadHeight = Math.max(overheadZoomMin, Math.min(overheadZoomMax, overheadHeight));

		e.preventDefault();
	}
});

////////////////////////////////////////////////////////////////////
// Animation Loop
////////////////////////////////////////////////////////////////////

function render() {
	animationFrameId = requestAnimationFrame(render);
	frame++;

	var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
	updateCamera(scrollY);

	// Update building positions and spawning
	updateBuildingPositions();

	// Update camera marker for overhead view
	updateCameraMarker();

	// Update star twinkle (not in overhead view)
	if (!overheadView) {
		updateStars();
	}

	// Show/hide stars and moon based on view
	if (stars) stars.visible = !overheadView;
	if (moon) moon.visible = !overheadView;

	// Render scene
	renderer.render(scene, camera);
}

////////////////////////////////////////////////////////////////////
// Window Resize
////////////////////////////////////////////////////////////////////

$(window).resize(function() {
	page_width = window.innerWidth;
	page_height = window.innerHeight;

	if (camera) {
		camera.aspect = page_width / page_height;
		camera.updateProjectionMatrix();
	}

	if (renderer) {
		renderer.setSize(page_width, page_height);
	}

	// Regenerate scene with proper cleanup to adjust building distribution
	if (scene) {
		generateScene();
	}
});

////////////////////////////////////////////////////////////////////
// Scene Generation
////////////////////////////////////////////////////////////////////

function generateScene() {
	console.log('Generating 3D scene with Three.js...');

	// Initialize texture pools once (before creating any buildings)
	if (windowTexturePool.length === 0) {
		initializeTexturePools();
	}

	createGround();
	createLighting();
	createMountains();
	generateBuildings();
	createStars();
	createMoon();
	createCameraMarker();
	createCameraFrustum();

	console.log('Scene generation complete');
}

// Make page tall enough to scroll
function setupPageHeight() {
	// Add a spacer div to make the page scrollable
	// Since content divs (#a, #b) are absolutely positioned, they don't expand the page
	var spacer = document.createElement('div');
	spacer.id = 'scroll-spacer';

	// Wait for content to load, then size spacer to match
	setTimeout(function() {
		var contentHeight = Math.max(
			$('#a').outerHeight(true) || 0,
			$('#b').outerHeight(true) || 0
		);
		// Add small margin at bottom
		spacer.style.height = (contentHeight + 100) + 'px';
	}, 1000);

	spacer.style.pointerEvents = 'none';
	document.body.appendChild(spacer);
}

////////////////////////////////////////////////////////////////////
// Start
////////////////////////////////////////////////////////////////////

var startBackground = function() {
	console.log('Starting Three.js GL-City with shadow mapping...');

	if (!initThreeJS()) {
		console.error('Failed to initialize Three.js');
		return;
	}

	// Make page scrollable
	setupPageHeight();

	generateScene();

	// Start animation loop
	render();

	console.log('Three.js GL-City started successfully');
};

// Auto-start when document is ready
$(document).ready(function() {
	console.log('Document ready, checking for THREE.js...');

	// Wait for THREE.js to load
	var checkThree = function() {
		if (typeof THREE !== 'undefined') {
			console.log('THREE.js detected, starting background');
			startBackground();
		} else {
			console.log('THREE.js not yet loaded, waiting...');
			setTimeout(checkThree, 100);
		}
	};

	checkThree();
});
