-- ============================================================================
-- Dữ liệu mẫu cho database car_marketplace (PostgreSQL)
-- ============================================================================
-- CẢNH BÁO: Script XÓA TOÀN BỘ dữ liệu các bảng liên quan (TRUNCATE … CASCADE)
-- rồi chèn lại dữ liệu demo. Chỉ dùng trên môi trường dev / DB trống.
--
-- Mật khẩu đăng nhập mẫu (bcryptjs, 10 rounds): 12345
-- Hash cố định (khớp apps/auth-service): $2a$10$H41XeW3kzS6rONnEgyEEA.AlNkiPhg2LRNmKM7kapHErJp3D7Gk7S
--
-- Tài khoản (SĐT / mật khẩu):
--   0900000001 / 12345 — admin
--   0900000002 / 12345 — seller (showroom)
--   0900000003 / 12345 — buyer
-- ============================================================================

BEGIN;

TRUNCATE TABLE
  promotion_usage,
  transactions,
  admin_actions,
  audit_logs,
  comparisons,
  favorites,
  listing_contacts,
  listing_photos,
  listing_views,
  notifications,
  reports,
  user_sessions,
  violations,
  listings,
  users,
  otp_challenges,
  pending_registrations,
  promotions,
  packages,
  car_models,
  car_brands,
  provinces,
  banners,
  news_articles,
  revenue_analytics,
  seo_settings,
  system_metrics
RESTART IDENTITY CASCADE;

-- --- Địa lý & danh mục xe ---
INSERT INTO provinces (id, name, code, region_id, display_order) VALUES
  (1, 'Hà Nội', 'HN', 1, 1),
  (2, 'TP. Hồ Chí Minh', 'SG', 1, 2);

INSERT INTO car_brands (id, name, logo_url, display_order, is_active) VALUES
  (1, 'Toyota', 'https://cdn.example.com/brands/toyota.png', 1, true),
  (2, 'Honda', 'https://cdn.example.com/brands/honda.png', 2, true);

INSERT INTO car_models (id, brand_id, name, slug, is_active) VALUES
  (1, 1, 'Camry', 'toyota-camry', true),
  (2, 2, 'City', 'honda-city', true);

INSERT INTO packages (id, package_type, name, description, price, duration_days, quantity, benefits, is_active) VALUES
  (1, 'vip1'::package_type_enum, 'Gói VIP 1', 'Ưu tiên hiển thị 7 ngày', 199000, 7, 1, '{"highlight": true}'::jsonb, true),
  (2, 'vip2'::package_type_enum, 'Gói VIP 2', 'Top trang chủ 14 ngày', 499000, 14, 1, '{"top": true}'::jsonb, true),
  (3, 'refresh'::package_type_enum, 'Đẩy tin', 'Đưa tin lên đầu danh sách', 49000, NULL, 1, '[]'::jsonb, true),
  (4, 'featured'::package_type_enum, 'Ghim nổi bật', 'Hiển thị khu vực nổi bật', 99000, 3, 1, '[]'::jsonb, true);

INSERT INTO promotions (id, code, name, description, discount_type, discount_value, max_discount, min_order_value, applicable_packages, user_conditions, usage_limit, used_count, valid_from, valid_to, is_active) VALUES
  (1, 'WELCOME10', 'Giảm 10% lần đầu', 'Áp dụng gói VIP', 'percentage'::discount_type_enum, 10, 50000, 100000, '[1, 2]'::jsonb, '{}'::jsonb, 100, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true);

-- --- Người dùng (legacy + cột TypeORM cho auth-service) ---
INSERT INTO users (
  id, phone, email, password_hash, full_name, user_type, is_verified, verification_status,
  free_posts_remaining, account_status, violation_count, account_balance,
  "fullName", "accountType", "freeListingCredits", "passwordHash", role, "phoneVerified",
  address, "sellerDescription"
) VALUES
  (
    1, '0900000001', 'admin@example.com',
    '$2a$10$H41XeW3kzS6rONnEgyEEA.AlNkiPhg2LRNmKM7kapHErJp3D7Gk7S',
    'Quản trị viên', 'individual'::user_type_enum, true, 'approved'::verification_status_enum,
    3, 'active'::account_status_enum, 0, 0,
    'Quản trị viên', 'personal', 0,
    '$2a$10$H41XeW3kzS6rONnEgyEEA.AlNkiPhg2LRNmKM7kapHErJp3D7Gk7S',
    'admin', true,
    'Hà Nội', ''
  ),
  (
    2, '0900000002', 'seller@example.com',
    '$2a$10$H41XeW3kzS6rONnEgyEEA.AlNkiPhg2LRNmKM7kapHErJp3D7Gk7S',
    'Showroom Xe Tốt', 'showroom'::user_type_enum, true, 'approved'::verification_status_enum,
    10, 'active'::account_status_enum, 0, 0,
    'Showroom Xe Tốt', 'showroom', 5,
    '$2a$10$H41XeW3kzS6rONnEgyEEA.AlNkiPhg2LRNmKM7kapHErJp3D7Gk7S',
    'seller', true,
    'Quận 1, TP.HCM', 'Chuyên xe lướt, bảo hành chính hãng.'
  ),
  (
    3, '0900000003', 'buyer@example.com',
    '$2a$10$H41XeW3kzS6rONnEgyEEA.AlNkiPhg2LRNmKM7kapHErJp3D7Gk7S',
    'Nguyễn Văn A', 'individual'::user_type_enum, true, 'approved'::verification_status_enum,
    3, 'active'::account_status_enum, 0, 0,
    'Nguyễn Văn A', 'personal', 0,
    '$2a$10$H41XeW3kzS6rONnEgyEEA.AlNkiPhg2LRNmKM7kapHErJp3D7Gk7S',
    'buyer', true,
    'Hà Nội', ''
  );

-- --- Tin đăng ---
INSERT INTO listings (
  id, seller_id, brand_id, model_id, title, description, price, year, mileage,
  transmission, fuel_type, origin, province_id, seller_phone, vip_level, is_featured,
  status, rejection_reason, view_count, contact_count, share_count, is_deleted
) VALUES
  (
    1, 2, 1, 1,
    'Toyota Camry 2.5Q 2020 — zin, đi ít',
    'Xe gia đình, bảo dưỡng định kỳ, một chủ từ đầu.',
    850000000, 2020, 35000,
    'automatic'::transmission_enum, 'gasoline'::fuel_type_enum, 'domestic'::origin_enum,
    1, '0900000002', 1, true,
    'active'::listing_status_enum, NULL, 120, 5, 2, false
  ),
  (
    2, 2, 2, 2,
    'Honda City RS 2021 — chờ duyệt',
    'Mô tả ngắn gọn cho tin pending.',
    520000000, 2021, 20000,
    'automatic'::transmission_enum, 'gasoline'::fuel_type_enum, 'domestic'::origin_enum,
    2, '0900000002', 0, false,
    'pending'::listing_status_enum, NULL, 0, 0, 0, false
  ),
  (
    3, 2, 1, 1,
    'Toyota Camry — tin mẫu bị từ chối',
    'Nội dung không đạt yêu cầu (dữ liệu mẫu).',
    800000000, 2019, 90000,
    'automatic'::transmission_enum, 'gasoline'::fuel_type_enum, 'domestic'::origin_enum,
    1, '0900000002', 0, false,
    'rejected'::listing_status_enum, 'Ảnh không rõ nét', 0, 0, 0, false
  );

INSERT INTO listing_photos (listing_id, photo_url, display_order, is_primary, ai_check_status) VALUES
  (1, 'https://cdn.example.com/listings/1/front.jpg', 0, true, 'approved'::ai_check_status_enum),
  (1, 'https://cdn.example.com/listings/1/interior.jpg', 1, false, 'approved'::ai_check_status_enum);

INSERT INTO favorites (user_id, listing_id, notify_price_change) VALUES
  (3, 1, true);

INSERT INTO comparisons (user_id, listing_id, position) VALUES
  (3, 1, 1);

INSERT INTO listing_views (listing_id, user_id, ip_address, user_agent) VALUES
  (1, 3, '127.0.0.1', 'Mozilla/5.0 (demo)');

INSERT INTO listing_contacts (listing_id, buyer_id, contact_type, ip_address) VALUES
  (1, 3, 'phone_reveal'::contact_type_enum, '127.0.0.1');

INSERT INTO reports (listing_id, reporter_id, reason, description, status, reviewed_by, admin_note, reviewed_at) VALUES
  (2, 3, 'wrong_info'::report_reason_enum, 'Giá không khớp thực tế (dữ liệu mẫu).', 'pending'::report_status_enum, NULL, NULL, NULL);

INSERT INTO notifications (user_id, type, title, content, data, is_read, channel, status, sent_at) VALUES
  (
    3, 'listing_approved'::notification_type_enum,
    'Tin đăng đã được duyệt',
    'Xe Toyota Camry của bạn đang hiển thị công khai.',
    '{"listingId": 1}'::jsonb,
    false, 'in_app'::notification_channel_enum, 'sent'::notification_status_enum, NOW()
  );

INSERT INTO transactions (
  id, transaction_code, user_id, listing_id, package_id, transaction_type,
  amount, discount_amount, final_amount, payment_method, status,
  payment_gateway_response, paid_at
) VALUES
  (
    1, 'TXN-DEMO-20260411-0001', 2, 1, 1, 'vip_package'::transaction_type_enum,
    199000, 19900, 179100, 'qr_banking'::payment_method_enum, 'completed'::transaction_status_enum,
    '{"gateway":"demo","ok":true}'::text, NOW()
  );

INSERT INTO promotion_usage (promotion_id, user_id, transaction_id, discount_amount) VALUES
  (1, 2, 1, 19900);

INSERT INTO admin_actions (admin_id, action_type, target_user_id, target_listing_id, reason, metadata) VALUES
  (1, 'approve_listing'::admin_action_type_enum, 2, 1, 'Đạt chuẩn', '{"source":"seed"}'::jsonb);

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address) VALUES
  (3, 'login'::audit_action_enum, 'user', 3, '{"device":"demo"}'::jsonb, '127.0.0.1');

INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at) VALUES
  (3, 'sha256-demo-session-token-hash', '127.0.0.1', 'Mozilla/5.0 (seed)', NOW() + INTERVAL '7 days');

INSERT INTO violations (user_id, listing_id, violation_type, description, severity, created_by, is_resolved) VALUES
  (2, 1, 'fake_info'::violation_type_enum, 'Ghi chú vi phạm mẫu (chưa xử lý).', 'warning'::severity_enum, 1, false);

INSERT INTO revenue_analytics (
  report_date, total_revenue, vip1_revenue, vip2_revenue, refresh_revenue, featured_revenue, renew_revenue,
  new_users, active_users, new_listings, total_transactions, conversion_rate
) VALUES
  (CURRENT_DATE - 1, 5000000, 2000000, 1500000, 500000, 800000, 200000, 12, 340, 8, 25, 0.042);

INSERT INTO system_metrics (
  report_date, dau, mau, new_posts, total_transactions, avg_session_time, contact_rate, favorite_rate,
  bounce_rate, spam_rate, avg_photos_per_post, page_load_time_ms, search_response_time_ms, error_rate
) VALUES
  (
    CURRENT_DATE - 1, 220, 1800, 14, 25, 4.5, 0.12, 0.08,
    0.35, 0.01, 4.2, 420, 180, 0.002
  );

INSERT INTO seo_settings (page_type, entity_id, meta_title, meta_description, meta_keywords, canonical_url, schema_markup) VALUES
  (
    'home', NULL,
    'Chợ xe ô tô — Mua bán xe uy tín',
    'Tìm kiếm, so sánh và liên hệ người bán xe.',
    'ô tô, mua xe, bán xe',
    'https://example.com/',
    '{"@context":"https://schema.org","@type":"WebSite"}'::jsonb
  );

INSERT INTO banners (title, image_url, link_url, position, display_order, valid_from, valid_to, is_active, click_count) VALUES
  (
    'Khuyến mãi tháng 4',
    'https://cdn.example.com/banners/promo-apr.jpg',
    'https://example.com/khuyen-mai',
    'homepage_top'::banner_position_enum,
    1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 42
  );

INSERT INTO news_articles (title, slug, summary, content, thumbnail_url, author, category, view_count, is_published, published_at) VALUES
  (
    '5 lưu ý khi mua xe cũ',
    '5-luu-y-khi-mua-xe-cu',
    'Kiểm tra hồ sơ, máy và giá thị trường.',
    '<p>Nội dung bài viết mẫu…</p>',
    'https://cdn.example.com/news/used-cars.jpg',
    'Ban biên tập',
    'guides'::article_category_enum,
    150, true, NOW() - INTERVAL '2 days'
  );

-- OTP mẫu: mã plaintext 123456 (bcryptjs 4 rounds — khớp otp-challenge.service)
INSERT INTO otp_challenges (
  id, phone, purpose, "otpHash", "expiresAt", "wrongAttempts", "verifyLockedUntil"
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '0900000009',
    'registration',
    '$2a$04$Yx7YvoEIfbjJCS/RQZVabuCN0XT7CPKZSvxfPLI/5qXTkeVOSypLK',
    NOW() + INTERVAL '10 minutes',
    0,
    NULL
  );

INSERT INTO pending_registrations (
  id, phone, "fullName", "passwordHash", "accountType", "pendingExpiresAt"
) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '0900000010',
    'Người đăng ký demo',
    '$2a$10$H41XeW3kzS6rONnEgyEEA.AlNkiPhg2LRNmKM7kapHErJp3D7Gk7S',
    'personal',
    NOW() + INTERVAL '1 hour'
  );

-- Đồng bộ sequence sau khi gán id cố định
SELECT setval(pg_get_serial_sequence('provinces', 'id'), (SELECT COALESCE(MAX(id), 1) FROM provinces));
SELECT setval(pg_get_serial_sequence('car_brands', 'id'), (SELECT COALESCE(MAX(id), 1) FROM car_brands));
SELECT setval(pg_get_serial_sequence('car_models', 'id'), (SELECT COALESCE(MAX(id), 1) FROM car_models));
SELECT setval(pg_get_serial_sequence('packages', 'id'), (SELECT COALESCE(MAX(id), 1) FROM packages));
SELECT setval(pg_get_serial_sequence('promotions', 'id'), (SELECT COALESCE(MAX(id), 1) FROM promotions));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval(pg_get_serial_sequence('listings', 'id'), (SELECT COALESCE(MAX(id), 1) FROM listings));
SELECT setval(pg_get_serial_sequence('listing_photos', 'id'), (SELECT COALESCE(MAX(id), 1) FROM listing_photos));
SELECT setval(pg_get_serial_sequence('favorites', 'id'), (SELECT COALESCE(MAX(id), 1) FROM favorites));
SELECT setval(pg_get_serial_sequence('comparisons', 'id'), (SELECT COALESCE(MAX(id), 1) FROM comparisons));
SELECT setval(pg_get_serial_sequence('listing_views', 'id'), (SELECT COALESCE(MAX(id), 1) FROM listing_views));
SELECT setval(pg_get_serial_sequence('listing_contacts', 'id'), (SELECT COALESCE(MAX(id), 1) FROM listing_contacts));
SELECT setval(pg_get_serial_sequence('reports', 'id'), (SELECT COALESCE(MAX(id), 1) FROM reports));
SELECT setval(pg_get_serial_sequence('notifications', 'id'), (SELECT COALESCE(MAX(id), 1) FROM notifications));
SELECT setval(pg_get_serial_sequence('transactions', 'id'), (SELECT COALESCE(MAX(id), 1) FROM transactions));
SELECT setval(pg_get_serial_sequence('promotion_usage', 'id'), (SELECT COALESCE(MAX(id), 1) FROM promotion_usage));
SELECT setval(pg_get_serial_sequence('admin_actions', 'id'), (SELECT COALESCE(MAX(id), 1) FROM admin_actions));
SELECT setval(pg_get_serial_sequence('audit_logs', 'id'), (SELECT COALESCE(MAX(id), 1) FROM audit_logs));
SELECT setval(pg_get_serial_sequence('user_sessions', 'id'), (SELECT COALESCE(MAX(id), 1) FROM user_sessions));
SELECT setval(pg_get_serial_sequence('violations', 'id'), (SELECT COALESCE(MAX(id), 1) FROM violations));
SELECT setval(pg_get_serial_sequence('revenue_analytics', 'id'), (SELECT COALESCE(MAX(id), 1) FROM revenue_analytics));
SELECT setval(pg_get_serial_sequence('seo_settings', 'id'), (SELECT COALESCE(MAX(id), 1) FROM seo_settings));
SELECT setval(pg_get_serial_sequence('system_metrics', 'id'), (SELECT COALESCE(MAX(id), 1) FROM system_metrics));
SELECT setval(pg_get_serial_sequence('banners', 'id'), (SELECT COALESCE(MAX(id), 1) FROM banners));
SELECT setval(pg_get_serial_sequence('news_articles', 'id'), (SELECT COALESCE(MAX(id), 1) FROM news_articles));

COMMIT;
