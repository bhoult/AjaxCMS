<div style="width:40%; height:100%; float:right; ">{{carousel | back-e.jpg | back-b.jpg | back-c.jpg | back-d.jpg | back-a.jpg }}</div>
## What is this?

AjaxCMS is an open source static file based CMS that runs almost entirely in javascript on the browser.  The server is only used for passing static files for the browser to process and display.  You add content by uploading [HTML](http://www.w3schools.com/html/) or [Markdown](https://guides.github.com/features/mastering-markdown/) files into the "pages" folder.  If you want them in the menu then you upload them to the "pages/menus" folder.  These files are automatically detected and added to the menu, folders of files are turned into drop down menus.  When the menus or links are clicked the content of the file is displayed without doing a page refresh.  This has a number of implications.  

1. First, it is fast.  The main "theme" html, css and javascript is loaded and processed only once when the site first loads.  Subsequent pages are then just inserted into the content area using AJAX so that only new content is actually processed by the browser.

2. You don't need a server side database, or code.  Because all the site content on the server is just static HTML it does not need to be processed by the webserver.  It is just sent as is. This again contributes to greater speed and reduces server costs.

3. Because the page is not reloaded you can create interesting effects such as page transitions and background animations that continue to play seamlessly as the user navigates your site. The animation running in the background of this page is just a small Javascript program using the HTML5 Canvas.  

4. Because there is no administrative backend, server side code or database, the site is much less vulnerable to hackers.  There are no server side CMS vulnerabilities requiring constant updates or holes for possible SQL injection.

5. It is very simple.  At the moment the entire code of AjaxCMS is less than 1000 lines not including the various libraries (jquery, bootstrap, animations, etc.) It is all included in just two files: index.html and js/ajaxcms.js.  This makes it relatively simple to understand the entire source code by just having a basic understanding of html / css / javascript.  It then becomes easy to fully customize your site without having to worry about dealing with the peculiarities of a complex system.  

## How does it work?
By default the Apache web server will show a file listing if you go a folder that does not contain an index.hmtl file.  AjaxCMS utilizes this to recursively index the files and directories listed in the "pages" folder when you first open the site.  It will use this list to build the menu.  The name of the file determines the name shown for that page in the menu.  If there is a number followed by a dash at the front of the file name (ie. 01-file.html) it will use this to order the menu items.  It will remove the number at the beginning and the extension (.html or .md) from the end.

From a content creators perspective all you have to worry about is creating content files in html or markdown, naming them appropriately and putting them in the right place on the server.

For complex and consistent page layouts AjaxCMS pages support "Layouts" and "Inserts".  If a folder contains a file called "layout.html" then the files in that folder and it's subfolders will be inserted into the layout before it is displayed.  Pages and layouts can also contain "inserts" which allows other files to be embedded inside a file.

## Features
1. Mobile Friendly - By default AjaxCMS uses [Bootstrap](http://getbootstrap.com/) to provide a themeable responsive grid-based layout that will adapt to different devices.  Swipe events are also detected and can be used to navigate forward and backwards through the menus as can the left and right arrow keys.

2. Markdown - You can create pages as either .html files or .md (markdown) files.  Markdown is generally faster and easier for novice users to edit, while plain html allows for more complex layouts.

3. Helpers - There are a number of helpers that will assist in tasks like finding and inserting non-menu links and images, or more complicated things like slideshows.  See the {{a | documentation | class=>testclass | id=>testid }} for more information.

4. Themes - AjaxCMS is easily themeable.  We plan to support the development of the AjaxCMS core through the sales of themes consisting of background animations combined with CSS color schemes. For a list of the themes currently available click on the "Themes" menu at the top right.

## Limitations
AjaxCMS is basically just for viewing content, the user can look around but cannot change anything. For the majority of simple sites, this is fine.  But it does mean that you have to use external tools to include features like response forms, chat rooms, forums, shopping carts, wikis, etc. However, due to the recent widespread compatibility of AJAX enabled browsers there are many options to embed dynamic features like the ones mentioned above.  These include embedded google maps, discussion boards like http://disqus.com, or response forms using http://forms.google.com 

At the moment, because we need the list of files from the webserver, AjaxCMS requires [Apache](http://www.apache.org/). However it would be trivial to modify the code to parse directory lists from other web servers.

## Plans for the Future.
We will continue development of the core of AjaxCMS as an open source project under the GPL v3 license. In order to support the development of AjaxCMS we plan to sell individual and site licences for the background animations and themes.  We also intend to develop a number of services that will allow functionality not possible in a purely client side system.  We hope that AJaxCMS is a tool that will make developing websites quicker, easier and more secure.  Let us know which direction you would like us to take to make this happen.

If you have any questions or suggestions or would like to purchase a theme please contact me at <a href="mailto:brandon.hoult@softwyre.com">brandon.hoult@softwyre.com</a> The source code (install files) can be downloaded from https://github.com/bhoult/AjaxCMS.
