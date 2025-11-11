// 既存の通知メッセージを更新するスクリプト
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

async function updateNotifications() {
  let connection;
  try {
    console.log('データベースに接続中...');
    connection = await mysql.createConnection(dbConfig);
    
    // application_idがNULLの通知を確認
    console.log('\napplication_idがNULLの通知を確認中...');
    const [nullAppIdNotifications] = await connection.execute(
      'SELECT id, user_id, application_id, message, type, is_read FROM notifications WHERE application_id IS NULL'
    );
    console.log(`application_idがNULLの通知: ${nullAppIdNotifications.length}件`);
    if (nullAppIdNotifications.length > 0) {
      console.table(nullAppIdNotifications);
    }
    
    // application_idがNULLの通知を既読にする
    console.log('\napplication_idがNULLの通知を既読にしています...');
    const [updateResult] = await connection.execute(
      'UPDATE notifications SET is_read = TRUE WHERE application_id IS NULL'
    );
    console.log(`✅ ${updateResult.affectedRows}件の通知を既読にしました`);
    
    // 確認用クエリ
    console.log('\n更新後の通知一覧（最新10件）:');
    const [notifications] = await connection.execute(
      'SELECT id, user_id, application_id, message, type, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 10'
    );
    console.table(notifications);
    
    await connection.end();
    console.log('\n✅ 通知の更新が完了しました！');
    console.log('ブラウザをリフレッシュして確認してください。');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

updateNotifications();
