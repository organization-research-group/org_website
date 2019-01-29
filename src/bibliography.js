"use strict";

const N3 = require('n3')
    , R = require('ramda')
    , Cite = require('citation-js')
    , { DateParser } = require('citeproc')
    , { rdfListToArray, findOne } = require('org-n3-utils')
    , { expandNS, isType, getDCContainer, getFirstObjectLiteral } = require('./rdf')

const bibRDFTypes = {
  'bibo:BookSection': cslConverter(bookSection),
  'bibo:AcademicArticle': cslConverter(academicArticle),
  'bibo:Book': cslConverter(book),
  ':ConferencePaper': cslConverter(conferencePaper),
  ':Lecture': cslConverter(lecture),
}

exports.generate = function getBibEntries(store) {
  return Object.entries(bibRDFTypes).reduce((acc, [ type, fn ]) => {
    const items = {}

    store.getSubjects(expandNS('rdf:type'), expandNS(type)).forEach($bibItem => {
      const csl = fn(store, $bibItem)

      const html = new Cite(csl).get({
        type: 'html',
        lang: 'en-US',
        style: 'citation-apa',
      })

      items[$bibItem.id] = { html, csl }
    })

    return Object.assign({}, acc, items)
  }, {})
}



function bookSection(store, uri) {
  const $chapter = uri
      , $book = getDCContainer(store, $chapter)

  const [ $publisher ] = store
    .getObjects($book, expandNS('dc:publisher'))
    .filter(isType(store, expandNS(':Publisher')))

  return {
    cslType: 'chapter',
    agentListFields: ['author', 'editor'],
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

function lecture(store, uri) {
  const $lecture = uri

  return {
    cslType: 'book', // Whatever, as long as all the fields are in there.
    agentListFields: ['author'],
    dateFields: ['event-date', 'issued'],
    fields: {
      title: [$lecture, 'dc:title'],
      URI: [$lecture, 'bibo:uri'],
      DOI: [$lecture, 'bibo:doi'],
      author: [$lecture, 'bibo:authorList'],
      medium: [$lecture, 'dc:format'],

      'event-date': [$lecture, 'dc:created'],
      issued: [$lecture, 'dc:issued'],
    },
  }
}


function academicArticle(store, uri) {
  const $article = uri
      , $issue = getDCContainer(store, $article)
      , $journal = getDCContainer(store, $issue)

  return {
    cslType: 'article-journal',
    agentListFields: ['author'],
    dateFields: ['issued'],
    fields: {
      title: [$article, 'dc:title'],
      page: [$article, 'bibo:pages'],
      URI: [$article, 'bibo:uri'],
      DOI: [$article, 'bibo:doi'],
      author: [$article, 'bibo:authorList'],
      'container-title': [$journal, 'dc:title'],
      issued: [
        [$article, 'dc:date'],
        [$issue, 'dc:date'],
      ],
      volume: [$issue, 'bibo:volume'],
      issue: [$issue, 'bibo:issue'],
    },
  }
}

function book(store, uri) {
  const $book = uri

  const [ $publisher ] = store
    .getObjects($book, expandNS('dc:publisher'))

  return {
    cslType: 'book',
    agentListFields: ['author', 'editor'],
    dateFields: ['issued'],
    fields: {
      title: [$book, 'dc:title'],
      page: [$book, 'bibo:pages'],
      URI: [$book, 'bibo:uri'],
      DOI: [$book, 'bibo:doi'],
      author: [$book, 'bibo:authorList'],
      editor: [$book, 'bibo:editorList'],
      issued: [$book, 'dc:date'],
      publisher: [$publisher, 'foaf:name'],
      'publisher-place': [$publisher, 'address:localityName'],
    },
  }
}

function conferencePaper(store, uri) {
  const $paper = uri
      , $conference = findOne(store, $paper, expandNS('bibo:presentedAt'), null).object
      , $proceedings = findOne(store, $paper, expandNS('bibo:reproducedIn'), null).object
      , $publisher = findOne(store, $proceedings, expandNS('dc:publisher'), null).object

  return {
    cslType: 'paper-conference',
    agentListFields: ['author'],
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


function cslConverter(fn) {
  return (store, $bibItem) => {
    const def = fn(store, $bibItem)

    const csl = {
      id: R.last($bibItem.id.split(':')),
      type: def.cslType,
    }

    // Populate all the CSL fields
    Object.entries(def.fields).forEach(([cslKey, paths]) => {
      if (!Array.isArray(paths[0])) paths = [paths]

      for (const [ s, p ] of paths) {
        const [ $cslValue ] = store.getObjects(s, expandNS(p))

        if ($cslValue) {
          csl[cslKey] = $cslValue;
          break;
        }
      }
    })

    // Convert agent fields to arrays of CSL agent objects
    def.agentListFields.forEach(cslKey => {
      rdfListToArray(store, csl[cslKey])

      csl[cslKey] = rdfListToArray(store, csl[cslKey]).map($agent => {
        const get = term => getFirstObjectLiteral(store, $agent, expandNS(term))

        return R.filter(R.identity, {
          name: get('foaf:name'),
          given: get('foaf:givenname'),
          family: get('foaf:surname'),
          suffix: get('bibo:suffixName'),
        })
      })
    })

    // Convert everything else (hopefully?) to literals
    Object.entries(csl).forEach(([k, v]) => {
      if (N3.Util.isLiteral(v)) csl[k] = v.value
    })

    // Then parse the date into the CSL date format
    csl.issued = DateParser.parseDateToArray(csl.issued)

    return csl
  }
}
