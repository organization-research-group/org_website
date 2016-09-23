READINGS = $(wildcard readings/*)

all: dist/index.html # dist/archive.html

dist:
	mkdir -p dist

dist/index.html: build.py $(READINGS) | dist
	./build.py > $@

.PHONY: clean

clean:
	rm -rf dist
