# Helpers

AJAX CMS uses various "helpers" to make it easy to insert complex code.  Helpers are specified in the content of the page using double brace symbol ie. `{{helper      | param1 | param2 ...}}`. Each helper can take a number of parameters separated by the "|" character.  The parameters are in sequential order, it is generally valid to leave off parameters from the end if they are not needed.  Before the page is shown the helper will be replaced by the appropriate content.  The following list will show all the helpers currently enabled in AJAX and their format.  If a helper contains five or more sequential spaces it will be skipped.  This is so that we can show the helper code without it being replaced...like on this page.

Except for Inserts, each helper can contain an arbitrary number of "attributes", these are parameters that have a "=>" character.  An "attribute parameter" in the format "attr=>value" will be inserted in the top-most html element as attributes in the format attr="value".  This can be used for any html attributes.  For example `{{a      | documentation | class=>testclass | id=>testid }}` will be converted to `<a class="testclass" id="testid" onclick="loadPage('./pages/menus/01-Documentation/Helpers.md')">documentation</a>`

Along with these helpers, markdown includes a number of similar shortcuts.  Pages with a .md extension will be filtered through markdown.  AJAX CMS uses githubs version of markdown so the documentation at https://guides.github.com/features/mastering-markdown/ should be applicable.

You can view the pages on this site before they are processed as examples by looking at the raw directory list provided by apache here: <a href='./pages'>./pages</a>

## Anchor (link)
Example: `{{a      | page | link text | alt text}}`

If you put a normal html anchor tag `<a>` in the page and the user clicks it the browser will follow the link and perform a complete reload.  This is probably what you want if the link is outside of your website.  For links inside of your website that may not be in the menu though you need a special bit of javascript to do the page transition.  This helper will assist in making that link.  For the page it will use the first partial match.  So if the page is in "./pages/menus/test.html" you only have to specify "test" assuming that you only have one page called "test".

## Image
Example: `{{i      | image | alt }}`

Images should be stored in the "images" folder.  You can have as many subfolders as you want under "images" in order to keep them organized.  Like Anchors they only require a partial match, so an image called "./images/vacation/colorado.jpg" could just be specified as "colorado".  The default css in index.html includes the following presets: icon, thumb, small, medium, large, left, right.  These can be used in the class to specifiy basic image sizes and positions.

## Carousel (Slideshow)
Example: `{{carousel:5000     | image1:alt1:caption1 | image2:alt2:caption2 | image3:alt3:caption3 }}`

AJAX CMS includes bootstrap, so we use Bootstrap's carousel by default.  You can specify as many slides as you want.  Each slide can take a number of optional parameters separated by a ':' character.  Specified in order they are the alt tag and a caption.  The caption can include html like `<h1>Some text</h1>`.  The 5000 in the above example is optional abd specifies the speed in milliseconds between slide transitions.  So 5000 would mean 5 seconds between slides.  

## Insert
Example: `{{     insert | pagename }}`

Will insert the contents of the page into the location of the helper.  The name of the page can be a partial match.  The page will be inserted along with any layout that the page is associated with. Insert can insert content into pages or layouts.  Multiple insertions can be used on a page.  Pages that contain insertions can also be inserted.  Possible uses include inserting common content or menus into sidebars if the insert is in a layout.  Or for inserting a laid-out page into a menu without a layout.

Note that attributes cannot be used with inserts.  Instead wrap the insert manually, for example: `<div id='test'>{{     insert | pagename }}</div>`

## File List
Example: `{{filelist     | ./pages/foldername }}`

Will convert a folder and all it's subfolders into a vertical menu using the standard `<ul>`, `<li>` format.  Can be used to create vertical submenus.

## Blog
Example: `{{blog     | directory | start | stop }}`

Will display the specified directory as a list of blog entries with content loaded via AJAX.  Start and stop specify the number of blogs to display.  The blog entries must be named as follows: YY-MM-DD-n-Blog_Title.md or YY-MM-DD-Blog_Title.md.  Where YY=Year, MM=Month, DD=Day, n=Number (optional).

## Blog List
Example: `{{bloglist     | directory | start | stop }}`

Will display the specified directory as a list of blog entries showing only the title.  Start and stop specify the number of blogs to display.  The blog entries must be named as follows: YY-MM-DD-n-Blog_Title.md or YY-MM-DD-Blog_Title.md.  Where YY=Year, MM=Month, DD=Day, n=Number (optional).