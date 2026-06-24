from pathlib import Path
from datetime import timedelta
from decouple import config
from celery.schedules import crontab

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost").split(",")

AUTH_USER_MODEL = "accounts.User"

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "channels",
    # local — add new phases here
    "apps.accounts",
    "apps.records",      
    "apps.audit",        
    "apps.emergency",    
    "apps.timeline",     
    "apps.notifications",# Pshase 6
    "apps.rag",          # Phase 7
    "apps.ai_assistant", # Phase 8
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",   # must be above CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="medilocker"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default="postgres"),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    # Phase 3: throttling (uses LocMemCache in dev; swap for Redis in production)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon":              "200/day",
        "user":              "2000/day",
        "login":             "5/minute",
        "upload":            "30/hour",
        "emergency_access":  "10/minute",
    },
}
# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,          # new refresh token on every refresh
    "BLACKLIST_AFTER_ROTATION": True,       # old refresh token is invalidated
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS", default="http://localhost:5173"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ── Phase 6 placeholder: Redis / Channels ─────────────────────────────────────
# CHANNEL_LAYERS = {
#     "default": {"BACKEND": "channels_redis.core.RedisChannelLayer",
#                 "CONFIG": {"hosts": [("127.0.0.1", 6379)]}}
# }

# ── Phase 6: Channels / WebSocket ─────────────────────────────────────────────
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(config("REDIS_HOST", default="localhost"),
                       config("REDIS_PORT", default=6379, cast=int))],
        },
    },
}

# ── Phase 6: Celery ────────────────────────────────────────────────────────────
CELERY_BROKER_URL      = config("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND  = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT  = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TIMEZONE        = "UTC"

CELERY_BEAT_SCHEDULE = {
    "check-appointment-reminders": {
        "task":     "apps.notifications.tasks.check_appointment_reminders",
        "schedule": 900.0,  # every 15 minutes
    },
    "check-medicine-reminders": {
        "task":     "apps.notifications.tasks.check_medicine_reminders",
        "schedule": crontab(hour=8, minute=0),  # daily, 08:00 UTC
    },
}

# ── Phase 7: OCR / RAG ────────────────────────────────────────────────────────
QDRANT_HOST  = config("QDRANT_HOST",  default="localhost")
QDRANT_PORT  = config("QDRANT_PORT",  default=6333, cast=int)
TESSERACT_CMD = config("TESSERACT_CMD", default="")

# ── Phase 8: AI Assistant ─────────────────────────────────────────────────────
GEMINI_API_KEY  = config("GEMINI_API_KEY",  default="")
OLLAMA_BASE_URL = config("OLLAMA_BASE_URL", default="http://localhost:11434")
OLLAMA_MODEL    = config("OLLAMA_MODEL",    default="llama3.2:3b")
AI_PROVIDER     = config("AI_PROVIDER",     default="auto")   # auto | ollama | gemini


# ── Production security (activates automatically when DEBUG=False) ─────────────
if not DEBUG:
    SECURE_PROXY_SSL_HEADER           = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT               = config("SECURE_SSL_REDIRECT", default=False, cast=bool)
    SESSION_COOKIE_SECURE             = True
    CSRF_COOKIE_SECURE                = True
    SECURE_HSTS_SECONDS               = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS    = True
    SECURE_HSTS_PRELOAD               = True
    SECURE_CONTENT_TYPE_NOSNIFF       = True
    X_FRAME_OPTIONS                   = "DENY"
    SECURE_BROWSER_XSS_FILTER         = True
    # Prevent Nginx from buffering SSE (AI streaming) responses
    # -- set via X-Accel-Buffering header in the view, not here

# ── Logging ────────────────────────────────────────────────────────────────────
LOGGING = {
    "version":                  1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format":  "{levelname} {asctime} {name} {message}",
            "style":   "{",
        },
    },
    "handlers": {
        "console": {
            "class":     "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level":    config("LOG_LEVEL", default="INFO"),
    },
    "loggers": {
        "django": {
            "handlers":  ["console"],
            "level":     config("DJANGO_LOG_LEVEL", default="WARNING"),
            "propagate": False,
        },
        "apps": {
            "handlers":  ["console"],
            "level":     config("LOG_LEVEL", default="INFO"),
            "propagate": False,
        },
        "celery": {
            "handlers":  ["console"],
            "level":     "INFO",
            "propagate": False,
        },
    },
}