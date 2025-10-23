# Layouts

Layouts can be used to create multi-column displays for all the files in a specific subfolder under pages folder.  If a folder has a "layout.html" file in it then all the pages in that folder and its subfolders will be inserted into the layout wherever the `{{content}}` tag is specified in the layout.html file.

This allows multiple layouts to be shared among specific files.

Layouts should be specified according to [Bootstraps](https://getbootstrap.com/) documentation.  They have to be HTML (markdown will not work).  But you can use helpers inside the layout file.  One particular helper `{{     insert }}` is particularly useful here as it can be used to embed another page into the content of the layout.  This can be helpful in making a standardised header / footer / side panel.  For more information see the documentation on helpers.

The following is an example of a Bootstrap two column adaptive layout that has the page content inserted in the left column and another page (called "two") inserted into the right column.

```
<div class="container-fluid">
  <div class="row">
    <div class="col-md-8">{{content}}</div>
    <div class="col-md-4">{{     insert | two}}</div>
  </div>
</div>

```