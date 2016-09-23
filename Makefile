READINGS = $(wildcard readings/*)

all: dist/index.html dist/style.css dist/org.js # dist/archive.html

dist:
	mkdir -p dist

dist/index.html: build.py $(READINGS) | dist
	./build.py > $@

dist/style.css: style.css | dist
	cp $< $@

dist/org.js: animation.js | dist
	cp $< $@

.PHONY: clean

clean:
	rm -rf dist
