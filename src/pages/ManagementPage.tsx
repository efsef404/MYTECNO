import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Select, MenuItem, InputLabel, FormControl, Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ConfirmationModal from '../components/ConfirmationModal';

interface UserData {
  id: number;
  username: string;
  role: '社員' | '承認者' | '管理者';
}

function ManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [error, setError] = useState('');

  // ユーザー登録フォーム用のステート
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'社員' | '承認者' | '管理者'>('社員');
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
    setNewUserRole('社員');
    setUserFormError('');
    setUserFormSuccess('');
  };

  // 確認モーダル用のステート
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const handleOpenConfirmModal = (message: string, action: () => void) => {
    setConfirmModalMessage(message);
    setConfirmAction(() => action);
    setConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    handleCloseConfirmModal();
  };

  // APIから全ユーザー一覧を取得する関数
  const fetchAllUsers = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました。');
      }

      const { users: fetchedUsers } = await response.json();
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 新しいユーザーを登録する関数
  const handleAddUser = async () => {
    setUserFormError('');
    setUserFormSuccess('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setUserFormError('ユーザー名とパスワードは必須です。');
      return;
    }

    handleOpenConfirmModal(
      `ユーザー名: ${newUsername}, 役割: ${newUserRole} で新規登録しますか？`,
      async () => {
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
          fetchAllUsers(); // ユーザー登録後に一覧を再取得
          setTimeout(() => { // 成功メッセージを少し表示してからモーダルを閉じる
            handleClose();
          }, 1500);

        } catch (err: any) {
          setUserFormError(err.message);
        }
      }
    );
  };

  // ユーザーの役割を更新する関数
  const handleUpdateUserRole = async (userId: number, newRole: UserData['role']) => {
    setError('');

    const userToUpdate = users.find(user => user.id === userId);
    if (!userToUpdate) return;

    handleOpenConfirmModal(
      `${userToUpdate.username} の役割を ${newRole} に変更しますか？`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ newRole }),
          });

          if (!response.ok) {
            throw new Error('ユーザー役割の更新に失敗しました。');
          }

          fetchAllUsers(); // 更新後に一覧を再取得
        } catch (err: any) {
          setError(err.message);
        }
      }
    );
  };

  // コンポーネントのマウント時に全ユーザー一覧を取得
  useEffect(() => {
    fetchAllUsers();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        社員管理
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
          <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
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
                  onChange={(e) => setNewUserRole(e.target.value as '社員' | '承認者' | '管理者')}
                >
                  <MenuItem value="社員">社員</MenuItem>
                  <MenuItem value="承認者">承認者</MenuItem>
                  <MenuItem value="管理者">管理者</MenuItem>
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

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>ユーザー名</TableCell>
              <TableCell>役割</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <FormControl variant="outlined" size="small">
                    <Select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value as UserData['role'])}
                    >
                      <MenuItem value="社員">社員</MenuItem>
                      <MenuItem value="承認者">承認者</MenuItem>
                      <MenuItem value="管理者">管理者</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  {/* 必要に応じて削除ボタンなどを追加 */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmationModal
        open={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmAction}
        message={confirmModalMessage}
      />
    </Box>
  );
}

export default ManagementPage;
