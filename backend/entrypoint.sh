#!/bin/bash
set -e

echo "── MediLocker backend startup ──────────────────────"

# Wait briefly for DB healthcheck (docker-compose depends_on handles most of this)
echo "Running migrations..."
python manage.py migrate --no-input

echo "Collecting static files..."
python manage.py collectstatic --no-input --clear

echo "Starting Daphne ASGI server..."
exec daphne \
    -b 0.0.0.0 \
    -p 8000 \
    --access-log - \
    --proxy-headers \
    config.asgi:application