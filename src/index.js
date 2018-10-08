"use strict";

const fs = require('fs')
    , path = require('path')
    , N3 = require('n3')
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

  await new Promise((resolve, reject) =>
    store
      .import(fs.createReadStream(BIB_FILE).pipe(parser))
      .on('error', reject)
      .on('end', resolve))

  const bibItems = await getBibMap(store)

  let meetings = await getMeetings(store, bibItems)

  meetings = R.sortBy(d => d.date.getTime(), meetings).reverse()

  const pack = tar.pack()

  pack.entry({ name: 'index.html' }, '' + renderMain(meetings))
  pack.entry({ name: 'archive.html' }, '' + renderArchive(meetings))
  pack.entry({ name: 'authors.html' }, '' + renderAuthors(meetings))
  pack.pipe(process.stdout);
}
