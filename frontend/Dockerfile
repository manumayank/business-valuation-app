# Frontend Dockerfile for Business Valuation App
# Multi-stage build for optimal image size

# Stage 1: Build stage
FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
# Use npm install instead of ci for better compatibility
RUN npm install

# Copy source code
COPY public ./public
COPY src ./src

# Build the React application
RUN npm run build

# Stage 2: Runtime stage - serve with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
