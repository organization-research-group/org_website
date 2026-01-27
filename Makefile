SITE_TARBALL := dist/site.tar

UPLOAD_HOST ?= orgorgorgorgorg.org
UPLOAD_PATH ?= /home/ptgolden/apps/org_home/

# Files that will be included in the tarball
STATIC_DEPS = org.css graph.ttl org.js

# Files that generate the tarball
SITE_SCRIPTS := $(wildcard src/*js)

GRAPH_FILES := conferences.ttl journals.ttl meetings.ttl people.ttl proceedings.ttl publishers.ttl readings.ttl volumes.ttl

platform=$(shell uname -s)
ifeq ($(platform), Darwin)
	TAR := gtar
else
	TAR := tar
endif


.PHONY: all
all: $(SITE_TARBALL)
	$(TAR) xf $< -C dist

.PHONY: clean
clean:
	rm -rf dist node_modules graph.ttl

.PHONY: upload
upload: $(SITE_TARBALL)
	$(TAR) xf $< -C dist
	chmod g+w $(addprefix dist/,$(shell $(TAR) tf $<))
	scp $(addprefix dist/,$(shell $(TAR) tf $<)) $(UPLOAD_HOST):$(UPLOAD_PATH)

graph.ttl: $(GRAPH_FILES)
	riot --formatted=ttl --set ttl:indentStyle=long $^ > $@

dist:
	mkdir -p $@

node_modules: package.json
	npm ci

$(SITE_TARBALL): $(STATIC_DEPS) $(SITE_SCRIPTS) node_modules | dist
	node . > $@ || rm $@
	$(TAR) --owner=0 --group=0 -r -f $@ $(STATIC_DEPS)


#--- Utilities

.PHONY: add_meeting
add_meeting:
	@python3 bin/add_meeting

.PHONY: add_missing_entities
add_missing_entities: graph.ttl
	bin/missing_entities

.PHONY: check
check:
	for f in $(GRAPH_FILES) ; do echo "\n$$f" && shacl v -s shape.ttl -d $$f --text ; done
