# Indexer (Local)

Docker-compose setup for running the [VeChain indexer](https://github.com/vechain/vechain-indexer) locally against thor-solo. This package does not contain the indexer source code — it pulls pre-built images from `ghcr.io/vechain/vechain-indexer`.

## What it runs

| Service | Image | Port |
| --- | --- | --- |
| MongoDB (replica set) | `mongo:8` | 27017 |
| Indexer | `ghcr.io/vechain/vechain-indexer/indexer:latest` | 8090 |
| Indexer API | `ghcr.io/vechain/vechain-indexer/api:latest` | 8089 |
| Block Explorer | `ghcr.io/vechain/block-explorer:latest` | 8088 |

## Prerequisites

- Thor solo must be running (`make solo-up` from repo root)
- Contracts must be deployed (`yarn dev` must have completed at least once, generating `packages/config/local.ts`)

## Usage

From the repo root:

```bash
make indexer-up      # Start indexer (reads contract addresses from local.ts)
make indexer-down    # Stop indexer services
make indexer-clean   # Stop + remove indexer volumes
```

## How it works

`make indexer-up` runs `scripts/extract-local-config.sh`, which reads contract addresses from `packages/config/local.ts` and exports them as environment variables. These are passed into the docker-compose file as config for the indexer services.

The compose file joins the `vechain-thor` Docker network created by `packages/contracts/docker-compose.yaml`, allowing the indexer to reach `thor-solo:8669`.

MongoDB runs without authentication (local dev only).

## URLs

- Block explorer: http://localhost:8088
- Indexer API health: http://localhost:8089/actuator/health
