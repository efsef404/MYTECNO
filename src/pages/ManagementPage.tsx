import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Select, MenuItem, InputLabel, FormControl, Pagination, Modal, Tabs, Tab } from '@mui/material';
import ApplicationList from '../components/ApplicationList';
import type { ApplicationData } from '../pages/ApplicationPage'; // 型定義をインポート
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs'; // dayjsをインポート

function ManagementPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // 現在のページ
  const [totalCount, setTotalCount] = useState(0); // 総件数
  const limit = 10; // 1ページあたりの表示件数

  // タブ選択用のステート
  const [selectedTab, setSelectedTab] = useState<'pending' | 'processed'>('pending'); // 'pending' (申請中) または 'processed' (承認済み/否認)

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
  const fetchAllApplications = async (fetchPage: number, statusFilter?: 'pending' | 'processed') => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      let apiUrl = `http://localhost:3001/api/admin/applications?page=${fetchPage}&limit=${limit}`;
      if (statusFilter === 'pending') {
        apiUrl += '&status=pending';
      } else if (statusFilter === 'processed') {
        apiUrl += '&status=processed';
      } else if (statusFilter === 'all') {
        // 'all' の場合はフィルタリングしない
      }

      const response = await fetch(apiUrl, {
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
        applicationDate: app.applicationDate ? dayjs(app.applicationDate).format('MM/DD HH:mm') : '',
        requestedDate: app.requestedDate ? dayjs(app.requestedDate).format('MM/DD') : '',
        processedAt: app.processedAt ? dayjs(app.processedAt).format('MM/DD HH:mm') : null,
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
      setPage(1); // ユーザー登録後は1ページ目に戻る
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

  // コンポーネントのマウント時とページ変更時、タブ変更時に全申請一覧を取得
  useEffect(() => {
    fetchAllApplications(page, selectedTab);
  }, [page, selectedTab]); // pageまたはselectedTabが変更されたら再取得

  const pageCount = Math.ceil(totalCount / limit);

  // 申請ステータスを更新する関数 (ApprovalPage.tsxからコピー)
  const updateApplicationStatus = async (id: number, newStatus: ApplicationData['status']) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/applications/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newStatus }),
      });

      if (!response.ok) {
        throw new Error('申請ステータスの更新に失敗しました。');
      }

      // 成功したら申請一覧を再取得して画面を更新
      fetchAllApplications(page, selectedTab); // selectedTabも渡す

    } catch (err: any) {
      setError(err.message);
    }
  };

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(event, newValue) => {
          setSelectedTab(newValue);
          setPage(1); // タブ切り替え時にページを1に戻す
        }} aria-label="application status tabs">
          <Tab label="申請中" value="pending" />
          <Tab label="承認済み / 否認" value="processed" />
        </Tabs>
      </Box>

      {error && <p style={{ color: 'red' }}>{error}</p>} 
      <ApplicationList applications={applications} updateApplicationStatus={updateApplicationStatus} selectedTab={selectedTab} /> {/* propsを追加 */}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
          <Typography>
            {totalCount > 0 ? `${(page - 1) * limit + 1} - ${Math.min(page * limit, totalCount)}` : '0'} / {totalCount}件
          </Typography>
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
