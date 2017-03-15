READINGS := $(wildcard readings/*)

SITE_FILES := dist/index.html dist/archive.html dist/style.css dist/org.js

all: $(SITE_FILES)

dist:
	mkdir -p $@

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

upload: $(SITE_FILES)
	chmod g+w $^
	scp -p dist/* orgorgorgorgorg.org:/home/ptgolden/webapps/org_home/
