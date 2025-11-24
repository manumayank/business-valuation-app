# Backend Dockerfile for Business Valuation App
# Multi-stage build for optimal image size

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init and wget for health checks
RUN apk add --no-cache dumb-init wget

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY package*.json ./
COPY server.js ./
COPY db.js ./
COPY valuationEngine.js ./

# Copy migrations, middleware, routes, and services folders
COPY migrations ./migrations
COPY middleware ./middleware
COPY routes ./routes
COPY services ./services

# Copy .env if it exists (optional for Docker builds)
COPY .env* ./

# Create directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Use dumb-init to run the application
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
