/**
 * Canvas Utilities for AjaxCMS
 *
 * This file provides utility functions for canvas-based animations including color conversion
 * (HSL to RGB), mouse tracking, and helper functions used by various AjaxCMS themes.
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

/* Update Global Variables with current mouse position. */
var cursorX;
var cursorY;
document.onmousemove = function(e){
    cursorX = e.pageX;
    cursorY = e.pageY;
}

/**
* Converts an HSL color value to RGB. Conversion formula
* adapted from http://en.wikipedia.org/wiki/HSL_color_space.
* Assumes h, s, and l are contained in the set [0, 1] and
* returns r, g, and b in the set [0, 255].
*
* @param   Number  h       The hue
* @param   Number  s       The saturation
* @param   Number  l       The lightness
* @return  Array           The RGB representation
*/
function hslToRgb(h, s, l){
    var r, g, b;
    h = h % 1;
    if (s%1 != 0) {s = s % 1};
    if (l%1 != 0) {l = l % 1};
    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function decToHex(d){
	var hex = Number(d).toString(16);
	if (hex.length < 2) {hex = '0' + hex}
	return hex
}

/**
* Converts an RGB color value to HSL. Conversion formula
* adapted from http://en.wikipedia.org/wiki/HSL_color_space.
* Assumes r, g, and b are contained in the set [0, 255] and
* returns h, s, and l in the set [0, 1].
*
* @param   Number  r       The red color value
* @param   Number  g       The green color value
* @param   Number  b       The blue color value
* @return  Array           The HSL representation
*/
function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

////////////////////////////////////////////////////////////////////
// Converts from degrees to radians.
////////////////////////////////////////////////////////////////////
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
////////////////////////////////////////////////////////////////////
// Converts from radians to degrees.
////////////////////////////////////////////////////////////////////
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

////////////////////////////////////////////////////////////////////
// Perlin Noise                                                                 
// from: http://www.xna-connection.com/post/Algorithme-de-Perlin-Noise-en-C     
////////////////////////////////////////////////////////////////////
var Perlin = function () {
    var mask = 0xff;
    var size = mask + 1;
    var values = new Uint8Array(size * 2);
    for (var i = 0; i < size; i++) {
        values[i] = values[size + i] = 0|(Math.random() * 0xff);
    }
    
    var lerp = function (t, a, b) {
        return a + t * (b - a);
    };
    var fade = function (t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    };
    
    var grad1d = function (hash, x) {
        return (hash & 1) === 0 ? x : -x;
    };
    var grad2d = function (hash, x, y) {
        var u = (hash & 2) === 0 ? x : -x;
        var v = (hash & 1) === 0 ? y : -y;
        return u + v;
    };
    var grad3d = function (hash, x, y, z) {
        var h = hash & 15;
        var u = h < 8 ? x : y;
        var v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
        return ((h & 1) === 0 ? u : -u) + ((h & 1 === 0) ? v : -v);
    };
    
    var noise1d = function (x) {
        var intX = (0|x) & mask;
        var fracX = x - (0|x);
        var t = fade(fracX);
        var a = grad1d(values[intX], fracX);
        var b = grad1d(values[intX + 1], fracX - 1);
        return lerp(t, a, b);
    };
    var noise2d = function (x, y) {
        var intX = (0|x) & mask;
        var intY = (0|y) & mask;
        var fracX = x - (0|x);
        var fracY = y - (0|y);
        var r1 = values[intX] + intY;
        var r2 = values[intX + 1] + intY;
        var t1 = fade(fracX);
        var t2 = fade(fracY);
        
        var a1 = grad2d(values[r1], fracX, fracY);
        var b1 = grad2d(values[r2], fracX - 1, fracY);
        var a2 = grad2d(values[r1 + 1], fracX, fracY - 1);
        var b2 = grad2d(values[r2 + 1], fracX - 1, fracY - 1);
        return lerp(t2, lerp(t1, a1, b1), lerp(t1, a2, b2));
    };
    var noise3d = function (x, y, z) {
        var intX = (0|x) & mask;
        var intY = (0|y) & mask;
        var intZ = (0|z) & mask;
        var fracX = x - (0|x);
        var fracY = y - (0|y);
        var fracZ = z - (0|z);
        var r1 = values[intX] + intY;
        var r11 = values[r1] + intZ;
        var r12 = values[r1 + 1] + intZ;
        var r2 = values[intX + 1] + intY;
        var r21 = values[r2] + intZ;
        var r22 = values[r2 + 1] + intZ;
        var t1 = fade(fracX);
        var t2 = fade(fracY);
        var t3 = fade(fracZ);
        
        var a11 = grad3d(values[r11], fracX, fracY, fracZ);
        var b11 = grad3d(values[r21], fracX - 1, fracY, fracZ);
        var a12 = grad3d(values[r12], fracX, fracY - 1, fracZ);
        var b12 = grad3d(values[r22], fracX - 1, fracY - 1, fracZ);
        
        var a21 = grad3d(values[r11 + 1], fracX, fracY, fracZ - 1);
        var b21 = grad3d(values[r21 + 1], fracX - 1, fracY, fracZ - 1);
        var a22 = grad3d(values[r12 + 1], fracX, fracY - 1, fracZ - 1);
        var b22 = grad3d(values[r22 + 1], fracX - 1, fracY - 1, fracZ - 1);
        
        return lerp(t3,
                    lerp(t2, lerp(t1, a11, b11), lerp(t1, a12, b12)),
                    lerp(t2, lerp(t1, a21, b21), lerp(t1, a22, b22)));
    };

    return {
        get1d: noise1d,
        get2d: noise2d,
        get3d: noise3d,
    }
};
perlin = Perlin();

////////////////////////////////////////////////////////////////////
function rand(n) {
  return Math.random() * n;
}

////////////////////////////////////////////////////////////////////
function cdFade(data,v,n) {
	var len = data.data.length
	for (i=0; i < len; i = i + 4) {
		i += (Math.floor(rand(v)) * 4);
		data.data[i+3] -= n;
	}
}

////////////////////////////////////////////////////////////////////
function cdDiffuse(data,v,spread) {
	var len = data.data.length
	var data_width = data.width;
	var array_width = data_width * 4;
	
	var r;
	var g;
	var b;
	var a;
	var p2;
	
	for (var i=0; i < len; i += 4) {
		
		i += (Math.floor(rand(v)) * 4);
		if (data.data[i+3] == 0) { continue; }
		
		r = data.data[i];
		g = data.data[i+1];
		b = data.data[i+2];
		a = data.data[i+3];

		p2 = i + (Math.round(rand(spread) - (spread/2)) * array_width) + (Math.round(rand(spread) - (spread/2)) * 4);
		//p2 = i + ((Math.floor(rand(5)) - 2) * array_width) + ((Math.floor(rand(5)) - 2) * 4);
		
		data.data[i] = data.data[p2];
		data.data[i+1] = data.data[p2+1];
		data.data[i+2] = data.data[p2+2];
		data.data[i+3] = data.data[p2+3];
		
		data.data[p2] = r;
		data.data[p2+1] = g;
		data.data[p2+2] = b;
		data.data[p2+3] = a;
	}
}

////////////////////////////////////////////////////////////////////
function getPixel(data,x,y) {
  var idx = ((x|0) + (y|0) * data.width) * 4;
  var r = data.data[idx + 0];
  var g = data.data[idx + 1];
  var b = data.data[idx + 2];
  var a = data.data[idx + 3];
  return ([r,g,b,a]);
}

////////////////////////////////////////////////////////////////////
function setPixel(data,x,y,r,g,b,a) {
  var idx = ((x|0) + (y|0) * data.width) * 4;
  data.data[idx + 0] = r; // Red channel
  data.data[idx + 1] = g; // Green channel
  data.data[idx + 2] = b; // Blue channel
  data.data[idx + 3] = a; // Alpha channel
}

////////////////////////////////////////////////////////////////////
function arrayLine(cd, x1, y1, x2, y2, r, g, b, a, width) {
  var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  var xd = (x2 - x1) / distance;
  var yd = (y2 - y1) / distance;
  var normal = vectorNormal(Victor(xd, yd));
  for (w = -width / 2 | 0; w < width / 2 | 0; w++) {
    for (i = 0; i < distance; i++) {
      setPixel(cd, (x1 + xd * i) + (normal.x * w) | 0, (y1 + yd * i) + (normal.y * w) | 0, r, g, b, a);
    }
  }
}

////////////////////////////////////////////////////////////////////
function spray(cd,x,y,hsl,num){
	for (ii = 0; ii < num; ii++) {
          var rr = rand(360);
          var xr = rand(2);
          var yr = rand(15);
          var xx = (Math.cos(Math.radians(rr)) * xr);
          var yy = (Math.sin(Math.radians(rr)) * yr);

          var rgb = hslToRgb(hsl[0] + (yr / 70), hsl[1], hsl[2]);
          var r = rgb[0];
          var g = rgb[1];
          var b = rgb[2];
          
          setPixel(cd, (x + xx) | 0, (y + yy) | 0, r, g, b, 255);
    }
}

////////////////////////////////////////////////////////////////////
// Normal of a vector
function vectorNormal(v) {
  var x = v.x;
  var y = v.y;
  var v2 = Victor(-y, x);
  return v2.normalize();
}

////////////////////////////////////////////////////////////////////
// Calculate the reflection of the incoming vector off the wall vector
// refl_v = incoming_v - 2 * WallNormal * (WallNormal DOT incoming_v)
////////////////////////////////////////////////////////////////////
function vectorReflect(wall,incoming) {
  wallNormal = vectorNormal(wall);
  dot = wallNormal.dot(incoming);
  return incoming.clone().subtract(Victor(2, 2).multiply(wallNormal).multiply(Victor(dot, dot))).multiply(Victor(1, 1));
}