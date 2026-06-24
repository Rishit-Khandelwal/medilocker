FROM python:3.12-slim

# System dependencies
# tesseract-ocr: Phase 7 OCR fallback
# libpq-dev + gcc: psycopg2 compilation
# poppler-utils: optional PDF utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure media and static directories exist
RUN mkdir -p /app/media /app/staticfiles

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["/app/entrypoint.sh"]