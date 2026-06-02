#!/usr/bin/env bash
# Tạo PostgreSQL local cho Car Marketplace (macOS Homebrew hoặc Postgres cài sẵn).
# Chạy từ thư mục gốc repo:  bash scripts/setup-local-db.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PG_HOST="${POSTGRES_HOST:-localhost}"
PG_PORT="${POSTGRES_PORT:-5432}"
PG_USER="${POSTGRES_USER:-postgres}"
PG_PASS="${POSTGRES_PASSWORD:-12345}"
PG_DB="${POSTGRES_DB:-car_marketplace}"

echo "==> Kiểm tra PostgreSQL tại ${PG_HOST}:${PG_PORT}..."
if ! pg_isready -h "$PG_HOST" -p "$PG_PORT" >/dev/null 2>&1; then
  echo "ERROR: PostgreSQL không chạy. Khởi động bằng: brew services start postgresql@14"
  exit 1
fi

# User quản trị cục bộ (Homebrew thường là tên macOS, không phải postgres)
LOCAL_SUPERUSER="${PG_LOCAL_SUPERUSER:-$(whoami)}"

echo "==> Tạo role postgres (nếu chưa có) — khớp .env..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$LOCAL_SUPERUSER" -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres WITH LOGIN PASSWORD '${PG_PASS}' SUPERUSER CREATEDB CREATEROLE;
  ELSE
    ALTER ROLE postgres WITH PASSWORD '${PG_PASS}';
  END IF;
END
\$\$;
SQL

echo "==> Tạo database ${PG_DB} (nếu chưa có)..."
EXISTS=$(PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '${PG_DB}'" 2>/dev/null || true)
if [[ "$EXISTS" != "1" ]]; then
  PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c \
    "CREATE DATABASE \"${PG_DB}\" OWNER postgres ENCODING 'UTF8';"
  echo "    Đã tạo database ${PG_DB}."
else
  echo "    Database ${PG_DB} đã tồn tại."
fi

echo "==> Áp schema payment..."
PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -f scripts/payment-schema.sql

echo "==> Đồng bộ bảng auth (TypeORM SYNC, ~12s)..."
if [[ -f apps/auth-service/dist/main.js ]]; then
  (
    cd apps/auth-service
    TYPEORM_SYNC=true POSTGRES_HOST="$PG_HOST" POSTGRES_PORT="$PG_PORT" \
      POSTGRES_USER="$PG_USER" POSTGRES_PASSWORD="$PG_PASS" POSTGRES_DB="$PG_DB" \
      SUPERADMIN_BOOTSTRAP_ENABLED=true SKIP_REDIS=true \
      node dist/main.js
  ) &
  AUTH_PID=$!
  sleep 12
  kill "$AUTH_PID" 2>/dev/null || true
  wait "$AUTH_PID" 2>/dev/null || true
else
  echo "    Bỏ qua: chưa build auth-service (npm run build -w auth-service)"
fi

echo "==> Đồng bộ bảng listing (TypeORM SYNC, ~12s)..."
if [[ -f apps/listing-service/dist/main.js ]]; then
  (
    cd apps/listing-service
    TYPEORM_SYNC=true POSTGRES_HOST="$PG_HOST" POSTGRES_PORT="$PG_PORT" \
      POSTGRES_USER="$PG_USER" POSTGRES_PASSWORD="$PG_PASS" POSTGRES_DB="$PG_DB" \
      RABBITMQ_URL= node dist/main.js
  ) &
  LS_PID=$!
  sleep 12
  kill "$LS_PID" 2>/dev/null || true
  wait "$LS_PID" 2>/dev/null || true
else
  echo "    Bỏ qua: chưa build listing-service (npm run build -w listing-service)"
fi

echo ""
echo "==> Hoàn tất. Bảng trong ${PG_DB}:"
PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c '\dt'

echo ""
echo "Kết nối: postgresql://${PG_USER}:****@${PG_HOST}:${PG_PORT}/${PG_DB}"
echo "File .env đã có POSTGRES_* — giữ TYPEORM_SYNC=false sau khi DB đã có dữ liệu."
