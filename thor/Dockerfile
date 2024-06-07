FROM vechain/thor:v2.1.2

USER root

RUN apk update && apk upgrade && apk add curl

ENTRYPOINT thor solo --on-demand \
    --persist \
    --data-dir /data/thor \
    --api-addr 0.0.0.0:8669 \
    --api-cors '*' \
    --api-backtrace-limit -1 \
    --verbosity 3
