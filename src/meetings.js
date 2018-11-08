"use strict";

const R = require('ramda')
    , { expandNS, getFirstObject, getFirstObjectLiteral, makeSubgraphFrom } = require('./rdf')
    , { rdfListToArray, findOne } = require('org-n3-utils')
    , entityDefs = require('./entities').definitions

function fragmentOf(uri) {
  return (uri.value || uri.id).replace(/.*\/graph/, '')
}

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

function getMeetingDate(store, meetingURI) {
  try {
    const [ interval ] = store.getObjects(meetingURI, expandNS('lode:atTime'))
        , [ beginning ] = store.getObjects(interval, expandNS('time:hasBeginning'))
        , [ dateStamp ] = store.getObjects(beginning, expandNS('time:inXSDDateTimeStamp'))

    return new Date(dateStamp.value)

  } catch (e) {
    throw new Error(
      `Triples for meeting time of ${meetingURI.value} are incorrectly defined.`
    )
  }
}


    /*
    const html = R.pipe(
      R.groupWith((a, b) => a.termType === b.termType),
      R.transduce(
        R.map(list =>
          list[0].termType === 'NamedNode'
            ? makeReadingsHTML(store, bib, list)
            : list.map(R.pipe(
                bNode => findOne(store, bNode, expandNS('dc:description')),
                term => `<p>${term.object.value}</p>`
              )).join('\n')
        ),
        R.concat,
        '',
      )
    )(schedule)
    */

exports.generate = async function getMeetings(store, bib) {
  const meetingNodes = store.getObjects(null, expandNS(':meeting'))
      , meetings = []

  await Promise.all(meetingNodes.map(async meetingNode => {
    const scheduleNode = getFirstObject(store, meetingNode, ':schedule')
        , schedule = rdfListToArray(store, scheduleNode)
        , subgraph = await makeSubgraphFrom(store, schedule)
        , entities = new Map()

    const add = (entityTerm, role) => {
      if (!entities.has(entityTerm.id)) {
        entities.set(entityTerm.id, {
          term: entityTerm,
          roles: new Set()
        })
      }

      if (role) {
        entities.get(entityTerm.id).roles.add(role)
      }
    }

    // Add authors one at a time (to preserve order), from authorList predicate
    subgraph.getObjects(null, expandNS('bibo:authorList')).forEach(listNode => {
      rdfListToArray(subgraph, listNode).forEach(author => {
        add(author, 'author')
      })
    })

    // Then add editors from editorList predicate
    subgraph.getObjects(null, expandNS('bibo:editorList')).forEach(listNode => {
      rdfListToArray(subgraph, listNode).forEach(editor => {
        add(editor, 'editor')
      })
    })

    // Then add all matching entities from the subgraph
    Array.from(entityDefs.keys()).forEach(entityType => {
      subgraph.getSubjects(expandNS('rdf:type'), entityType).forEach(entity => {
        add(entity)
      })
    })

    meetings.push({
      node: meetingNode,
      schedule,
      date: getMeetingDate(store, meetingNode),
      entities: [...entities.values()],
    })
  }))

  return R.sortBy(d => d.date.getTime(), meetings).reverse()
}
