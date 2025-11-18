import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5174' }));
app.use(express.json());

// データベース接続設定
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// 通知テーブルと否認理由カラムを追加する初期化関数
const initializeDatabase = async () => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 通知テーブルを作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        application_id INT,
        message TEXT NOT NULL,
        type ENUM('approval', 'denial', 'update') NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (application_id) REFERENCES applications(id)
      )
    `);
    
    // 申請テーブルに否認理由カラムを追加（まだ存在しない場合）
    try {
      await connection.execute(`
        ALTER TABLE applications 
        ADD COLUMN denial_reason TEXT 
        AFTER reason
      `);
    } catch (error) {
      // カラムが既に存在する場合はエラーを無視
      console.log('否認理由カラムは既に存在するか、追加に失敗しました');
    }
    
    await connection.end();
    console.log('データベースの初期化が完了しました');
  } catch (error) {
    console.error('データベース初期化エラー:', error);
    if (connection) await connection.end();
  }
};

// アプリ起動時にデータベースを初期化
initializeDatabase();

// ログインAPIエンドポイント
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'ユーザー名とパスワードを入力してください。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows]: [any[], any] = await connection.execute('SELECT u.*, d.name as departmentName FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.username = ?', [username]);

    if (rows.length === 0) {
      await connection.end();
      return res.status(401).json({ message: 'ユーザー名またはパスワードが間違っています。' });
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      await connection.end();
      return res.status(401).json({ message: 'ユーザー名またはパスワードが間違っています。' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, departmentName: user.departmentName },
      process.env.JWT_SECRET || 'your_default_secret',
      { expiresIn: '1h' }
    );

    await connection.end();
    res.json({ token });

  } catch (error) {
    console.error('Login API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// --- 認証ミドルウェア ---
interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string; departmentName?: string };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret', (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next();
  });
};

// --- 管理者チェックミドルウェア ---
const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== '管理者') {
    return res.sendStatus(403); // Forbidden
  }
  next();
};

// --- 承認者または管理者チェックミドルウェア ---
const approverOrAdminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== '承認者' && req.user?.role !== '管理者') {
    return res.sendStatus(403); // Forbidden
  }
  next();
};


// --- 申請関連API ---

// 自分の申請一覧を取得 (ページング対応)
app.get('/api/applications/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  let connection;
  try {
    const user = req.user;
    if (!user) {
      return res.sendStatus(401);
    }

    // ページネーションの変数をクエリパラメータから取得
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    connection = await mysql.createConnection(dbConfig);

    // データ取得クエリ
    const dataQuery = `
      SELECT a.id, u.username, u.department_id, d.name as departmentName, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, a.denial_reason as denialReason, s.name as status,
             a.processed_at as processedAt, approver.username as approverUsername, approver_department.name as approverDepartmentName, a.is_special_approval as isSpecialApproval, a.start_time as startTime, a.end_time as endTime
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approver_id = approver.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN departments approver_department ON approver.department_id = approver_department.id
      WHERE a.user_id = ?
      ORDER BY a.is_special_approval DESC, processedAt DESC, a.application_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [applications] = await connection.execute(dataQuery, [user.id]);

    // 総件数取得クエリ
    const countQuery = `
      SELECT COUNT(*) as totalCount
      FROM applications a
      WHERE a.user_id = ?
    `;
    const [countRows]: [any[], any] = await connection.execute(countQuery, [user.id]);
    const totalCount = countRows[0].totalCount;

    await connection.end();
    res.json({ applications, totalCount });
  } catch (error) {
    console.error('Get My Applications API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '申請一覧の取得に失敗しました。' });
  }
});

// 新しい申請を作成
app.post('/api/applications', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { applicationDate, requestedDate, reason, isSpecialApproval, startTime, endTime, isPartialWorkFromHome, isOvertimeApproval } = req.body;
  const userId = req.user?.id;

  if (!applicationDate || !requestedDate || !reason) {
    return res.status(400).json({ message: '申請日、申請希望日、理由は必須です。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const pendingStatusId = 1;
    const query = 'INSERT INTO applications (user_id, application_date, requested_date, reason, status_id, is_special_approval, start_time, end_time, is_partial_work_from_home, is_overtime_approval) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result]:[any, any] = await connection.execute(query, [userId, applicationDate, requestedDate, reason, pendingStatusId, isSpecialApproval, startTime, endTime, isPartialWorkFromHome, isOvertimeApproval]);

    const newApplicationId = result.insertId;
    const [rows]:[any[], any] = await connection.execute('SELECT id, user_id, application_date, requested_date, reason, status_id, is_special_approval, start_time, end_time, is_partial_work_from_home, is_overtime_approval FROM applications WHERE id = ?', [newApplicationId]);

    await connection.end();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create Application API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '申請の作成に失敗しました。' });
  }
});
// --- 管理者用API ---

// すべての申請一覧を取得 (管理者専用、ページング対応)
app.get('/api/admin/applications', [authenticateToken, adminOnly], async (req: AuthRequest, res: Response) => {
  let connection;
  try {
    // ページネーションの変数をクエリパラメータから取得
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string; // statusクエリパラメータを取得

    connection = await mysql.createConnection(dbConfig);

    let whereClause = '';
    const queryParams: (string | number)[] = [];

    if (statusFilter === 'pending') {
      whereClause = 'WHERE TRIM(s.name) LIKE ?';
      queryParams.push('%申請中%');
    } else if (statusFilter === 'processed') {
      whereClause = 'WHERE TRIM(s.name) LIKE ? OR TRIM(s.name) LIKE ?';
      queryParams.push('%承認%', '%否認%');
    }

    // データ取得クエリ (LIMITとOFFSET、WHERE句を追加)
    const dataQuery = `
      SELECT a.id, u.username, u.department_id, d.name as departmentName, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, a.denial_reason as denialReason, s.name as status,
             a.processed_at as processedAt, approver.username as approverUsername, approver_department.name as approverDepartmentName, a.is_special_approval as isSpecialApproval, a.start_time as startTime, a.end_time as endTime
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approver_id = approver.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN departments approver_department ON approver.department_id = approver_department.id
      ${whereClause}
      ORDER BY a.is_special_approval DESC, processedAt DESC, a.application_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [applications] = await connection.execute(dataQuery, queryParams); // applicationsを定義

    // 総件数取得クエリ (WHERE句を追加)
    const countQuery = `
      SELECT COUNT(*) as totalCount
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      ${whereClause}
    `;
    const [countRows]: [any[], any] = await connection.execute(countQuery, queryParams);
    const totalCount = countRows[0].totalCount;

    await connection.end();
    res.json({ applications, totalCount });
  } catch (error) {
    console.error('Get All Applications API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '全申請一覧の取得に失敗しました。' });
  }
});

// --- 承認者用API ---

// 承認待ちの申請一覧を取得 (承認者・管理者専用、ページング対応)
app.get('/api/approver/applications', [authenticateToken, approverOrAdminOnly], async (req: AuthRequest, res: Response) => {
  let connection;
  try {
    // ページネーションの変数をクエリパラメータから取得
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string; // statusクエリパラメータを取得

    connection = await mysql.createConnection(dbConfig);

    let whereClause = '';
    const queryParams: (string | number)[] = [];

    if (statusFilter === 'pending') {
      whereClause = 'WHERE TRIM(s.name) LIKE ?';
      queryParams.push('%申請中%');
    } else if (statusFilter === 'processed') {
      whereClause = 'WHERE TRIM(s.name) LIKE ? OR TRIM(s.name) LIKE ?';
      queryParams.push('%承認%', '%否認%');
    }

    // データ取得クエリ
    const dataQuery = `
      SELECT a.id, u.username, u.department_id, d.name as departmentName, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, a.denial_reason as denialReason, s.name as status,
             a.processed_at as processedAt, approver.username as approverUsername, approver_department.name as approverDepartmentName, a.is_special_approval as isSpecialApproval, a.start_time as startTime, a.end_time as endTime
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approver_id = approver.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN departments approver_department ON approver.department_id = approver_department.id
      ${whereClause}
      ORDER BY a.is_special_approval DESC, a.application_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [applications] = await connection.execute(dataQuery, queryParams);

    // 総件数取得クエリ
    const countQuery = `
      SELECT COUNT(*) as totalCount
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      ${whereClause}
    `;
    const [countRows]: [any[], any] = await connection.execute(countQuery, queryParams);
    const totalCount = countRows[0].totalCount;

    await connection.end();
    res.json({ applications, totalCount });
  } catch (error) {
    console.error('Get Approver Applications API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '承認待ち申請一覧の取得に失敗しました。' });
  }
});

// すべてのリクエストをログに記録
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

// 申請のステータスを更新 (管理者専用)
app.put('/api/applications/:id/status', [authenticateToken, approverOrAdminOnly], async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // URLパラメータから申請IDを取得
  const { newStatus, denialReason } = req.body; // リクエストボディから新しいステータス名と否認理由を取得
  const approverId = req.user?.id; // 承認者のID

  console.log('申請ステータス更新リクエスト:', { 
    id, 
    newStatus, 
    denialReason, 
    approverId,
    requestBody: req.body,
    headers: req.headers
  });

  if (!newStatus || !id) {
    console.log('エラー: 申請IDと新しいステータスは必須です', { 
      newStatus, 
      id, 
      newStatusType: typeof newStatus, 
      idType: typeof id 
    });
    return res.status(400).json({ message: '申請IDと新しいステータスは必須です。' });
  }

  // 否認する場合は理由が必須
  if (newStatus === '否認' && !denialReason) {
    console.log('エラー: 否認する場合は理由が必須です');
    return res.status(400).json({ message: '否認する場合は理由を入力してください。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // 新しいステータス名からstatus_idを取得
    const [statusRows]: [any[], any] = await connection.execute('SELECT id FROM application_statuses WHERE name = ?', [newStatus]);
    if (statusRows.length === 0) {
      await connection.end();
      return res.status(400).json({ message: '無効なステータスです。' });
    }
    const newStatusId = statusRows[0].id;

    // 申請のステータスを更新
    const updateQuery = newStatus === '否認' 
      ? 'UPDATE applications SET status_id = ?, approver_id = ?, processed_at = NOW(), denial_reason = ? WHERE id = ?'
      : 'UPDATE applications SET status_id = ?, approver_id = ?, processed_at = NOW() WHERE id = ?';
    
    const updateParams = newStatus === '否認' 
      ? [newStatusId, approverId, denialReason, id]
      : [newStatusId, approverId, id];
    
    const [result]: [any, any] = await connection.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ message: '指定された申請が見つかりません。' });
    }

<<<<<<< HEAD
    // ステータスが「承認」の場合、ユーザーの在宅勤務回数をインクリメント
    if (newStatus === '承認') {
      // 申請が部分在宅勤務か確認
      const [appRows]: [any[], any] = await connection.execute('SELECT user_id, is_partial_work_from_home FROM applications WHERE id = ?', [id]);
      if (appRows.length > 0) {
        const { user_id: userId, is_partial_work_from_home: isPartial } = appRows[0];
        const incrementValue = isPartial ? 0.5 : 1;
        await connection.execute('UPDATE users SET remote_work_count = remote_work_count + ? WHERE id = ?', [incrementValue, userId]);
=======
    // 申請者情報と申請日を取得して通知を作成
    const [appRows]: [any[], any] = await connection.execute(
      'SELECT user_id, requested_date, denial_reason FROM applications WHERE id = ?', 
      [id]
    );
    if (appRows.length > 0) {
      const userId = appRows[0].user_id;
      const requestedDate = appRows[0].requested_date;
      const denialReasonFromDb = appRows[0].denial_reason;
      
      let notificationMessage = '';
      let notificationType = '';
      
      // 日付をフォーマット（YYYY年MM月DD日形式）
      const formattedDate = new Date(requestedDate).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (newStatus === '承認') {
        notificationMessage = `${formattedDate}の在宅勤務申請が承認されました。`;
        notificationType = 'approval';
        // ユーザーの在宅勤務回数をインクリメント
        await connection.execute('UPDATE users SET remote_work_count = remote_work_count + 1 WHERE id = ?', [userId]);
      } else if (newStatus === '否認') {
        const reason = denialReasonFromDb || denialReason || '理由なし';
        notificationMessage = `${formattedDate}の在宅勤務申請が否認されました。理由: ${reason}`;
        notificationType = 'denial';
      }
      
      // 通知を作成
      if (notificationMessage) {
        await connection.execute(
          'INSERT INTO notifications (user_id, application_id, message, type) VALUES (?, ?, ?, ?)',
          [userId, id, notificationMessage, notificationType]
        );
>>>>>>> 4cd658e31ddc7a38544536989674a8403f504301
      }
    }

    // 更新された申請データを取得して返す
    const [updatedRows]: [any[], any] = await connection.execute(
      `SELECT a.id, u.username, u.department_id, d.name as departmentName, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, a.denial_reason as denialReason, s.name as status,
              a.processed_at as processedAt, approver.username as approverUsername, approver_department.name as approverDepartmentName, a.is_special_approval as isSpecialApproval, a.start_time as startTime, a.end_time as endTime
       FROM applications a
       JOIN application_statuses s ON a.status_id = s.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN users approver ON a.approver_id = approver.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN departments approver_department ON approver.department_id = approver_department.id
       WHERE a.id = ?`,
      [id]
    );

    await connection.end();
    res.json(updatedRows[0]);

  } catch (error) {
    console.error('Update Application Status API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '申請ステータスの更新に失敗しました。' });
  }
});

// 通知を取得するAPIエンドポイント
app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'ユーザーIDが見つかりません。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [notifications]: [any[], any] = await connection.execute(
      `SELECT 
        n.id as id,
        n.application_id as application_id,
        n.message as message,
        n.type as type,
        n.is_read as is_read,
        n.created_at as created_at,
        a.requested_date as requested_date
       FROM notifications n
       LEFT JOIN applications a ON n.application_id = a.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    // 未読通知数を取得
    const [unreadCount]: [any[], any] = await connection.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    await connection.end();
    
    // デバッグ: 通知データをログ出力
    console.log('通知データをクライアントに送信:', JSON.stringify(notifications.slice(0, 3), null, 2));
    
    // キャッシュ制御ヘッダーを設定
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      notifications,
      unreadCount: unreadCount[0].count
    });

  } catch (error) {
    console.error('Get Notifications API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '通知の取得に失敗しました。' });
  }
});

// 通知を既読にするAPIエンドポイント
app.put('/api/notifications/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id) {
    return res.status(400).json({ message: '通知IDは必須です。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [result]: [any, any] = await connection.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ message: '通知が見つからないか、アクセス権限がありません。' });
    }

    await connection.end();
    res.json({ message: '通知を既読にしました。' });

  } catch (error) {
    console.error('Mark Notification as Read API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '通知の既読処理に失敗しました。' });
  }
});

// 新しいユーザーを登録 (管理者専用)
app.post('/api/users', [authenticateToken, adminOnly], async (req: AuthRequest, res: Response) => {
  const { username, password, role, departmentId } = req.body;

  if (!username || !password || !role || !departmentId) {
    return res.status(400).json({ message: 'ユーザー名、パスワード、役割、部署は必須です。' });
  }

  if (!['社員', '承認者', '管理者'].includes(role)) {
    return res.status(400).json({ message: '役割は \'社員\', \'承認者\', \'管理者\' のいずれかである必要があります。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // ユーザー名が既に存在するかチェック
    const [existingUsers]: [any[], any] = await connection.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(409).json({ message: 'このユーザー名は既に存在します。' });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10); // saltRounds = 10

    // ユーザーをデータベースに挿入
    const query = 'INSERT INTO users (username, password, role, department_id) VALUES (?, ?, ?, ?)';
    const [result]: [any, any] = await connection.execute(query, [username, hashedPassword, role, departmentId]);

    const newUserId = result.insertId;
    const [rows]: [any[], any] = await connection.execute('SELECT u.id, u.username, u.role, d.name as departmentName FROM users u JOIN departments d ON u.department_id = d.id WHERE u.id = ?', [newUserId]);

    await connection.end();
    res.status(201).json(rows[0]); // パスワードは返さない

  } catch (error) {
    console.error('Create User API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: 'ユーザーの登録に失敗しました。' });
  }
});

// --- 管理者用API (ユーザー管理) ---

// 全ユーザー一覧を取得 (管理者専用)
app.get('/api/admin/users', [authenticateToken, adminOnly], async (_req: AuthRequest, res: Response) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [users]: [any[], any] = await connection.execute('SELECT u.id, u.username, u.role, u.department_id as departmentId, d.name as departmentName FROM users u LEFT JOIN departments d ON u.department_id = d.id');
    await connection.end();
    res.json({ users });
  } catch (error) {
    console.error('Get All Users API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: 'ユーザー一覧の取得に失敗しました。' });
  }
});

// ユーザーの役割を更新 (管理者専用)
app.put('/api/admin/users/:id/role', [authenticateToken, adminOnly], async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { newRole, departmentId } = req.body;

  if (!newRole || !departmentId) {
    return res.status(400).json({ message: '新しい役割と部署は必須です。' });
  }

  if (!['社員', '承認者', '管理者'].includes(newRole)) {
    return res.status(400).json({ message: '役割は \'社員\', \'承認者\', \'管理者\' のいずれかである必要があります。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = 'UPDATE users SET role = ?, department_id = ? WHERE id = ?';
    const [result]: any = await connection.execute(query, [newRole, departmentId, id]);

    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ message: '指定されたユーザーが見つかりません。' });
    }

    await connection.end();
    res.json({ message: 'ユーザーの役割が更新されました。' });
  } catch (error) {
    console.error('Update User Role API Error:', error);
    if (connection) await connection.end();
    res.json({ message: 'ユーザーの役割の更新に失敗しました。' });
  }
});

// ユーザーを削除 (管理者専用)
app.delete('/api/admin/users/:id', [authenticateToken, adminOnly], async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction(); // トランザクション開始

    // 関連するアプリケーションを削除
    await connection.execute('DELETE FROM applications WHERE user_id = ?', [id]);

    // ユーザーを削除
    const query = 'DELETE FROM users WHERE id = ?';
    const [result]: any = await connection.execute(query, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback(); // 変更をロールバック
      await connection.end();
      return res.status(404).json({ message: '指定されたユーザーが見つかりません。' });
    }

    await connection.commit(); // 変更をコミット
    await connection.end();
    res.json({ message: 'ユーザーと関連データが削除されました。' });
  } catch (error) {
    console.error('Delete User API Error:', error);
    if (connection) {
      await connection.rollback(); // エラー発生時はロールバック
      await connection.end();
    }
    res.status(500).json({ message: 'ユーザーの削除に失敗しました。' });
  }
});

// 部署一覧を取得
app.get('/api/departments', authenticateToken, async (_req: AuthRequest, res: Response) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [departments]: [any[], any] = await connection.execute('SELECT id, name FROM departments');
    await connection.end();
    res.json({ departments });
  } catch (error) {
    console.error('Get Departments API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '部署一覧の取得に失敗しました。' });
  }
});

// ユーザーの統計情報を取得
app.get('/api/user/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.sendStatus(401);
    }

    connection = await mysql.createConnection(dbConfig);
    const [rows]: [any[], any] = await connection.execute('SELECT username, remote_work_count FROM users WHERE id = ?', [userId]);

    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    await connection.end();
    res.json(rows[0]);
  } catch (error) {
    console.error('Get User Stats API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: 'ユーザー統計の取得に失敗しました。' });
  }
});

// 個別申請詳細を取得
app.get('/api/applications/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id) {
    return res.status(400).json({ message: '申請IDは必須です。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT a.id, u.username, u.department_id, d.name as departmentName, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, a.denial_reason as denialReason, s.name as status,
             a.processed_at as processedAt, approver.username as approverUsername, approver_department.name as approverDepartmentName, a.is_special_approval as isSpecialApproval, a.start_time as startTime, a.end_time as endTime
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approver_id = approver.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN departments approver_department ON approver.department_id = approver_department.id
      WHERE a.id = ? AND a.user_id = ?
    `;
    
    const [applications]: [any[], any] = await connection.execute(query, [id, userId]);

    if (applications.length === 0) {
      await connection.end();
      return res.status(404).json({ message: '申請が見つからないか、アクセス権限がありません。' });
    }

    await connection.end();
    res.json(applications[0]);

  } catch (error) {
    console.error('Get Application Detail API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '申請詳細の取得に失敗しました。' });
  }
});

// --- 新しいエンドポイント: 承認済み申請一覧を取得 ---
app.get('/api/applications/approved', authenticateToken, async (_req: AuthRequest, res: Response) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT
        u.username AS employeeName,
        DATE_FORMAT(a.application_date, '%Y-%m-%d') AS applicationDate
      FROM
        applications a
      JOIN
        users u ON a.user_id = u.id
      WHERE
        a.status_id = 2 AND a.approver_id IS NOT NULL
      ORDER BY
        a.requested_date DESC;
    `;
    const [approvedApplications]: [any[], any] = await connection.execute(query);

    await connection.end();
    res.json(approvedApplications);
  } catch (error) {
    console.error('Get Approved Applications API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '承認済み申請の取得に失敗しました。' });
  }
});

// カレンダー用: 自分の承認済み在宅勤務日を取得
app.get('/api/calendar/my-approved', authenticateToken, async (req: AuthRequest, res: Response) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.sendStatus(401);
    }

    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT
        a.id,
        a.requested_date,
        a.start_time,
        a.end_time,
        u.username
      FROM
        applications a
      JOIN
        users u ON a.user_id = u.id
      WHERE
        a.user_id = ? AND a.status_id = 2 AND a.approver_id IS NOT NULL
      ORDER BY
        a.requested_date ASC;
    `;
    const [applications]: [any[], any] = await connection.execute(query, [userId]);

    console.log('My calendar data fetched for user', userId, ':', applications); // デバッグ用ログ

    await connection.end();
    res.json(applications);
  } catch (error) {
    console.error('Get My Calendar API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: 'カレンダーデータの取得に失敗しました。' });
  }
});

// カレンダー用: 全社員の承認済み在宅勤務日を取得（管理者用）
app.get('/api/calendar/all-approved', authenticateToken, adminOnly, async (_req: AuthRequest, res: Response) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT
        DATE(a.requested_date) as date,
        COUNT(*) as count,
        GROUP_CONCAT(
          CONCAT(
            COALESCE(u.username, 'Unknown'), 
            '|', 
            COALESCE(TIME_FORMAT(a.start_time, '%H:%i'), '00:00'), 
            '-', 
            COALESCE(TIME_FORMAT(a.end_time, '%H:%i'), '00:00')
          )
          SEPARATOR ';;'
        ) as details
      FROM
        applications a
      JOIN
        users u ON a.user_id = u.id
      WHERE
        a.status_id = 2 
        AND a.approver_id IS NOT NULL
        AND a.start_time IS NOT NULL
        AND a.end_time IS NOT NULL
      GROUP BY
        DATE(a.requested_date)
      ORDER BY
        date ASC;
    `;
    const [applications]: [any[], any] = await connection.execute(query);

    console.log('Calendar data fetched:', applications); // デバッグ用ログ
    console.log('Number of dates with approved applications:', applications.length);

    await connection.end();
    res.json(applications);
  } catch (error) {
    console.error('Get All Calendar API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: 'カレンダーデータの取得に失敗しました。' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
