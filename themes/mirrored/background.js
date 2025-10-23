/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: brandon.hoult@softwyre.com */

velocity = 8;
padding = 400;    	// How far from the edge does repulsion start.
magnet = 10;      	// Strength of repulsion greater = less repulsion.
colorspeed = 175; 	// Greater is slower
num_nodes = 5;    	// Number of nodes to animate
saturation = 1;		// Color saturation range 0-1
lightness = 0.5;	// Brightness value of colors 0-1

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


function drawFrame(ctx, frame) {
	
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
	
	//-------------------- 1 ------------------------
	// Draw Lines Connecting Nodes
	ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
	for (n = 1; n < nodes.length; n++) {
		ctx.lineTo(nodes[n].x, nodes[n].y);
	}
	ctx.stroke();
	
	// Draw Nodes
	for (n = 0; n < nodes.length; n++) {
    	ctx.beginPath();
    	ctx.arc(Math.round(nodes[n].x),Math.round(nodes[n].y), 5, 0,2*Math.PI); // circle
    	ctx.fillStyle = node_color;
		ctx.fill();
	}
	
	//-------------------- 2 ------------------------
	// Draw Lines Connecting Nodes
	ctx.beginPath();
    ctx.moveTo(page_width-nodes[0].x, nodes[0].y);
	for (n = 1; n < nodes.length; n++) {
		ctx.lineTo(page_width-nodes[n].x, nodes[n].y);
	}
	ctx.stroke();
	
	// Draw Nodes
	for (n = 0; n < nodes.length; n++) {
    	ctx.beginPath();
    	ctx.arc(Math.round(page_width-nodes[n].x),Math.round(nodes[n].y), 5, 0,2*Math.PI); // circle
    	ctx.fillStyle = node_color;
		ctx.fill();
	}
	
	//-------------------- 3 ------------------------
	// Draw Lines Connecting Nodes
	ctx.beginPath();
    ctx.moveTo(page_width-nodes[0].x, page_height-nodes[0].y);
	for (n = 1; n < nodes.length; n++) {
		ctx.lineTo(page_width-nodes[n].x, page_height-nodes[n].y);
	}
	ctx.stroke();
	
	// Draw Nodes
	for (n = 0; n < nodes.length; n++) {
    	ctx.beginPath();
    	ctx.arc(Math.round(page_width-nodes[n].x),Math.round(page_height-nodes[n].y), 5, 0,2*Math.PI); // circle
    	ctx.fillStyle = node_color;
		ctx.fill();
	}
	
	//-------------------- 4 ------------------------
	// Draw Lines Connecting Nodes
	ctx.beginPath();
    ctx.moveTo(nodes[0].x, page_height-nodes[0].y);
	for (n = 1; n < nodes.length; n++) {
		ctx.lineTo(nodes[n].x, page_height-nodes[n].y);
	}
	ctx.stroke();
	
	// Draw Nodes
	for (n = 0; n < nodes.length; n++) {
    	ctx.beginPath();
    	ctx.arc(Math.round(nodes[n].x),Math.round(page_height-nodes[n].y), 5, 0,2*Math.PI); // circle
    	ctx.fillStyle = node_color;
		ctx.fill();
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
$.ajax({url:"http://ajaxcmshelper.softwyre.com/hit",type:"post",data:{hit_data: hit_data}});

// Start the background animation.
startBackground();