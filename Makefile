
build:
	rm -fr ./build
	component build -s simpleio -n simpleio
	./node_modules/.bin/uglifyjs < ./build/simpleio.js > ./build/simpleio.min.js

install:
	rm -fr ./components
	rm -fr ./node_modules
	component install
	npm i

docs:
	node ./bin/mkdocs

.PHONY: build install docs
