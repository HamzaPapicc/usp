#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

PORT="${PORT:-8000}"

# Keep the platform's assigned PORT for health checks/public routing.
# Also bind 8000 when PORT differs, so internal proxies can keep using backend:8000.
set -- gunicorn backend.wsgi:application --bind "0.0.0.0:${PORT}"

if [ "${PORT}" != "8000" ]; then
  set -- "$@" --bind "0.0.0.0:8000"
fi

set -- "$@" --workers "${GUNICORN_WORKERS:-3}" --timeout "${GUNICORN_TIMEOUT:-120}"

exec "$@"