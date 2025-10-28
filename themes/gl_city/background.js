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
var overheadHeight = 300;

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
	moonLight.shadow.mapSize.width = 2048;
	moonLight.shadow.mapSize.height = 2048;
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
		color: 0x050508,
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

	// Create mesh
	var geometry = new THREE.BoxGeometry(this.width, this.height, this.depth_size);
	var material = new THREE.MeshStandardMaterial({
		color: this.color,
		roughness: 0.8,
		metalness: 0.2
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position.set(this.x, this.height / 2, this.z);  // Position on ground
	this.mesh.castShadow = true;  // Buildings cast shadows
	this.mesh.receiveShadow = true;  // Buildings receive shadows from other buildings

	scene.add(this.mesh);
}

Building.prototype.remove = function() {
	if (this.mesh) {
		scene.remove(this.mesh);
		this.mesh.geometry.dispose();
		this.mesh.material.dispose();
	}
};

Building.prototype.update = function() {
	// Move building left
	this.x -= buildingPanSpeed;
	if (this.mesh) {
		this.mesh.position.x = this.x;
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
// Stars
////////////////////////////////////////////////////////////////////

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
		starSizes.push(2.0 + Math.random() * 3.0);  // Larger stars (2-5 instead of 0.75-2)
		starColors.push(1, 1, 1);  // White
	}

	starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
	starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
	starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

	// Create star material with custom shader for twinkling - brighter
	var starMaterial = new THREE.PointsMaterial({
		size: 5,  // Larger base size
		sizeAttenuation: true,
		transparent: true,
		opacity: 1.0,
		vertexColors: true,
		blending: THREE.AdditiveBlending
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

	for (var i = 0; i < sizes.length; i++) {
		var twinkle = Math.sin(frame * 0.01 + i) * 0.495 + 0.505;  // 0.01 to 1.0
		sizes[i] = (2.0 + (i % 125) / 40) * twinkle;  // Larger base size with twinkle
	}

	stars.geometry.attributes.size.needsUpdate = true;
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
		// Overhead view - look down from above
		camera.position.set(0, overheadHeight, 0);
		camera.lookAt(0, 0, -500);
		camera.fov = 90;
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

	createGround();
	createLighting();
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
	var spacer = document.createElement('div');
	spacer.id = 'scroll-spacer';
	spacer.style.height = '3000px';
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
