-- データベースの現在状態を確認するSQL

-- 1. 申請テーブルの構造を確認
DESCRIBE applications;

-- 2. 否認理由カラムの存在を確認
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'applications' 
AND COLUMN_NAME = 'denial_reason';

-- 3. 通知テーブルの存在を確認
SHOW TABLES LIKE 'notifications';

-- 4. 通知テーブルの構造を確認（存在する場合）
DESCRIBE notifications;

-- 5. 既存の通知データを確認
SELECT * FROM notifications LIMIT 5;

-- 6. 申請ステータスの確認
SELECT * FROM application_statuses;

-- 7. テスト用：否認理由付きの申請データを確認
SELECT 
    id, 
    user_id, 
    requested_date, 
    reason, 
    denial_reason, 
    status_id,
    created_at
FROM applications 
WHERE denial_reason IS NOT NULL 
LIMIT 5;
