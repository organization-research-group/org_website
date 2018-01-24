JS_FILES := $(wildcard src/*js)
SITE_FILES = $(wildcard dist/*)

all: dist/site.tar
	tar xf $< -C dist
	rm $<

dist:
	mkdir -p $@

dist/site.tar: org.css $(JS_FILES) | dist
	node . > $@ || rm $@
	tar rf $@ $<

.PHONY: clean upload add_meeting

clean:
	rm -rf dist

add_meeting:
	@python3 bin/add_meeting

sort_turtle:
	bin/clean_ttl.py bib.ttl | sponge bib.ttl

upload: $(SITE_FILES)
	chmod g+w $^
	scp $^ orgorgorgorgorg.org:/home/ptgolden/webapps/org_home/
