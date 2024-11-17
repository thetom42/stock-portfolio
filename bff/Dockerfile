FROM node:18-slim

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files for BFF
COPY bff/package*.json ./
COPY bff/tsconfig.json ./

# Install BFF dependencies
RUN npm install

# Create the exact directory structure needed for imports
RUN mkdir -p ../../../db

# Copy DB package files and install dependencies
COPY db/package*.json ../../../db/
COPY db/tsconfig.json ../../../db/
WORKDIR /app/../../../db
RUN npm install
WORKDIR /app

# Copy all necessary files maintaining the exact import structure
COPY db/models/ ../../../db/models/
COPY db/repositories/ ../../../db/repositories/
COPY db/prisma/ ./prisma/
COPY bff/src/ ./src/

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]
