"use strict";

const R = require('ramda')

const prefixes = {
  '': 'http://orgorgorgorgorg.org/graph#',
  address: 'http://schemas.talis.com/2005/address/schema#',
  bibo: 'http://purl.org/ontology/bibo/',
  dc: 'http://purl.org/dc/terms/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  lode: 'http://linkedevents.org/ontology/',
  orcid: 'http://orcid.org/',
  owl: 'http://www.w3.org/2002/07/owl#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  time: 'http://www.w3.org/2006/time#',
  viaf: 'http://viaf.org/viaf/',
  wd: 'http://www.wikidata.org/entity/',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
}

function ns(str) {
  const [ns, rest] = [].concat(str)[0].split(':')
  return prefixes[ns] + rest
}

function isType(store, type, uri) {
  return store.some(R.T, uri, 'rdf:type', type)
}


function rdfListToArray(store, rootNode) {
  const els = []

  let currentNode = rootNode

  do {
    const [ el ] = store.getTriples(currentNode, 'rdf:first', null)
        , [ tail ] = store.getTriples(currentNode, 'rdf:rest', null)

    if (!el || !tail) throw new Error(`${currentNode} is not a node in a linked list.`)

    els.push(el.object);
    currentNode = tail;
  } while (currentNode.object !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')

  return els;
}

function getDCContainer(store, uri) {
  const [ ret ] = store.getObjects(uri, 'dc:isPartOf')
  return ret || null;
}

function one(store, s, p, o) {
  let ret

  store.some(triple => {
    ret = triple;
  }, s, p, o)

  if (!ret) {
    throw new Error(`No matching triple in store: ${s}, ${p}, ${o}`);
  }

  return ret;
}

module.exports = {
  prefixes,
  ns,
  isType: R.curry(isType),
  rdfListToArray: R.curry(rdfListToArray),
  getDCContainer: R.curry(getDCContainer),
  one: R.curry(one),
}
