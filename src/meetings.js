"use strict";

const R = require('ramda')
    , N3 = require('n3')
    , { expandNS, getFirstObjectLiteral } = require('./rdf')
    , { rdfListToArray } = require('org-n3-utils')

function fragmentOf(uri) {
  return uri.value.replace(/.*\/graph/, '')
}

/*
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
*/

function makeReadingsHTML(store, bib, readings) {
  const readingsHTML = readings.map(item => {
    let ret

    const bibID = item.value.split(':').slice(-1)[0]
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

const entityTypes = {
  People: {
    uri: expandNS('foaf:Person'),
    label: (store, term) => ([
      getFirstObjectLiteral(store, term, 'foaf:givenname'),
      getFirstObjectLiteral(store, term, 'foaf:surname'),
    ]).filter(R.identity).join(' ')
  },
  Journals: {
    uri: expandNS('bibo:Journal'),
    label: (store, term) => getFirstObjectLiteral(store, term, 'dc:title'),
  },
  Conferences: {
    uri: expandNS('bibo:Conference'),
    label: (store, term) => getFirstObjectLiteral(store, term, 'dc:title'),
  },
  Publishers: {
    uri: expandNS(':Publisher'),
    label: (store, term) => getFirstObjectLiteral(store, term, 'dc:title'),
  },
}

function getEntities(store) {
  const ret = {}

  return [].concat(...Object.entries(entityTypes).map(([key, { uri }]) =>
    store.getSubjects(expandNS('rdf:type'), uri).map(term => {
      return { key, term }
    })
  )).map(({ key, term }) => {
    const ret = {
      key,
      id: term.value,
      label: entityTypes[key].label(store, term),
    }

    return ret
  })
}

async function resolveObj(obj) {
  const pairs = await Promise.all(
    Object.entries(obj).map(([k, v]) => Promise.resolve(v).then(v => [k, v]))
  )

  return R.fromPairs(pairs)
}

function getMeetingTime(store, meetingURI) {
  try {
    const [ interval ] = store.getObjects(meetingURI, expandNS('lode:atTime'))
        , [ beginning ] = store.getObjects(interval, expandNS('time:hasBeginning'))
        , [ dateStamp ] = store.getObjects(beginning, expandNS('time:inXSDDateTimeStamp'))

    return dateStamp

  } catch (e) {
    throw new Error(
      `Triples for meeting time of ${meetingURI.value} are incorrectly defined.`
    )
  }
}

function makeSubGraphFrom(store, nodes) {
  const newStore = N3.Store()
      , subjs = [...nodes]

  while (subjs.length) {
    const subj = subjs.shift()

    store.getQuads(subj).forEach(quad => {
      const searchForObject = (
        newStore.addQuad(quad) && (
          N3.Util.isNamedNode(quad.object) || 
          N3.Util.isBlankNode(quad.object)
        )
      )

      if (searchForObject) {
        subjs.push(quad.object)
      }
    })
  }

  return newStore
}

module.exports = async function getMeetings(store, bib) {
  const meetings = store
    .getObjects(null, expandNS(':meeting'))
    .map(meetingURI => {
      const [ schedule ] = store.getObjects(meetingURI, expandNS(':schedule'))

      return {
        meetingURI,
        at: getMeetingTime(store, meetingURI),
        schedule: rdfListToArray(store, schedule),
      }
    })

  return Promise.all(meetings.map(async meeting => {
    const { schedule, at } = meeting

    const html = R.pipe(
      R.groupWith((a, b) => a.termType === b.termType),
      R.transduce(
        R.map(list =>
          list[0].termType === 'NamedNode'
            ? makeReadingsHTML(store, bib, list)
            : ''
          /*
            : list.map(R.pipe(
                bNode => store.getObjects(bNode, expandNS('dc:description')),
                R.first,
                term => `<p>${term.value}</p>`
              )).join('\n')
              */
        ),
        R.concat,
        '',
      )
    )(schedule)

    const meetingFragment = fragmentOf(meeting.meetingURI);

    const entities = await R.pipe(
      meetingURI => store.getObjects(meetingURI, expandNS('lode:involved')),
      involvedURIs => makeSubGraphFrom(store, involvedURIs),
      getEntities
    )(meeting.meetingURI)

    /*
    const entities = await R.pipe(
      involved => ({ '@graph': involved, '@context': context }),
      ld => R.map(({ frame, label }) =>
        jsonld.promises.frame(ld, Object.assign({ '@context': context }, frame))
          .then(data => data['@graph'].map(item => ({
            label: label(item),
            id: fragmentOf(item),
            externalLink: (item['foaf:homepage'] || item['foaf:workInfoHomepage'] || item['foaf:page'] || {})['@id'],
            meetingLink: 'archive.html#' + meetingFragment,
            ld: item,
          })))
      )(entityDefinitions),
      resolveObj
    )([].concat(meeting['lode:involved'] || []))
    */

    return {
      fragment: meetingFragment,
      date: new Date(at.value),
      entities,
      html,
    }
  }))
}
