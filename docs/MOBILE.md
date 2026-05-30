# Car Marketplace — Mobile App (Expo)

## Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- API Gateway running on port **3000** (`npm run start:gateway`)
- Listing, auth, payment services (Docker stack or individual `start:*` scripts)

## Setup

```bash
# From monorepo root
npm install
npm run build -w @car-marketplace/api-contract

cd apps/mobile
cp .env.example .env
# Edit EXPO_PUBLIC_API_BASE — use your machine LAN IP for physical devices:
# EXPO_PUBLIC_API_BASE=http://192.168.1.10:3000
```

## Run

```bash
# From root
npm run start:mobile

# Or inside apps/mobile
npm run start
npm run ios
npm run android
```

## Environment

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_BASE` | Gateway origin without `/api/v1` (e.g. `http://localhost:3000`) |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional Sentry DSN |

## Deep links

Scheme: `carmarketplace://listing/{id}`

## EAS Build

```bash
cd apps/mobile
npx eas build --profile development
npx eas build --profile production
```

Profiles in `apps/mobile/eas.json`.

## API contract

Shared types: `@car-marketplace/api-contract` (`libs/api-contract`).

OpenAPI snapshot: `GET http://localhost:3000/api/openapi.json`

**Test API trên điện thoại (browser):**

- Danh sách tin: `http://<IP-Mac>:3000/api/v1/listings?status=approved&page=1&limit=10`
- Tìm kiếm UC2: `http://<IP-Mac>:3000/api/v1/listings/search?keyword=toyota` (param là `keyword`, không phải `q`)

## Gateway routes used by mobile

- `/api/v1/auth/*`, `/api/v1/profile/*`
- `/api/v1/listings/*`
- `/api/v1/payments/*`
- `/api/v1/admin/*`
- `/api/v1/notifications/devices/register`
- `/api/v1/identity-verification/*` (CCCD, optional)
