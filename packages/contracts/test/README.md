# Smart Contract Tests

Each test describe block is marked with a shard name. This is needed to split large test suites into smaller, parallel runs for faster CI execution and to prevent timeouts.

## Active Shards

All active shards are listed in `.github/workflows/unit-tests.yml`.

When adding new tests, assign them to an appropriate shard to maintain balanced execution times across all shards.
