FROM mongo:6.0.6

# Create a new user 'mongodb' and switch to it
USER mongodb

COPY ./scripts /scripts

ENTRYPOINT ["/bin/bash", "/scripts/setup.sh"]