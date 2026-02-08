FROM postgres:16-alpine

# Set default environment variables (matches docker-compose.yml)
ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=password
ENV POSTGRES_DB=anotame
# Use a subdirectory for data to avoid issues with lost+found in volume root
ENV PGDATA=/var/lib/postgresql/data/pgdata

# Copy the initialization script to the special directory
# This script will be executed when the container starts for the first time
COPY init.sql /docker-entrypoint-initdb.d/
