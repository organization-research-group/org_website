"use strict";

const R = require('ramda')
    , N3 = require('n3')
    , ns = require('lov-ns')
    , { findOne, nsExpander } = require('org-n3-utils')

const expandNS = nsExpander({
  '': 'http://orgorgorgorgorg.org/graph#',
  address: 'http://schemas.talis.com/2005/address/schema#',
  orcid: 'http://orcid.org/',
  viaf: 'http://viaf.org/viaf/',
  wd: 'http://www.wikidata.org/entity/',

  bibo: ns.bibo,
  dc: ns.dcterms,
  foaf: ns.foaf,
  lode: ns.lode,
  owl: ns.owl,
  rdf: ns.rdf,
  rdfs: ns.rdfs,
  time: ns.time,
  xsd: ns.xsd,
})

function isType(store, type, uri) {
  return store.some(R.T, uri, expandNS('rdf:type'), type)
}

function getDCContainer(store, uri) {
  const container = findOne(store, uri, expandNS('dc:isPartOf'))

  return container && container.object
}

function getFirstObjectLiteral(store, s, p) {
  if (typeof p === 'string') {
    p = expandNS(p)
  }

  const [ object ] = store.getObjects(s, p)

  if (!object || !N3.Util.isLiteral(object)) return null

  return object.value
}

// Given a store and one or more nodes, return a new store that is a subset of
// the original. The new graph is constructed by starting with all the
// statements in the original graph where the given nodes are subjects. The
// original graph is then re-traversed to find all the statements where those
// objects are subjects, and so on, until all matching statements are exhausted.
function makeSubgraphFrom(store, nodes) {
  const newStore = N3.Store()
      , subjs = [...[].concat(nodes)]

  const seen = [...store.seen]
      , subSeen = []

  while (subjs.length) {
    const subj = subjs.shift()

    subSeen.push(subj.value)

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

  const s = []

  seen.forEach(v => {
    if (subSeen.includes(v)) s.push(v)
  })

  newStore.seen = s

  return newStore
}

module.exports = {
  expandNS,
  makeSubgraphFrom: R.curry(makeSubgraphFrom),
  getFirstObjectLiteral,
  isType: R.curry(isType),
  getDCContainer: R.curry(getDCContainer),
}
