"use strict";

const Type = require('union-type')

const CSLField = Type({ CSLField: {
  cslKey: String,
  subject: String,
  predicate: String,
  required: Boolean,
}})

const field = CSLField.CSLFieldOf.bind(CSLField)

const isType = R.curry(function(store, type, uri) {
  return store.countTriples(uri, 'rdf:type', type) > 0
})

function bookSection(store) {
  const bookSections = store.getSubjects('rdf:type', ':BookSection')

  return bookSections.map(bookSection.bind(null, store))
}

function bookSection(store, $chapter) {
  const [ $book ] = store
    .getObjects($chapter, 'dc:isPartOf')
    .filter(isType(store, 'bibo:EditedBook'))

  const [ $publisher ] = store
    .getObjects($book, 'dc:publisher')
    .filter(isType(store, 'bibo:Publisher'))

  const fields = {
    [$chapter]: {
      title: 'dc:title',
      page: 'bibo:pages',
      URI: 'bibo:uri',
      DOI: 'bibo:doi',
      author: 'bibo:authorList',
    },

    [$book]: {
      'container-title': 'dc:title',
      issued: 'dc:date',
      editor: 'bibo:editorList',
    },

    [$publisher]: {
      publisher: 'foaf:name',
      'publisher-place': 'address:localityName',
    },
  }

  const csl = {}

  Object.entries(fields).forEach(([s, obj]) =>
    Object.entries(obj).forEach((cslKey, p) => {
      store.forObjects(o => {
        const [ key, type ] = cslKey.split('_')

        if (type === 'list') {
        }

        csl[cslKey] = o
      }, s, p)
    }))

  csl.editor = urisInList(csl.editor).map(formatName)
  csl.author = urisInList(csl.author).map(formatName)
  csl.issued = { raw: csl.issued }

  return csl
}

function rdfListToArray(store, rootNode) {
  const els = []

  let currentNode = rootNode

  do {
    const [ el ] = store.getTriples(currentNode, 'rdf:first', null)
        , [ tail ] = store.getTriples(currentNode, 'rdf:rest', null)

    if (!el || !tail) throw new Error(`${currentNode} is not a node in a linked list.`)

    els.push(el);
    currentNode = tail;
  } while (currentNode !== 'rdf:nil') // FIXME: gotta expand this

  return els;
}
