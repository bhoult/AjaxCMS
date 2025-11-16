(function() {
'use strict';

/**
 * AjaxCMS - Dynamic front-end CMS with static file backend
 *
 * This IIFE (Immediately Invoked Function Expression) wraps the entire CMS
 * to prevent global namespace pollution. Only the loadPage function is
 * exposed globally for onclick handlers in generated HTML.
 */

/////////////////////////////////  CONFIGURATION   ///////////////////////////////

// Animation and timing constants
var CAROUSEL_INIT_DELAY = 1000;        // Delay before initializing Bootstrap carousels (ms)
var TRANSITION_DURATION = 500;          // Duration of page transition animations (ms)
var BACKGROUND_HEIGHT_OFFSET = 120;     // Extra height for background to prevent glitches on mobile

// Page transition type: "slide" (directional) or "basic" (instant)
var load_transition = "slide";

// Disable AJAX caching to ensure fresh content
$.ajaxSetup({ cache: false });

//////////////////////////////////////////////////////////////////////////////////

// Data arrays populated from directory listings
var menus = [];      // Menu page paths (files in pages/menus/)
var pages = [];      // All page paths (both files and directories)
var layouts = [];    // Layout template paths (layout.html files)
var blogs = [];      // Blog post paths (reserved for future use)
var images = [];     // Image file paths from images/ directory

// Async operation counters - track when directory listings are fully loaded
var menu_count = 0;     // Reserved for future use
var pages_count = 0;    // Counter for pending page directory requests
var images_count = 0;   // Counter for pending image directory requests
var in_transition = false;  // Flag to prevent overlapping page transitions
var theme_ready = false;  // Flag to track when theme initialization is complete

// URL and page state management
var base_url = window.location.href.replace(/\?.*/,'');  // Base URL without query params
var current_page;   // Currently displayed page path
var just_pages;     // Filtered array of actual pages (excludes directories and layouts)
var menu_pages;     // Pages that appear in the navigation menu
var data;           // Global variable holding current page content during processing

// Directories to skip when loading images (special size variants)
var SKIP_IMAGE_DIRS = ['icon/', 'thumb/', 'small/', 'medium/', 'large/'];

// Cache for blog excerpts (persists across page loads)
var blogExcerptCache = {};

//////////////////////////////////////////////////////////////////////////////////

/**
 * Extract URL parameter value by key
 * @param {string} key - The parameter name to look for
 * @returns {string|undefined} The parameter value or undefined if not found
 */
function param(key) {
	var params = window.location.href.replace(/.*\?/,'').split('&');

	for (var i=0; i<params.length; i++) {
		var x = params[i].split("=");
		if (x[0] == key) {return x[1]}
	}
}

/**
 * Filter pages array to get only actual page files (HTML/Markdown)
 * Also populates the layouts array as a side effect
 * @returns {Array} Array of page file paths (excludes directories and layouts)
 */
function findPages() {
	return $.grep(pages, function(n,i){
		// Collect layout files in separate array
		if (/\/layout\.html$/.test(n)) {layouts.push(n)}

		// Return only .html and .md files, excluding layouts
		return /\.(html|md)$/.test(n) && !/\/layout\.html$/.test(n);
	});
}

/**
 * Filter pages to get only menu items (pages in the menus/ directory)
 * @returns {Array} Array of menu page paths
 */
function findMenus(){
	return $.grep(pages, function(n,i){
		return /\/menus\/.+/.test(n) && !/\/layout\.html$/.test(n);
	});
}

/**
 * Get the index position of a menu item
 * @param {string} m - Menu page path
 * @returns {number} Index in menus array, or -1 if not found
 */
function menuIndex(m) {
	return menus.indexOf(m);
}

/**
 * Get the index position of a page in the menu_pages array
 * @param {string} m - Page path
 * @returns {number} Index in menu_pages array, or -1 if not found
 */
function mpIndex(m) {
	return menu_pages.indexOf(m);
}

/**
 * Check if both pages and images are loaded and theme is ready, then load the initial page
 * This ensures the images array is populated and theme is initialized before any page loads
 */
function checkAndLoadInitialPage() {
	// Only proceed when pages, images, and theme are all ready
	if (pages_count === 0 && images_count === 0 && theme_ready) {
		// Stuff to run after menu list is loaded.
		menus = findMenus().sort();
		makemenu();
		just_pages = findPages().sort();
		menu_pages = $.grep(just_pages, function(n,i){return /\/menus\/.+/.test(n)});

		// if there is a splash page then display
		if (pages.indexOf("./pages/splash.html") >= 0 && !param('page')) {
			$.get("./pages/splash.html",function(data){
				$(".container").before("<div id='splash' style='width:100%; position:absolute;'>"+data+"</div>");
			}).fail(function(jqXHR, textStatus, errorThrown) {
				console.error('Error loading splash page:', textStatus, errorThrown);
			});

			setTimeout(function(){
				$('#splash').fadeOut(2000);
				$('.container').fadeIn(1000);
			},ajaxcms_splash_time);

		} else {
			$('.container').fadeIn(1000)
		}

		// Load the page in the params if specified, first menu page otherwise.
		var p = param('page');
		if (p) {
			loadPage('./'+p, true);
			current_page = p;
		} else {
			current_page = menu_pages[0];
			// Store the URL of the current page in the history *** for some reason firefox needs this or it will break the splash animation.
			var new_url = base_url+'?page='+current_page.replace(/^\.\//,'');
			window.history.replaceState({page: new_url},'test',new_url);
			loadPage(current_page, false); // Load the first page (home page) on init.
		}
	}
}

/**
 * Recursively load all pages from a directory via JSON API
 * Populates the pages array and triggers initialization when complete
 * @param {string} url - Directory path to load (e.g., './pages')
 */
function load_pages(url) {
	url = url.replace(/\/$/,''); // Remove trailing slash for consistency
	pages_count++;

	// Fetch recursive directory listing as JSON from the server API
	$.getJSON('api/list-recursive?dir=' + encodeURIComponent(url), function(data) {
		// Add all files to pages array
		for (var i = 0; i < data.files.length; i++) {
			var filePath = url + '/' + data.files[i].path;
			pages.push(filePath);
		}

		// Also need to add directories for menu structure
		// Extract unique directory paths from file paths
		var dirs = {};
		for (var i = 0; i < data.files.length; i++) {
			var parts = data.files[i].path.split('/');
			for (var j = 0; j < parts.length - 1; j++) {
				var dirPath = parts.slice(0, j + 1).join('/') + '/';
				dirs[dirPath] = true;
			}
		}

		// Add directories to pages array
		for (var dir in dirs) {
			pages.push(url + '/' + dir);
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.error('Error loading pages from ' + url + ':', textStatus, errorThrown);
	}).then(function(){
		pages_count--;
		checkAndLoadInitialPage();
	});
}


/**
 * Recursively load all images from a directory via JSON API
 * Populates the images array, excluding special size variant directories
 * @param {string} url - Directory path to load (e.g., './images')
 */
function load_images(url) {
	url = url.replace(/\/$/,''); // Remove trailing slash for consistency
	images_count++;

	// Fetch recursive directory listing as JSON from the server API
	$.getJSON('api/list-recursive?dir=' + encodeURIComponent(url), function(data) {
		// Add all image files to images array
		for (var i = 0; i < data.files.length; i++) {
			var filePath = data.files[i].path;

			// Skip special directories (icon/, thumb/, small/, medium/, large/)
			if (SKIP_IMAGE_DIRS.some(function(dir) { return filePath.indexOf(dir) === 0; })) {
				continue;
			}

			images.push(url + '/' + filePath);
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.error('Error loading images from ' + url + ':', textStatus, errorThrown);
	}).then(function(){
		images_count--;
		checkAndLoadInitialPage();
	});
}

/**
 * Find the first image that matches the search term
 * @param {string} s - Search term (partial match, case insensitive)
 * @returns {string|undefined} Image URL or undefined if no match
 */
function imageMatch(s) {
	if (!s || s.trim() === '') {
		console.warn('imageMatch called with empty string');
		return '';
	}

	var re = new RegExp(s,"gi");
	for (var i=0; i<images.length; i++) {
		if (re.test(images[i])){return images[i]}
	}

	console.warn('Image not found:', s);
	return ''; // Return empty string instead of undefined
}

/**
 * Find all images that match the search term (supports wildcards)
 * @param {string} s - Search term with wildcards (* matches any characters)
 * @returns {Array} Array of matching image URLs
 */
function imageMatchMultiple(s) {
	if (!s || s.trim() === '') {
		console.warn('imageMatchMultiple called with empty string');
		return [];
	}

	// Convert wildcard pattern to regex
	// Escape special regex characters except *
	var pattern = s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
	// Convert * to .*
	pattern = pattern.replace(/\*/g, '.*');

	var re = new RegExp(pattern, "i");  // Removed global flag to avoid lastIndex issues
	var matches = [];

	for (var i=0; i<images.length; i++) {
		if (re.test(images[i])){
			matches.push(images[i]);
		}
	}

	if (matches.length === 0) {
		console.warn('No images found matching pattern:', s, '(regex:', pattern, ')');
		console.warn('Available images:', images.length > 0 ? images.slice(0, 5).join(', ') + '...' : 'none');
	}

	return matches;
}

/**
 * Find the best matching page for a search term
 * Best match is defined as the shortest filename (without path) that matches
 * @param {string} s - Search term (partial match, case insensitive)
 * @returns {string} Page URL or empty string if no match
 */
function pageMatch(s) {
	var best_match = "";
	var return_url = "";
	var re = new RegExp(s,"gi");

	for (var i=0; i<just_pages.length; i++) {
		// Test if search term matches this page path
		if (re.test(just_pages[i])){
			// Extract just the filename, strip numeric prefixes and extensions
			var page_name = just_pages[i].split('/').slice(-1)[0].replace(/^\d+\-/,'').replace(/\..*?$/,'');

			// Keep the shortest matching filename (most specific match)
			if ((page_name.length < best_match.length) || (best_match.length == 0)) {
				best_match = page_name;
				return_url = just_pages[i]
			}
		}
	}
	return return_url;
}

/**
 * Strip all <script> tags from HTML content
 * Used when inserting untrusted content via the {{insert}} helper
 * @param {string} text - HTML content to sanitize
 * @returns {string} HTML with all script tags removed
 */
function removeScripts(text) {
	return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"");
}

/**
 * Parse helper syntax and extract parts and attributes
 * Helpers use format: {{type | param1 | param2 | attr => value}}
 * @param {string} helperString - Full helper string including {{ }}
 * @returns {Object} Object with parts array, attributes string, and original pieces
 */
function parseHelper(helperString) {
	var pieces = helperString.replace(/{{/g,'').replace(/}}/g,'').split('|');
	var parts = [];
	var attributes = [];

	// separate parts and attributes
	for (var i=0; i<pieces.length; i++) {
		if (/=&gt;/.test(pieces[i])){
			attributes.push(pieces[i]);
		} else {
			parts.push(pieces[i]);
		}
	}

	// Convert attributes to string attr => value becomes attr='value'
	for (var i=0; i<attributes.length; i++){
		var apieces = attributes[i].split('=&gt;');
		attributes[i] = apieces[0].trim()+"=\""+apieces[1].trim()+"\"";
	}
	var attributes_string = attributes.join(" ");

	// Remove Blanks from parts
	for (var i=0; i < parts.length; i++) {
		parts[i] = parts[i].trim().toLowerCase();
	}

	return {
		parts: parts,
		attributes: attributes_string,
		pieces: pieces
	};
}

/**
 * Extract and process blog list from a directory
 * Blog posts must be named with date prefix: YYYY-MM-DD-Title.html
 * Shared helper used by both {{blog}} and {{bloglist}} helpers
 * @param {Array} parts - Parsed helper parts [type, directory, start, stop]
 * @returns {Array} Array of blog objects with {name, date, url} properties
 */
function processBlogList(parts) {
	// Find all pages in the specified directory that are HTML or Markdown
	var blog_list = $.grep(just_pages, function(n,i){
		return n.toLowerCase().indexOf(parts[1].toLowerCase()) > -1 && /\.(html|md)$/i.test(n);
	}).sort().reverse();  // Sort reverse chronologically (newest first)

	// Apply pagination if start and stop parameters provided
	var start;
	var stop;
	if (parts[2] != undefined) {start = parseInt(parts[2])}
	if (parts[3] != undefined) {stop = parseInt(parts[3])} else {stop = blog_list.length}
	if (parts.length > 2) {blog_list = blog_list.slice(start,stop);}

	// Parse blog filename to extract date and clean title
	for (var i=0; i< blog_list.length; i++) {
		var blog_name = blog_list[i].split("/").slice(-1)[0].replace(/\.html$|\.md$/gi,'').replace(/_/g," ");
		var blog_date_parts = /(\d+)-(\d+)-(\d+)(-(\d+)-)?/g.exec(blog_name);
		var blog_date;
		if (blog_date_parts != null) {
			// Parse YYYY-MM-DD date from filename
			blog_date = new Date(blog_date_parts.slice(1,4).join('/'))
			// Extract just the title (everything after date prefix)
			blog_name = blog_name.split('-').slice(-1)[0];
		}
		blog_list[i] = {name: blog_name, date: blog_date, url: blog_list[i]}
	}

	return blog_list;
}


/**
 * Process all helper syntax in page content
 * Converts {{helper}} tags to their HTML replacements
 * Supports: {{a}}, {{i}}, {{carousel}}, {{filelist}}, {{bloglist}}
 * @param {string} sdata - HTML content to process (optional, uses global data if undefined)
 * @returns {string} Processed HTML with helpers replaced
 */
function process_page(sdata) {
	var d;

	// If a string is passed in, process it; otherwise use global data variable
	if (sdata === undefined) {
		d = data;
	} else {
		d = sdata;
	}

	// Convert all {{helper}} tags - use non-greedy matching to handle multiple helpers
	d = d.replace(/{{.*?}}/gi, function myFunction(x){
		var parsed = parseHelper(x);
		var parts = parsed.parts;
		var attributes_string = parsed.attributes;
		var pieces = parsed.pieces;

		// Anchors
		if (parts[0]=='a' && parts.length == 2) {
			return "<a href=\"javascript:void(0);\" "+attributes_string+" onclick=\"loadPage(\'" + pageMatch(parts[1]) + "\'); return false;\">"+parts[1]+"</a>";
		}
		if (parts[0]=='a' && parts.length == 3) {
			return "<a href=\"javascript:void(0);\" "+attributes_string+" onclick=\"loadPage(\'" + pageMatch(parts[1]) + "\'); return false;\">"+parts[2]+"</a>";
		}
		if (parts[0]=='a' && parts.length == 4) {
			return "<a href=\"javascript:void(0);\" "+attributes_string+" onclick=\"loadPage(\'" + pageMatch(parts[1]) + "\'); return false;\" alt=\"" + parts[3] + "\">"+parts[2]+"</a>";
		}

		// Images
		if (parts[0]=='i' && parts.length == 2) {
			// Check for wildcard pattern
			if (parts[1].indexOf('*') !== -1) {
				// Wildcard pattern - create a gallery with all matching images
				var matchedImages = imageMatchMultiple(parts[1]);
				if (matchedImages.length === 0) {
					return "<p class=\"text-danger\">No images found matching pattern: " + parts[1] + "</p>";
				}

				// Default: 3 images per row (col-md-4 in Bootstrap's 12-column grid)
				var per_row = 3;
				var colClass = "col-md-4";

				// Build the gallery using Bootstrap grid
				var gallery = "<div class=\"row image-gallery\" "+attributes_string+">";
				for (var ii=0; ii < matchedImages.length; ii++) {
					// Extract filename for alt text
					var imgAlt = matchedImages[ii].split('/').pop().replace(/\.[^/.]+$/, '');
					gallery += "<div class=\""+colClass+" mb-3\">" +
								"<img src=\""+ matchedImages[ii] +"\" alt=\""+ imgAlt  +"\" class=\"img-fluid\" onclick=\"openLightbox('"+ matchedImages[ii] +"')\">" +
								"</div>";
				}
				gallery += "</div>";

				return gallery;
			}
			return "<img "+attributes_string+" src=\"" + imageMatch(parts[1]) + "\" alt=\"" + parts[1] + "\">";
		}
		if (parts[0]=='i' && parts.length == 3) {
			// Check for wildcard pattern
			if (parts[1].indexOf('*') !== -1) {
				// Wildcard pattern - create a gallery with all matching images
				var matchedImages = imageMatchMultiple(parts[1]);
				if (matchedImages.length === 0) {
					return "<p class=\"text-danger\">No images found matching pattern: " + parts[1] + "</p>";
				}

				// Second parameter could be alt text OR per_row number
				var per_row = 3;
				var colClass = "col-md-4";
				var useCustomAlt = true;

				// Check if parts[2] is a number (per_row) or text (alt)
				if (!isNaN(parts[2]) && parts[2].trim() !== '') {
					per_row = parseInt(parts[2]);
					useCustomAlt = false;
					// Calculate Bootstrap column class based on per_row
					// Bootstrap uses 12-column grid, so col size = 12 / per_row
					var colSize = Math.floor(12 / per_row);
					colClass = "col-md-" + colSize;
				}

				// Build the gallery using Bootstrap grid
				var gallery = "<div class=\"row image-gallery\" "+attributes_string+">";
				for (var ii=0; ii < matchedImages.length; ii++) {
					// Use custom alt text if provided and not a number, otherwise use filename
					var imgAlt;
					if (useCustomAlt) {
						imgAlt = parts[2];
					} else {
						imgAlt = matchedImages[ii].split('/').pop().replace(/\.[^/.]+$/, '');
					}
					gallery += "<div class=\""+colClass+" mb-3\">" +
								"<img src=\""+ matchedImages[ii] +"\" alt=\""+ imgAlt  +"\" class=\"img-fluid\" onclick=\"openLightbox('"+ matchedImages[ii] +"')\">" +
								"</div>";
				}
				gallery += "</div>";

				return gallery;
			}
			return "<img "+attributes_string+" src=\"" + imageMatch(parts[1]) + "\" alt=\"" + parts[2] + "\">";
		}
		if (parts[0]=='i' && parts.length == 4) {
			// Check for wildcard pattern
			if (parts[1].indexOf('*') !== -1) {
				// Wildcard pattern - create a gallery with all matching images
				// {{i | pattern | alt_text | per_row}}
				var matchedImages = imageMatchMultiple(parts[1]);
				if (matchedImages.length === 0) {
					return "<p class=\"text-danger\">No images found matching pattern: " + parts[1] + "</p>";
				}

				var per_row = 3;
				var colClass = "col-md-4";

				// Fourth parameter is per_row
				if (!isNaN(parts[3]) && parts[3].trim() !== '') {
					per_row = parseInt(parts[3]);
					var colSize = Math.floor(12 / per_row);
					colClass = "col-md-" + colSize;
				}

				// Build the gallery using Bootstrap grid
				var gallery = "<div class=\"row image-gallery\" "+attributes_string+">";
				for (var ii=0; ii < matchedImages.length; ii++) {
					gallery += "<div class=\""+colClass+" mb-3\">" +
								"<img src=\""+ matchedImages[ii] +"\" alt=\""+ parts[2]  +"\" class=\"img-fluid\" onclick=\"openLightbox('"+ matchedImages[ii] +"')\">" +
								"</div>";
				}
				gallery += "</div>";

				return gallery;
			}
			return "<img "+attributes_string+" src=\"" + imageMatch(parts[1]) + "\" alt=\"" + parts[2] + "\">";
		}

		// Carousel {{ carousel:speed | image1:alt1:caption1 | image2:alt2:caption2 | image3:alt3:caption3 }}
		if (parts[0].includes('carousel') && parts.length >= 2) {
			var idn = Math.floor(Math.random() * 9999999999);
			var carousel_images = parts.slice(1);
			var carousel_speed = 5000;
			if (parts[0].split(':').length == 2) {carousel_speed = parseInt(parts[0].split(':')[1])}

			// Expand any wildcard patterns into individual images
			var expanded_images = [];
			for (var ii=0; ii < carousel_images.length; ii++) {
				var image_parts = carousel_images[ii].split(':');
				var slide_image = image_parts.length > 0 ? image_parts[0] : "";
				var slide_alt = image_parts.length > 1 ? image_parts[1] : "";
				var slide_caption = image_parts.length > 2 ? image_parts[2] : "";

				// Check if this is a wildcard pattern
				if (slide_image.indexOf('*') !== -1) {
					var matchedImages = imageMatchMultiple(slide_image);
					// Add each matched image with the same alt and caption
					for (var jj=0; jj < matchedImages.length; jj++) {
						// If no alt provided, use filename
						var img_alt = slide_alt || matchedImages[jj].split('/').pop().replace(/\.[^/.]+$/, '');
						expanded_images.push({
							image: matchedImages[jj],
							alt: img_alt,
							caption: slide_caption
						});
					}
				} else {
					// Regular image (not a wildcard)
					expanded_images.push({
						image: imageMatch(slide_image),
						alt: slide_alt,
						caption: slide_caption
					});
				}
			}

			// Build the repeating parts of the carousel
			var carousel_indicators = "";
			var slides = "";
			for (var ii=0; ii < expanded_images.length; ii++) {
				carousel_indicators += "<button type=\"button\" data-bs-target=\"#carousel_"+idn+"\" data-bs-slide-to=\""+ii+"\" class=\""+ (ii==0 ? 'active' : '') +"\" aria-current=\""+(ii==0 ? 'true' : 'false')+"\" aria-label=\"Slide "+(ii+1)+"\"></button>";

				slides += 	"<div class=\"carousel-item "+ (ii==0 ? 'active' : '') +"\">" +
							"<img src=\""+ expanded_images[ii].image +"\" alt=\""+ expanded_images[ii].alt  +"\" class=\"d-block w-100\">" +
							"<div class=\"carousel-caption\">"+expanded_images[ii].caption+"</div></div>";
			}

			// Wait a second then start the carousel - use IIFE to capture variables
			(function(carouselId, speed){
				setTimeout(function(){
					var carouselElement = document.getElementById(carouselId);
					if (carouselElement) {
						if (typeof bootstrap !== "undefined") {
							try {
								var carousel = new bootstrap.Carousel(carouselElement, {
									interval: speed,
									wrap: true,
									touch: true
								});
								carousel.cycle();
							} catch(e) {
								console.error("Error creating carousel:", e);
							}
						} else {
							console.error("Bootstrap is not defined!");
						}
					}
				}, CAROUSEL_INIT_DELAY);
			})("carousel_"+idn, carousel_speed);

			// Extract class from attributes and merge with carousel classes
			var carousel_class = "carousel slide";
			var class_match = attributes_string.match(/class="([^"]*)"/);
			if (class_match) {
				carousel_class = "carousel slide " + class_match[1];
				attributes_string = attributes_string.replace(/class="[^"]*"\s*/, '');
			}

			// Return the Carousel
			return 	"<div "+attributes_string+" id=\"carousel_"+idn+"\" class=\""+carousel_class+"\" data-bs-ride=\"carousel\" data-bs-interval=\""+carousel_speed+"\">" +
					"<div class=\"carousel-indicators\">"+carousel_indicators+"</div>" +
					"<div class=\"carousel-inner\">" + slides + "</div>" +
					"<button class=\"carousel-control-prev\" type=\"button\" data-bs-target=\"#carousel_"+idn+"\" data-bs-slide=\"prev\">" +
					"<span class=\"carousel-control-prev-icon\" aria-hidden=\"true\"></span><span class=\"visually-hidden\">Previous</span></button>" +
					"<button class=\"carousel-control-next\" type=\"button\" data-bs-target=\"#carousel_"+idn+"\" data-bs-slide=\"next\">" +
					"<span class=\"carousel-control-next-icon\" aria-hidden=\"true\"></span><span class=\"visually-hidden\">Next</span></button>" +
					"</div>"
		}

		// {{filelist | directory}}
		if (parts[0] == 'filelist' && parts.length == 2) {
			var list =  $.grep(pages, function(n,i){
				return (n.indexOf(parts[1]) > -1) && (!/\/layout\.html$/.test(n));
			}).sort();
			list.shift(); // Don't show the first directory.

			// Convert the list to a hash with the name and the url
			for (var i = 0; i < list.length; i++) {
				var fname = list[i].replace(/\/$/,'')
				fname = fname.split("/")[fname.split("/").length-1];
				fname = fname.replace(/\.md$|\.html$/,'').replace(/^\//,'').replace(/\/$/,'');
				fname = fname.replace(/\d+-/,'');
				fname = fname.replace(/_/g,' ')
				list[i] = {name: fname,url: list[i].replace(/\/$/,'')}
			}

			// Remove any empty strings that are left in the list
			list = $.grep(list, function(n,i){return n.name != ""});

			var rootList = $("<ul>")
		    var elements = {};
		    $.each(list, function() {
		        var parent = elements[this.url.substr(0, this.url.lastIndexOf("/"))];
		        var list = parent ? parent.children("ul") : rootList;
		        if (!list.length) {
		            list = $("<ul>").appendTo(parent);
		        }
		        var item = $("<li>").appendTo(list);
		        if (!/\.html|\.md/.test(this.url)) {
		        	$("<a>").attr("href", "javascript:void(0);").attr('class','folder').text(this.name).appendTo(item);
		        } else {
		        	$("<a>").attr("href", "javascript:void(0);").attr("onclick", "loadPage(\""+this.url+"\"); return false;").attr('class','file').text(this.name).appendTo(item);
		        }
		        elements[this.url] = item;
		    });

			return "<ul "+attributes_string+" class=\"filelist\">" + rootList.html() + "</ul>";
		}

		// {{bloglist | directory | start | stop }}
		if (parts[0] == 'bloglist' && parts.length > 1) {
			var blog_list = processBlogList(parts);

			// Make a li for each blog entry
			var output = "";
			for (var i=0; i < blog_list.length; i++){
				output += "<li class=\"blog_entry\"><a href=\"javascript:void(0);\" onclick=\"loadPage('"+blog_list[i].url+"'); return false;\">" + blog_list[i].name + "</a></li>"
			}

			// Output all the blog entries wrapped in a div and then use javascript to load the contgents of each.
			return "<ul "+attributes_string+" class=\"blog_list\">"+output+"</ul>"
		}

		// If all else fails return the original tag.
		return "{{"+pieces.join("|")+"}}"
	});

	return d
}

/**
 * Pre-process helpers that generate other helpers
 * Must run before process_page() to handle nested helper generation
 * Currently only processes the {{blog}} helper which generates {{insert}} helpers
 * @param {string} sdata - HTML content to process (optional, uses global data if undefined)
 * @returns {string} Processed HTML with meta-helpers expanded
 */
function pre_process_page(sdata) {
	var d;

	// If a string is passed in, process it; otherwise use global data variable
	if (sdata === undefined) {
		d = data;
	} else {
		d = sdata;
	}

	// Convert meta-helpers that generate other helpers - use non-greedy matching
	d = d.replace(/{{.*?}}/gi, function myFunction(x){
		var original = x;
		var parsed = parseHelper(x);
		var parts = parsed.parts;
		var attributes_string = parsed.attributes;

		// {{blog | directory | start | stop }}
		if (parts[0] == 'blog' && parts.length > 1) {
			var allBlogPosts = processBlogList([parts[0], parts[1]]); // Get all posts for pagination
			var blog_list = processBlogList(parts); // Get current page of posts

			// Extract pagination parameters
			var start = parts[2] !== undefined ? parseInt(parts[2]) : 0;
			var stop = parts[3] !== undefined ? parseInt(parts[3]) : allBlogPosts.length;
			var postsPerPage = stop - start;
			var totalPosts = allBlogPosts.length;

			// Generate HTML for ALL blog entries (hidden by default)
			var output = "";
			for (var i=0; i < allBlogPosts.length; i++){
				var entryId = 'blog_entry_' + i;
				var isVisible = (i >= start && i < stop);
				output += "<div class='blog_entry' id='"+entryId+"' data-url='"+allBlogPosts[i].url+"' data-page-index='"+i+"' style='display: "+(isVisible ? 'block' : 'none')+"'>"
				output += "<h1 onclick=\"toggleBlogEntry('"+entryId+"'); return false;\" style=\"cursor: pointer;\">"+allBlogPosts[i].name+"</h1>"
				output += "<time>"+allBlogPosts[i].date.toLocaleDateString()+"</time>"
				output += "<div class='blog_excerpt' onclick=\"toggleBlogEntry('"+entryId+"'); return false;\" style=\"cursor: pointer;\">"
				output += "<p class='excerpt_text'>Loading excerpt...</p>"
				output += "<a href='javascript:void(0);' class='read_more'>Read more...</a>"
				output += "</div>"
				output += "<div class='blog_content' style='display: none;'>\n{{insert | "+allBlogPosts[i].url+" | false}}\n"
				output += "<a href='javascript:void(0);' class='read_less' onclick=\"toggleBlogEntry('"+entryId+"'); return false;\">Show less</a>"
				output += "</div></div>"
			}

			// Add pagination controls if there are multiple pages
			if (totalPosts > postsPerPage) {
				output += "<div class='blog_pagination'>";

				// Previous button
				if (start > 0) {
					var prevStart = Math.max(0, start - postsPerPage);
					var prevStop = start;
					output += "<button class='blog_page_btn blog_prev' onclick=\"updateBlogPage("+prevStart+", "+prevStop+", "+postsPerPage+"); return false;\">← Previous</button>";
				} else {
					output += "<button class='blog_page_btn blog_prev' disabled>← Previous</button>";
				}

				// Page info
				var currentPage = Math.floor(start / postsPerPage) + 1;
				var totalPages = Math.ceil(totalPosts / postsPerPage);
				output += "<span class='blog_page_info'>Page " + currentPage + " of " + totalPages + "</span>";

				// Next button
				if (stop < totalPosts) {
					var nextStart = stop;
					var nextStop = Math.min(totalPosts, stop + postsPerPage);
					output += "<button class='blog_page_btn blog_next' onclick=\"updateBlogPage("+nextStart+", "+nextStop+", "+postsPerPage+"); return false;\">Next →</button>";
				} else {
					output += "<button class='blog_page_btn blog_next' disabled>Next →</button>";
				}

				output += "</div>";
			}

			return "<div "+attributes_string+" class='blog' data-total-posts='"+totalPosts+"' data-posts-per-page='"+postsPerPage+"'>\n"+output+"</div>"
		}

		// If all else fails return the original tag.
		return original

	});

	return d
}

/**
 * Find the appropriate layout template for a file
 * Searches up the directory tree for the nearest layout.html
 * @param {string} filename - Full path to the file
 * @returns {string} Path to the nearest layout.html file
 */
function lastLayout(filename) {
	var pieces = filename.split("/")

	// Walk up the directory tree looking for layout.html
	for (var i=1; i < pieces.length; i++) {
		var name = pieces.slice(0,pieces.length-i).concat(["layout.html"]).join("/")
		if ($.inArray(name, layouts) > -1) { return name }
	}

	// Fallback: return expected layout path even if not found
	return pieces.slice(0,-1).concat(["layout.html"]).join("/")
}

/**
 * Load and insert content from another page
 * Used by the {{insert}} helper to embed one page within another
 * @param {string} fname - Path to file to insert
 * @param {string} insert_location - Original helper string to replace
 * @param {boolean} allow_scripts - Whether to allow <script> tags (default: true)
 * @param {Function} callback - Function to call when insert is complete
 */
function loadInsert(fname,insert_location,allow_scripts,callback) {

	$.get(fname,function(insert_contents){
		var layout_url = lastLayout(fname);

		// Use GLOBAL protection arrays so all protections are restored together at the end
		// Protect triple-backtick code blocks BEFORE markdown processing
		insert_contents = insert_contents.replace(/^```[^\n]*$\n([\s\S]*?)^```$/gm, function(fullMatch, content) {
			var index = globalProtectedCodeBlocks.length;
			globalProtectedCodeBlocks.push(fullMatch);
			return '___PROTECTED_CODE_BLOCK_' + index + '___';
		});

		// Protect inline code (single backticks)
		insert_contents = insert_contents.replace(/`[^`\n]+`/g, function(match) {
			var index = globalProtectedCodeBlocks.length;
			globalProtectedCodeBlocks.push(match);
			return '___PROTECTED_CODE_BLOCK_' + index + '___';
		});

		// Protect 5-space helpers (legacy)
		insert_contents = insert_contents.replace(/{{[^}]*\s\s\s\s\s[^}]*}}/g, function(match) {
			var index = globalProtectedHelpers.length;
			globalProtectedHelpers.push(match);
			return '___PROTECTED_HELPER_' + index + '___';
		});

		// Check if layout exists before requesting it to avoid 404 errors
		if ($.inArray(layout_url, layouts) > -1) {
			// Layout exists, load it
			$.get( layout_url )
				.fail(function(jqXHR, textStatus, errorThrown) {
					console.error('Error loading insert layout ' + layout_url + ':', textStatus, errorThrown);
				})
				.always(function( layout ) {

					// Restore protected code blocks so markdown can process them
					insert_contents = insert_contents.replace(/___PROTECTED_CODE_BLOCK_(\d+)___/g, function(match, index) {
						return globalProtectedCodeBlocks[parseInt(index)];
					});

					// Run through markdown if the file ends in .md
					if (/\.md$/.test(fname)){ insert_contents = marked.parse(insert_contents);	}

					// Protect <code> and <pre> tags after markdown processing
					// First protect <pre> blocks (which may contain <code> tags)
					insert_contents = insert_contents.replace(/<pre>[\s\S]*?<\/pre>/gi, function(match) {
						var index = globalProtectedCodeBlocks.length;
						globalProtectedCodeBlocks.push(match);
						return '___PROTECTED_CODE_BLOCK_' + index + '___';
					});
					// Then protect standalone <code> tags
					insert_contents = insert_contents.replace(/<code>[\s\S]*?<\/code>/gi, function(match) {
						var index = globalProtectedCodeBlocks.length;
						globalProtectedCodeBlocks.push(match);
						return '___PROTECTED_CODE_BLOCK_' + index + '___';
					});

					// NOTE: Do NOT restore protected content here!
					// It will be restored at the END of processPageContent() after all helpers are processed

					// If there is a layout then insert the data into the layout
					if (typeof(layout) != "object") {
						insert_contents = layout.replace(/{{content}}/gi, function myFunction(x){
							return insert_contents;
						});
					}

					// Strip the scripts if specified
					if (!allow_scripts) {insert_contents = removeScripts(insert_contents);}

					// Insert the contents of each file into data -- invalidate insertion patterns in content of replacement file until async is done.
					data = data.replace(insert_location,insert_contents.replace(/{{/,'@@@@@').replace(/}}/,'#####'))

					// Run Callback if it exists
					if (callback && typeof(callback) === "function") {callback();}
				});
		} else {
			// No layout, use content directly
			// Restore protected code blocks so markdown can process them
			insert_contents = insert_contents.replace(/___PROTECTED_CODE_BLOCK_(\d+)___/g, function(match, index) {
				return globalProtectedCodeBlocks[parseInt(index)];
			});

			// Run through markdown if the file ends in .md
			if (/\.md$/.test(fname)){ insert_contents = marked.parse(insert_contents);	}

			// Protect <code> and <pre> tags after markdown processing
			// First protect <pre> blocks (which may contain <code> tags)
			insert_contents = insert_contents.replace(/<pre>[\s\S]*?<\/pre>/gi, function(match) {
				var index = globalProtectedCodeBlocks.length;
				globalProtectedCodeBlocks.push(match);
				return '___PROTECTED_CODE_BLOCK_' + index + '___';
			});
			// Then protect standalone <code> tags
			insert_contents = insert_contents.replace(/<code>[\s\S]*?<\/code>/gi, function(match) {
				var index = globalProtectedCodeBlocks.length;
				globalProtectedCodeBlocks.push(match);
				return '___PROTECTED_CODE_BLOCK_' + index + '___';
			});

			// NOTE: Do NOT restore protected content here!
			// It will be restored at the END of processPageContent() after all helpers are processed

			// Strip the scripts if specified
			if (!allow_scripts) {insert_contents = removeScripts(insert_contents);}

			// Insert the contents of each file into data -- invalidate insertion patterns in content of replacement file until async is done.
			data = data.replace(insert_location,insert_contents.replace(/{{/,'@@@@@').replace(/}}/,'#####'))

			// Run Callback if it exists
			if (callback && typeof(callback) === "function") {callback();}
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.error('Error loading insert ' + fname + ':', textStatus, errorThrown);
		// Call callback even on failure to prevent hanging
		if (callback && typeof(callback) === "function") {callback();}
	});
};

/**
 * Recursively process all {{insert}} helpers in the global data variable
 * Inserts can contain other inserts, so this function calls itself recursively
 * @param {Function} callback - Function to call when all inserts are complete
 */
function processInserts(callback) {
	// Find all {{insert}} helpers (allow up to 4 spaces for documentation)
	var insert_list = data.match(/{{\s{0,4}insert.*?}}/gi);

	// Filter out helpers with 5+ consecutive spaces (documentation examples)
	if (insert_list) {
		insert_list = insert_list.filter(function(helper) {
			return !/\s\s\s\s\s/.test(helper);
		});
	}

	// If no inserts found, we're done
	if (insert_list == null || insert_list.length === 0) {
		callback();
		return;
	}
	var rcount = insert_list.length;

	// Load all the files in the insert list
	for (var i=0; i < insert_list.length; i++) {
		var pageName = insert_list[i].replace(/[{}\s]/g,'').split("|")[1];

		// Skip invalid inserts (no page name specified)
		if (!pageName || pageName.trim() === '') {
			console.warn('Skipping invalid insert (no page name):', insert_list[i]);
			rcount--;
			if (rcount == 0 && callback && typeof(callback) === "function") {
				callback();
			}
			continue;
		}

		var fname = pageMatch(pageName);

		var scripts = insert_list[i].replace(/[{}\s]/g,'').split("|")[2];
		if (scripts === undefined || scripts.trim() == 'true') {var allow_scripts = true}

		loadInsert(fname, insert_list[i], allow_scripts, function(){
			rcount--;

			// Run Callback if it exists
			if (rcount == 0 && callback && typeof(callback) === "function") {
				data = data.replace(/@@@@@/,'{{').replace(/#####/,'}}');

				// If there are more inserts in the new version then recurse.
				var more_inserts = data.match(/{{\s*insert.*?}}/gi);
				if (more_inserts) {
					processInserts(function(){
						callback();
					})
				} else {
					callback();
				}
			}
		});
	}
}

/**
 * Process and render page content after loading
 * Handles all content transformation steps and page transitions
 * Extracted to eliminate duplication in loadPage() function
 * @param {string} contentData - Raw page content (possibly with layout applied)
 * @param {string} url - Page URL
 * @param {Function} callback - Callback with save property indicating whether to save to history
 */
// Global array for code block protection (shared across processPageContent scope)
var globalProtectedCodeBlocks = [];

function processPageContent(contentData, url, callback) {
	// Step 0.5: Protect markdown code blocks BEFORE any helper processing
	// This prevents {{blog}}, {{bloglist}}, etc. in documentation from being processed
	globalProtectedCodeBlocks = [];

	data = contentData;

	// Protect triple-backtick code blocks
	// Match: newline, ```, optional language, newline, content, newline, ```, newline
	// The key is using multiline mode and ensuring ``` is on its own line
	data = data.replace(/^```[^\n]*$\n([\s\S]*?)^```$/gm, function(fullMatch, content) {
		var index = globalProtectedCodeBlocks.length;
		var codeBlock = fullMatch;
		globalProtectedCodeBlocks.push(codeBlock);
		return '___PROTECTED_CODE_BLOCK_' + index + '___';
	});

	// Protect inline code (single backticks)
	data = data.replace(/`[^`\n]+`/g, function(match) {
		var index = globalProtectedCodeBlocks.length;
		globalProtectedCodeBlocks.push(match);
		return '___PROTECTED_CODE_BLOCK_' + index + '___';
	});

	// Step 1: Process meta-helpers FIRST ({{blog}}, {{bloglist}})
	// These generate content that needs to be present before Markdown conversion
	data = pre_process_page(data);

	// Step 2: Convert Markdown to HTML
	// Match .md files, ignoring any hash fragments (#...)
	if (/\.md($|#)/.test(url)) {
		// Temporarily restore code blocks so markdown can process them
		data = data.replace(/___PROTECTED_CODE_BLOCK_(\d+)___/g, function(match, index) {
			return globalProtectedCodeBlocks[parseInt(index)];
		});
		globalProtectedCodeBlocks = [];

		data = marked.parse(data);

		// Re-protect code blocks after markdown processing
		data = data.replace(/<pre>[\s\S]*?<\/pre>/gi, function(match) {
			var index = globalProtectedCodeBlocks.length;
			globalProtectedCodeBlocks.push(match);
			return '___PROTECTED_CODE_BLOCK_' + index + '___';
		});
		data = data.replace(/<code>[\s\S]*?<\/code>/gi, function(match) {
			var index = globalProtectedCodeBlocks.length;
			globalProtectedCodeBlocks.push(match);
			return '___PROTECTED_CODE_BLOCK_' + index + '___';
		});
	}

	// Step 3: Recursively process all {{insert}} helpers
	processInserts(function(){
		// Step 4: Process remaining helpers ({{a}}, {{i}}, {{carousel}}, etc.)
		data = process_page();

		// Step 5: Restore protected code blocks AFTER all processing
		data = data.replace(/___PROTECTED_CODE_BLOCK_(\d+)___/g, function(match, index) {
			return globalProtectedCodeBlocks[parseInt(index)];
		});

		// Step 6: Render with appropriate page transition animation
		switch(load_transition) {
			case 'basic':
				loadPageBasic(data, url)
				break;
			case 'slide':
				loadPageSlide(data, url);
				break;
			default:
				loadPageBasic(data, url);
		}

		// Step 6: Update browser history (if save is true or undefined)
		var save = callback.save;
		if (save == undefined || save == true) {
			var new_url = base_url+'?page='+url.replace(/^\.\//,'');
			window.history.pushState({page: new_url},'test',new_url);
		}

		// Step 7: Update body ID for page-specific CSS
		var ajaxcms_page_id = url.replace(/[\s\/\.]/g,'_')
		$('body').attr("id", ajaxcms_page_id);

		// Step 8: Track page view in Google Analytics (if initialized)
		if (typeof ga === 'function') {
			ga('send', 'pageview', location.href);
		}

		// Step 9: Initialize blog excerpts if this page has blog entries
		// Use setTimeout to ensure DOM is fully updated AND slide transition is complete
		// Wait for TRANSITION_DURATION + 50ms buffer to ensure content is in final position
		setTimeout(function() {
			if (document.querySelector('.blog_entry')) {
				initializeBlogExcerpts();
			}
		}, TRANSITION_DURATION + 50);

		// Call completion callback if provided
		if (callback && typeof(callback) === "function") {
			callback();
		}
	});
}

/**
 * Basic page transition - instant replacement
 * @param {string} data - Processed HTML content
 * @param {string} url - Page URL (unused but kept for consistency)
 */
function loadPageBasic(data,url) {
	$("main").html( data );
}

/**
 * Slide page transition - animated directional slides
 * Determines slide direction based on menu position (forward/back) or fades for non-menu pages
 * Uses two content divs (#a and #b) that swap with jQuery UI effects
 * @param {string} data - Processed HTML content
 * @param {string} url - Page URL to determine transition direction
 */
function loadPageSlide(data,url) {
	in_transition = true;

	if (menuIndex(url) > menuIndex(current_page)) {
		// Moving forward in menu - slide left to right
		$("#b").html( data )
		$("#a").hide("slide", { direction: "left"}, TRANSITION_DURATION);
		$("#b").show("slide", { direction: "right", complete: function(){
			in_transition = false;
			current_page = url;
			$("#a").html($('#b').html());
			$("#a").show();
			$("#b").hide();
		}}, TRANSITION_DURATION);
	} else if (menuIndex(url) < menuIndex(current_page) && menuIndex(url) != -1) {
		// Moving backward in menu - slide right to left
		$("#b").html( data )
		$("#a").hide("slide", { direction: "right"}, TRANSITION_DURATION);
		$("#b").show("slide", { direction: "left", complete: function(){
			in_transition = false;
			current_page = url;
			$("#a").html($('#b').html());
			$("#a").show();
			$("#b").hide();
		}}, TRANSITION_DURATION);
	} else {
		// Non-sequential or non-menu page - use fade transition
		$("#a").hide("fade", { }, TRANSITION_DURATION);
		$("#b").show("fade", { complete: function(){
			  $("#b").html( data )
			  in_transition = false;
			  current_page = url;
			  $("#a").html($('#b').html());
			  $("#a").show();
			  $("#b").hide();
		}}, TRANSITION_DURATION);
	}

}


/**
 * Load and display a page with optional layout and content processing
 * Main entry point for all page navigation
 * @param {string} url - Page URL to load
 * @param {boolean} save - Whether to save this navigation to browser history
 */
function loadPage(url, save) {
	// Prevent loading undefined or invalid pages
	if (!url || url === 'undefined' || url === 'null') {
		console.error('Invalid URL:', url);
		return;
	}

	highlightMenu(url);

	$.get(url, function(d) {
		var layout_url = lastLayout(url);

		// Check if layout exists before requesting it to avoid 404 errors
		if ($.inArray(layout_url, layouts) > -1) {
			// Layout exists, load it
			$.get(layout_url)
				.fail(function(jqXHR, textStatus, errorThrown) {
					console.error('Error loading layout ' + layout_url + ':', textStatus, errorThrown);
				})
				.always(function(layout) {
					var contentData;

					// If there is a layout then insert the data into the layout
					if (typeof(layout) != "object") {
						contentData = layout.replace(/{{content}}/gi, function myFunction(x){
							if (/\.md/.test(url)){ d = marked.parse(d); }
							return d;
						});
					} else {
						contentData = d;
					}

					// Process the page content
					var callbackObj = function() {};
					callbackObj.save = save;
					processPageContent(contentData, url, callbackObj);
				});
		} else {
			// No layout, process content directly
			var callbackObj = function() {};
			callbackObj.save = save;
			processPageContent(d, url, callbackObj);
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.error('Error loading page ' + url + ':', textStatus, errorThrown);
	});
}

/**
 * Convert a file path to a valid CSS class name
 * Replaces special characters (/, \, ., spaces) with hyphens
 * @param {string} n - File path
 * @returns {string} CSS-safe class name
 */
function fileToClass(n){
	return n.replace(/\/$/,'').replace(/[\.|\\|\/|\s]/g,'-');
}

/**
 * Highlight the active menu item for the current page
 * Adds 'active' class to the appropriate menu li element
 * @param {string} fn - Full file path of current page
 */
function highlightMenu(fn) {
	var c = fn;
	// Truncate to first 4 path segments for menu matching
	if (fn.split('/').length > 4){ c = fn.split('/').slice(0,4).join('/');}

    c = fileToClass(c);
	$('#menu li').removeClass('active');
	$('.'+c).addClass('active');
}

/**
 * Build the navigation menu from the menus array
 * Creates Bootstrap navbar with dropdown support (max 2 levels deep)
 * Menu structure is determined by files in pages/menus/ directory
 */
function makemenu() {
    $.each(menus, function(index,file){
    	if (file.split("/").length < 6) { // Only go two levels deep in the menu structure.

	    	var filename = file;
	    	filename = filename.replace(/\.\/pages\/menus\//,'');   // Remove ./pages from beginning
	    	filename = filename.replace(/\d+\-/,'');       			// Remove any digits followed by a dash at the beginning (use for sort)
	    	filename = filename.replace(/\.html$/,'');     			// Remove .html from end.
	    	filename = filename.replace(/\.md$/,''); 				// Remove .md from end.
	    	filename = filename.replace(/_/g,' ');					// Replace underscores with spaces.

	    	var classname = fileToClass(file);

	    	if (/\/$/.test(filename)) {
	    		// It is a directory
	    		$('#menu').append(
	    			'<li class="nav-item dropdown '+classname+'"><a href="javascript:void(0);" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" role="button" aria-expanded="false">'
	    			+ filename.replace(/\/$/,'')
	    			+ '</a><ul class="dropdown-menu" id="'+filename+'"></ul></li>'
	    		);
	    	} else {
	    		// It is a file
	    		var parts = filename.split('/');
	    		if (parts.length > 1) {
	    			$('#'+parts[0]+'\\\/').append('<li class="file '+classname+'"><a href="javascript:void(0);" onclick="loadPage(\''+file.replace(/\//g,'\\\/')+'\'); return false;">'+parts[1].replace(/\d+\-/,'')+'</a></li>');
	    		} else {
					$('#menu').append('<li class="nav-item '+classname+'"><a class="nav-link" href="javascript:void(0);" onclick="loadPage(\''+file.replace(/\//g,'\\\/')+'\'); return false;">'+filename+'</a></li>');
	    		}
	    	}
    	}
	});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  EVENT HANDLERS & INITIALIZATION
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Document ready handler - initializes the CMS
 * Sets up event handlers for navigation, swipe gestures, keyboard shortcuts, and browser back button
 */
$( document ).ready(function() {

	// Load directory listings from the server
	load_images('./images');
	load_pages('./pages');

	// Set a fallback timeout in case theme never signals ready
	// This prevents the site from being stuck if a theme doesn't call themeReady()
	setTimeout(function() {
		if (!theme_ready) {
			console.warn('Theme did not signal ready within 2 seconds, proceeding anyway');
			themeReady();
		}
	}, 2000);

    // Navigate to home page when clicking the site logo/brand
    $('.navbar-brand').click(function(e){
    	e.preventDefault();
    	current_page = menu_pages[0];
		loadPage(current_page, true);
		return false;
    });

    // Swipe gesture navigation - only enable on touch-enabled devices
	var isTouchDevice = ('ontouchstart' in window) ||
	                    (navigator.maxTouchPoints > 0) ||
	                    (navigator.msMaxTouchPoints > 0);

	if (isTouchDevice) {
		$("#a").on("swiperight",function(event){
			// Swipe right = go to previous page
			var currentIndex = mpIndex(current_page);
			if (currentIndex > 0 && !in_transition){
				var nextPage = menu_pages[currentIndex - 1];
				if (nextPage) {
					loadPage(nextPage, true);
				}
			}
		});
		$("#a").on("swipeleft",function(event){
			// Swipe left = go to next page
			var currentIndex = mpIndex(current_page);
			if (currentIndex >= 0 && currentIndex < menu_pages.length - 1 && !in_transition){
				var nextPage = menu_pages[currentIndex + 1];
				if (nextPage) {
					loadPage(nextPage, true);
				}
			}
		});
	}

	// Browser back/forward button support
	$(window).on("popstate", function(e) {
		var page = e.originalEvent.state.page
	    // Extract page path from URL and load without adding to history
	    loadPage('./' + /(.*)\?page\=(.*)/.exec(page)[2],false);
	});

	// Keyboard navigation with arrow keys
	$(function(){
    	$('html').keydown(function(e){

	        // Right arrow key = next page
	        if (e.keyCode == 39 && !in_transition) {
	        	var currentIndex = mpIndex(current_page);
	        	if (currentIndex >= 0 && currentIndex < menu_pages.length - 1){
	        		var nextPage = menu_pages[currentIndex + 1];
	        		if (nextPage) {
						loadPage(nextPage, true);
					}
	        	}
			}

	        // Left arrow key = previous page
	        if (e.keyCode == 37 && !in_transition) {
	        	var currentIndex = mpIndex(current_page);
	        	if (currentIndex > 0){
	        		var nextPage = menu_pages[currentIndex - 1];
	        		if (nextPage) {
						loadPage(nextPage, true);
					}
	        	}
			}
	    });

	});

	// Fix for mobile: prevent background glitches when address bar shows/hides
	// Add extra height to ensure background covers viewport changes
	$('#background').height(jQuery(window).height() + BACKGROUND_HEIGHT_OFFSET);
	window.onresize = function(){
		$('#background').height(jQuery(window).height() + BACKGROUND_HEIGHT_OFFSET);
	};
});

/**
 * Toggle blog entry between excerpt and full content
 * @param {string} entryId - ID of the blog entry div
 */
function toggleBlogEntry(entryId) {
	var entry = document.getElementById(entryId);
	if (!entry) return;

	var excerpt = entry.querySelector('.blog_excerpt');
	var content = entry.querySelector('.blog_content');

	if (content.style.display === 'none') {
		// Expanding - show full content
		excerpt.style.display = 'none';
		content.style.display = 'block';
	} else {
		// Collapsing - show excerpt
		content.style.display = 'none';
		excerpt.style.display = 'block';
	}
}

/**
 * Initialize blog excerpts after page load
 * Called after all blog entries are inserted
 */
function initializeBlogExcerpts() {
	console.log('initializeBlogExcerpts called, cache:', blogExcerptCache);
	// Find all blog entries in the active content div only (not in hidden transition divs)
	// Use jQuery to check which div is visible
	var activeDiv;
	if ($('#a').is(':visible')) {
		activeDiv = document.getElementById('a');
	} else if ($('#b').is(':visible')) {
		activeDiv = document.getElementById('b');
	} else {
		// Fallback to main for basic transitions
		activeDiv = document.querySelector('main');
	}

	if (!activeDiv) {
		console.log('No active content div found');
		return;
	}

	var entries = activeDiv.querySelectorAll('.blog_entry');
	console.log('Found', entries.length, 'blog entries in active div:', activeDiv.id);
	entries.forEach(function(entry) {
		var url = entry.getAttribute('data-url');
		var entryId = entry.getAttribute('id');

		// Check if we already have this excerpt cached
		if (url && entryId) {
			console.log('Checking entry', entryId, 'url:', url);
			if (blogExcerptCache[url]) {
				console.log('Using cached excerpt for', url);
				// Use cached excerpt
				var excerptPara = entry.querySelector('.excerpt_text');
				if (excerptPara) {
					excerptPara.textContent = blogExcerptCache[url];
				}
				entry.setAttribute('data-excerpt-loaded', 'true');
			} else if (!entry.hasAttribute('data-excerpt-loaded')) {
				console.log('Loading excerpt for first time:', url);
				// Load excerpt for the first time
				loadBlogExcerpt(url, entryId);
			}
		}
	});
}

/**
 * Update blog page to show different posts (pagination)
 * @param {number} start - Start index
 * @param {number} stop - Stop index
 * @param {number} postsPerPage - Posts per page
 */
function updateBlogPage(start, stop, postsPerPage) {
	// Store pagination state in URL hash for bookmarking
	window.location.hash = 'blog-' + start + '-' + stop;

	// Find the blog container
	var blogContainer = document.querySelector('.blog');
	if (!blogContainer) return;

	var totalPosts = parseInt(blogContainer.getAttribute('data-total-posts'));

	// Hide all blog entries
	var allEntries = blogContainer.querySelectorAll('.blog_entry');
	allEntries.forEach(function(entry) {
		entry.style.display = 'none';
	});

	// Show only entries in the current range
	for (var i = start; i < stop; i++) {
		var entry = document.getElementById('blog_entry_' + i);
		if (entry) {
			entry.style.display = 'block';
		}
	}

	// Update pagination controls
	var currentPage = Math.floor(start / postsPerPage) + 1;
	var totalPages = Math.ceil(totalPosts / postsPerPage);

	// Update page info
	var pageInfo = blogContainer.querySelector('.blog_page_info');
	if (pageInfo) {
		pageInfo.textContent = 'Page ' + currentPage + ' of ' + totalPages;
	}

	// Update Previous button
	var prevBtn = blogContainer.querySelector('.blog_prev');
	if (prevBtn) {
		if (start > 0) {
			var prevStart = Math.max(0, start - postsPerPage);
			var prevStop = start;
			prevBtn.disabled = false;
			prevBtn.onclick = function() { updateBlogPage(prevStart, prevStop, postsPerPage); return false; };
		} else {
			prevBtn.disabled = true;
		}
	}

	// Update Next button
	var nextBtn = blogContainer.querySelector('.blog_next');
	if (nextBtn) {
		if (stop < totalPosts) {
			var nextStart = stop;
			var nextStop = Math.min(totalPosts, stop + postsPerPage);
			nextBtn.disabled = false;
			nextBtn.onclick = function() { updateBlogPage(nextStart, nextStop, postsPerPage); return false; };
		} else {
			nextBtn.disabled = true;
		}
	}

	// Scroll to blog section
	blogContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Load and cache the excerpt for a blog post
 * @param {string} url - URL of the blog post
 * @param {string} entryId - ID of the blog entry div
 */
function loadBlogExcerpt(url, entryId) {
	console.log('loadBlogExcerpt called for', url, 'entry:', entryId);
	$.get(url, function(data) {
		console.log('AJAX response received for', url);
		// Convert markdown to HTML if needed
		if (/\.md$/.test(url)) {
			data = marked.parse(data);
		}

		// Extract first paragraph or first 300 characters
		var tempDiv = document.createElement('div');
		tempDiv.innerHTML = data;

		// Remove any headings to get to actual content
		var headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
		headings.forEach(function(h) { h.remove(); });

		// Try to get first paragraph
		var firstP = tempDiv.querySelector('p');
		var excerptText = '';

		if (firstP) {
			excerptText = firstP.textContent.trim();
		} else {
			// Fallback to all text content
			excerptText = tempDiv.textContent.trim();
		}

		// Remove extra whitespace
		excerptText = excerptText.replace(/\s+/g, ' ');

		// Limit to 300 characters
		if (excerptText.length > 300) {
			excerptText = excerptText.substring(0, 300).trim() + '...';
		}

		// If still empty, use a default message
		if (!excerptText) {
			excerptText = 'Click to read more...';
		}

		// Cache the excerpt for future use
		blogExcerptCache[url] = excerptText;
		console.log('Cached excerpt for', url, ':', excerptText.substring(0, 50) + '...');

		// Update excerpt text
		var entry = document.getElementById(entryId);
		if (entry) {
			var excerptPara = entry.querySelector('.excerpt_text');
			if (excerptPara) {
				excerptPara.textContent = excerptText;
			}
			entry.setAttribute('data-excerpt-loaded', 'true');
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.error('Failed to load excerpt for', url, ':', textStatus, errorThrown);
		// Set a fallback message
		var entry = document.getElementById(entryId);
		if (entry) {
			var excerptPara = entry.querySelector('.excerpt_text');
			if (excerptPara) {
				excerptPara.textContent = 'Error loading excerpt. Click to read full post.';
			}
		}
	});
}

/**
 * Open image in lightbox overlay
 * @param {string} imageSrc - Image source URL
 */
function openLightbox(imageSrc) {
	// Create lightbox if it doesn't exist
	var lightbox = document.getElementById('image-lightbox');
	if (!lightbox) {
		lightbox = document.createElement('div');
		lightbox.id = 'image-lightbox';
		lightbox.className = 'image-lightbox';
		lightbox.onclick = closeLightbox;

		var img = document.createElement('img');
		img.id = 'lightbox-img';
		lightbox.appendChild(img);

		document.body.appendChild(lightbox);
	}

	// Set image source and show lightbox
	var img = document.getElementById('lightbox-img');
	img.src = imageSrc;
	lightbox.style.display = 'block';

	// Trigger animation after a brief delay to allow display change to take effect
	setTimeout(function() {
		lightbox.classList.add('active');
	}, 10);

	// Prevent body scrolling when lightbox is open
	document.body.style.overflow = 'hidden';
}

/**
 * Close the lightbox overlay
 */
function closeLightbox() {
	var lightbox = document.getElementById('image-lightbox');
	if (lightbox) {
		// Remove active class to trigger fade-out animation
		lightbox.classList.remove('active');

		// Hide lightbox after animation completes (300ms)
		setTimeout(function() {
			lightbox.style.display = 'none';
		}, 300);
	}

	// Restore body scrolling
	document.body.style.overflow = 'auto';
}

/**
 * Signal that theme initialization is complete
 * Themes should call this function (via window.themeReady()) when they finish loading
 * If not called within 2 seconds, initialization proceeds anyway to prevent blocking
 */
function themeReady() {
	if (!theme_ready) {
		theme_ready = true;
		console.log('Theme initialized and ready');
		checkAndLoadInitialPage();
	}
}

// Expose functions to global scope so onclick handlers in generated HTML can call them
window.loadPage = loadPage;
window.toggleBlogEntry = toggleBlogEntry;
window.initializeBlogExcerpts = initializeBlogExcerpts;
window.updateBlogPage = updateBlogPage;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.themeReady = themeReady;

})();
