-- データベーススキーマ

-- 診断セッションテーブル
CREATE TABLE IF NOT EXISTS diagnosis_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'セッションID（UUID）',
    age INT UNSIGNED COMMENT '年齢',
    children_count TINYINT UNSIGNED COMMENT '未成年の扶養人数',
    monthly_income DECIMAL(10, 2) COMMENT '手取り月収',
    monthly_fixed_cost DECIMAL(10, 2) COMMENT '毎月固定費',
    savings DECIMAL(12, 2) COMMENT '現預金額',
    monthly_insurance DECIMAL(10, 2) COMMENT '毎月保険料',
    diagnosis_score INT UNSIGNED COMMENT '診断スコア',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='診断セッション';

-- リードテーブル（メール登録ユーザー）
CREATE TABLE IF NOT EXISTS leads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    diagnosis_session_id BIGINT UNSIGNED UNIQUE COMMENT '診断セッションID',
    email VARCHAR(255) NOT NULL COMMENT 'メールアドレス',
    is_email_verified BOOLEAN DEFAULT FALSE COMMENT 'メール認証済みフラグ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (diagnosis_session_id) REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='リード（メール登録ユーザー）';

-- 結果アクセストークンテーブル
CREATE TABLE IF NOT EXISTS result_access_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT UNSIGNED NOT NULL COMMENT 'リードID',
    token VARCHAR(255) UNIQUE NOT NULL COMMENT 'アクセストークン',
    expires_at TIMESTAMP NULL COMMENT '有効期限（NULL=無期限。500円プラン購入者は無期限）',
    accessed_at TIMESTAMP NULL COMMENT 'アクセス日時',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_lead_id (lead_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='結果アクセストークン';

-- 決済テーブル（Stripe）
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    diagnosis_session_id BIGINT UNSIGNED NULL COMMENT '診断セッションID（preview の session_id から解決）',
    lead_id BIGINT UNSIGNED NULL COMMENT 'リードID（決済確定後に紐付け）',
    email VARCHAR(255) NULL COMMENT '購入者メール（送信先 / receipt_email）',
    plan_code VARCHAR(50) NOT NULL DEFAULT 'basic_500' COMMENT 'プランコード',
    amount INT UNSIGNED NOT NULL COMMENT '金額（JPYはゼロ小数通貨のため 500 をそのまま）',
    currency CHAR(3) NOT NULL DEFAULT 'jpy' COMMENT '通貨',
    status ENUM('pending', 'paid', 'failed', 'canceled', 'refunded') NOT NULL DEFAULT 'pending' COMMENT '決済ステータス',
    stripe_payment_intent_id VARCHAR(255) UNIQUE NULL COMMENT 'Stripe PaymentIntent ID（pi_...）。ポーリング/冪等キー',
    stripe_charge_id VARCHAR(255) NULL COMMENT 'Stripe Charge ID（返金照合）',
    stripe_customer_id VARCHAR(255) NULL COMMENT 'Stripe Customer ID',
    paid_at TIMESTAMP NULL COMMENT '入金確定日時',
    email_sent_at TIMESTAMP NULL COMMENT '購入完了メール送信日時（二重送信防止）',
    result_access_token_id BIGINT UNSIGNED NULL COMMENT '発行したフル結果トークンID',
    metadata JSON NULL COMMENT '監査・拡張用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (diagnosis_session_id) REFERENCES diagnosis_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (result_access_token_id) REFERENCES result_access_tokens(id) ON DELETE SET NULL,
    INDEX idx_payment_intent (stripe_payment_intent_id),
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_diagnosis_session_id (diagnosis_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='決済（Stripe）';

-- Stripe Webhook イベントテーブル（冪等性: 二重配信を無視）
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Stripe イベントID（evt_...）',
    type VARCHAR(100) NOT NULL COMMENT 'イベント種別',
    payload LONGTEXT NULL COMMENT '受信ペイロード（監査/再処理用）',
    processed_at TIMESTAMP NULL COMMENT '処理完了日時',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_id (event_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stripe Webhook イベント';

-- 予約テーブル（TimeRex連携）
CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT UNSIGNED NOT NULL COMMENT 'リードID',
    timerex_reservation_id VARCHAR(255) COMMENT 'TimeRex予約ID',
    reservation_status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending' COMMENT '予約ステータス',
    reserved_at TIMESTAMP NULL COMMENT '予約日時',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    INDEX idx_lead_id (lead_id),
    INDEX idx_timerex_reservation_id (timerex_reservation_id),
    INDEX idx_reservation_status (reservation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='予約（TimeRex連携）';
