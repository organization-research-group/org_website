"use strict";

const R = require('ramda')
    , jsonld = require('jsonld')
    , { toJSONLD, context } = require('./rdf')

function fragmentOf(uri) {
  const id = typeof uri === 'object'
    ? uri['@id']
    : uri

  if (!id) {
    throw new Error(`${uri} does not have an associated URI`)
  }

  return id.replace(/^org:/, '')
}

const frame = {
  '@context': Object.assign({}, context, {
    schedule: {
      '@type': '@id',
      '@container': '@list',
      '@id': 'org:schedule',
    },
    at: {
      '@id': 'lode:atTime',
      '@type': '@id',
    },
    beginning: {
      '@id': 'time:hasBeginning',
      '@type': '@id',
    },
    datetime: {
      '@id': 'time:inXSDDateTimeStamp',
      '@type': 'xsd:dateTimeStamp',
    },
    description: 'dc:description'
  }),
  '@explicit': true,
  '@type': 'org:Meeting',
  'schedule': {},
  'lode:involved': {
    '@embed': '@always'
  },
  'at': {
    beginning: {
      datetime: {},
    }
  },
}

const agentFrame = {
  '@context': Object.assign({
    'sameAs': {
      '@id': 'owl:sameAs',
      '@type': '@id',
    },
    'homepage': {
      '@id': 'foaf:homepage',
      '@type': '@id',
    },
    'workpage': {
      '@id': 'foaf:workInfoHomepage',
      '@type': '@id',
    }
  }, context),
  '@type': 'foaf:Person',
}

function makeReadingsHTML(store, bib, readings) {
  const readingsHTML = readings.map(item => {
    let ret

    const bibID = item['@id'].split(':').slice(-1)[0]
        , bibItem = bib.get(bibID)

    if (!bibItem) {
      ret = `<div style="background-color: red;">Missing citation</div>`
    } else {
      ret = bibItem
        .split('\n').slice(1,-1).join('\n')
        .replace(/(https:\/\/doi.org\/(.*?))<\/div>/, (_, url, doi) =>
          `<a href="${url}">doi:${doi}</a></div>`)

      if (ret.slice(-7) === '.</div>' && item['bibo:uri']) {
        ret = `${ret.slice(0, -6)} Retrieved from <a href="${item['bibo:uri']}">${item['bibo:uri']}</a>.`
      }


    }

    return `<li>${ret}</li>`
  })

  return`<ul class="reading-list">${readingsHTML.join('')}</ul>`
}

module.exports = async function getMeetings(store, bib) {
  const ld = await toJSONLD(store, frame)

  const meetings = ld['@graph']

  return Promise.all(meetings.map(async meeting => {
    const { schedule, at } = meeting

    const html = R.pipe(
      R.groupWith((a, b) => a['@type'] === b['@type']),
      R.transduce(
        R.map(list =>
          [].concat(list[0]['@type']).includes('org:Reading')
            ? makeReadingsHTML(store, bib, list)
            : list.map(({ description }) => `<div>${description}</div>`)),
        R.concat,
        '',
      )
    )(schedule)

    const involved = [].concat(meeting['lode:involved'] || [])

    const agents = await jsonld.promises.frame({
      '@context': context,
      '@graph': [].concat(meeting['lode:involved'] || [])
    }, agentFrame)

    const fragment = fragmentOf(meeting);

    return {
      fragment,
      date: new Date(at.beginning.datetime),
      agents: agents['@graph'].map(a => Object.assign({
        fragment
      }, a)),
      html,
    }
  }))
}
