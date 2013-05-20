
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
	rm -fr ./docs
	mkdir -p ./docs/client ./docs/server
	./node_modules/.bin/markdox  ./lib/client/index.js -o ./docs/client/index.md
	./node_modules/.bin/markdox  ./lib/client/Client.js -o ./docs/client/client.md

.PHONY: build install docs
