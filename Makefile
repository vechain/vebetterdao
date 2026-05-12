SHELL := /bin/bash

help:
	@egrep -h '\s#@\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?#@ "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

# Thor solo for e2e (separate node on port 8670, isolated from local dev)
e2e-solo-up: #@ Start Thor solo for e2e tests (port 8670)
	docker compose -p b3tr-e2e -f packages/contracts/docker-compose.e2e.yaml up -d --wait
e2e-solo-down: #@ Stop Thor solo for e2e
	docker compose -p b3tr-e2e -f packages/contracts/docker-compose.e2e.yaml down
e2e-solo-clean: #@ Clean Thor solo for e2e (removes volume, e2e config, snapshot)
	docker compose -p b3tr-e2e -f packages/contracts/docker-compose.e2e.yaml down -v --remove-orphans
	rm -f packages/config/e2e.ts
	rm -rf packages/e2e/.snapshots

NAV_CONTRACTS=cd packages/contracts

# Contracts
contracts-compile: #@ Compile the contracts.
	$(NAV_CONTRACTS); yarn compile
contracts-deploy: contracts-compile #@ Deploy the contracts.
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
