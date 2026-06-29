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

# Create writable directories and set ownership only where the app writes files
RUN mkdir -p /app/uploads /app/backups && \
    chown -R appuser:appgroup /app/uploads /app/backups

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Healthcheck (standalone docker run; compose also defines one)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||'3000')+'/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start application
CMD ["node", "dist/src/main.js"]
