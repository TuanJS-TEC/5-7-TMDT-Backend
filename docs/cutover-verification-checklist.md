# Cutover Verification Checklist (NestJS -> .NET 8)

## Preconditions

- Both stacks are deployable in staging.
- Postgres schema is migrated (`InitialListings` applied).
- Feature freeze is active for legacy Nest services.

## Route-level comparison

- Compare response parity between old and new for:
  - `GET /health` equivalent
  - `GET /api/v1/listings`
  - `GET /api/v1/listings/{id}`
  - `POST /api/v1/listings`
  - `PATCH /api/v1/listings/{id}`
  - `POST /api/v1/listings/{id}/approve`
  - `DELETE /api/v1/listings/{id}`
- Validate:
  - status codes
  - payload shapes
  - validation errors
  - not-found behavior

## Progressive cutover steps

1. Route a small percentage of listing read traffic to .NET API.
2. Observe logs/latency/error rates for 30-60 minutes.
3. Move write endpoints for listings.
4. Move non-listing module routes (currently scaffold parity endpoints).
5. Complete 100% switch to .NET API.

## Rollback strategy

- Keep old NestJS services running behind switchable routing.
- Rollback trigger thresholds:
  - elevated 5xx rate
  - data inconsistency
  - unacceptable latency
- Rollback action:
  - redirect traffic to Nest endpoints
  - keep .NET in shadow mode for diagnostics

## Post-cutover checks

- Run smoke tests from frontend to .NET endpoints.
- Confirm database writes/reads for listings are correct.
- Verify auth/login endpoint contract for frontend integration.
