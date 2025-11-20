/**
 * AjaxCMS Theme - Starter
 *
 * Animated canvas background theme for AjaxCMS providing visual effects and coordinated color schemes.
 *
 * Copyright (C) 2016-2025 Brandon Hoult
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


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