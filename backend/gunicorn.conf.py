"""
Alternative to Daphne for HTTP-only deployments (no WebSocket).
Usage: gunicorn config.wsgi:application -c gunicorn.conf.py

For WebSocket support, use Daphne (see entrypoint.sh).
"""
import multiprocessing

bind             = "0.0.0.0:8000"
workers          = min(multiprocessing.cpu_count() * 2 + 1, 4)
worker_class     = "sync"
timeout          = 300
keepalive        = 5
accesslog        = "-"
errorlog         = "-"
loglevel         = "info"
max_requests     = 1000
max_requests_jitter = 50
preload_app      = True