/* (c) 2016 Softwyre Inc / Brandon Hoult. for More Invformation email: brandon.hoult@softwyre.com */

page_width = window.innerWidth;
page_height = window.innerHeight;
  
layer_height = page_height;	// Height of layers in pixels
rise_factor = 15; 			// Amount of rise with mouse move... higher is less

////////////////////////////////////////////////////////////////////

function layer(jqo, speed, offset) {
  this.jqo = jqo;
  
  this.speed = speed;
  if (speed === undefined) {this.speed = 0}
  
  this.offset = offset;
  if (offset === undefined) {this.offset = 0}
  
  this.position = rand(2000);
}

function drawFrame(frame) {
	if (cursorY === undefined) {cursorY = 0}
	
	var layer_bottom = -layer_height/2;
    var layer_distance_spread = layer_height / 2.6;
		
	for (var i = 1; i<=layers.length; i++) {
		// Scroll Horizontally
		var position = frame * layers[i-1].speed;
		layers[i-1].jqo.css("background-position", Math.round(position)+"px");
		
		// Layer spread 
		var shiftX = ((cursorX * (layers.length-i)) / 50) - ((page_width) * (layers.length-i) / 50);
		layers[i-1].jqo.css("left", Math.round(shiftX)+"px");
		
		var shiftY = ((cursorY * (layers.length-i)) / 50) - ((page_height) * (layers.length-i) / 50) + (layers[i-1].offset);
		layers[i-1].jqo.css("bottom", Math.round(shiftY)+"px");
	}
}

function addLayer(imagename,speed,offset) {
	
	var l = $("<div id='layer"+i+"' style='width:110%; height:110%; position:absolute; bottom:0px; background-repeat:repeat-x; background-size:cover;'></div>");
	l.css('background-image', 'url('+imagename+')'); 
	$('#background-div').prepend(l);
	layers.push(new layer(l,speed,offset));
	
}

////////////////////////////////////////////////////////////////////

startBackground = function() {
  frame = 0;
  layers = [];

  // Add Background Layers in order from front to back.
  addLayer('themes/utah/images/arches1.png',0,0);
  addLayer('themes/utah/images/arches2.png',0,-50);
  addLayer('themes/utah/images/arches3.jpg',1,0);
  
  // Animation Loop
  function draw() {
  	    requestAnimationFrame(draw);
  	    
		frame++;
		
		drawFrame(frame);
		//debugger
  }
  
  draw();
}

// Ping the tracking server.
hit_data = {theme: theme, user_agent: navigator.userAgent, resolution_x: window.innerWidth, resolution_y: window.innerHeight, url: document.domain};
$.ajax({url:"http://ajaxcmshelper.softwyre.com/hit",type:"post",data:{hit_data: hit_data}});

// Start the background animation.
startBackground();