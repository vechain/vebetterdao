FROM mongo:6.0.6

# Use the the `mongodb` of the `mongo` image
USER mongodb

COPY ./scripts /scripts

ENTRYPOINT ["/bin/bash", "/scripts/setup.sh"]