# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) for build
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build:backend

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install PostgreSQL client for backups and OCR runtime dependencies
RUN apk add --no-cache \
    postgresql-client \
    ocrmypdf \
    tesseract-ocr \
    tesseract-ocr-data-por \
    qpdf \
    ghostscript \
    unpaper

# Create non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy assets (logos for PDF/DOCX generation)
COPY --from=builder /app/src/assets ./src/assets
COPY --from=builder /app/frontend/src/components/img ./frontend/src/components/img

# Create necessary directories and set ownership
RUN mkdir -p /app/uploads /app/backups && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/src/main.js"]
