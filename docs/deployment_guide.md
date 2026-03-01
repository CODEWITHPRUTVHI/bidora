# Bidora Deployment Guide

This document outlines the strategy and requirements for deploying the Bidora full-stack application to production.

## Deployment Architecture

Given the requirements for scalable, secure deployment, a standard setup would look like:
- **Frontend Container:** Deployed on Vercel or Railway for seamless Next.js optimization.
- **Backend Container:** Deployed on AWS ECS / DigitalOcean App Platform / Railway.
- **Database:** Managed PostgreSQL instance (AWS RDS, Supabase, or Railway).
- **Cache / WebSocket State:** Redis (Vercel KV or Upstash) for scaling WebSockets if multiple backend instances are deployed.

## 1. Preparing the Application

Ensure the `.env` values are properly configured with production secrets and database URLs.

## 2. Setting Up the Database

For production, strong relational capabilities and backups are critical.
A managed PostgreSQL solution (e.g., AWS RDS or Supabase) is highly recommended.
Get your production database connection string and secure it.

Run all migrations before deploying the application logic:
\`\`\`bash
npx prisma migrate deploy
\`\`\`

## 3. Containerization (Docker)

Both the frontend and backend are containerized for deployment consistency.

### Frontend Dockerfile (`frontend/Dockerfile`):
\`\`\`dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

### Backend Dockerfile (`backend/Dockerfile`):
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
\`\`\`

*Note: Ensure `npx prisma generate` is run at build time if using Prisma.*

## 4. Environment Variables on Production

All environment variables from `.env.example` must be set in your chosen hosting provider's dashboard:
- \`DATABASE_URL\`
- \`JWT_SECRET\`
- \`CLIENT_URL\` (CORS origin)
- \`NODE_ENV\` (set to \`production\`)
- Payment/Escrow API Keys
- Notification service keys

## 5. Security Checklist (Pre-launch)

- Have you disabled debugging routes/logs?
- Is Rate Limiting applied to authentication and bidding endpoints?
- Are secure HttpOnly Cookies or token storage mechanisms implemented securely?
- Is WebSocket connections over WSS (TLS)?
- Is CORS strictly configured to allow only the production frontend URL?

## 6. CI/CD (GitHub Actions / GitLab CI)

Create deployment workflows that run on pushes to the `main` branch. A typical workflow:
1. Trigger on commit to `main`.
2. Run database migrations.
3. Build the frontend and backend Docker images.
4. Push images to a container registry (ECR/DockerHub).
5. Trigger redeployment of services (e.g., AWS ECS Update).

If using Vercel & Railway, continuous deployment is automated upon binding the GitHub repository.
