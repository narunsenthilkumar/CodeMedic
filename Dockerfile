# CodeMedic Production & Sandbox Container
FROM node:20-alpine AS base

WORKDIR /app

# Install build essentials for native dependencies if needed
RUN apk add --no-cache libc6-compat git python3 make g++

# Dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Source files
COPY . .

# Build Next.js application
RUN npm run build

# Runtime Stage
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
