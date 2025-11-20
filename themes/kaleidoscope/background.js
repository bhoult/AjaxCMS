/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: bhoult@gmail.com */

velocity = 8;
padding = 400;    	// How far from the edge does repulsion start.
magnet = 10;      	// Strength of repulsion greater = less repulsion.
colorspeed = 175; 	// Greater is slower
num_nodes = 4;    	// Number of nodes to animate
saturation = 1;		// Color saturation range 0-1
lightness = 0.5;	// Brightness value of colors 0-1
angles = rand(12)+1;

$('#background').css('background', '#000');

////////////////////////////////////////////////////////////////////

function node(x,y, vx,vy, size, depth) {
  this.x = x;
  this.y = y;
  this.velocity = new Victor(vx, vy);
  this.depth = depth;
  this.size = size;

  this.frame = function(n) {
  	// Apply Movement
    this.x += (this.velocity.x);
    this.y += (this.velocity.y);
    
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

// Draw the nodes and other effects
function drawFrame(ctx, frame) {
	var angle,npos;
	
	// Calculate Line Color
	var lc = hslToRgb((frame/100), saturation, lightness)
	var line_color = '#' + decToHex(lc[0]) + decToHex(lc[1]) + decToHex(lc[2]);
	ctx.strokeStyle = line_color;
	
	// Calculate Node Color
	var nc = hslToRgb(((frame+180)/100), saturation, lightness)
	var node_color = '#' + decToHex(nc[0]) + decToHex(nc[1]) + decToHex(nc[2]);
	
	// Clear the frame.
	ctx.fillStyle = "rgba(0,0,0,0.018)";
	ctx.fillRect(0,0,page_width,page_height);
	
	// Update Node Positions
	for (n = 0; n < nodes.length; n++) {
	  nodes[n].frame(n);
	}
	
	// Draw nodes and points rotated around center.
	for (var i = 0; i<angles; i++) {
		angle = (360/angles) * i;
		
		// Draw Lines Connecting Nodes
		ctx.beginPath();
		npos = rotatePoint(nodes[0].x,nodes[0].y, center_x,center_y, angle);
	    ctx.moveTo(npos.x, npos.y);
		for (n = 1; n < nodes.length; n++) {
			npos = rotatePoint(nodes[n].x,nodes[n].y, center_x,center_y, angle);
			ctx.lineTo(npos.x, npos.y);
		}
		ctx.stroke();
		
		// Draw Nodes
		for (n = 0; n < nodes.length; n++) {
			npos = rotatePoint(nodes[n].x,nodes[n].y, center_x,center_y, angle);
	    	ctx.beginPath();
	    	ctx.arc(npos.x,npos.y, 5, 0,2*Math.PI); // circle
	    	ctx.fillStyle = node_color;
			ctx.fill();
		}
	}
}



////////////////////////////////////////////////////////////////////
startBackground = function() {
	nodes = [];
	frame = 0;
	
	// Set up the background canvas
	canvas = document.getElementById('background');
	ctx = canvas.getContext("2d");
	page_width = window.innerWidth;
	page_height = window.innerHeight;
	center_x = page_width / 2;
	center_y = page_height / 2;
	ctx.canvas.width = page_width;
	ctx.canvas.height = page_height;

	canvas_size = ctx.canvas.width * ctx.canvas.height;
	
	// Make new nodes
	for (var i=0; i<num_nodes; i++) {
		var v = new Victor(rand(10)-5,rand(10)-5);
		v = vectorNormal(v).multiply(new Victor(rand(velocity)+1,rand(velocity)+1));
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
startBackground();