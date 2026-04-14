# Backend Inventory (NestJS Baseline)

## Services in `apps/*`

- `api-gateway`: starter-only (`GET /` -> "Hello World!").
- `auth-service`: starter-only (`GET /` -> "Hello World!").
- `user-service`: starter-only (`GET /` -> "Hello World!").
- `payment-service`: starter-only (`GET /` -> "Hello World!").
- `notification-service`: starter-only (`GET /` -> "Hello World!").
- `admin-service`: starter-only (`GET /` -> "Hello World!").
- `search-service`: starter-only (`GET /` -> "Hello World!").
- `listing-service`: only module with real domain/CQRS logic.

## API Compatibility Matrix (Current)

### Generic starter services

All non-listing services currently expose:

- `GET /` -> `string` `"Hello World!"`
- HTTP 200 only (no validation, no auth)

### Listing service (`/api/v1/listings`)

- `POST /api/v1/listings`
  - body: `CreateListingDto`
  - returns created listing object
- `GET /api/v1/listings?page=&limit=&status=`
  - returns paginated listing result `{ items, total, page, limit }`
- `GET /api/v1/listings/seller/:sellerId?page=&limit=`
  - returns paginated listing result for seller
- `GET /api/v1/listings/:id`
  - returns listing detail
  - 404 when listing not found
- `PATCH /api/v1/listings/:id`
  - body: `UpdateListingDto`
  - returns updated listing detail
- `POST /api/v1/listings/:id/approve`
  - body: `ApproveListingDto`
  - returns approved listing detail
- `DELETE /api/v1/listings/:id`
  - body: `DeleteListingDto`
  - returns `{ success: true }`

## DTO/Validation baseline (Listing)

- `CreateListingDto`: title, description, priceVnd, sellerId
- `UpdateListingDto`: sellerId + optional editable fields
- `ApproveListingDto`: moderatorId
- `DeleteListingDto`: sellerId

Global validation in listing service:

- whitelist enabled
- forbidNonWhitelisted enabled
- transform enabled

## Domain and CQRS baseline

- Aggregate: `Listing`
  - status transitions: draft/pending/approved/rejected/sold
- Commands:
  - create, update, approve, delete
- Queries:
  - detail, list, seller-list
- Events:
  - listing-created, listing-approved

## Persistence & integration points

- PostgreSQL env keys:
  - `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- TypeORM entity: `listings` table with key fields:
  - title, description, priceVnd(bigint), sellerId(uuid), status, approvedAt
- In-memory store (`Map`) currently used in read/write repositories for listing module.
- RabbitMQ publisher class exists for listing events.
- Redis/Elasticsearch/MinIO appear in docker setup but not actively wired in current code path.

## Migration implications

- Most modules are scaffolding; migration effort focuses on:
  1) establishing .NET modular architecture
  2) implementing listing domain parity
  3) preserving placeholder endpoints for other modules until business logic is added
