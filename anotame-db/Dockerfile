FROM postgres:16-alpine

# Copy the initialization script to the special directory
# This script will be executed when the container starts for the first time
COPY init.sql /docker-entrypoint-initdb.d/
