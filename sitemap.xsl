<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <title>XML Sitemap</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          h1 {
            color: #333;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 10px;
          }
          .info {
            background: #e8f4f8;
            border-left: 4px solid #0066cc;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 20px;
          }
          th {
            background: #0066cc;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
          }
          tr:hover {
            background: #f9f9f9;
          }
          a {
            color: #0066cc;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .url {
            word-break: break-all;
          }
          .alternate {
            font-size: 0.9em;
            color: #666;
            font-style: italic;
          }
          .priority {
            text-align: center;
          }
          .changefreq {
            text-align: center;
            text-transform: capitalize;
          }
          .count {
            font-weight: bold;
            color: #0066cc;
          }
          .section-header {
            background: #f0f0f0;
            font-weight: bold;
            font-size: 1.1em;
            padding: 15px 12px;
            color: #333;
            border-top: 2px solid #0066cc;
          }
        </style>
      </head>
      <body>
        <h1>XML Sitemap</h1>

        <div class="info">
          <p><strong>This is an XML Sitemap</strong> used to help search engines like Google discover and index pages on this site.</p>
          <p>Number of URLs in this sitemap: <span class="count"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span></p>
        </div>

        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Last Modified</th>
              <th>Change Frequency</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            <!-- Homepage -->
            <xsl:for-each select="sitemap:urlset/sitemap:url[sitemap:priority='1.0']">
              <tr class="section-header">
                <td colspan="4">Homepage</td>
              </tr>
              <tr>
                <td class="url">
                  <a href="{sitemap:loc}">
                    <xsl:value-of select="sitemap:loc"/>
                  </a>
                </td>
                <td>-</td>
                <td class="changefreq">
                  <xsl:value-of select="sitemap:changefreq"/>
                </td>
                <td class="priority">
                  <xsl:value-of select="sitemap:priority"/>
                </td>
              </tr>
            </xsl:for-each>

            <!-- Menu Pages -->
            <xsl:if test="sitemap:urlset/sitemap:url[contains(sitemap:loc, '/menus/')]">
              <tr class="section-header">
                <td colspan="4">Menu Pages</td>
              </tr>
              <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc, '/menus/')]">
                <tr>
                  <td class="url">
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                    <xsl:if test="xhtml:link[@rel='alternate']">
                      <br/>
                      <span class="alternate">
                        Alternate: <a href="{xhtml:link[@rel='alternate']/@href}">
                          <xsl:value-of select="xhtml:link[@rel='alternate']/@href"/>
                        </a>
                      </span>
                    </xsl:if>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td class="changefreq">
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td class="priority">
                    <xsl:value-of select="sitemap:priority"/>
                  </td>
                </tr>
              </xsl:for-each>
            </xsl:if>

            <!-- Blog Posts -->
            <xsl:if test="sitemap:urlset/sitemap:url[contains(sitemap:loc, '_Blog/')]">
              <tr class="section-header">
                <td colspan="4">Blog Posts</td>
              </tr>
              <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc, '_Blog/')]">
                <tr>
                  <td class="url">
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                    <xsl:if test="xhtml:link[@rel='alternate']">
                      <br/>
                      <span class="alternate">
                        Alternate: <a href="{xhtml:link[@rel='alternate']/@href}">
                          <xsl:value-of select="xhtml:link[@rel='alternate']/@href"/>
                        </a>
                      </span>
                    </xsl:if>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td class="changefreq">
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td class="priority">
                    <xsl:value-of select="sitemap:priority"/>
                  </td>
                </tr>
              </xsl:for-each>
            </xsl:if>

            <!-- Other Pages -->
            <xsl:if test="sitemap:urlset/sitemap:url[not(contains(sitemap:loc, '/menus/')) and not(contains(sitemap:loc, '_Blog/')) and sitemap:priority!='1.0']">
              <tr class="section-header">
                <td colspan="4">Other Pages</td>
              </tr>
              <xsl:for-each select="sitemap:urlset/sitemap:url[not(contains(sitemap:loc, '/menus/')) and not(contains(sitemap:loc, '_Blog/')) and sitemap:priority!='1.0']">
                <tr>
                  <td class="url">
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                    <xsl:if test="xhtml:link[@rel='alternate']">
                      <br/>
                      <span class="alternate">
                        Alternate: <a href="{xhtml:link[@rel='alternate']/@href}">
                          <xsl:value-of select="xhtml:link[@rel='alternate']/@href"/>
                        </a>
                      </span>
                    </xsl:if>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td class="changefreq">
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td class="priority">
                    <xsl:value-of select="sitemap:priority"/>
                  </td>
                </tr>
              </xsl:for-each>
            </xsl:if>
          </tbody>
        </table>

        <div class="info" style="margin-top: 30px;">
          <p><strong>What is a sitemap?</strong></p>
          <p>Sitemaps are a way to tell search engines about pages on your site. Search engines like Google use sitemaps to discover and crawl pages more efficiently.</p>
          <p><strong>Alternate Links:</strong> Pages with "Alternate" links offer a basic HTML version optimized for search engine crawlers.</p>
        </div>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>
