"use strict";

const { html, raw } = require('es6-string-html-template')

module.exports = {
  renderMain,
}

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]


function zeroPad(num) {
  return num.toString().padStart(2, '0')
}

function renderMain(meetings) {
  const content = main(meetings)

  return renderPage(content)
}

function renderReading(meeting) {
  const { date } = meeting
      , meetingHTML = meeting.html

  return html`
  <div class="reading">
  <h3>
  ${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}
  </h3>
  ${raw(meetingHTML)}
  </div>
  `
}

function main(meetings) {
  const now = new Date()
      , lastUpdated = `${now.getFullYear()}-${zeroPad(now.getMonth())}-${zeroPad(now.getDate())}`

  meetings = meetings.map(renderReading)

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
  ${meetings[0]}
</section>

<section id="recent">
  <h2 id="recent">Recent meetings</h2>
  ${raw(meetings.slice(1,6).join(''))}
</section>

<section>
  <p>
    <a href="archive.html">All past meetings</a>
  </p>
  <p>
    <i>Last updated ${lastUpdated}</i>
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
  <main>
    ${raw(content)}
  </main>

  <script type="text/javascript" src="org.js" />
</body>
</html>`
}
