# Playwright e2e

These tests are designed to execute on a clean, pre-seeded Solo environment 
Tests are designed to always expect this starting point - this means to run the tests twice locally without re-seeding solo may cause them to fail

## Setup local environment

1. Have docker running
2. From the repo root run the following to deploy the app:
```shell
cp .env.example .env
make solo-up
yarn build
yarn dev
```
3. Setup tests:
```shell
cd packages/e2e
yarn build
yarn install-browsers
```
4. Open new terminal tab and run the tests:
```shell
yarn playwright:e2e
```
5. Open report:
```shell
yarn playwright show-report
```
