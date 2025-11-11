-- 既存の通知メッセージを新しい形式に更新する

-- 承認通知を更新
UPDATE notifications 
SET message = '1件の在宅勤務申請が承認されました。'
WHERE type = 'approval';

-- 否認通知を更新
UPDATE notifications 
SET message = '1件の在宅勤務申請が否認されました。'
WHERE type = 'denial';

-- 確認用クエリ
SELECT id, user_id, application_id, message, type, is_read, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
