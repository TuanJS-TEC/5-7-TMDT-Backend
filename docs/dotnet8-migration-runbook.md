# .NET 8 Migration Runbook

## Scope delivered

- Modular monolith solution in `dotnet/` with modules:
  - Auth, Users, Listings, Payments, Notifications, Admin, Search
- API gateway behavior consolidated into one ASP.NET Core API (`api/v1` versioned routes).
- Listings domain migrated with EF Core + PostgreSQL.
- EF Core baseline migration generated for `listings` table.
- Vue 3 + PrimeVue frontend scaffolded in `frontend/`.

## Local backend setup

1. Ensure PostgreSQL is running.
2. Copy `dotnet/.env.example` values to your environment.
3. Run migration:
   - `dotnet dotnet-ef database update --project dotnet/src/Modules/Listings/CarMarketplace.Modules.Listings/CarMarketplace.Modules.Listings.csproj --startup-project dotnet/src/Api/CarMarketplace.Api/CarMarketplace.Api.csproj`
4. Start API:
   - `dotnet run --project dotnet/src/Api/CarMarketplace.Api/CarMarketplace.Api.csproj`

## Local frontend setup

1. In `frontend/`, create `.env` from `.env.example`.
2. Install and run:
   - `npm install`
   - `npm run dev`

## Key routes

- Health: `GET /api/v1/health`
- Auth module: `GET /api/v1/auth`, `POST /api/v1/auth/login`
- Listings:
  - `POST /api/v1/listings`
  - `GET /api/v1/listings`
  - `GET /api/v1/listings/seller/{sellerId}`
  - `GET /api/v1/listings/{id}`
  - `PATCH /api/v1/listings/{id}`
  - `POST /api/v1/listings/{id}/approve`
  - `DELETE /api/v1/listings/{id}`

## Build/test commands

- Backend build: `dotnet build CarMarketplace.sln`
- Backend tests: `dotnet test CarMarketplace.sln`
- Frontend build: `npm run build` (inside `frontend/`)
