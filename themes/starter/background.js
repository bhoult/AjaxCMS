/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: bhoult@gmail.com */

$('#background').css('background', 'linear-gradient(#555,#000');

velocity_per_frame = 1;

////////////////////////////////////////////////////////////////////

function node(x,y) {
  this.x = x;
  this.y = y;
  
  this.frame = function(cd) {
  	// Calculate Movement
    
    // Draw Stuff
    
  }
}

function drawFrame(ctx, frame) {

	// Clear the frame.
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw Stuff
	for (n = 0; n < nodes.length; n++) {
	  nodes[n].frame(cd);
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
	ctx.strokeStyle = "black";
	ctx.fillStyle = "rgba(255,255,255,0.018)";
	cd = ctx.getImageData(0, 0, canvas.width, canvas.height);
	canvas_size = ctx.canvas.width * ctx.canvas.height;
	  
	// Animation Loop
	function draw() {
		requestAnimationFrame(draw);
		frame++;
		drawFrame(ctx, frame);
	}
	
	draw();
}


// Start the background animation.
//startBackground();