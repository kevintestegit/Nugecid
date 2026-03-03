# Build stage
FROM node:20-alpine AS builder

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
FROM node:20-alpine

WORKDIR /app

# Install PostgreSQL client for backups
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy assets (logos for PDF/DOCX generation)
COPY --from=builder /app/src/assets ./src/assets
COPY --from=builder /app/frontend/src/components/img ./frontend/src/components/img

# Create necessary directories
RUN mkdir -p /app/uploads /app/backups

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/src/main.js"]
