import os
import sys

server_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'server')
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

server_config = os.path.join(server_dir, 'config')
if os.path.exists(server_config) and server_config not in __path__:
    __path__.append(server_config)
