-- 1. TẠO CƠ SỞ DỮ LIỆU
CREATE DATABASE car_marketplace;
\c car_marketplace;

-- ==========================================
-- 2. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU (ENUMS)
-- Lưu ý: Các giá trị ('...', '...') dưới đây là dữ liệu giả định phổ biến, 
-- bạn có thể điều chỉnh lại cho đúng với logic hệ thống của mình.
-- ==========================================

-- ENUMs cho User
CREATE TYPE user_type_enum AS ENUM ('individual', 'dealer', 'admin');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'banned');

-- ENUMs cho Listing (Tin đăng)
CREATE TYPE transmission_enum AS ENUM ('manual', 'automatic');
CREATE TYPE fuel_type_enum AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');
CREATE TYPE origin_enum AS ENUM ('domestic', 'imported');
CREATE TYPE listing_status_enum AS ENUM ('draft', 'pending', 'active', 'rejected', 'sold', 'expired');
CREATE TYPE ai_check_status_enum AS ENUM ('pending', 'passed', 'failed');

-- ENUMs cho Tương tác & Tố cáo
CREATE TYPE contact_type_enum AS ENUM ('call', 'sms', 'chat', 'zalo');
CREATE TYPE report_reason_enum AS ENUM ('spam', 'scam', 'wrong_info', 'sold', 'other');
CREATE TYPE report_status_enum AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

-- ENUMs cho Giao dịch & Gói dịch vụ
CREATE TYPE package_type_enum AS ENUM ('post', 'push', 'vip');
CREATE TYPE transaction_type_enum AS ENUM ('purchase', 'refund', 'bonus');
CREATE TYPE payment_method_enum AS ENUM ('bank_transfer', 'momo', 'vnpay', 'credit_card');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'success', 'failed', 'cancelled');
CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed_amount');

-- ENUMs cho Quản trị & Hệ thống
CREATE TYPE admin_action_type_enum AS ENUM ('approve_listing', 'reject_listing', 'ban_user', 'unban_user');
CREATE TYPE audit_action_enum AS ENUM ('create', 'update', 'delete', 'login');
CREATE TYPE violation_type_enum AS ENUM ('fake_info', 'scam', 'spam_post');
CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high', 'critical');

-- ENUMs cho Marketing & Truyền thông
CREATE TYPE article_category_enum AS ENUM ('news', 'review', 'tip');
CREATE TYPE banner_position_enum AS ENUM ('home_top', 'home_middle', 'listing_sidebar');
CREATE TYPE notification_type_enum AS ENUM ('system', 'promotion', 'transaction', 'listing_update');
CREATE TYPE notification_channel_enum AS ENUM ('in_app', 'email', 'sms');
CREATE TYPE notification_status_enum AS ENUM ('sent', 'failed');


-- ==========================================
-- 3. TẠO CÁC BẢNG (TABLES)
-- Sắp xếp theo thứ tự ưu tiên Khóa ngoại (Foreign Key)
-- ==========================================

-- Nhóm 1: Bảng Danh mục & Địa lý (Không có khóa ngoại phụ thuộc)
CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(10),
    region_id INTEGER,
    display_order INTEGER
);

CREATE TABLE car_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    logo_url TEXT,
    display_order INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE car_models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES car_brands(id),
    name VARCHAR(100),
    slug VARCHAR(150),
    is_active BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

-- Nhóm 2: Bảng Người dùng & Auth
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    user_type user_type_enum,
    is_verified BOOLEAN,
    verification_document_url TEXT,
    verification_status verification_status_enum,
    free_posts_remaining INTEGER,
    account_status account_status_enum,
    ban_reason TEXT,
    violation_count INTEGER,
    device_fingerprint VARCHAR(255),
    account_balance NUMERIC(15,2),
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    token_hash VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

-- Nhóm 3: Bảng Tin đăng (Listings)
CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT REFERENCES users(id),
    brand_id INTEGER REFERENCES car_brands(id),
    model_id INTEGER REFERENCES car_models(id),
    title VARCHAR(500),
    description TEXT,
    price NUMERIC(15,0),
    year INTEGER,
    mileage INTEGER,
    transmission transmission_enum,
    fuel_type fuel_type_enum,
    origin origin_enum,
    province_id INTEGER REFERENCES provinces(id),
    seller_phone VARCHAR(20),
    vip_level SMALLINT,
    is_featured BOOLEAN,
    featured_expires_at TIMESTAMP WITHOUT TIME ZONE,
    status listing_status_enum,
    rejection_reason TEXT,
    quality_score INTEGER,
    view_count INTEGER,
    contact_count INTEGER,
    share_count INTEGER,
    refreshed_at TIMESTAMP WITHOUT TIME ZONE,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    is_deleted BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE listing_photos (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES listings(id),
    photo_url TEXT,
    display_order INTEGER,
    is_primary BOOLEAN,
    ai_check_status ai_check_status_enum,
    ai_rejection_reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

-- Nhóm 4: Bảng Tương tác với Tin đăng
CREATE TABLE listing_contacts (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES listings(id),
    buyer_id BIGINT REFERENCES users(id),
    contact_type contact_type_enum,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE listing_views (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES listings(id),
    user_id BIGINT REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    listing_id BIGINT REFERENCES listings(id),
    notify_price_change BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE comparisons (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    listing_id BIGINT REFERENCES listings(id),
    position SMALLINT,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

-- Nhóm 5: Gói dịch vụ & Giao dịch
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    package_type package_type_enum,
    name VARCHAR(255),
    description TEXT,
    price NUMERIC(15,0),
    duration_days INTEGER,
    quantity INTEGER,
    benefits JSONB,
    is_active BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_code VARCHAR(100),
    user_id BIGINT REFERENCES users(id),
    listing_id BIGINT REFERENCES listings(id),
    package_id INTEGER REFERENCES packages(id),
    transaction_type transaction_type_enum,
    amount NUMERIC(15,0),
    discount_amount NUMERIC(15,0),
    final_amount NUMERIC(15,0),
    payment_method payment_method_enum,
    status transaction_status_enum,
    payment_gateway_response TEXT,
    webhook_id VARCHAR(255),
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50),
    name VARCHAR(255),
    description TEXT,
    discount_type discount_type_enum,
    discount_value NUMERIC(15,2),
    max_discount NUMERIC(15,2),
    min_order_value NUMERIC(15,0),
    applicable_packages JSONB,
    user_conditions JSONB,
    usage_limit INTEGER,
    used_count INTEGER,
    valid_from TIMESTAMP WITHOUT TIME ZONE,
    valid_to TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

-- Nhóm 6: Quản trị, Log & Tố cáo
CREATE TABLE admin_actions (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT REFERENCES users(id),
    action_type admin_action_type_enum,
    target_user_id BIGINT REFERENCES users(id),
    target_listing_id BIGINT REFERENCES listings(id),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES listings(id),
    reporter_id BIGINT REFERENCES users(id),
    reason report_reason_enum,
    description TEXT,
    status report_status_enum,
    reviewed_by BIGINT REFERENCES users(id),
    admin_note TEXT,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE violations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    listing_id BIGINT REFERENCES listings(id),
    violation_type violation_type_enum,
    description TEXT,
    severity severity_enum,
    created_by BIGINT REFERENCES users(id),
    is_resolved BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action audit_action_enum,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

-- Nhóm 7: Truyền thông & Hệ thống khác
CREATE TABLE news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    slug VARCHAR(600),
    summary TEXT,
    content TEXT,
    thumbnail_url TEXT,
    author VARCHAR(255),
    category article_category_enum,
    view_count INTEGER,
    is_published BOOLEAN,
    published_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT,
    link_url TEXT,
    position banner_position_enum,
    display_order INTEGER,
    valid_from TIMESTAMP WITHOUT TIME ZONE,
    valid_to TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN,
    click_count INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE seo_settings (
    id SERIAL PRIMARY KEY,
    page_type VARCHAR(100),
    entity_id BIGINT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    canonical_url TEXT,
    schema_markup JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE revenue_analytics (
    id BIGSERIAL PRIMARY KEY,
    report_date DATE,
    total_revenue NUMERIC(15,0),
    vip1_revenue NUMERIC(15,0),
    vip2_revenue NUMERIC(15,0),
    refresh_revenue NUMERIC(15,0),
    featured_revenue NUMERIC(15,0),
    renew_revenue NUMERIC(15,0),
    new_users INTEGER,
    active_users INTEGER,
    new_listings INTEGER,
    total_transactions INTEGER,
    conversion_rate NUMERIC(5,4),
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE system_metrics (
    id BIGSERIAL PRIMARY KEY,
    report_date DATE,
    dau INTEGER,
    mau INTEGER,
    new_posts INTEGER,
    total_transactions INTEGER,
    avg_session_time NUMERIC(8,2),
    contact_rate NUMERIC(5,4),
    favorite_rate NUMERIC(5,4),
    bounce_rate NUMERIC(5,4),
    spam_rate NUMERIC(5,4),
    avg_photos_per_post NUMERIC(5,2),
    page_load_time_ms INTEGER,
    search_response_time_ms INTEGER,
    error_rate NUMERIC(5,4),
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    type notification_type_enum,
    title VARCHAR(500),
    content TEXT,
    data JSONB,
    is_read BOOLEAN,
    channel notification_channel_enum,
    status notification_status_enum,
    sent_at TIMESTAMP WITHOUT TIME ZONE,
    read_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE promotion_usage (
    id BIGSERIAL PRIMARY KEY,
    promotion_id INTEGER REFERENCES promotions(id),
    user_id BIGINT REFERENCES users(id),
    transaction_id BIGINT REFERENCES transactions(id),
    discount_amount NUMERIC(15,0),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);