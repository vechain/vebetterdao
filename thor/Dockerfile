FROM ghcr.io/vechain/thor:release-galactica-latest

USER root

RUN apk update && apk upgrade && apk add curl

ENTRYPOINT thor solo --on-demand \
    --persist \
    --data-dir /data/thor \
    --api-addr 0.0.0.0:8669 \
    --api-cors '*' \
    --verbosity 3
