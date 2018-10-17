"use strict";

const fs = require('fs')
    , path = require('path')
    , N3 = require('n3')
    , { isNamedNode } = N3.Util
    , R = require('ramda')
    , tar = require('tar-stream')
    , getBibMap = require('./rdf_to_csl')
    , getMeetings = require('./meetings')
    , { renderArchive, renderIndex, renderMain } = require('./html')

const BIB_FILE = path.join(__dirname, '..', 'bib.ttl')

createWebsiteArchive()
  .catch(err => {
    process.stderr.write('Uncaught: ' + err.toString() + '\n' + err.stack + '\n');
    process.exit(1);
  })

async function createWebsiteArchive() {
  const store = N3.Store()
      , parser = N3.StreamParser()

  let i = -1

  const seenEntities = new Set()

  await new Promise((resolve, reject) =>
    fs.createReadStream(BIB_FILE).pipe(parser)
      .on('data', quad => {
        if (isNamedNode(quad.object)) {
          seenEntities.add(quad.object.value)
        }

        store.addQuad(quad)
      })
      .on('error', reject)
      .on('end', resolve))

  store.seen = seenEntities

  const bibItems = await getBibMap(store)

  let meetings = await getMeetings(store, bibItems)

  meetings = R.sortBy(d => d.date.getTime(), meetings).reverse()

  const pack = tar.pack()

  pack.entry({ name: 'index.html' }, '' + renderMain(meetings))
  // pack.entry({ name: 'archive.html' }, '' + renderArchive(meetings))
  // pack.entry({ name: 'authors.html' }, '' + renderIndex(meetings))
  pack.pipe(process.stdout);
}
