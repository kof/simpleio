
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
	./node_modules/.bin/markdox\
		./lib/client/Client.js\
		./lib/server/Server.js\
		./lib/server/Message.js\
		./lib/server/Connection.js\
		./lib/server/adapters/Memory.js\
		./lib/server/adapters/Mongo.js\
		./lib/shared/Multiplexer.js\
		-o ./api.md

.PHONY: build install docs
