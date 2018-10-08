"use strict";

const R = require('ramda')
    , N3 = require('n3')
    , ns = require('lov-ns')
    , jsonld = require('jsonld')
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

async function toJSONLD(store, frame) {
  const ntriples = await new Promise((resolve, reject) => {
    const writer = N3.Writer({ format: 'N-Triples' })
    store.forEach(t => writer.addTriple(t))
    writer.end((err, doc) => {
      if (err) reject(err)
      resolve(doc)
    })
  })

  let ret = await jsonld.promises.fromRDF(ntriples)

  if (frame) {
    ret = await jsonld.promises.frame(ret, frame)
  }

  return ret;
}

function getFirstObjectLiteral(store, s, p) {
  if (typeof p === 'string') {
    p = expandNS(p)
  }

  const [ object ] = store.getObjects(s, p)

  if (!object || !N3.Util.isLiteral(object)) return null

  return object.value
}


module.exports = {
  expandNS,
  getFirstObjectLiteral,
  toJSONLD: R.curry(toJSONLD),
  isType: R.curry(isType),
  getDCContainer: R.curry(getDCContainer),
}
