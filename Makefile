JS_FILES := $(wildcard src/*js)

all: dist/site.tar
	tar xf $< -C dist
	rm $<

dist:
	mkdir -p $@

dist/site.tar: $(JS_FILES) org.css js/org.js | dist
	node . > $@ || rm $@
	tar rf $@ $< -C js org.js

.PHONY: clean upload add_meeting

clean:
	rm -rf dist

add_meeting:
	@python3 scripts/add_meeting

upload: $(SITE_FILES)
	chmod g+w $^
	scp $^ orgorgorgorgorg.org:/home/ptgolden/webapps/org_home/
