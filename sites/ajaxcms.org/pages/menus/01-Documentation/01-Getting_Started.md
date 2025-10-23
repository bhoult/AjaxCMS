# Getting Started

## 1. Setting up Apache on the webserver.
AjaxCMS currently requires that you use the apache webserver.  The reason for this is that it functions by parsing the file listing that apache provides if it is enabled and there is not a "index.html" file in the folder.  In the future we plan to make it work for other web servers and also by allowing a small bit of code to run on the server in a cronjob to create a static file listing.  You can see how this works by going to http://ajaxcms.org/pages to see the source files being used by this site. The full source code (install files) can be downloaded from https://github.com/bhoult/AjaxCMS.

AjaxCMS is mainly developed under Linux, but since apache can be run on any of the major operating systems it should work on anything.  If you are just getting started we would suggest purchasing a shared host from http://hostgator.com, http://siteground.com, http://dreamhost.com or similar.  These all use apache and you should just be able to copy AjaxCMS to your public_html folder.  If you are more advanced and are familiar with linux administration from the command line then a virtual server from Amazon EC2, Digital Ocean, or Microsoft Azure or anything similar would work.  If you want to run apache locally and are using Windows then I would suggest installing a linux virtual machine using VMWare or Virtualbox.  Then installing apache inside that.

It is also possible to install apache directly under windows.  Instructions can be found here: http://httpd.apache.org/docs/current/platform/windows.html

Most of the time apache directory listings are turned on by default.  You can test this by creating a folder inside the apache "root" directory then copying a few files into that folder.  As long as there is not a file called "index.html" you should see just a list of your files.  If the directory is not shown then you may need to enable it in the apache configuration files or in the .htaccess file.  Instructions can be found here: http://wiki.apache.org/httpd/DirectoryListings If you can see the files listed then AjaxCMS is ready to be installed.  In Ubuntu Linux you can install everything you need by simply typing "apt-get install apache2" on the command line.

## 2. Install AjaxCMS.
Once apache is up and running you simply copy the files into the apache root directory or into a virtual-host.  This can be done by either downloading the latest AjaxCMS archive or by using [git](https://git-scm.com/). I would suggest learning git since it will allow you to track changes over time, update to the latest version of AjaxCMS or rollback to a previous version if a file gets accidentally deleted or modified.  What you will end up with is a complete copy of this website running on your server.

There are a lot of files included in the distribution, but most of them are just examples documentation and themes.  There are really only two files that are required.  "index.html" and "js/ajaxcms.js".  If you look at index.html you will see that it includes a bunch of scripts at the top.  Most of these like [jquery](https://jquery.com/) and [bootstrap](http://getbootstrap.com/) are hosted externally on a CDN.  The ones I could not find a CDN for are included in the js folder.  If you know javascript I would suggest you look over the source code in "js/ajaxcms.com".  At under 1000 lines it is far simpler to fully understand than any other CMS that I am aware of.

## 3. Customization.
To build your own site, just delete everything in the "pages" and the "pages/menus" folder and the "images" folder.  You can also delete any other folders apart from "js" and "themes/default". Create a page called 01-Home.md (if you want to use Markdown, or 01-Home.html (if you would rather just use plain html) in the pages/menus folder.  Go to the url where your site is hosted and you should see your content with just "Home" in the menu.  From this point you just keep uploading or modifying the files in "pages" as needed.

The index.html can be customized to your needs a long as the following html is included:
```
<!-- Static navbar -->
<nav class="navbar navbar-default">
	<div class="container-fluid">
	  <div class="navbar-header">
	    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
	      <span class="sr-only">Toggle navigation</span>
	      <span class="icon-bar"></span>
	      <span class="icon-bar"></span>
	      <span class="icon-bar"></span>
	    </button>
	    <a class="navbar-brand" href="#">AjaxCMS</a>
	  </div>
	  <div id="navbar" class="navbar-collapse collapse">
	    <ul id='menu' class="nav navbar-nav">
	    	<!-- Pages get inserted here to make menu -->
	    </ul>
	  </div><!--/.nav-collapse -->
	</div><!--/.container-fluid -->
</nav>

<main id="main" style="position:relative; width:100%;">
	<!-- Content gets inserted here, a and b are for making page style transitions. -->
	<div id='a' style=""></div>
	<div id='b' style="display:none;"></div>
</main>
```

The "navbar" section is where the menu will be built.  The "main" section is where the content will be inserted when the user clicks a link. The a and b divs are used by the page transitions. 

There is a bit of CSS included in the index.html file.  This can be modified or you can include your own external css file in the head section here.

By default AjaxCMS will load themes/default/theme.css.  You can modify or overwrite this file with your own CSS.  AjaxCMS will also try to load themes/default/background.js to start the background animation. You can delete the contents of this file if you would like to create your own background animations.  There is a little script at the top of "index.html" that loads these.  You can modify or remove this script if you would like to do something different. If you would like to learn how to create these animations using Canvas / SVG / WebGL / CSS or would like to see source code and examples not included here I have found http://codepen.io to be a good source of inspiration.  Feel free to use the "starter" theme as a base for your own themes.

Animations used to be done using flash or silverlight, but because of issues with it being insecure and no longer included on mobile devices these technologies are being discontinued.  They are being replaced by HTML5 Canvas, SVG and WebGL, along with CSS animations.  These are cross-browser compatible technologies that can be animated with Javascript to provide similar capabilities to what Flash provides without the need for an external plugins and with greater security.  Most of the animations that we are using utilize Canvas because it is the most likely to be supported by all modern browsers.  WebGL requires that the user has some kind of 3D capability (which can vary widely) and is still maturing so we are avoiding it at the moment.

Currently AjaxCMS development is supported through the sales of themes.  At the moment we charge $50 for a single site license or $100 for multiple installs by a single individual or corporation. If you would like to include your animations in AjaxCMS for free or for with a cost please contact me at <brandon.hoult@softwyre.com>

## 4. Markdown / HTML / CSS.
Unlike most CMS systems there is not a backend with a WYSIWYG editor.  Pages in AjaxCMS are just plain [Markdown](https://guides.github.com/features/mastering-markdown/) or [HTML](http://www.w3schools.com/html/default.asp). How the content is displayed (size, color, etc.) is controlled using standard [CSS](http://www.w3schools.com/css/default.asp). If you are just starting then I would suggest learning Markdown (It can be learned in a few minutes) and beginning with predefined CSS themes for Bootstrap like the the ones at [Bootswatch](https://bootswatch.com/). HTML and CSS will give you full control over the look and content of your site but may take a while to learn.  There are a number of resources on the web you can use to learn for free or there are many books you can purchase if you prefer that format.

## 5. Editors.
Because there is not an admin interface you will need to be able to create and edit files to upload to the pages folder.  This can be done any number of ways and is one of the main strengths of AjaxCMS.  Basically, anything that can create or modify files on the server can be used as an editor.  Which you choose is up to you and how you prefer to work.  I will list a few options below.  Feel free to email me at <brandon.hoult@softwyre.com> if you know of other options you would like included in the list. These editors basically fall into four categories:

1. SSH or Remote into the server and edit the files directly on the command line. (SSH is included with Linux and OSX, use [putty](http://www.putty.org/) in Windows)
	* VI / VIM - A little difficult to learn but fast and powerful once you have.
	* EMACS - Very powerful, somewhat complicated.
	* nano / pico / joe - Simple to use, basic functionality.
2. Edit the files locally then upload to the server using FTP or SFTP (ssh). (In windows use Notepad or [Notepad++](https://notepad-plus-plus.org/))
	* [Filezilla](https://filezilla-project.org/) - Free FTP/SFTP Client.
3. Use an editor that can edit files remotely through FTP or SFTP
	* In Linux just use the standard file manager to open the folder on the remote server then edit using the default text editor for your distro.
	* (Windows) [Notepad++](https://notepad-plus-plus.org/)
4. Install software on the server that will allow you to edit the files remotely in your browser.
	* [Codiad](http://codiad.com/) - Full featured editor that runs in a browser and can be installed alongside AjaxCMS.

I would NOT suggest using document editors such as Microsoft Word or Openoffice, even though they can export HTML they tend to include a lot of formatting code that conflicts with the sites CSS and can cause many issues.