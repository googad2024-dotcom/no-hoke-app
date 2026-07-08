-- 500円プラン（買い切り）購入者のフル結果トークンを無期限化するため、
-- result_access_tokens.expires_at を NULL 許容に変更する。
--   NULL  = 無期限（500円プラン購入者）
--   日時  = 有効期限あり（無料プラン: 発行から7日）
--
-- 既存DBへの適用:
--   mysql -u app -p asset_diagnosis < backend/database/migrations/2026_06_26_result_access_tokens_expires_at_nullable.sql

ALTER TABLE result_access_tokens
    MODIFY COLUMN expires_at TIMESTAMP NULL COMMENT '有効期限（NULL=無期限。500円プラン購入者は無期限）';
