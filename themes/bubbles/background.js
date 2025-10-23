/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: brandon.hoult@softwyre.com */

$('#background').css('background', 'linear-gradient(#BBF,#446,#2B1F19,#000');

velocity_per_frame = 1;

////////////////////////////////////////////////////////////////////

function node(x,y, vx,vy, size, depth) {
  this.x = x;
  this.y = y;
  this.velocity = new Victor(vx, vy);
  this.depth = depth;
  this.size = size;
  this.pop = 0;

  this.frame = function(cd) {
  	// Apply Movement
    this.x += (this.velocity.x / this.depth);
    this.y += (this.velocity.y / this.depth);
    
    // Increase Velocity
    this.velocity.y += -0.05;
    
    // Add perlin noise for side to side motion
    this.x += perlin.get1d(frame/300) * ((20 - this.depth)/5);
    
    var s2 = (this.size / this.depth);
    this.pop -= 1;
    
    // Draw Stuff
    ctx.drawImage(image_list[this.depth], this.x|0,this.y|0, s2,s2);
  }
}


function drawFrame(ctx, frame) {
	if (play) {
		// Make new nodes
		if ( rand(20)|0 == 1 ) {
			nodes.push(new node(rand(page_width),page_height, rand(10)-5,-9, 250,rand(20)|0));
		}
		
		// Remove nodes outside of display
		nodes = nodes.filter(function(i){
		  return ( (i.y > 0) && ((i.x > 0) && (i.x < page_width- img.width)) )	
		});
	    
	    // Pop bubbles with mouse.
	    var pops = [];
	    for (var i = 0; i<nodes.length; i++) {
	    	
	    	if (nodes[i].pop > 0) {continue}
	    	
	    	var nodesize = (nodes[i].size / nodes[i].depth);
	    	var ns2 = nodesize / 2;
	    	if ((nodes[i].x + ns2 < cursorX + ns2) && 
	    	    (nodes[i].x + ns2 > cursorX - ns2) && 
	    	    (nodes[i].y + nodesize < (cursorY*0.94) + ns2) && 
	    	    (nodes[i].y + nodesize > (cursorY*0.94) - ns2)) {
	    			var n = nodes[i];
	    			for (var ii=0; ii<rand(5); ii++) {
	    				var pop = new node(n.x + rand(nodesize) - ns2 ,n.y + rand(nodesize) - ns2, n.velocity.x + rand(5),n.velocity.y + rand(5), ns2,n.depth);
	    				pop.pop = 100;
	    				pops.push(pop);
	    			}
	    			nodes.splice(i,1);
	    	}
 		}
 		nodes = nodes.concat(pops);
 		
 		
		
		// Clear the frame.
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		//ctx.fillRect(0,0,page_width,page_height);
		//ctx.drawImage(image_list[3], cursorX-75,(cursorY*0.94)-75, 150,150);
		
		// Draw Stuff on The Array
		for (n = 0; n < nodes.length; n++) {
		  nodes[n].frame(cd);
		}
	}
}

function makeSizeArray(img) {
	var sa = [];
	var canvas3 = document.getElementById('c3');
	canvas3.width = img.width;
	canvas3.height = img.height;
	
	var ctx3 = canvas3.getContext("2d");
	for (i=0;i<100;i++) {
		ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
		ctx3.save()
		ctx3.scale(i/100,i/100);
		ctx3.drawImage(img, 0, 0, img.width, img.height);
		sa[i] = ctx3.getImageData(0, 0, i+1, i+1).data.slice();
		ctx3.restore();
	}
	return sa
}

function animNum(str) {
	var str = "" + str;
	var pad = "0000";
    return pad.substring(0, pad.length - str.length) + str;
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
	page_width = window.innerWidth;
	page_height = window.innerHeight;
	ctx.canvas.width = page_width;
	ctx.canvas.height = page_height;
	ctx.strokeStyle = "black";
	ctx.fillStyle = "rgba(255,255,255,0.018)";
	cd = ctx.getImageData(0, 0, canvas.width, canvas.height);
	canvas_size = ctx.canvas.width * ctx.canvas.height;
	  
	// Load image put on new canvas, manipulate, and save as a new image.
	image_list = [];
	for (i=1; i<21; i++) {
		img = new Image();
		img.src = 'themes/bubbles/images/'+animNum(i)+'.png';
		image_list.push(img);
		if (i==20) {play=true;}
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