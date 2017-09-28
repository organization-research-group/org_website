"use strict";

const { html, raw } = require('es6-string-html-template')
    , parseRDF = require('./rdf')



function main() {
  const { bib, meetings } = parseRDF('../bib.ttl')

}

function zeroPad(num) {
  return num.toString().padStart(2, '0')
}

function renderMain({ bib, meetings }) {
  const now = new Date()
      , lastUpdated = `${now.getYear()}-${zeroPad(now.getMonth())}-${zeroPad(now.getDate())}`

  return html`
<section id="about">
  <h1>
    The
    <span class="org-o org-firstletter">O</span><span class="org-r">r</span><span class="org-g">g</span>anizati<span class="org-o">o</span>n

    <span class="org-r org-firstletter">R</span>esea<span class="org-r">r</span>ch

    <span class="org-g org-firstletter">G</span><span class="org-r">r</span><span class="org-o">o</span>up
  </h1>

  <p>
  ORG meets Fridays at 11am in 214 Manning Hall.
  </p>
  <p>
  <a href="mailto:listmanager@listserv.unc.edu?body=subscribe%20org">Subscribe</a>
  to our email list for announcements and general discussion.
  </p>
</section>

<section id="current">
  <h2>Current meeting</h2>
  {current_reading}
</section>

<section id="recent">
  <h2 id="recent">Recent meetings</h2>
  {recent_readings}
</section>

<section>
  <p>
    <a href="archive.html">All past meetings</a>
  </p>
  <p>
    <i>Last updated {lastUpdated}</i>
  </p>
</section>
  `
}

function renderArchives({ bib, meetings }) {
}

function renderIndex({ bib, meetings }) {
}

function renderPage(content) {
  return html`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="org.css">
  <title>The Organization Research Group</title>
</head>

<body>
  <div class="grid" id="content">
    <main>
      {raw(content)}
    </main>
  </div>

  <div class="grid" id="margins">
    <p><span>O</span></p>
    <p><span>R</span></p>
    <p><span>G</span></p>
  </div>

  <script type="text/javascript" src="org.js" />
</body>
</html>`
}
