"use strict";

const R = require('ramda')
    , { html, raw } = require('es6-string-html-template')

module.exports = {
  renderMain,
  renderArchive,
  renderAuthors,
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

function renderArchive(meetings) {
  const content = archive(meetings)

  return renderPage(content)
}

function renderAuthors(meetings) {
  const entitiesByType = R.pipe(
    R.transduce(
      R.map(R.prop('entities')),
      R.mergeWith(R.concat),
      {}
    ),
    R.map(R.pipe(
      R.sortBy(R.prop('id')),
      R.groupWith((a, b) => a.id === b.id),
      R.map(xs => Object.assign(R.mergeAll(xs), {
        weeks: xs.map(d => d.meetingLink).sort()
      }))
    )),
  )(meetings)


  const content = entities(entitiesByType)

  return renderPage(content)
}

function renderEntity(val, key) {
  if (!val.length) return ''

  const entityListHTML = val.map(({ id, label }) => html`
    <li><a href="authors.html#${id}">${label}</a></li>
  `).join('\n')

  return html`
    <h4>${key}</h4>
    <ul>${raw(entityListHTML)}</ul>
  `
}

function renderReading(meeting) {
  const { date, fragment, entities } = meeting
      , meetingHTML = meeting.html

  const entityHTML = Object.values(entities).some(x => x.length)
    ? Object.values(R.mapObjIndexed(renderEntity, entities)).join('\n')
    : ''

  /*
  const agentHTML = agents.map(a => html`
    <li>${a['foaf:givenname']} ${a['foaf:surname']}</li>
  `).join('\n')
  */

  return html`
  <div class="meeting" id="${fragment}">
    <h3 class="meeting--date">
    ${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}
    </h3>

    <div class="meeting--schedule">${raw(meetingHTML)}</div>

    <div class="meeting--entities">${raw(entityHTML)}</div>
  </div>
  `
}

function main(meetings) {
  meetings = meetings.map(renderReading)

  return html`
<section id="about">
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

</section>
  `
}

function entities(entitiesByType) {
  const htmlByType = R.map(
    R.pipe(
      R.map(({ id, label, weeks, externalLink }) => html`
        <div id=${id}>
        <h3>${label}</h3>
        <a class="external" href="${externalLink}">${externalLink && 'Homepage'}</a>
        <ul>
          ${raw(weeks.map(week => html`
            <li>
              <a href="${week}">${week.split(':').slice(-1)[0]}</a>
            </li>
          `).join('\n'))}
        </ul>
        </div>
      `),
      d => d.join('\n')
    ), entitiesByType)

  return html`
    <section id="index">
      <div>
        <h2>People</h2>
        ${raw(htmlByType.People)}
      </div>

      <div>
        <h2>Journals</h2>
        ${raw(htmlByType.Journals)}
      </div>

      <div>
        <h2>Conferences</h2>

        ${raw(htmlByType.Conferences)}
        <h2>Publishers</h2>
        ${raw(htmlByType.Publishers)}

      </div>
    </section>
  `
}

function archive(meetings) {
  meetings = meetings.map(renderReading)
  return html`
<section>
  ${raw(meetings.slice(0).join('\n\n'))}
</section>
`
}

function renderPage(content) {
  const now = new Date()
      , lastUpdated = `${now.getFullYear()}-${zeroPad(now.getMonth())}-${zeroPad(now.getDate())}`

  return html`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="org.css">
  <title>The Organization Research Group</title>
</head>

<body>
  <main>
  <header>
  <h1>
    The
    <span class="org-o org-firstletter">O</span><span class="org-r">r</span><span class="org-g">g</span>anizati<span class="org-o">o</span>n
    <span class="org-r org-firstletter">R</span>esea<span class="org-r">r</span>ch
    <span class="org-g org-firstletter">G</span><span class="org-r">r</span><span class="org-o">o</span>up
  </h1>

    <ul id="nav-controls">
      <li><a href="index.html">Home</a></li>
      <li><a href="archive.html">Archive</a></li>
      <li><a href="authors.html">Author index</a></li>
    </ul>
    </header>

    <main>
    ${raw(content)}
    </main>

    <footer>
      Last updated ${lastUpdated}
    </footer>
  </main>

  <script type="text/javascript" src="org.js" />
</body>
</html>`
}
