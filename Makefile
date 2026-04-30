SHELL := /bin/bash

help:
	@egrep -h '\s#@\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?#@ "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

# Thor solo
solo-up: #@ Start Thor solo
	docker compose -f packages/contracts/docker-compose.yaml up -d --wait 
solo-down: #@ Stop Thor solo
	docker compose -f packages/contracts/docker-compose.yaml down
solo-clean: #@ Clean Thor solo
	docker compose -f packages/contracts/docker-compose.yaml down -v --remove-orphans

# Thor solo for e2e (separate node on port 8670, isolated from local dev)
e2e-solo-up: #@ Start Thor solo for e2e tests (port 8670)
	docker compose -p b3tr-e2e -f packages/contracts/docker-compose.e2e.yaml up -d --wait
e2e-solo-down: #@ Stop Thor solo for e2e
	docker compose -p b3tr-e2e -f packages/contracts/docker-compose.e2e.yaml down
e2e-solo-clean: #@ Clean Thor solo for e2e (removes volume, e2e config, snapshot)
	docker compose -p b3tr-e2e -f packages/contracts/docker-compose.e2e.yaml down -v --remove-orphans
	rm -f packages/config/e2e.ts
	rm -rf packages/e2e/.snapshots

# Indexer
indexer-up: #@ Start indexer (requires deployed contracts)
	@source scripts/extract-local-config.sh && \
		docker compose -f packages/indexer/docker-compose.yaml up -d
indexer-down: #@ Stop indexer
	docker compose -f packages/indexer/docker-compose.yaml down
indexer-clean: #@ Clean indexer (removes volumes)
	docker compose -f packages/indexer/docker-compose.yaml down -v --remove-orphans
indexer-restart: #@ Restart indexer
	make indexer-down
	make indexer-up

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

# spins up a local instance of thor solo, builds the app and runs it in dev mode
# the env config used is defined by ENV input param
# !!! NOTE !!!: existing instance of thor solo will be removed along with its data volume
# example: make up ENV=e2e
up:
	make solo-down
	@if [ ! -e ./.env ]; then cp .env.example .env; fi
	# if exists - remove the old thor image and its data volume
	@if [ -n "$$(docker images -q vechain/thor)" ]; then docker rmi $$(docker images -q vechain/thor); fi
	@if [ -n "$$(docker volume ls -q -f name=thor-data)" ]; then docker volume rm thor-data; fi
	yarn install
	make solo-up
	yarn build
	@if [ -e ./packages/config/local.ts ]; then rm ./packages/config/local.ts; fi
	yarn dev:$(ENV)