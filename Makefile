BIN = ./node_modules/.bin

.PHONY: bootstrap start;

start: bootstrap
	@$(BIN)/nodemon index.js

deploy:
	@git push -f heroku master;

bootstrap: package.json security.json
	@npm install;

security.json:
	@cp security.json.template security.json