FROM node:18-slim

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files for BFF
COPY bff/package*.json ./
COPY bff/tsconfig.json ./

# Install BFF dependencies and prisma
RUN npm install
RUN npm install prisma --save-dev

# Create the exact directory structure needed for imports
RUN mkdir -p ../../../db

# Copy DB package files and install dependencies
COPY db/package*.json ../../../db/
COPY db/tsconfig.json ../../../db/
WORKDIR /app/../../../db
RUN npm install

# Copy DB source files first and build DB package
COPY db/src/ ./src/
COPY db/prisma/ ./prisma/
RUN npx prisma generate
RUN npm run build

# Return to app directory and copy prisma schema
WORKDIR /app
COPY db/prisma/ ./prisma/

# Generate Prisma client for BFF
RUN npx prisma generate

# Copy BFF source files
COPY bff/src/ ./src/

# Build the BFF application
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "dev"]
