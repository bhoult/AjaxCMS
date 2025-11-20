/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: bhoult@gmail.com */

velocity_per_frame = 1;

////////////////////////////////////////////////////////////////////

function node(ra, w,h, x,y, vx,vy, rot) {
  this.x = x;
  this.y = y;
  this.velocity = new Victor(vx, vy);
  this.r = rot;

  this.frame = function(cd) {
  	// Apply Movement
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    
    // Increase Velocity
    this.velocity.y += -0.005;
    
    // Rotate
    this.r = this.r -((cd.width/2) - this.x) / 200;
    this.r = this.r % 360;
    if (this.r < 0){this.r = 360 + this.r}
    
    
    // Draw Stuff
	copyRotationArray(this.x|0,this.y|0,w,h,ra[(this.r)|0],cd);
  }
}


function drawFrame(ctx, frame) {
	if (play) {
		
		// Make new nodes
		canvas_size = ctx.canvas.width * ctx.canvas.height;

		if ( ((rand(canvas_size) - (canvas_size/10))) < 0) {
			nodes.push(new node(ra, img.width,img.height, rand(page_width),page_height, rand(4)-2,-3, rand(20)-10));
		}
		
		// Remove nodes outside of display
		nodes = nodes.filter(function(i){
		  return ( (i.y > 0) && ((i.x > 0) && (i.x < page_width- img.width)) )	
		});
		
		// Fade the Array
		cdFade(cd,50,20);
		cdDiffuse(cd,100,10);
		
		// Draw Stuff on The Array
		for (n = 0; n < nodes.length; n++) {
		  nodes[n].frame(cd);
		}
		
		// Copy The Array to the Canvas
		ctx.putImageData(cd, 0, 0);
	}
}

function fillArray(r,g,b,a,destination) {
	for (i=0; i<destination.data.length; i += 4) {
		destination.data[i] = r;
		destination.data[i+1] = g;
		destination.data[i+2] = b;
		destination.data[i+3] = a;
	}
}

function copyRotationArray(x,y,w,h,ra,destination) {
  var op,dp,line;

  var ow = w * 4;
  var dw = destination.width * 4;
  
  for (i=0; i < h; i++) {
  	op = ow * i;
  	dp = (x * 4) + (y * dw) + (dw * i);
   	for (ii=0; ii<ow; ii+=4) {
   		if (ra[op+ii+3] == 0) { continue; } // Skip Empty Pixels
  		destination.data[dp+ii] = ra[op+ii];
  		destination.data[dp+ii+1] = ra[op+ii+1];
  		destination.data[dp+ii+2] = ra[op+ii+2];
  		destination.data[dp+ii+3] = ra[op+ii+3];
  	}
  }
}

function copyArray(x,y,origin,destination) {
  var op,dp,line;

  var ow = origin.width * 4;
  var dw = destination.width * 4;
  
  for (i=0; i < origin.height; i++) {
  	op = ow * i;
  	dp = (x * 4) + (y * dw) + (dw * i);
   	for (ii=0; ii<ow; ii+=4) {
   		if (origin.data[op+ii+3] == 0) { continue; } // Skip Empty Pixels
  		destination.data[dp+ii] = origin.data[op+ii];
  		destination.data[dp+ii+1] = origin.data[op+ii+1];
  		destination.data[dp+ii+2] = origin.data[op+ii+2];
  		destination.data[dp+ii+3] = origin.data[op+ii+3];
  	}
  }
}

function makeRotationArray(img) {
	var ra = [];
	var canvas3 = document.getElementById('c3');
	canvas3.width = img.width;
	canvas3.height = img.height;
	
	var ctx3 = canvas3.getContext("2d");
	ctx3.translate(img.width/2, img.height/2);
	for (i=0;i<360;i++) {
		ctx3.clearRect(-canvas3.width/2, -canvas3.height/2, canvas3.width, canvas3.height);
		ctx3.rotate(Math.radians(1));
		ctx3.drawImage(img, -img.width/2, -img.width/2, img.width, img.height);
		ra[i] = ctx3.getImageData(0, 0, canvas3.width, canvas3.height).data.slice();
	}
	return ra
}

////////////////////////////////////////////////////////////////////
startBackground = function() {
	nodes = [];
	frame = 0;
	
	canvas = document.getElementById('background');
	ctx = canvas.getContext("2d");
	page_width = window.innerWidth/2;
	page_height = window.innerHeight;
	ctx.canvas.width = page_width;
	ctx.canvas.height = page_height;
	ctx.strokeStyle = "black";
	ctx.fillStyle = "rgba(255,255,255,0.018)";
	cd = ctx.getImageData(0, 0, canvas.width, canvas.height);
	  
	  
	$('#background').after('<canvas id="c3" style="display:none;"></canvas>');
	img = new Image();
	play=false;
	img.onload = function(){
	    ra = makeRotationArray(img);
	    play=true;
	}
	img.src = 'themes/riseup/images/bar1.png';
	
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