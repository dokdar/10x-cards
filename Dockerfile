# =============================================================================
# Stage 1: Builder - Install dependencies and build the application
# =============================================================================
FROM node:24-alpine AS builder

# Set build-time environment
ARG PUBLIC_ENV_NAME=local
ENV PUBLIC_ENV_NAME=${PUBLIC_ENV_NAME}

# Add metadata
LABEL maintainer="10x-cards"
LABEL description="10x-cards Astro application builder stage"
LABEL version="0.0.1"

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
# This layer is cached unless package files change
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
# Clean up npm cache in the same layer to reduce image size
RUN npm ci && \
    npm cache clean --force

# Copy source code and configuration files
# This layer changes most frequently, so it's placed last
COPY . .

# Build the Astro application
# This creates the dist/ directory with SSR-ready application
RUN npm run build

# =============================================================================
# Stage 2: Runtime - Create minimal production image
# =============================================================================
FROM node:24-alpine AS runtime

# Add metadata for runtime stage
LABEL maintainer="10x-cards"
LABEL description="10x-cards Astro application runtime"
LABEL version="0.0.1"

# Install curl for healthcheck
# Clean up apk cache in the same layer
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Set runtime environment variables
# These can be overridden at runtime via docker run -e or docker-compose
ENV PUBLIC_ENV_NAME=local \
    HOST=0.0.0.0 \
    PORT=8080

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
# This excludes devDependencies like testing frameworks, linters, etc.
# Clean up npm cache in the same layer
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
# Only copy what's needed: dist/ for the built app
COPY --from=builder /app/dist ./dist

# Copy necessary runtime files
# astro.config.mjs is needed for Astro SSR runtime configuration
COPY --from=builder /app/astro.config.mjs ./

# Create non-root user for security
# The node user/group is already available in official node images
RUN chown -R node:node /app

# Switch to non-root user
# All subsequent commands and the application will run as this user
USER node

# Document the port the application listens on
# This doesn't actually publish the port, but serves as documentation
EXPOSE 8080

# Health check to ensure the container is serving requests
# Checks every 30 seconds, timeout after 3 seconds, start after 40 seconds
# Fails after 3 consecutive failures
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Default command to run the application
# Uses the preview command which serves the built Astro app
# Astro will respect the HOST and PORT environment variables
CMD ["node", "./dist/server/entry.mjs"]
