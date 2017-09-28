"use strict";

const fs = require('fs')
    , path = require('path')
    , N3 = require('n3')
    , literalValue = N3.Util.getLiteralValue
    , { isType, rdfListToArray, ns, getDCContainer, one } = require('./rdf')

const BIB_FILE = path.join(__dirname, '..', 'bib.ttl')


const bibRDFTypes = {
  'bibo:BookSection': bookSection,
  'bibo:AcademicArticle': academicArticle,
  'bibo:Book': book,
  ':ConferencePaper': conferencePaper,
}


main().catch(
  err => {
    process.stderr.write('Uncaught: ' + err.stack + '\n');
    process.exit(1);
  }
)

function bookSection(store, uri) {
  const $chapter = uri
      , $book = getDCContainer(store, $chapter)

  const [ $publisher ] = store
    .getObjects($book, 'dc:publisher')
    .filter(isType(store, 'foaf:Organization'))

  return {
    type: 'chapter',
    agentFields: ['author', 'editor'],
    dateFields: ['issued'],
    fields: {
      title: [$chapter, 'dc:title'],
      page: [$chapter, 'bibo:pages'],
      URI: [$chapter, 'bibo:uri'],
      DOI: [$chapter, 'bibo:doi'],
      author: [$chapter, 'bibo:authorList'],
      'container-title': [$book, 'dc:title'],
      issued: [$book, 'dc:date'],
      editor: [$book, 'bibo:editorList'],
      publisher: [$publisher, 'foaf:name'],
      'publisher-place': [$publisher, 'address:localityName'],
    },
  }
}

function academicArticle(store, uri) {
  const $article = uri
      , $issue = getDCContainer(store, $article)
      , $journal = getDCContainer(store, $issue)

  return {
    type: 'article-journal',
    agentFields: ['author'],
    dateFields: ['issued'],
    fields: {
      title: [$article, 'dc:title'],
      page: [$article, 'bibo:pages'],
      URI: [$article, 'bibo:uri'],
      DOI: [$article, 'bibo:doi'],
      author: [$article, 'bibo:authorList'],
      'container-title': [$journal, 'dc:title'],
      issued: [$issue, 'dc:date'],
      volume: [$issue, 'bibo:volume'],
      issue: [$issue, 'bibo:issue'],
    },
  }
}

function book(store, uri) {
  const $book = uri

  const [ $publisher ] = store
    .getObjects($book, 'dc:publisher')

  return {
    type: 'book',
    agentFields: ['author'],
    dateFields: ['issued'],
    fields: {
      title: [$book, 'dc:title'],
      page: [$book, 'bibo:pages'],
      URI: [$book, 'bibo:uri'],
      DOI: [$book, 'bibo:doi'],
      author: [$book, 'bibo:authorList'],
      issued: [$book, 'dc:date'],
      publisher: [$publisher, 'foaf:name'],
      'publisher-place': [$publisher, 'address:localityName'],
    },
  }
}

function conferencePaper(store, uri) {
  const $paper = uri
      , $conference = one(store, $paper, 'bibo:presentedAt', null).object
      , $proceedings = one(store, $paper, 'bibo:reproducedIn', null).object
      , $publisher = one(store, $proceedings, 'dc:publisher', null).object

  return {
    type: 'paper-conference',
    agentFields: ['author'],
    dateFields: ['issued'],
    fields: {
      title: [$paper, 'dc:title'],
      'container-title': [$proceedings, 'dc:title'],
      'collection-title': [$conference, 'dc:title'],
      'event-place': [$conference, 'address:localityName'],
      publisher: [$publisher, 'foaf:name'],
      'publisher-place': [$publisher, 'address:localityName'],
      page: [$paper, 'bibo:pages'],
      URI: [$paper, 'bibo:uri'],
      DOI: [$paper, 'bibo:doi'],
      author: [$paper, 'bibo:authorList'],
      issued: [$proceedings, 'dc:date'],
    },
  }
}















async function main() {
  const store = await new Promise((resolve, reject) => {
    const store = N3.Store()
        , parser = N3.Parser()

    parser.parse(fs.createReadStream(BIB_FILE), (err, triple, prefixes) => {
      if (err) reject(err)

      if (triple) {
        store.addTriple(triple)
      }

      if (prefixes) {
        store.addPrefixes(prefixes)
        resolve(store)
      }
    })
  })

  const csl = Object.entries(bibRDFTypes).reduce((acc=[], [rdfType, fn]) =>
    acc.concat(
      store
        .getSubjects('rdf:type', rdfType)
        .map(uri => {
          const def = fn(store, uri)

          return execCSLDefinition(store, uri, def)
        })
    )
  , [])

  process.stdout.write(JSON.stringify(csl, true, '  ') + '\n')
}


function execCSLDefinition(store, uri, def) {
  const csl = {
    id: uri.split(':').slice(-1)[0],
    type: def.type,
  }

  Object.entries(def.fields).forEach(([cslKey, [s, p]]) => {
    const [ o ] = store.getObjects(s, p)

    if (o) {
      csl[cslKey] = o;
    }
  })

  def.agentFields.forEach(field => {
    const agents = rdfListToArray(store, csl[field]).map(uri => {
      const agent = {}

      store.forEach(({ predicate, object }) => {
        if (predicate === ns`foaf:name`) agent.name = literalValue(object);
        if (predicate === ns`foaf:givenname`) agent.given = literalValue(object);
        if (predicate === ns`foaf:surname`) agent.family = literalValue(object);
      }, uri)

      return agent
    })

    csl[field] = agents;
  })

  Object.entries(csl).forEach(([k, v]) => {
    if (N3.Util.isLiteral(v)) csl[k] = literalValue(v)
  })

  csl.issued = { raw: csl.issued }

  return csl
}
