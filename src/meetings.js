"use strict";

const R = require('ramda')
    , { expandNS, getFirstObject, makeSubgraphFrom } = require('./rdf')
    , { rdfListToArray } = require('org-n3-utils')
    , entityDefs = require('./entities').definitions

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

exports.generate = async function getMeetings(store) {
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

    let links = []

    const linksNode = getFirstObject(store, meetingNode, ':postedLinks')

    if (linksNode) {
      links = rdfListToArray(store, linksNode).map(linkNode => linkNode.id)
    }

    meetings.push({
      links,
      uri: 'archive.html#' + meetingNode.value.split('#')[1],
      node: meetingNode,
      schedule,
      date: getMeetingDate(store, meetingNode),
      entities: [...entities.values()],
    })
  }))

  return R.sortBy(d => d.date.getTime(), meetings).reverse()
}
