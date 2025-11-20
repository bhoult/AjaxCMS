/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Information email: bhoult@gmail.com */

$('#background').css('background', 'linear-gradient(#000,#FFF');

velocity_per_frame = 1;

////////////////////////////////////////////////////////////////////

function node(x,y, vx,vy, depth, inum, rotation, rotation_velocity) {
  this.x = x;
  this.y = y;
  this.velocity = new Victor(vx, vy);
  this.depth = depth + 1;
  this.inum = inum;
  this.rotation = rotation;
  this.rotation_velocity = rotation_velocity;

  this.frame = function(cd) {
  	// Apply Movement
    this.x += (this.velocity.x / this.depth);
    this.y += (this.velocity.y / this.depth);
    
    this.rotation += rotation_velocity;
    
    // Increase Velocity
    this.velocity.y += -0.05;
    this.velocity.x += 0.05;
    
    // Add perlin noise for side to side motion
    this.x += perlin.get1d(frame/300) * ((20 - this.depth)/5);
    
    // Draw Stuff
    var iwidth = image_list[this.inum].width;
    var iheight = image_list[this.inum].height;
    var ctx_mid_x = Math.round(canvas.width / 2);
    var ctx_mid_y = Math.round(canvas.height / 2);
    var img_mid_x = Math.round(iwidth / 2);
    var img_mid_y = Math.round(iheight / 2);
    
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    //ctx.translate(img_mid_x, img_mid_y);
    ctx.rotate(Math.radians(this.rotation));
    ctx.scale(1/this.depth,1/this.depth);
    ctx.scale(page_width/1000, page_width/1000);
   	ctx.drawImage(image_list[this.inum], -img_mid_x,-img_mid_y, iwidth,iheight);

    ctx.restore();
  }
}


function drawFrame(ctx, frame) {
	if (play) {
		// Make new nodes
		if ( rand(20)|0 == 1 ) {
			nodes.push(
				new node(
					page_width/4,  					// x
					page_height - (page_width/4) , 	// y
					rand(25),-rand(25),   			// xv,yv
					rand(15)|0+1,	    			// depth
					rand(15)|0,						// inum
					rand(360),						// rotation
					rand(4)-2						// rotation_velocity
				)
			);
		}
		
		// Remove nodes outside of display
		nodes = nodes.filter(function(i){
		  return ( (i.y > -img.height) && ((i.x > -img.width) && (i.x < page_width + img.width)) && (i.y < page_height + img.height))	
		});
		
		// Clear the frame.
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// Draw Stuff on The Array
		for (n = 0; n < nodes.length; n++) {
		  nodes[n].frame(cd);
		}
	}
}

////////////////////////////////////////////////////////////////////
startBackground = function() {
	nodes = [];
	velocity_per_frame = 1;
	frame = 0;
	play=false;
	
	// Set up the background canvas
	canvas = document.getElementById('background');
	ctx = canvas.getContext("2d");
	page_width = window.innerWidth/1;
	page_height = window.innerHeight/1;
	ctx.canvas.width = page_width;
	ctx.canvas.height = page_height;
	ctx.strokeStyle = "black";
	ctx.fillStyle = "rgba(255,255,255,0.018)";
	cd = ctx.getImageData(0, 0, canvas.width, canvas.height);
	canvas_size = ctx.canvas.width * ctx.canvas.height;
	  
	// Load image put on new canvas, manipulate, and save as a new image.
	image_list = [];
	for (i=1; i<16; i++) {
		img = new Image();
		img.src = 'themes/notes/images/note'+i+'.png';
		
		image_list.push(img);
		if (i==15) {
			play=true;
			for (var i=0; i<50; i++) {
				nodes.push(
					new node(
						page_width/4,  					// x
						page_height - (page_width/4) , 	// y
						rand(25),-rand(25),   			// xv,yv
						rand(15)|0+1,	    			// depth
						rand(15)|0,						// inum
						rand(360),						// rotation
						rand(4)-2						// rotation_velocity
					)
				);
			}
		}
	}
	
	// Load Head
	$('canvas').after("<img src='themes/notes/images/head.png' style='position:absolute; bottom:0px; width:50%;'>");
	
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