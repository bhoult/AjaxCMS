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

// URL and page state management
var base_url = window.location.href.replace(/\?.*/,'');  // Base URL without query params
var current_page;   // Currently displayed page path
var just_pages;     // Filtered array of actual pages (excludes directories and layouts)
var menu_pages;     // Pages that appear in the navigation menu
var data;           // Global variable holding current page content during processing

// Directories to skip when loading images (special size variants)
var SKIP_IMAGE_DIRS = ['icon/', 'thumb/', 'small/', 'medium/', 'large/'];

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
		if (pages_count === 0) {

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
		if (images_count === 0) {
			// All image directories loaded - reserved for future initialization
		}
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

        // Blank - Skip any helpers that contain five sequential spaces.  This is so we can document the helpers format without it being replaced.
        if (/\s\s\s\s\s/.test(x)) {
        	return x; // Return unchanged to preserve spacing in <code>/<pre> blocks
        }

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
			return "<img "+attributes_string+" src=\"" + imageMatch(parts[1]) + "\" alt=\"" + parts[1] + "\">";
		}
		if (parts[0]=='i' && parts.length == 3) {
			return "<img "+attributes_string+" src=\"" + imageMatch(parts[1]) + "\" alt=\"" + parts[2] + "\">";
		}

		// Carousel {{ carousel:speed | image1:alt1:caption1 | image2:alt2:caption2 | image3:alt3:caption3 }}
		if (parts[0].includes('carousel') && parts.length > 2) {
			var idn = Math.floor(Math.random() * 9999999999);
			var carousel_images = parts.slice(1);
			var carousel_speed = 5000;
			if (parts[0].split(':').length == 2) {carousel_speed = parseInt(parts[0].split(':')[1])}

			// Build the repeating parts of the carousel
			var carousel_indicators = "";
			var slides = "";
			for (var ii=0; ii < carousel_images.length; ii++) {
				carousel_indicators += "<button type=\"button\" data-bs-target=\"#carousel_"+idn+"\" data-bs-slide-to=\""+ii+"\" class=\""+ (ii==0 ? 'active' : '') +"\" aria-current=\""+(ii==0 ? 'true' : 'false')+"\" aria-label=\"Slide "+(ii+1)+"\"></button>";

				var image_parts = carousel_images[ii].split(':');
				var slide_image;
				var slide_caption;
				var slide_alt;
				(image_parts.length > 0) ? slide_image = image_parts[0] : slide_image = "";
				(image_parts.length > 1) ? slide_alt = image_parts[1] : slide_alt = "";
				(image_parts.length > 2) ? slide_caption = image_parts[2] : slide_caption = "";
				slides += 	"<div class=\"carousel-item "+ (ii==0 ? 'active' : '') +"\">" +
							"<img src=\""+ imageMatch(slide_image) +"\" alt=\""+ slide_alt  +"\" class=\"d-block w-100\">" +
							"<div class=\"carousel-caption\">"+slide_caption+"</div></div>";
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

        // Blank - Skip any helpers that contain five sequential spaces.  This is so we can document the helpers format without it being replaced.  HTML merges the spaces.
        if (/\s\s\s\s\s/.test(x)) {
        	return original;
        }

		// {{blog | directory | start | stop }}
		if (parts[0] == 'blog' && parts.length > 1) {
			var blog_list = processBlogList(parts);

			// Make a div for each blog entry
			var output = "";
			for (var i=0; i < blog_list.length; i++){
				output += "<div class='blog_entry' data-url='"+blog_list[i].url+"' onclick=\"loadPage('"+blog_list[i].url+"'); return false;\" style=\"cursor: pointer;\">"
				output += "<h1>"+blog_list[i].name+"</h1><time>"+blog_list[i].date.toLocaleDateString()+"</time><div class='blog_content'>\n{{insert | "+blog_list[i].url+" | false}}\n</div></div>"
			}

			return "<div "+attributes_string+" class='blog'>\n"+output+"</div>"
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

		// Protect helpers with 5+ spaces (legacy documentation compatibility)
		var protectedHelpers = [];
		var protectedCodeBlocks = [];

		insert_contents = insert_contents.replace(/{{[^}]*\s\s\s\s\s[^}]*}}/g, function(match) {
			var index = protectedHelpers.length;
			protectedHelpers.push(match);
			return '___INSERT_PROTECTED_HELPER_' + index + '___';
		});

		// Check if layout exists before requesting it to avoid 404 errors
		if ($.inArray(layout_url, layouts) > -1) {
			// Layout exists, load it
			$.get( layout_url )
				.fail(function(jqXHR, textStatus, errorThrown) {
					console.error('Error loading insert layout ' + layout_url + ':', textStatus, errorThrown);
				})
				.always(function( layout ) {

					// Run through markdown if the file ends in .md
					if (/\.md$/.test(fname)){ insert_contents = marked.parse(insert_contents);	}

					// Protect <code> and <pre> tags after markdown processing
					// First protect <pre> blocks (which may contain <code> tags)
					insert_contents = insert_contents.replace(/<pre>[\s\S]*?<\/pre>/gi, function(match) {
						var index = protectedCodeBlocks.length;
						protectedCodeBlocks.push(match);
						return '___INSERT_PROTECTED_CODE_' + index + '___';
					});
					// Then protect standalone <code> tags
					insert_contents = insert_contents.replace(/<code>[\s\S]*?<\/code>/gi, function(match) {
						var index = protectedCodeBlocks.length;
						protectedCodeBlocks.push(match);
						return '___INSERT_PROTECTED_CODE_' + index + '___';
					});

					// Process any helpers in the inserted content (but not in code blocks)
					// ... this happens later when it's merged into main data ...

					// Restore protected code blocks and helpers before inserting
					insert_contents = insert_contents.replace(/___INSERT_PROTECTED_CODE_(\d+)___/g, function(match, index) {
						return protectedCodeBlocks[parseInt(index)];
					});
					insert_contents = insert_contents.replace(/___INSERT_PROTECTED_HELPER_(\d+)___/g, function(match, index) {
						return protectedHelpers[parseInt(index)];
					});

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
			// Run through markdown if the file ends in .md
			if (/\.md$/.test(fname)){ insert_contents = marked.parse(insert_contents);	}

			// Protect <code> and <pre> tags after markdown processing
			// First protect <pre> blocks (which may contain <code> tags)
			insert_contents = insert_contents.replace(/<pre>[\s\S]*?<\/pre>/gi, function(match) {
				var index = protectedCodeBlocks.length;
				protectedCodeBlocks.push(match);
				return '___INSERT_PROTECTED_CODE_' + index + '___';
			});
			// Then protect standalone <code> tags
			insert_contents = insert_contents.replace(/<code>[\s\S]*?<\/code>/gi, function(match) {
				var index = protectedCodeBlocks.length;
				protectedCodeBlocks.push(match);
				return '___INSERT_PROTECTED_CODE_' + index + '___';
			});

			// Restore protected code blocks and helpers before inserting
			insert_contents = insert_contents.replace(/___INSERT_PROTECTED_CODE_(\d+)___/g, function(match, index) {
				return protectedCodeBlocks[parseInt(index)];
			});
			insert_contents = insert_contents.replace(/___INSERT_PROTECTED_HELPER_(\d+)___/g, function(match, index) {
				return protectedHelpers[parseInt(index)];
			});

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
// Global arrays for code block protection (shared across processPageContent scope)
var globalProtectedHelpers = [];
var globalProtectedCodeBlocks = [];

function processPageContent(contentData, url, callback) {
	// Step 0.5: Protect markdown code blocks BEFORE any helper processing
	// This prevents {{blog}}, {{bloglist}}, etc. in documentation from being processed
	globalProtectedHelpers = [];
	globalProtectedCodeBlocks = [];

	data = contentData;

	// Protect triple-backtick code blocks
	// Match from ```language\n or ```\n to the closing ```
	data = data.replace(/```[^\n]*\n[\s\S]*?\n```/g, function(match) {
		var index = globalProtectedCodeBlocks.length;
		globalProtectedCodeBlocks.push(match);
		return '___PROTECTED_CODE_BLOCK_' + index + '___';
	});

	// Protect inline code (single backticks)
	data = data.replace(/`[^`\n]+`/g, function(match) {
		var index = globalProtectedCodeBlocks.length;
		globalProtectedCodeBlocks.push(match);
		return '___PROTECTED_CODE_BLOCK_' + index + '___';
	});

	// Also protect helpers with 5+ spaces (legacy documentation compatibility)
	data = data.replace(/{{[^}]*\s\s\s\s\s[^}]*}}/g, function(match) {
		var index = globalProtectedHelpers.length;
		globalProtectedHelpers.push(match);
		return '___PROTECTED_HELPER_' + index + '___';
	});

	// Step 1: Process meta-helpers (like {{blog}} which generates {{insert}} helpers)
	// Protected code blocks won't match {{}} patterns
	data = pre_process_page(data);

	// Step 1.5: Restore protected code blocks so markdown can process them
	data = data.replace(/___PROTECTED_CODE_BLOCK_(\d+)___/g, function(match, index) {
		return globalProtectedCodeBlocks[parseInt(index)];
	});

	// Reset the array since we'll re-protect after markdown
	globalProtectedCodeBlocks = [];

	// Step 2: Convert Markdown to HTML if this is a .md file
	if (/\.md$/.test(url)){ data = marked.parse(data);}

	// Step 2.5: Protect HTML <code> and <pre> tags AFTER markdown processing
	// This prevents helpers inside code blocks from being processed
	// First protect <pre> blocks (which may contain <code> tags)
	data = data.replace(/<pre>[\s\S]*?<\/pre>/gi, function(match) {
		var index = globalProtectedCodeBlocks.length;
		globalProtectedCodeBlocks.push(match);
		return '___PROTECTED_CODE_BLOCK_' + index + '___';
	});
	// Then protect standalone <code> tags (inline code, not inside <pre>)
	data = data.replace(/<code>[\s\S]*?<\/code>/gi, function(match) {
		var index = globalProtectedCodeBlocks.length;
		globalProtectedCodeBlocks.push(match);
		return '___PROTECTED_CODE_BLOCK_' + index + '___';
	});

	// Step 3: Recursively process all {{insert}} helpers
	processInserts(function(){
		// Step 4: Process remaining helpers ({{a}}, {{i}}, {{carousel}}, etc.)
		data = process_page();

		// Step 4.5: Restore protected code blocks and helpers AFTER all processing
		data = data.replace(/___PROTECTED_CODE_BLOCK_(\d+)___/g, function(match, index) {
			return globalProtectedCodeBlocks[parseInt(index)];
		});
		data = data.replace(/___PROTECTED_HELPER_(\d+)___/g, function(match, index) {
			return globalProtectedHelpers[parseInt(index)];
		});

		// Step 5: Render with appropriate page transition animation
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

    // Navigate to home page when clicking the site logo/brand
    $('.navbar-brand').click(function(e){
    	e.preventDefault();
    	current_page = menu_pages[0];
		loadPage(current_page, true);
		return false;
    });

    // Swipe gesture navigation on touch devices
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

// Expose loadPage to global scope so onclick handlers in generated HTML can call it
window.loadPage = loadPage;

})();
