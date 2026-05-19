# Docker Commands — Car Marketplace

## Project Overview

The project uses **3 Docker Compose files** and **1 multi-stage Dockerfile**:

| File | Purpose |
|------|---------|
| `docker-compose.stack.yml` | **Full stack** — infrastructure + all microservices + web (Nginx) |
| `docker-compose.yml` | Infrastructure only (Postgres, Redis, RabbitMQ, Elasticsearch, MinIO) |
| `docker-compose.dev.yml` | **Lightweight dev** — Postgres + Redis + RabbitMQ only |
| `Dockerfile` | Multi-stage build: `builder` → `runner` (Node) + `web` (Nginx) |

---

## Quick Start (most common)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Build image and start all services
npm run docker:stack:up
# equivalent to:
docker compose -f docker-compose.stack.yml up --build
```

> Web UI available at: **http://localhost:8080**  
> API Gateway available at: **http://localhost:3000**

---

## Full Stack (`docker-compose.stack.yml`)

### Start / Stop / Restart

```bash
# Start full stack (build image if needed)
docker compose -f docker-compose.stack.yml up --build

# Start in background (detached mode)
docker compose -f docker-compose.stack.yml up --build -d

# Build image only (without starting containers)
docker compose -f docker-compose.stack.yml build
npm run docker:stack:build      # shortcut

# Stop and remove containers (keep volumes)
docker compose -f docker-compose.stack.yml down
npm run docker:stack:down       # shortcut

# Stop and remove containers + volumes (full clean)
docker compose -f docker-compose.stack.yml down -v

# Restart a specific service
docker compose -f docker-compose.stack.yml restart auth-service
```

### Force Rebuild (no cache)

```bash
docker compose -f docker-compose.stack.yml build --no-cache
docker compose -f docker-compose.stack.yml up --build --force-recreate
```

### Start / Stop Individual Services

```bash
# Start one service (and its dependencies)
docker compose -f docker-compose.stack.yml up api-gateway

# Stop one service without affecting others
docker compose -f docker-compose.stack.yml stop listing-service

# Remove a stopped service container
docker compose -f docker-compose.stack.yml rm listing-service
```

### Scale (run multiple instances)

```bash
docker compose -f docker-compose.stack.yml up -d --scale listing-service=2
```

---

## Dev Mode — Infrastructure Only (`docker-compose.dev.yml`)

Used when running microservices locally via `npm run start:dev`.

```bash
# Start Postgres + Redis + RabbitMQ only
docker compose -f docker-compose.dev.yml up -d

# Stop
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker compose -f docker-compose.dev.yml down -v
```

---

## Infrastructure Only (`docker-compose.yml`)

Full infrastructure set: Postgres, Redis, RabbitMQ, Elasticsearch, MinIO.

```bash
# Start all infrastructure services
docker compose up -d

# Stop
docker compose down

# Stop and remove all volumes
docker compose down -v
```

---

## Logs

```bash
# View logs for all services (full stack)
docker compose -f docker-compose.stack.yml logs

# Follow logs in real-time
docker compose -f docker-compose.stack.yml logs -f

# Logs for a specific service (last 100 lines)
docker compose -f docker-compose.stack.yml logs --tail=100 auth-service

# Follow logs for a specific service
docker compose -f docker-compose.stack.yml logs -f listing-service
docker compose -f docker-compose.stack.yml logs -f payment-service
docker compose -f docker-compose.stack.yml logs -f api-gateway
docker compose -f docker-compose.stack.yml logs -f web
```

---

## Container Status & Inspection

```bash
# List running containers
docker compose -f docker-compose.stack.yml ps

# Check resource usage (CPU, memory)
docker stats

# Inspect environment variables of a container
docker compose -f docker-compose.stack.yml exec auth-service env

# Open interactive shell inside a container
docker compose -f docker-compose.stack.yml exec auth-service sh
docker compose -f docker-compose.stack.yml exec postgres sh
```

---

## Database (PostgreSQL)

```bash
# Connect to PostgreSQL inside Docker
docker compose -f docker-compose.stack.yml exec postgres \
  psql -U postgres -d car_marketplace

# Run a SQL file against the database
docker compose -f docker-compose.stack.yml exec -T postgres \
  psql -U postgres -d car_marketplace < scripts/payment-schema.sql

# Dump the database
docker compose -f docker-compose.stack.yml exec postgres \
  pg_dump -U postgres car_marketplace > backup.sql

# Restore from dump
docker compose -f docker-compose.stack.yml exec -T postgres \
  psql -U postgres -d car_marketplace < backup.sql
```

> **Port conflict:** If your local machine already runs PostgreSQL on port 5432,  
> add `POSTGRES_PUBLISH_PORT=5433` to your `.env` file.

---

## RabbitMQ

```bash
# Access management UI
open http://localhost:15672
# Credentials: marketplace / marketplace

# Check connection from inside a service
docker compose -f docker-compose.stack.yml exec listing-service \
  wget -qO- http://rabbitmq:15672/api/overview --user marketplace:marketplace
```

---

## Image Management

```bash
# List images built by this project
docker images | grep car-marketplace

# Remove the runner image (forces a full rebuild next time)
docker rmi car-marketplace-runner:local
docker rmi car-marketplace-web:local

# Remove all dangling (unused) images
docker image prune

# Remove all stopped containers, dangling images, unused networks
docker system prune

# Full clean (including volumes — WARNING: deletes DB data)
docker system prune -a --volumes
```

---

## Port Reference

| Service | Internal Port | Published Port |
|---------|--------------|----------------|
| Web (Nginx) | 80 | **8080** |
| API Gateway | 3000 | **3000** (or `API_GATEWAY_PUBLISH_PORT` in `.env`) |
| Auth Service | 3001 | — (internal only) |
| Listing Service | 3002 | — (internal only) |
| Payment Service | 3004 | — (internal only) |
| User Service | 3005 | — (internal only) |
| Admin Service | 3006 | — (internal only) |
| Notification Service | 3007 | — (internal only) |
| Search Service | 3008 | — (internal only) |
| PostgreSQL | 5432 | **5432** (or `POSTGRES_PUBLISH_PORT` in `.env`) |
| Redis | 6379 | **6379** |
| RabbitMQ AMQP | 5672 | **5672** |
| RabbitMQ UI | 15672 | **15672** |

---

## Environment Variables (`.env`)

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

Key variables for Docker:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PUBLISH_PORT` | `5432` | Change to `5433` if local PG already uses 5432 |
| `API_GATEWAY_PUBLISH_PORT` | `3000` | Change to `3003` if local gateway already uses 3000 |
| `JWT_SECRET` | `change-me-in-production` | **Must change in production** |
| `TYPEORM_SYNC` | `false` | Set `true` only on empty DB for auto-migration |

---

## npm Scripts

```bash
npm run docker:stack:up      # docker compose -f docker-compose.stack.yml up --build
npm run docker:stack:down    # docker compose -f docker-compose.stack.yml down
npm run docker:stack:build   # docker compose -f docker-compose.stack.yml build
```

---

## Typical Workflows

### First-time setup

```bash
cp .env.example .env
npm run docker:stack:up
# Wait for all services to be healthy, then open:
open http://localhost:8080
```

### Rebuild after code changes

```bash
# Rebuild the shared image and restart all services
docker compose -f docker-compose.stack.yml up --build -d

# Rebuild and restart only one service (e.g. listing-service)
docker compose -f docker-compose.stack.yml up --build -d listing-service
```

### Run microservices locally, infrastructure in Docker

```bash
# Start only infrastructure
docker compose -f docker-compose.dev.yml up -d

# Run services locally (in separate terminals)
npm run start:dev -w auth-service
npm run start:dev -w listing-service
npm run start:dev -w api-gateway
```

### Reset everything (clean slate)

```bash
docker compose -f docker-compose.stack.yml down -v   # remove containers + volumes
docker rmi car-marketplace-runner:local car-marketplace-web:local 2>/dev/null || true
npm run docker:stack:up                               # rebuild from scratch
```
