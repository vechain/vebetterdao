SHELL := /bin/bash

help:
	@egrep -h '\s#@\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?#@ "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

# Thor solo
solo-up: #@ Start Thor solo
	docker compose -f packages/contracts/docker-compose.yaml up -d --wait thor-solo
solo-down: #@ Stop Thor solo
	docker compose -f packages/contracts/docker-compose.yaml down
solo-clean: #@ Clean Thor solo
	docker compose -f packages/contracts/docker-compose.yaml down -v --remove-orphans

# Database
DB_COMMAND=docker compose -f packages/database/docker-compose-mongo.yaml
DB_MAKE_KEY=mkdir -p packages/database/keys; openssl rand -base64 756 > packages/database/keys/keyfile;
DB_REMOVE_KEY=rm -f -R packages/database/keys
DB_SETUP_COMMAND=docker compose -f packages/database/docker-compose-mongo-setup.yaml

db-all: #@ Remove, clean and start all the database.
	make db-down db-clean db-up db-setup
db-up: #@ Start the database.
	$(DB_COMMAND) up -d --wait
db-clean: #@ Clean all the database data
	$(DB_COMMAND) down -v --remove-orphans;
db-down: #@ Stop the database.
	$(DB_COMMAND) down
db-keyfile-create: #@ Generate the keyfile for the database.
	$(DB_MAKE_KEY)
db-keyfile-remove: #@ Remove the keyfile for the database.
	$(DB_REMOVE_KEY)
db-setup: #@ Setup the database.
	$(DB_SETUP_COMMAND) up --build; $(DB_SETUP_COMMAND) rm --force

NAV_CONTRACTS=cd packages/contracts

# Contracts
contracts-compile: #@ Compile the contracts.
	$(NAV_CONTRACTS); yarn compile
contracts-deploy: contracts-compile solo-up #@ Deploy the contracts.
	$(NAV_CONTRACTS); yarn deploy
contracts-test: contracts-compile #@ Test the contracts.
	$(NAV_CONTRACTS); yarn test

# Apps
install: #@ Install the dependencies.
	yarn install
build: install #@ Build the app.
	yarn build
test: #@ Test the app.
	yarn test
.PHONY:build
