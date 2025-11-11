-- 既存の通知データを修正するSQL
-- application_idがNULLの通知を削除または修正する

-- 1. application_idがNULLの通知を確認
SELECT id, user_id, message, type, application_id, created_at
FROM notifications
WHERE application_id IS NULL;

-- 2. application_idがNULLの古い通知を削除（オプション）
-- 注意: このクエリを実行すると、申請IDが紐付いていない通知が削除されます
-- DELETE FROM notifications WHERE application_id IS NULL;

-- 3. または、application_idがNULLの通知を既読にする（推奨）
-- これにより、ユーザーに表示されなくなります
UPDATE notifications 
SET is_read = TRUE 
WHERE application_id IS NULL;

-- 4. 修正後の確認
SELECT id, user_id, message, type, application_id, is_read, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 20;
