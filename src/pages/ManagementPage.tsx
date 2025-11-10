import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  Select, MenuItem, InputLabel, FormControl, Modal,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ConfirmationModal from '../components/ConfirmationModal';
import CalendarModal from '../components/CalendarModal';
import type { ApplicationData } from '../types/ApplicationData';

import { jwtDecode } from 'jwt-decode';

interface ManagementPageProps {
  handleLogout: () => void;
}

interface UserData {
  id: number;
  username: string;
  role: '社員' | '承認者' | '管理者';
  departmentName: string | null;
  departmentId: number | null;
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function ManagementPage({ handleLogout }: ManagementPageProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'社員' | '承認者' | '管理者'>('社員');
  const [newDepartmentId, setNewDepartmentId] = useState<string>('');
  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewUsername('');
    setNewPassword('');
    setNewUserRole('社員');
    setNewDepartmentId('');
    setUserFormError('');
    setUserFormSuccess('');
  };

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(0);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<UserData['role']>('社員');
  const [newDepartmentIdForModal, setNewDepartmentIdForModal] = useState<number | null>(null);

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setNewDepartmentIdForModal(user.departmentId);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    setEditModalOpen(false);
  };

  const handleOpenConfirmModal = (message: string, action: () => void, countdown: number = 0) => {
    setConfirmModalMessage(message);
    setConfirmAction(() => action);
    setDeleteCountdown(countdown);
    setConfirmModalOpen(true);
  };
  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setConfirmAction(null);
    setDeleteCountdown(0); // モーダルが閉じたらカウントダウンをリセット
  };
  const handleConfirmAction = () => {
    if (confirmAction) confirmAction();
    handleCloseConfirmModal();
  };

  const fetchAllUsers = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('ユーザー一覧の取得に失敗しました。');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchAllApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/applications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('申請データの取得に失敗しました。');
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('部署一覧の取得に失敗しました。');
      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddUser = async () => {
    setUserFormError('');
    setUserFormSuccess('');
    if (!newUsername.trim() || !newPassword.trim() || !newDepartmentId) {
      setUserFormError('ユーザー名、パスワード、部署は必須です。');
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
            body: JSON.stringify({
              username: newUsername,
              password: newPassword,
              role: newUserRole,
              departmentId: Number(newDepartmentId),
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'ユーザー登録に失敗しました。');
          setUserFormSuccess(`ユーザー '${newUsername}' を登録しました。`);
          fetchAllUsers();
          setTimeout(handleClose, 1500);
        } catch (err: any) {
          setUserFormError(err.message);
        }
      }
    );
  };

  const handleUpdateUser = async (
    userId: number,
    newRole: UserData['role'],
    newDepartmentId: number | null
  ) => {
    setError('');
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    handleOpenConfirmModal(
      `${userToUpdate.username} の役割を ${newRole}, 部署を ${departments.find(d => d.id === newDepartmentId)?.name || 'なし'} に変更しますか？`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ newRole, departmentId: newDepartmentId }),
          });
          if (!response.ok) throw new Error('ユーザー情報の更新に失敗しました。');

          if (userId === currentUserId) {
            handleLogout();
          } else {
            fetchAllUsers();
          }
        } catch (err: any) {
          setError(err.message);
        }
      }
    );
  };

  const handleDeleteUser = (userId: number, username: string) => {
    handleOpenConfirmModal(
      `ユーザー '${username}' を本当に削除しますか？この操作は元に戻せません。`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            }
          );
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'ユーザーの削除に失敗しました。');
          }
          fetchAllUsers();
          closeEditModal(); // 削除成功後に編集モーダルを閉じる
        } catch (err: any) {
          setError(err.message);
        }
      },
      5 // 5秒のカウントダウン
    );
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: { id: number } = jwtDecode(token);
        setCurrentUserId(decodedToken.id);
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }

    fetchAllUsers();
    fetchDepartments();
    fetchAllApplications();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>社員管理</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={() => setCalendarModalOpen(true)} startIcon={<CalendarMonthIcon />}>
          カレンダー
        </Button>
        <Button variant="contained" onClick={handleOpen} startIcon={<AddIcon />}>
          社員新規登録
        </Button>
      </Box>

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

      <TextField
        label="社員を検索"
        variant="outlined"
        fullWidth
        margin="normal"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>ユーザー名</TableCell>
              <TableCell>部署</TableCell>
              <TableCell>役割</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow
                key={user.id}
                onClick={() => openEditModal(user)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.action.hover,
                  },
                }}
              >
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.departmentName || 'なし'}</TableCell>
                <TableCell>{user.role}</TableCell>
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
        countdown={deleteCountdown} // deleteCountdown stateを渡す
      />
      <CalendarModal
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        applications={applications}
      />

      {/* ユーザー編集モーダル */}
      <Modal open={editModalOpen} onClose={closeEditModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6">ユーザー情報編集</Typography>
          {selectedUser && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                ユーザー名: {selectedUser.username}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>役割</InputLabel>
                <Select
                  value={newRole}
                  label="役割"
                  onChange={(e) => setNewRole(e.target.value as UserData['role'])}
                >
                  <MenuItem value="社員">社員</MenuItem>
                  <MenuItem value="承認者">承認者</MenuItem>
                  <MenuItem value="管理者">管理者</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>部署</InputLabel>
                <Select
                  value={newDepartmentIdForModal ? newDepartmentIdForModal.toString() : ''}
                  label="部署"
                  onChange={(e) =>
                    setNewDepartmentIdForModal(Number(e.target.value) || null)
                  }
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    if (selectedUser) {
                      handleDeleteUser(selectedUser.id, selectedUser.username);
                    }
                  }}
                >
                  社員の削除
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    if (selectedUser) {
                      handleUpdateUser(selectedUser.id, newRole, newDepartmentIdForModal);
                      closeEditModal();
                    }
                  }}
                >
                  保存
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* 社員新規登録モーダル */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6">社員新規登録</Typography>
          <TextField
            label="ユーザー名"
            fullWidth
            margin="normal"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <TextField
            label="パスワード"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>役割</InputLabel>
            <Select
              value={newUserRole}
              label="役割"
              onChange={(e) => setNewUserRole(e.target.value as '社員' | '承認者' | '管理者')}
            >
              <MenuItem value="社員">社員</MenuItem>
              <MenuItem value="承認者">承認者</MenuItem>
              <MenuItem value="管理者">管理者</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>部署</InputLabel>
            <Select
              value={newDepartmentId}
              label="部署"
              onChange={(e) => setNewDepartmentId(e.target.value)}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {userFormError && <Typography color="error">{userFormError}</Typography>}
          {userFormSuccess && <Typography color="primary">{userFormSuccess}</Typography>}
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleAddUser}
          >
            登録
          </Button>
        </Box>
      </Modal>

    </Box>
  );
}

export default ManagementPage;
