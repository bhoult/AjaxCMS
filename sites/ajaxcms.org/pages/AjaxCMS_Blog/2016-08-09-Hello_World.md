Welcome to AjaxCMS.

This is the initial release of the AjaxCMS platform.  We are releasing the core of AjaxCMS as an open source system and hope to support further development through the sales of "themes" or donations.  For more information or to purchase a theme please contact <brandon.hoult@softwyre.com>.

### Intro.  AjaxCMS v1.0
AjaxCMS works kind of backwards from a traditional CMS such as Wordpress, Joomla, or Drupal.  In those systems you have content stored in a database which is then processed by code running on a server before being combined with static assets like images and sent to the browser as finished HTML.  The browser is mostly just used to display the HTML with JavaScript being used for minor effects. In AjaxCMS content is stored as static HTML or Markdown files on the server, there is no database, there is no server side code, all layout is done on the user's browser.  This results in a number of benefits such as speed, security, and the ability to create complex visual effects in JavaScript as well as page transitions.  For more information please read the {{a | Home | Homepage}} and the Documentation.

### Does the world really need another CMS?
If AjaxCMS functioned like a traditional CMS such as Wordpress, Joomla, or Drupal there would not be much point.  All these CMS systems were introduced many years ago and have gone through many iterations.  They are established, well known and mostly secure unless you start adding a bunch of untested plugins or modules.  They started out focused on a particular use but have since evolved into extremely complicated general purpose systems with hundreds of interrelated PHP files.  

Since that time there have been many attempts to make a better CMS in a different, more powerful, more efficient language or framework. None have been successful because the community surrounding the early systems along with the thousands of plugins and modules they create make it nearly impossible to make anything comparable.  But in the last few years a lot of things have changed.

HTML5 and CSS3 along with the standardization of JavaScript have finally make the browser into a "platform".  A "platform" is a system of supporting technologies such as computers, operating systems, server-side languages, databases, and client side scripts that are needed to support a website.  As a developer you had to pick which set of technologies (stack) you wanted to invest in and hope that it remained relevant into the future. AjaxCMS tries to simplify this by requiring as little as possible on the server side and moving all the program logic to the client's browser.

This is made possible by a technology known as AJAX (Asynchronous JavaScript and XML).  AJAX allows a website to load and update pieces of a page instead of doing a full page refresh.  Because of this we are able to offload the parts of a website that require dynamic back ends to external services.  This replaces the need for proprietary and insecure plugins or modules, and allows us to focus on features that can be accomplished with nothing more than static files on the server. Examples of external services include [Disqus](https://disqus.com/) for comments, or [Google Forms](https://forms.google.com) for online forms.

### Is it ready to use.
Yes.  Although this is a first release and there will be bugs they will not impact the security of your site.  Most of the time when a new product is first introduced people are rightfully hesitant to use it until "the kinks have been worked out". Because everything that AjaxCMS does only runs in the users browser it is a little different.  We are confident that your site will not be hacked as a result of our code simply because none of our code runs on your server.  The only vulnerability that can exist is someone breaking into your hosting platform.

AjaxCMS has been tested in all modern browsers for basic functionality and should work on both mobile and desktop devices.  We are continuing to add features and some aspects may change in the future, but upgrades will mostly involve just updating a single file "js/ajaxcms.js".  Unlike traditional CMS systems you don't have to upgrade for security reasons, so the only reason to do so is if there is a bug that has been fixed, or if you want to use new functionality in later versions.

Any bugs will be limited to client side where they cannot cause any damage to other users.  Bugs will be limited to the few users that have not updated their browsers in the last several years and should not make the site unusable.  At some point we intend to create a fail-over version for ancient incompatible browsers or for screen readers for the visually impaired that cannot handle JavaScript.

We will update this blog as new versions become available.

### Conclusion.

This has been the result of many months of work and I look forward to hearing any questions or suggestions you might have.  Feel free to contact me at <brandon.hoult@softwyre.com>.  The source code (install files) can be downloaded from https://github.com/bhoult/AjaxCMS.

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


