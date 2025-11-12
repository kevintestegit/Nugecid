# Build stage
FROM node:18-alpine AS builder

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
FROM node:18-alpine

WORKDIR /app

# Install PostgreSQL client for backups
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p /app/uploads /app/backups

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/src/main.js"]
