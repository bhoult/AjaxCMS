### New Feature: Splash Screen
So I wanted to show off more of the graphical capabilities of AjaxCMS.  I have kept the page layout intentionally simple so that it would be easy for people to modify, but it looked a little dull and wordy compared to the home pages of other CMS systems.  I will be doing more to show off the capabilities of layouts and inserts in the future, but for now this will hopefully make it look a little more interesting.

To create a splash screen you just have to create a file called "splash.html" in the pages folder.  There is also a variable "ajaxcms_splash_time" at the top of the index.html file that will set the duration of the splash screen.  5000 = 5 seconds.

The content of the file can be whatever you want.  In this case I made a logo using [Inkscape](https://inkscape.org), then animated it in javascript using [segment.js](http://lmgonzalves.github.io/segment/), and jquery.  When the time you specify has elapsed it will fade out the splash and fadein the home page.

If there is not a splash.html file then it will just immediately show the homepage as before.

<div id="disqus_thread"></div>
<script>
var disqus_config = function () {
    this.page.url = window.location.href;  
    this.page.identifier = ajaxcms_page_id; 
};

(function() { // DON'T EDIT BELOW THIS LINE
    var d = document, s = d.createElement('script');
    s.src = '//ajaxcms-org.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
})();
</script>


