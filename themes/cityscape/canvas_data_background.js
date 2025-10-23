// Turns out that this is really slow.  Not sure why.
function rollLayer(layer,amount) {
	d = layer.data
		d.copyWithin(4, 0, d.length - (amount * 4));
	
	for (var y=0; y<layer.height; y++) {
		//debugger
		row_start = layer.width * y * 4;
		row_end = row_start + (layer.width * 4);
		
		//end_bit = d.slice(row_end - (amount * 4), row_end);
		d.copyWithin(row_start + (amount * 4), row_start, row_end - (amount * 4));
	}
	
}

function drawFrame(ctx, frame) {
	
	// Clear the frame.
	ctx.clearRect(0,0, ctx.canvas.width,ctx.canvas.height);
	
	// Roll the layer
	//layer[0].data.copyWithin(0, 4, layer[0].length); // also slow
	//rollLayer(layer[0],3);

	// Copy The Canvas to the Screen
	vertical = ctx.canvas.height - layer[0].height - 130;
	shift = frame % layer[0].width * 5;
	
	// ok performance so long as image is not scaled up for really tall screens.
	for (var i = 0; i< 1; i++) {
		ctx.putImageData(layer[0], shift,vertical, 0,0, ctx.canvas.width-shift,layer[0].height); // Align to bottom of screen
		ctx.putImageData(layer[0], -layer[0].width + shift,vertical , 0,0, layer[0].width,layer[0].height); // Align to bottom of screen
	}
}

// Return Context Data for specified filename
function loadImage(filename, scale, callback) {
	img = new Image();
	
	img.onload = function(){
		scale = page_height / img.height * scale;
		
		tcanvas = document.createElement('canvas');
		tcanvas.width = img.width * scale;
		tcanvas.height = img.height * scale;
		tctx = tcanvas.getContext('2d');
		tctx.scale(scale,scale);
		tctx.drawImage(img,0,0);
		callback(tctx.getImageData(0, 0, tcanvas.width, tcanvas.height));
	}
	img.src = filename;
}

////////////////////////////////////////////////////////////////////
startBackground = function() {
  start_animation = false;
  frame = 0;
  layer=[];

  canvas = document.getElementById('background');
  ctx = canvas.getContext("2d");
  page_width = window.innerWidth;
  page_height = window.innerHeight;
  ctx.canvas.width = page_width;
  ctx.canvas.height = page_height;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "rgba(255,255,255,0.018)";
  cd = ctx.getImageData(0, 0, canvas.width, canvas.height);

  
  var iData = loadImage('themes/default/images/cityscape1.png',0.3, function(data){
  	layer.push(data);
  	start_animation = true;
  })
  
  // Animation Loop
  function draw() {
  	    requestAnimationFrame(draw);
  	    
		if (start_animation) {
			frame++;
			drawFrame(ctx, frame);
		}
  }
  
  draw();
}

startBackground();