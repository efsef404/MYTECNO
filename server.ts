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
  if (req.user?.role !== 'admin') {
    return res.sendStatus(403); // Forbidden
  }
  next();
};


// --- 申請関連API ---

// 自分の申請一覧を取得
app.get('/api/applications/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  let connection;
  try {
    const user = req.user;
    if (!user) {
      return res.sendStatus(401);
    }

    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT a.id, u.username, a.date, a.reason, s.name as status
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.date DESC
    `;
    const [applications] = await connection.execute(query, [user.id]);
    await connection.end();
    res.json(applications);
  } catch (error) {
    console.error('Get My Applications API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '申請一覧の取得に失敗しました。' });
  }
});

// 新しい申請を作成
app.post('/api/applications', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { date, reason } = req.body;
  const userId = req.user?.id;

  if (!date || !reason) {
    return res.status(400).json({ message: '日付と理由は必須です。' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // 「申請中」のステータスIDを取得 (ここではID=1と仮定)
    const pendingStatusId = 1;
    const query = 'INSERT INTO applications (user_id, date, reason, status_id) VALUES (?, ?, ?, ?)';
    const [result]:[any, any] = await connection.execute(query, [userId, date, reason, pendingStatusId]);
    
    const newApplicationId = result.insertId;
    const [rows]:[any[], any] = await connection.execute('SELECT * FROM applications WHERE id = ?', [newApplicationId]);

    await connection.end();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create Application API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '申請の作成に失敗しました。' });
  }
});

// --- 管理者用API ---

// すべての申請一覧を取得 (管理者専用)
app.get('/api/admin/applications', [authenticateToken, adminOnly], async (_req: AuthRequest, res: Response) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT a.id, u.username, a.date, a.reason, s.name as status
      FROM applications a
      JOIN application_statuses s ON a.status_id = s.id
      JOIN users u ON a.user_id = u.id
      ORDER BY a.date DESC
    `;
    const [applications] = await connection.execute(query);
    await connection.end();
    res.json(applications);
  } catch (error) {
    console.error('Get All Applications API Error:', error);
    if (connection) await connection.end();
    res.status(500).json({ message: '全申請一覧の取得に失敗しました。' });
  }
});

// 申請のステータスを更新 (管理者専用)
app.put('/api/applications/:id/status', [authenticateToken, adminOnly], async (req: AuthRequest, res: Response) => {
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
      `SELECT a.id, u.username, a.date, a.reason, s.name as status
       FROM applications a
       JOIN application_statuses s ON a.status_id = s.id
       JOIN users u ON a.user_id = u.id
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


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
