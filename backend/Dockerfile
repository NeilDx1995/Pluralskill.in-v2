FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create a non-root user
RUN useradd -m -u 1000 appuser

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app/uploads

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

# Production: Gunicorn with Uvicorn workers
# Development override: set CMD to ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
CMD ["gunicorn", "app.main:app", \
  "--bind", "0.0.0.0:8001", \
  "--worker-class", "uvicorn.workers.UvicornWorker", \
  "--workers", "2", \
  "--timeout", "120", \
  "--access-logfile", "-", \
  "--error-logfile", "-"]
