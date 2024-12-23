# Use Microsoft's official Node.js devcontainer image
FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install OpenSSL (required for the project)
RUN apt-get update -y && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# The base image already:
# - Has Docker CLI installed
# - Has proper user permissions set up
# - Includes common development tools
# - Has the non-root 'node' user configured
