# Use official Python runtime
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for static files
RUN mkdir -p static/stems static/voices

# Expose port (Cloud Run will override with $PORT)
ENV PORT=8080
EXPOSE 8080

# Run with Uvicorn
CMD uvicorn server:app --host 0.0.0.0 --port $PORT
