SITE_TARBALL := dist/site.tar

UPLOAD_HOST ?= orgorgorgorgorg.org
UPLOAD_PATH ?= /home/ptgolden/apps/org_home/

# Files that will be included in the tarball
STATIC_DEPS = org.css graph.ttl

# Files that generate the tarball
SITE_SCRIPTS := $(wildcard src/*js)


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
	rm -rf dist node_modules

.PHONY: upload
upload: $(SITE_TARBALL)
	$(TAR) xf $< -C dist
	chmod g+w $(addprefix dist/,$(shell $(TAR) tf $<))
	scp $(addprefix dist/,$(shell $(TAR) tf $<)) $(UPLOAD_HOST):$(UPLOAD_PATH)


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

.PHONY: sort_turtle
sort_turtle:
	bin/clean_ttl.py graph.ttl | sponge graph.ttl


.PHONY: add_missing_entities
add_missing_entities:
	bin/missing_entities graph.ttl >> graph.ttl
	make sort_turtle
