#!/bin/sh
set -e
echo "Waiting for database..."
python <<'PY'
import os, time, sys, psycopg2
host = os.environ.get("DB_HOST", "db")
port = int(os.environ.get("DB_PORT", "5432"))
name = os.environ.get("DB_NAME", "postgres")
user = os.environ.get("DB_USER", "postgres")
password = os.environ.get("DB_PASSWORD", "postgres")
for i in range(60):
    try:
        conn = psycopg2.connect(dbname=name, user=user, password=password, host=host, port=port)
        conn.close()
        print("DB ready")
        sys.exit(0)
    except Exception as e:
        print("DB not ready (%s); retry %s/60" % (e, i + 1))
        time.sleep(2)
print("DB wait timed out", file=sys.stderr)
sys.exit(1)
PY
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python <<'PY'
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin123")
username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
exists = User.objects.filter(email=email).exists()
if not exists:
    try:
        try:
            User.objects.create_superuser(username=username, email=email, password=password)
        except TypeError:
            try:
                User.objects.create_superuser(email=email, password=password)
            except TypeError:
                User.objects.create_superuser(email, password)
        print("Created superuser", email)
    except Exception as e:
        print("Superuser create skipped:", e)
else:
    print("Superuser already exists:", email)
PY
exec "$@"
