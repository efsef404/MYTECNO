-- 在宅勤務申請システム データベース更新SQL
-- 否認理由と通知機能の追加

-- 1. 申請テーブルに否認理由カラムを追加
ALTER TABLE applications 
ADD COLUMN denial_reason TEXT 
AFTER reason;

-- 2. 通知テーブルを作成
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    application_id INT,
    message TEXT NOT NULL,
    type ENUM('approval', 'denial', 'update') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- 3. 既存の申請ステータスを確認（デバッグ用）
SELECT id, name FROM application_statuses;

-- 4. テストデータの挿入（オプション）
-- 通知テーブルのテストデータ
INSERT INTO notifications (user_id, application_id, message, type) VALUES 
(1, 1, '2024-01-15 の在宅勤務申請が承認されました。', 'approval'),
(2, 2, '2024-01-16 の在宅勤務申請が否認されました。理由: 人員不足のため', 'denial');

-- 5. インデックスの追加（パフォーマンス向上用）
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);

-- 6. テーブル構造の確認
DESCRIBE applications;
DESCRIBE notifications;
