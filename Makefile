READINGS = $(wildcard readings/*)

all: dist/index.html dist/archive.html dist/style.css dist/org.js # dist/archive.html

dist:
	mkdir -p dist

dist/index.html: build.py $(READINGS) | dist
	./build.py > $@

dist/archive.html: build.py $(READINGS) | dist
	./build.py archive > $@

dist/style.css: style.css | dist
	cp $< $@

dist/org.js: animation.js | dist
	cp $< $@

.PHONY: clean upload

clean:
	rm -rf dist

upload:
	scp dist/* orgorgorgorgorg.org:/home/ptgolden/webapps/org_home/
