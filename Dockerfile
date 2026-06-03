# Combined image: builds the Vite frontend and serves it from the FastAPI backend.
# Stage 1: build the frontend bundle.
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: backend runtime + static assets from stage 1.
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    QMLENS_STATIC_DIR=/app/frontend_dist

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install -r /app/backend/requirements.txt \
    && apt-get purge -y --auto-remove build-essential

COPY backend /app/backend
COPY --from=frontend-build /app/dist /app/frontend_dist

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=5 \
    CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://localhost:8000/api/health', timeout=2)" || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
