import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// データベース接続設定
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// ログインAPIエンドポイント
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'ユーザー名とパスワードを入力してください。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows]: [any[], any] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);

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
      { id: user.id, username: user.username, role: user.role },
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
  user?: { id: number; username: string; role: string };
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
      SELECT a.id, u.username, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, s.name as status,
             a.processed_at as processedAt, approver.username as approverUsername, a.is_special_approval as isSpecialApproval
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approver_id = approver.id
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
  const { applicationDate, requestedDate, reason, isSpecialApproval } = req.body; // isSpecialApprovalを受け取る
  const userId = req.user?.id;

  if (!applicationDate || !requestedDate || !reason) {
    return res.status(400).json({ message: '申請日、申請希望日、理由は必須です。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // 「申請中」のステータスIDを取得 (ここではID=1と仮定)
    const pendingStatusId = 1;
    // INSERTクエリを修正
    const query = 'INSERT INTO applications (user_id, application_date, requested_date, reason, status_id, is_special_approval) VALUES (?, ?, ?, ?, ?, ?)';
    const [result]:[any, any] = await connection.execute(query, [userId, applicationDate, requestedDate, reason, pendingStatusId, isSpecialApproval]);

    const newApplicationId = result.insertId;
    // SELECTクエリも修正 (is_special_approvalを取得)
    const [rows]:[any[], any] = await connection.execute('SELECT id, user_id, application_date, requested_date, reason, status_id, is_special_approval FROM applications WHERE id = ?', [newApplicationId]);

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
      SELECT a.id, u.username, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, s.name as status,
             a.processed_at as processedAt, approver.username as approverUsername, a.is_special_approval as isSpecialApproval
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approver_id = approver.id
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

    connection = await mysql.createConnection(dbConfig);

    const whereClause = 'WHERE TRIM(s.name) LIKE ?';
    const queryParams = ['%申請中%'];

    // データ取得クエリ
    const dataQuery = `
      SELECT a.id, u.username, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, s.name as status,
             a.processed_at as processedAt, approver.username as approverUsername, a.is_special_approval as isSpecialApproval
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approver_id = approver.id
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

// 申請のステータスを更新 (管理者専用)
app.put('/api/applications/:id/status', [authenticateToken, approverOrAdminOnly], async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // URLパラメータから申請IDを取得
  const { newStatus } = req.body; // リクエストボディから新しいステータス名を取得
  const approverId = req.user?.id; // 承認者のID

  if (!newStatus || !id) {
    return res.status(400).json({ message: '申請IDと新しいステータスは必須です。' });
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
    const query = 'UPDATE applications SET status_id = ?, approver_id = ?, processed_at = NOW() WHERE id = ?';
    const [result]: [any, any] = await connection.execute(query, [newStatusId, approverId, id]);

    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ message: '指定された申請が見つかりません。' });
    }

    // 更新された申請データを取得して返す
    const [updatedRows]: [any[], any] = await connection.execute(
      `SELECT a.id, u.username, a.application_date as applicationDate, a.requested_date as requestedDate, a.reason, s.name as status,
              a.processed_at as processedAt, approver.username as approverUsername, a.is_special_approval as isSpecialApproval
       FROM applications a
       JOIN application_statuses s ON a.status_id = s.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN users approver ON a.approver_id = approver.id
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

// 新しいユーザーを登録 (管理者専用)
app.post('/api/users', [authenticateToken, adminOnly], async (req: AuthRequest, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'ユーザー名、パスワード、役割は必須です。' });
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
    const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const [result]: [any, any] = await connection.execute(query, [username, hashedPassword, role]);

    const newUserId = result.insertId;
    const [rows]: [any[], any] = await connection.execute('SELECT id, username, role FROM users WHERE id = ?', [newUserId]);

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
    const [users]: [any[], any] = await connection.execute('SELECT id, username, role FROM users');
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
  const { newRole } = req.body;

  if (!newRole) {
    return res.status(400).json({ message: '新しい役割は必須です。' });
  }

  if (!['社員', '承認者', '管理者'].includes(newRole)) {
    return res.status(400).json({ message: '役割は \'社員\', \'承認者\', \'管理者\' のいずれかである必要があります。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = 'UPDATE users SET role = ? WHERE id = ?';
    const [result]: [any, any] = await connection.execute(query, [newRole, id]);

    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ message: '指定されたユーザーが見つかりません。' });
    }

    await connection.end();
    res.json({ message: 'ユーザーの役割が更新されました。' });
  } catch (error) {
    console.error('Update User Role API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: 'ユーザーの役割の更新に失敗しました。' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
