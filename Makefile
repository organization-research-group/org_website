JS_FILES := $(wildcard src/*js)
SITE_FILES = $(wildcard dist/*)

UPLOAD_HOST ?= orgorgorgorgorg.org
UPLOAD_PATH ?= /home/ptgolden/webapps/org_home/


platform=$(shell uname -s)
ifeq ($(platform), Darwin)
	TAR := gtar
else
	TAR := tar
endif

all: dist/site.tar
	$(TAR) xf $< -C dist
	rm $<

dist:
	mkdir -p $@

dist/site.tar: org.css graph.ttl $(JS_FILES) | dist
	node . > $@ || rm $@
	$(TAR) --owner=0 --group=0 -r -f $@ $(word 1, $^) $(word 2, $^)

.PHONY: clean upload add_meeting

clean:
	rm -rf dist

add_meeting:
	@python3 bin/add_meeting

sort_turtle:
	bin/clean_ttl.py graph.ttl | sponge graph.ttl

upload: $(SITE_FILES)
	chmod g+w $^
	scp $^ $(UPLOAD_HOST):$(UPLOAD_PATH)
