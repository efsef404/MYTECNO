import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Select, MenuItem, InputLabel, FormControl, Pagination, Modal } from '@mui/material';
import ApplicationList from '../components/ApplicationList';
import type { ApplicationData } from '../pages/ApplicationPage'; // 型定義をインポート
import AddIcon from '@mui/icons-material/Add';

function ManagementPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // 現在のページ
  const [totalCount, setTotalCount] = useState(0); // 総件数
  const limit = 5; // 1ページあたりの表示件数

  // ユーザー登録フォーム用のステート
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');

  // モーダル用のステートとハンドラ
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    // モーダルを閉じる時にフォームの状態をリセット
    setNewUsername('');
    setNewPassword('');
    setNewUserRole('user');
    setUserFormError('');
    setUserFormSuccess('');
  };

  // APIから全申請一覧を取得する関数
  const fetchAllApplications = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/applications?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('全申請一覧の取得に失敗しました。');
      }

      const { applications: fetchedApplications, totalCount: fetchedTotalCount } = await response.json();
      // 日付のフォーマットを整える
      const formattedData = fetchedApplications.map((app: ApplicationData) => ({
        ...app,
        date: new Date(app.date).toLocaleDateString(),
        processedAt: app.processedAt ? new Date(app.processedAt).toLocaleDateString() : null,
      }));
      setApplications(formattedData);
      setTotalCount(fetchedTotalCount);

    } catch (err: any) {
      setError(err.message);
    }
  };

  // 新しいユーザーを登録する関数
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormSuccess('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setUserFormError('ユーザー名とパスワードは必須です。');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newUserRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'ユーザー登録に失敗しました。');
      }

      setUserFormSuccess(`ユーザー '${newUsername}' を登録しました。`);
      fetchAllApplications(); // ユーザー登録後、申請一覧を更新
      setTimeout(() => { // 成功メッセージを少し表示してからモーダルを閉じる
        handleClose();
      }, 1500);

    } catch (err: any) {
      setUserFormError(err.message);
    }
  };

  // ページ変更ハンドラ
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // コンポーネントのマウント時とページ変更時に全申請一覧を取得
  useEffect(() => {
    fetchAllApplications();
  }, [page]); // pageが変更されたら再取得

  const pageCount = Math.ceil(totalCount / limit);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        管理画面
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" onClick={handleOpen} startIcon={<AddIcon />}>
          社員新規登録
        </Button>
      </Box>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="user-registration-modal-title"
        aria-describedby="user-registration-modal-description"
      >
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="user-registration-modal-title" variant="h6" component="h2" gutterBottom>
            社員新規登録
          </Typography>
          <form onSubmit={handleAddUser}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="ユーザー名"
                variant="outlined"
                fullWidth
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <TextField
                label="パスワード"
                variant="outlined"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel id="user-role-label">役割</InputLabel>
                <Select
                  labelId="user-role-label"
                  id="user-role-select"
                  value={newUserRole}
                  label="役割"
                  onChange={(e) => setNewUserRole(e.target.value as 'user' | 'admin')}
                >
                  <MenuItem value="user">一般ユーザー</MenuItem>
                  <MenuItem value="admin">管理者</MenuItem>
                </Select>
              </FormControl>
              {userFormError && <Typography color="error">{userFormError}</Typography>}
              {userFormSuccess && <Typography color="primary">{userFormSuccess}</Typography>}
              <Button type="submit" variant="contained" size="large">
                ユーザー登録
              </Button>
            </Box>
          </form>
        </Paper>
      </Modal>

      {error && <p style={{ color: 'red' }}>{error}</p>} 
      <ApplicationList applications={applications} />
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

export default ManagementPage;
