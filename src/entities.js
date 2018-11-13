"use strict";

const R = require('ramda')
    , { expandNS, getFirstObject, getFirstObjectLiteral } = require('./rdf')

const entityDefs = exports.definitions = new Map([
  [expandNS('foaf:Person'), {
    categoryLabel: 'People',
    label: (store, term) => ([
      getFirstObjectLiteral(store, term, 'foaf:givenname'),
      getFirstObjectLiteral(store, term, 'foaf:surname'),
    ]).filter(R.identity).join(' '),

    homepage: (store, term) => (
      getFirstObject(store, term, expandNS('foaf:homepage')) ||
      getFirstObject(store, term, expandNS('foaf:workInfoHomepage'))
    )
  }],

  [expandNS('bibo:Journal'), {
    categoryLabel: 'Journals',
    label: (store, term) => getFirstObjectLiteral(store, term, 'dc:title'),
    homepage: (store, term) => getFirstObject(store, term, expandNS('foaf:homepage')),
  }],

  [expandNS('bibo:Conference'), {
    categoryLabel: 'Conferences',
    label: (store, term) => getFirstObjectLiteral(store, term, 'dc:title'),
    homepage: (store, term) => getFirstObject(store, term, expandNS('foaf:homepage')),
  }],

  [expandNS(':Publisher'), {
    categoryLabel: 'Publishers',
    label: (store, term) => getFirstObjectLiteral(store, term, 'foaf:name'),
    homepage: (store, term) => getFirstObject(store, term, expandNS('foaf:homepage')),
  }],
])

exports.generate = function getEntities(store, meetings) {
  const entities = {}

  Array.from(entityDefs).forEach(([ typeNode, def ]) => {
    store.getSubjects(expandNS('rdf:type'), typeNode).forEach(entityNode => {
      const entity = {
        uri: 'directory.html#' + entityNode.value.split('#')[1],
        node: entityNode,
        type: typeNode,
      }

      Object.entries(def).forEach(([ key, fn ]) => {
        if (typeof fn === 'string') {
          entity[key] = fn
        } else {
          entity[key] = fn(store, entityNode)
        }
      })

      entities[entityNode.id] = entity
    })
  })

  return entities
}
