#!/bin/bash

# Migration script for Render deployment
# This script will be executed on Render to update the database schema

echo "Starting embed schema migration on Render..."

# Install dotenv if not already installed
npm install dotenv

# Run the migration script
node migrate-embed-schema.js

echo "Migration completed!"
