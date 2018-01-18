"use strict";

const fs = require('fs')
    , path = require('path')
    , N3 = require('n3')
    , R = require('ramda')
    , tar = require('tar-stream')
    , getBibMap = require('./rdf_to_csl')
    , getMeetings = require('./meetings')
    , { renderArchive, renderAuthors, renderMain } = require('./html')

const BIB_FILE = path.join(__dirname, '..', 'bib.ttl')

main().catch(
  err => {
    process.stderr.write('Uncaught: ' + err.toString() + '\n' + err.stack + '\n');
    process.exit(1);
  }
)

async function main() {
  const store = await new Promise((resolve, reject) => {
    const store = N3.Store()
        , parser = N3.Parser()

    parser.parse(fs.createReadStream(BIB_FILE), (err, triple, prefixes) => {
      if (err) reject(err)

      if (triple) store.addTriple(triple)

      if (prefixes) {
        store.addPrefixes(prefixes)
        resolve(store)
      }
    })
  })

  const bibItems = await getBibMap(store)

  let meetings = await getMeetings(store, bibItems)

  meetings = R.sortBy(d => d.date.getTime(), meetings).reverse()

  const pack = tar.pack()

  pack.entry({ name: 'index.html' }, '' + renderMain(meetings))
  pack.entry({ name: 'archive.html' }, '' + renderArchive(meetings))
  pack.entry({ name: 'authors.html' }, '' + renderAuthors(meetings))
  pack.pipe(process.stdout);
}
