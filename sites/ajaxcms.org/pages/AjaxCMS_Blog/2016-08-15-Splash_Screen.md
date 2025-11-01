## Splash Screen Feature
**Updated 2025:** The splash screen feature remains a great way to add visual interest and branding to your AjaxCMS site. This was one of the early features added to showcase the graphical capabilities of the platform.

### How It Works
AjaxCMS automatically detects and displays a splash screen before loading the main content, creating a polished first impression for visitors.

### Creating a Splash Screen
1. **Create the file**: Add `pages/splash.html` to your site directory
2. **Set the duration**: In `index.html`, configure the display time (in milliseconds):
   ```html
   <script>
   var ajaxcms_splash_time = 5000; // 5 seconds
   </script>
   ```
3. **Design your splash**: The content can be anything—HTML, CSS, SVG animations, canvas graphics, etc.

### Example Splash Content
The ajaxcms.org splash uses:
- **SVG logo** created in [Inkscape](https://inkscape.org)
- **Path animation** using [segment.js](http://lmgonzalves.github.io/segment/)
- **jQuery** for timing and transitions

After the specified duration, the splash fades out (2 seconds) and the main content fades in (1 second), creating a smooth visual transition.

### Implementation Details
The splash detection logic in `js/ajaxcms.js` (lines 155-169):
```javascript
// if there is a splash page then display
if (pages.indexOf("./pages/splash.html") >= 0 && !param('page')) {
    $.get("./pages/splash.html",function(data){
        $(".container").before("<div id='splash' style='width:100%; position:absolute;'>"+data+"</div>");
    });

    setTimeout(function(){
        $('#splash').fadeOut(2000);
        $('.container').fadeIn(1000);
    }, ajaxcms_splash_time);
} else {
    $('.container').fadeIn(1000);
}
```

**Note:** The splash only displays on the homepage. Direct links to specific pages bypass the splash screen.

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


