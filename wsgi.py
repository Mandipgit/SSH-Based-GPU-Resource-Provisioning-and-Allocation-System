import os
import sys

server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server')
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
