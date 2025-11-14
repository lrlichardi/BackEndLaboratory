#!/bin/sh
set -e
# Aplica migraciones en SQLite sin interacción
npx prisma migrate deploy
node dist/server.js
