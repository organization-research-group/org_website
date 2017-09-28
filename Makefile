WEB_OUTPUT :=
	dist/index.html \
	dist/archive.html \
	dist/authors.html \
	dist/org.css \
	dist/org.js

dist:
	mkdir -p $@

bib.json: bib.ttl
	./bin/generate_csl $< > $@


dist/index.html: dist/style.css build.py $(READINGS) | dist
	./bin/create_index > $@

dist/archive.html: dist/style.css build.py $(READINGS) | dist
	./bin/create_archive > $@

dist/style.css: style.css | dist
	cp $< $@

dist/org.js: animation.js | dist
	cp $< $@

.PHONY: clean upload add_meeting missing_bib_ids

clean:
	rm -rf dist

add_meeting:
	@python3 scripts/add_meeting.py

upload: $(SITE_FILES)
	chmod g+w $^
	scp $^ orgorgorgorgorg.org:/home/ptgolden/webapps/org_home/
