"use strict";

const fs = require('fs')
    , path = require('path')
    , N3 = require('n3')
    , tar = require('tar-stream')
    , bibliography = require('./bibliography')
    , meetings = require('./meetings')
    , entities = require('./entities')
    , { renderArchive, renderDirectory, renderMain } = require('./html')

const GRAPH_FILE = path.join(__dirname, '..', 'graph.ttl')

createWebsiteArchive()
  .catch(err => {
    process.stderr.write('Uncaught: ' + err.toString() + '\n' + err.stack + '\n');
    process.exit(1);
  })

async function createWebsiteArchive() {
  const store = N3.Store()
      , parser = N3.StreamParser()

  await new Promise((resolve, reject) =>
    store.import(fs.createReadStream(GRAPH_FILE).pipe(parser))
      .on('error', reject)
      .on('end', resolve))

  const grist = {
    store,
    bibliography: await bibliography.generate(store),
    meetings: await meetings.generate(store),
    entities: await entities.generate(store),
  }

  const mill = tar.pack()

  mill.entry({ name: 'index.html' }, '' + await renderMain(grist))
  mill.entry({ name: 'archive.html' }, '' + await renderArchive(grist))
  mill.entry({ name: 'directory.html' }, '' + renderDirectory(grist))
  mill.pipe(process.stdout);
}
