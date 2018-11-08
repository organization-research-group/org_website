"use strict";

const fs = require('fs')
    , path = require('path')
    , N3 = require('n3')
    , tar = require('tar-stream')
    , bibliography = require('./bibliography')
    , meetings = require('./meetings')
    , entities = require('./entities')
    , { renderArchive, renderDirectory, renderMain } = require('./html')

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
    store.import(fs.createReadStream(BIB_FILE).pipe(parser))
      .on('error', reject)
      .on('end', resolve))

  const orgBibliography = await bibliography.generate(store)
      , orgMeetings = await meetings.generate(store)
      , orgEntities = await entities.generate(store)

  const pack = tar.pack()

  pack.entry({ name: 'index.html' }, '' + renderMain(orgMeetings))
  // pack.entry({ name: 'archive.html' }, '' + renderArchive(meetings))
  // pack.entry({ name: 'directory.html' }, '' + renderDirectory(meetings))
  pack.pipe(process.stdout);
}
