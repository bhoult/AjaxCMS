/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: brandon.hoult@softwyre.com */

page_width = window.innerWidth;
page_height = window.innerHeight;

layer_height = page_height;	// Height of layers in pixels
layer_scroll_speed = -2;	// Speed of horizontal scroll
scroll_parallax_factor = 0.3; // Parallax intensity based on scroll (0-1)

////////////////////////////////////////////////////////////////////

function layer(jqo, offset) {
  this.jqo = jqo;
  
  this.offset = offset;
  if (offset === undefined) {this.offset = 0}
  
  this.position = rand(2000);
}

function drawFrame(frame) {
	// Get current scroll position
	var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

	var layer_bottom = -layer_height/2;
    var layer_distance_spread = layer_height / 2.6;

	for (var i = 1; i<=layers.length; i++) {
		// Scroll Horizontally
		var position = (frame + layers[i-1].position) * layer_scroll_speed / i;
		layers[i-1].jqo.css("background-position", Math.round(position)+"px");

		// Height of successive layers - add extra height for deeper layers to prevent cropping
	    var height = (layer_height) / i + (layer_height * 0.5); // Add 50% extra height
		layers[i-1].jqo.css("height", Math.round(height)+"px");

		// Layer spread based on scroll position
		// Layers move up at different rates as you scroll down (parallax effect)
		var parallax_offset = scrollY * scroll_parallax_factor * (1 / i); // Deeper layers move slower

		var bottom = 	( Math.sqrt(i-1) * layer_distance_spread )   // Base distance from bottom derived from layer number
						+ layer_bottom  // Base bottom position
						+ parallax_offset  // Move based on scroll (divided by depth for parallax)
						+ layers[i-1].offset;  // Raise with individual layer offset
		layers[i-1].jqo.css("bottom", Math.round(bottom)+"px");
	}
}

function addLayer(imagename,offset) {
	var layerIndex = layers.length;
	var l = $("<div id='layer"+layerIndex+"' style='width:100%; height:"+50+"%; position:absolute; bottom:"+0+"px; background-repeat:repeat-x; background-size:cover;'></div>");
	l.css('background-image', 'url('+imagename+')');
	$('#background-div').prepend(l);
	layers.push(new layer(l,offset));

	$('#background-div').prepend("<div style='width:100%; height:100%; position:absolute; background-color:rgba(200,200,255,0.2);'></div>")

	// Add bottom block to cover background below scrolling images;
	//layer.append()
}


////////////////////////////////////////////////////////////////////

startBackground = function() {
  
  
  frame = 0;
  layers = [];

  // Add Background Layers in order from front to back.
  addLayer('themes/cityscape/images/city-a-blur.png');
  addLayer('themes/cityscape/images/city-b-blur.png');
  addLayer('themes/cityscape/images/city-a.png');
  addLayer('themes/cityscape/images/city-b.png');
  addLayer('themes/cityscape/images/city-a.png');
  addLayer('themes/cityscape/images/mountain-a.png');
  addLayer('themes/cityscape/images/mountain-b.png', -50);
  
  // Animation Loop
  function draw() {
  	    requestAnimationFrame(draw);
  	    
		frame++;
		
		drawFrame(frame);
		//debugger
  }
  
  draw();
}

// Restart if window is resized
$(window).resize(function(){
  page_width = window.innerWidth;
  page_height = window.innerHeight;
  layer_height = page_height;	// Height of layers in pixels
});

// Ping the tracking server.
hit_data = {theme: theme, user_agent: navigator.userAgent, resolution_x: window.innerWidth, resolution_y: window.innerHeight, url: document.domain};

// Start the background animation.
startBackground();