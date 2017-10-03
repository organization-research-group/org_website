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

function makeReadingsHTML(store, bib, readings) {
  const readingsHTML = readings.map(item => {
    let ret

    const bibID = item['@id'].split(':').slice(-1)[0]
        , bibItem = bib.get(bibID)

    if (!bibItem) {
      ret = `<p style="background-color: red;">Missing citation</p>`
    } else {
      ret = bibItem
        .split('\n').slice(1,-1).join('\n')
        .replace(/(https:\/\/doi.org\/(.*?))<\/div>/, (_, url, doi) =>
          `<a href="${url}">doi:${doi.replace(/(\W)+/g, '<wbr>$1</wbr>')}</a></div>`)

      if (ret.slice(-7) === '.</div>' && item['bibo:uri']) {
        ret = `${ret.slice(0, -6)} Retrieved from <a href="${item['bibo:uri']}">${item['bibo:uri']}</a>.</div>`
      }


    }

    return `${ret}`
  })

  return readingsHTML.join('')
}

const entityDefinitions = {
  People: {
    frame: {
      '@type': 'foaf:Person',
    },
    label: d => `${d['foaf:givenname']} ${d['foaf:surname']}`,
  },

  Journals: {
    frame: {
      '@type': 'bibo:Journal',
    },
    label: R.prop('dc:title'),
  },

  Conferences: {
    frame: {
      '@type': 'bibo:Conference',
    },
    label: R.prop('dc:title'),
  },

  Publishers: {
    frame: {
      '@type': 'org:Publisher',
    },
    label: R.prop('foaf:name'),
  }
}

async function resolveObj(obj) {
  const pairs = await Promise.all(
    Object.entries(obj).map(([k, v]) => Promise.resolve(v).then(v => [k, v]))
  )

  return R.fromPairs(pairs)
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
            : list.map(({ description }) => `<p>${description}</p>`)),
        R.concat,
        '',
      )
    )(schedule)

    const meetingFragment = fragmentOf(meeting);

    const entities = await R.pipe(
      involved => ({ '@graph': involved, '@context': context }),
      ld => R.map(({ frame, label }) =>
        jsonld.promises.frame(ld, Object.assign({ '@context': context }, frame))
          .then(data => data['@graph'].map(item => ({
            label: label(item),
            id: fragmentOf(item),
            externalLink: (item['foaf:homepage'] || item['foaf:workInfoHomepage'] || {})['@id'],
            meetingLink: 'archive.html#' + meetingFragment,
            ld: item,
          })))
      )(entityDefinitions),
      resolveObj
    )([].concat(meeting['lode:involved'] || []))

    return {
      fragment: meetingFragment,
      date: new Date(at.beginning.datetime),
      entities,
      html,
    }
  }))
}
