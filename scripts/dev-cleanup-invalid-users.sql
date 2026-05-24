-- Chạy khi DB có user rác (phone rỗng) gây lỗi đăng nhập/đăng ký khó debug.
-- psql -h localhost -U postgres -d car_marketplace -f scripts/dev-cleanup-invalid-users.sql

DELETE FROM users
WHERE phone IS NULL OR trim(phone) = '';

-- Giữ superadmin; nếu thiếu, auth-service sẽ bootstrap lại khi khởi động.
