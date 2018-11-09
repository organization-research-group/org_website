"use strict";

const R = require('ramda')
    , h = require('hyperscript')
    , toHyperscript = require('html2hscript')
    , { timeFormat } = require('d3-time-format')
    , { html, raw } = require('es6-string-html-template')
    , pretty = require('pretty')
    , { bibliographyTypes } = require('./bibliography')
    , { getFirstObjectLiteral } = require('./rdf')

module.exports = {
  renderMain,
  renderArchive,
  renderDirectory,
}

function zeroPad(num) {
  return num.toString().padStart(2, '0')
}

function renderArchive(meetings) {
  const content = archive(meetings)

  return renderPage(content)
}

function renderDirectory(meetings) {
  /*
  const entitiesByType = R.pipe(
    R.chain(meeting =>
      meeting.entities.map(entity => ({ ...entity, weeks: meeting.fragment }))
    ),
    R.groupBy(R.prop('key')),
    R.map(R.pipe(
      R.sortBy(R.compose(R.toLower, R.prop('label'))),
      R.groupWith((a, b) => a.id.id === b.id.id), // lol
      R.map(meetingsByWeek => ({
        ...meetingsByWeek[0],
        weeks: R.pipe(
          R.chain(R.prop('weeks')),
          R.sortBy(R.identity)
        )(meetingsByWeek)
      }))
    ))
  )(meetings)

  const content = directory(entitiesByType)

  return renderPage(content)
  */
}

function renderEntity(val, key) {
  if (!val.length) return ''

  return (
    h('div', [
      h('h4', key),
      h('ul', val.map(({ fragment, roles, label }) => (
        h('li', [
          h('a', { href: `directory.html#${fragment}` }),
          roles.size === 0 ? null : h('span.entity-role', [
            '(',
            [...roles].join(', '),
            ')',
          ]),
        ])
      )))
    ])
  )
}

function renderMeeting({ store, bibliography, entities }) {
  return async meeting => {
    const renderScheduleItem = async $scheduleItem => {
      const bibItem = bibliography[$scheduleItem.id]

      let ret

      if (bibItem) {
        // Trim start and end tags of bibliography
        let { html, csl: { URI }} = bibItem

        html = html.split('\n').slice(1,-1).join('\n')

        // Make DOI links clickable
        html = html
          .replace(/(https:\/\/doi.org\/(.*?))<\/div>/, (_, url, doi) =>
            `<a href="${url}">doi:${doi.replace(/(\W)+/g, '<wbr>$1</wbr>')}</a></div>`)

        // Add "Retrieved from" URL if available and there is no URI in the citation
        if (URI && html.slice(-7) === '.</div>') {
          html = (
            html.slice(0, -6) +
            ` Retrieved from <a href="${URI}">${encodeURIComponent(URI)}</a>.</div>`
          )
        }

        ret = html
      } else {
        const description = getFirstObjectLiteral(store, $scheduleItem, 'dc:description')

        if (description) {
          ret = `<div>${description}</div>`
        } else {
          ret = '<p style="background-color: red;">Missing citation</p>'
        }
      }

      return new Promise((resolve, reject) => toHyperscript(ret.trim(), (err, tree) => {
        if (err) {
          reject(err)
        }

        resolve(eval(tree))
      }))
    }

    const scheduleHTML = await Promise.all(meeting.schedule.map(renderScheduleItem))

    const entitiesHTML = R.pipe(
      R.map(({ term, roles }) => {
        const entity = entities[term.id]

        return {
          roles,
          categoryLabel: entity.categoryLabel,
          label: entity.label,
          fragment: R.last(term.id.split('#'))
        }
      }),
      R.groupBy(R.prop('categoryLabel')),
      R.mapObjIndexed(renderEntity),
      R.values
    )(meeting.entities)

    return (
      h('div.meeting', {
        id: meeting.node.id.split('#')[1]
      }, [
        h('.meeting--date', timeFormat('%A, %B %e, %Y')(meeting.date)),

        h('.meeting--schedule', scheduleHTML),

        h('.meeting-entities', entitiesHTML),
      ])
    )
  }
}

async function renderMain(grist) {
  const meetings = await Promise.all(
    grist.meetings.slice(0, 6).map(renderMeeting(grist)))

  return renderPage(
    h('div', [
      h('section#about', [
        h('p', [
          'ORG is a reading group at UNC Chapel Hill that meets Fridays at 11am in 214 Manning Hall.',
        ]),

        h('p', [
          h('a', {
            href: 'mailto:listmanager@listserv.unc.edu?body=subscribe%20org',
          }, 'Subscribe'),
          'to our email list for announcements and general discussion.',
        ])
      ]),

      h('section#current', [
        h('h2', 'Current meeting'),
        meetings[0],
      ]),

      h('section#recent', [
        h('h2#recent', 'Recent meetings'),
        meetings.slice(1),
      ]),

    ])
  )
}

function directory(entitiesByType) {
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

function renderPage(page) {
  const now = new Date()
      , lastUpdated = `${now.getFullYear()}-${zeroPad(now.getMonth() + 1)}-${zeroPad(now.getDate())}`

  const doc = (
    h('html', [
      h('head', [
        h('meta', { charset: 'utf-8' }),
        h('link', { rel: 'stylesheet', href: 'org.css' }),
        h('title', 'The Organization Research Group'),
      ]),

      h('body', [
        h('header', [
          h('h1', [].concat('The ', 'Organization Research Group'.split('').map(letter => {
            let classNames = ''

            if (letter.match(/[ORG]/)) classNames += '.org-firstletter'
            if (letter.match(/[oO]/)) classNames += '.org-o'
            if (letter.match(/[rR]/)) classNames += '.org-r'
            if (letter.match(/[gG]/)) classNames += '.org-g'

            if (classNames) {
              return h('span' + classNames, letter)
            } else {
              return letter
            }
          }))),

          h('nav', [
            h('ul', [
              h('li', h('a', { href: 'index.html' }, 'Home')),
              h('li', h('a', { href: 'archive.html' }, 'Archive')),
              h('li', h('a', { href: 'directory.html' }, 'Index')),
            ]),
          ])
        ]),

        h('main', page),

        h('footer', [
          'Last updated ',
          lastUpdated,
        ]),

        h('script', { type: 'text/javascript', src: 'org.js' }),
      ]),

    ])
  )

  return pretty('<!doctype html>' + doc.outerHTML)
}
