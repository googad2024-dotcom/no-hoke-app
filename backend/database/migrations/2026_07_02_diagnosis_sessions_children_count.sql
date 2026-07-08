-- has_children (BOOLEAN 子供の有無) を children_count (未成年の扶養人数) に変更する。
-- 診断スコアで「未成年の扶養人数」による減点を行うため、有無ではなく人数を保持する。

ALTER TABLE diagnosis_sessions
    ADD COLUMN children_count TINYINT UNSIGNED NULL COMMENT '未成年の扶養人数' AFTER age;

-- 既存データの移行（暫定）: あり(1) → 1人 / なし(0)・NULL → 0人。
-- 旧データは正確な人数を持たないため近似値で埋める。
UPDATE diagnosis_sessions
    SET children_count = CASE WHEN has_children = 1 THEN 1 ELSE 0 END;

ALTER TABLE diagnosis_sessions
    DROP COLUMN has_children;
