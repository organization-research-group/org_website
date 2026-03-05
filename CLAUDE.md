# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when
working with code in this repository.

## Project Overview

Static website generator for the Organization Research Group (ORG), a
reading group at UNC Chapel Hill. The site is built from RDF/Turtle
data files and outputs a TAR archive containing pre-rendered HTML
pages.

## Build Commands

```bash
make all              # Build site to dist/site.tar and extract to dist/
make clean            # Remove dist/ and node_modules/
make upload           # Build and deploy to orgorgorgorgorg.org via scp
make graph.ttl        # Regenerate merged graph (requires Apache Jena's riot tool)
make check            # Validate RDF data against SHACL shapes
```

## Utility Commands

```bash
make add_meeting           # Interactive Python script to add a new meeting
make add_missing_entities  # Find and append missing RDF entity definitions
```

## Architecture

**Data Layer:** RDF/Turtle files in the root directory

- `meetings.ttl` - Meeting schedule with dates and attendees
- `readings.ttl` - Reading entries linked to meetings
- `people.ttl`, `journals.ttl`, `conferences.ttl`, `publishers.ttl`,
  `volumes.ttl`, `proceedings.ttl` - Entity definitions
- `graph.ttl` - Generated merged graph from all individual TTL files
- `shape.ttl` - SHACL validation shapes

**Processing Pipeline:** `src/` directory

- `index.js` - Entry point; loads RDF, orchestrates generation, outputs TAR to stdout
- `html.js` - Renders HTML pages using hyperscript
- `bibliography.js` - Converts RDF citations to CSL format using citation-js
- `meetings.js` - Extracts and groups meeting data from RDF store
- `entities.js` - Processes People, Journals, Conferences, Publishers
- `rdf.js` - RDF utilities (namespace expansion, querying)
- `feed.js` - Generates JSON Feed output

**Output:** TAR archive containing `index.html`, `archive.html`,
`directory.html`, `graph.ttl`, `feed.json`

## Data Flow

1. N3 parser loads `graph.ttl` into in-memory store
2. Modules extract/transform RDF data (bibliography, meetings, entities)
3. HTML rendered with hyperscript, pretty-printed
4. Pages bundled into TAR archive, static assets appended by Makefile

## Platform Notes

- On macOS, requires `gtar` (GNU tar) instead of BSD tar
- Node.js entry point is `node .` (runs src/index.js, outputs TAR to stdout)
