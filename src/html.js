"use strict";

const R = require('ramda')
    , h = require('hyperscript')
    , toHyperscript = require('html2hscript')
    , { timeFormat } = require('d3-time-format')
    , pretty = require('pretty')
    , { Util: { isNamedNode }} = require('n3')
    , { getFirstObjectLiteral } = require('./rdf')

module.exports = {
  renderMain,
  renderArchive,
  renderDirectory,
  renderMeeting,
}

function zeroPad(num) {
  return num.toString().padStart(2, '0')
}

function renderEntity(val, key) {
  if (!val.length) return ''

  return (
    h('div', [
      h('h4', key),
      h('ul', val.map(({ fragment, roles, label }) => (
        h('li', [
          h('a', { href: `directory.html#${fragment}` }, label),
          roles.size === 0 ? null : h('span.entity-role', [
            ' (',
            [...roles].join(', '),
            ')',
          ]),
        ])
      )))
    ])
  )
}

function renderLinks(links) {
  if (!links.length) return null

  return (
    h('div', [
      h('h4', 'Links posted in meeting'),
      h('ul', links.map(href => (
        h('li', [
          h('a', { href }, href),

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
            ` Retrieved from <a href="${URI}">${URI}</a>.</div>`
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

    const linksHTML = renderLinks(meeting.links)

    return (
      h('div.meeting', {
        id: meeting.node.id.split('#')[1]
      }, [
        h('h3.meeting--date', timeFormat('%A, %B %e, %Y')(meeting.date)),

        h('.meeting--schedule', scheduleHTML),

        h('.meeting--links', linksHTML),

        h('.meeting--entities', entitiesHTML),
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
          'ORG is a reading group at UNC Chapel Hill that meets Fridays at 11:00am ',
          h('strike', 'in 214 Manning Hall or'),
          ' via ',
          h('a', {
            href: 'https://unc.zoom.us/j/990002258',
          }, 'Zoom'),
          '.'
        ]),

        h('p', [
          h('a', {
            href: 'mailto:listmanager@listserv.unc.edu?body=subscribe%20org',
          }, 'Subscribe'),
          ' to our email list for announcements and general discussion.',
        ])
      ]),

      h('section#current', [
        h('h2', 'Next meeting'),
        meetings[0],
      ]),

      h('section#recent', [
        h('h2#recent', 'Recent meetings'),
        meetings.slice(1),
      ]),

    ])
  )
}

function renderDirectory(grist) {
  const entitiesWithWeeks = R.transduce(
    R.map(R.pipe(
      meeting => meeting.entities.map(entity => ({
        meetingURI: meeting.uri,
        entity: entity.term.id,
      })),
      R.groupBy(R.prop('entity')),
      R.map(R.applySpec({
        weeks: R.map(R.prop('meetingURI')),
      }))
    )),
    R.mergeDeepWith(R.concat),
    grist.entities,
    grist.meetings
  )

  const htmlByType = R.pipe(
    R.values,
    R.filter(({ node }) => isNamedNode(node)),
    R.groupBy(R.prop('categoryLabel')),
    R.map(R.sortBy(R.prop('uri'))),
    // FIXME: weeks should always be populated
    R.map(R.map(({ uri, label, weeks=[], homepage }) =>
      h('div#' + uri.split('#')[1], [
        h('h3', label),
        homepage && h('a.external', { href: homepage.id }, 'Homepage'),
        h('ul', weeks.map(week =>
          h('li', [
            h('a', { href: week }, week.split(':')[1]),
          ])
        ))
      ])
    ))
  )(entitiesWithWeeks)

  return renderPage(
    h('section#index', [
      h('div', [
        h('h2', 'People'),
        htmlByType.People,
      ]),

      h('div', [
        h('h2', 'Journals'),
        htmlByType.Journals,
      ]),

      h('div', [
        h('h2', 'Conferences'),
        htmlByType.Conferences,

        h('h2', 'Publishers'),
        htmlByType.Publishers,
      ])
    ])
  )
}

async function renderArchive(grist) {
  const meetings = await Promise.all(
    grist.meetings.map(renderMeeting(grist)))

  return renderPage(
    h('section', meetings)
  )
}

function renderPage(page) {
  const now = new Date()
      , lastUpdated = `${now.getFullYear()}-${zeroPad(now.getMonth() + 1)}-${zeroPad(now.getDate())}`

  const doc = (
    h('html', [
      h('head', [
        h('meta', { charset: 'utf-8' }),
        h('link', { rel: 'stylesheet', href: 'org.css' }),
        h('link', { rel: 'alternate', href: 'feed.json', type: 'application/json' }),
        h('title', 'The Organization Research Group'),
      ]),

      h('body', [
        h('.content-wrapper', [
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
            h('div', [
              'Last updated ',
              lastUpdated,
            ]),

            h('div', [
              h('a', { href: 'graph.ttl' }, 'Graph'),
              h('a', { href: 'feed.json' }, 'Feed'),
            ])
          ]),
        ]),

        // h('script', { type: 'text/javascript', src: 'org.js' }),
      ]),

    ])
  )

  return pretty('<!doctype html>' + doc.outerHTML)
}
