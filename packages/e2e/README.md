# Playwright e2e

These tests are designed to execute on a clean, pre-seeded Solo environment 
Tests are designed to always expect this starting point - this means to run the tests twice locally without re-seeding solo may cause them to fail

## Setup local environment

- Have docker running
- `yarn build`
- `yarn dev`
- In a new terminal `yarn playwright:e2e`