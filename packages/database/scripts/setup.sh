#!/bin/bash

mongosh --host $MONGO_HOST:27017 --username $MONGO_ADMIN_USER --password $MONGO_ADMIN_PASSWORD /scripts/init.js
