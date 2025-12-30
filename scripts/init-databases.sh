#!/bin/bash
set -e

# Create additional databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE strapi_db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'strapi_db')\gexec
EOSQL

echo "Database strapi_db created successfully"
