/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: bhoult@gmail.com */

x_velocity = 1;
y_velocity = 1;
padding = 100;    	// How far from the edge does repulsion start.
magnet = 1;      	// Strength of repulsion greater = less repulsion.
node_density = 30;  // Less is higher density.
line_hue = 200;
hue_spread = 10;
node_color = "#FFF";
background_color = "#000";
max_distance = 250;
max_sparks = 1;
spark_spread = 0;

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

// Distance Between Two Points
function distance(x1,y1,x2,y2) {
	return Math.sqrt( (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) );
}

// Draw the nodes and other effects
function drawFrame(ctx, frame) {

	// Clear the frame.
	ctx.fillStyle = "rgba(0,0,0,1)";
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

				for(i=0; i<num_sparks;i++) {
					line_saturation = 1;
					line_lightness = 1-(dist/max_distance);
					line_color = "hsl("+Math.round(line_hue + rand(hue_spread*2) - hue_spread)+","+(line_saturation*100)+"%,"+Math.round(line_lightness*100)+"%)";
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
	
	// Draw Nodes
	for (n = 0; n < nodes.length; n++) {
    	ctx.beginPath();
    	ctx.arc(nodes[n].x,nodes[n].y, 5, 0,2*Math.PI); // circle
    	ctx.fillStyle = node_color;
		ctx.fill();
	}
}

////////////////////////////////////////////////////////////////////

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
startBackground();