
build:
	rm -fr ./build
	component build -s simpleioTransport -n simpleio-transport
	./node_modules/.bin/uglifyjs < ./build/simpleio-transport.js > ./build/simpleio-transport.min.js

install:
	rm -fr ./components
	rm -fr ./node_modules
	component install
	npm i

.PHONY: build install
