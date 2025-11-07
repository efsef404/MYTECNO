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
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={user.departmentId ? user.departmentId.toString() : ''}
                      onChange={(e) =>
                        handleUpdateUser(user.id, user.role, Number(e.target.value) || null)
                      }
                    >
                      <MenuItem value=""><em>なし</em></MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl size="small">
                    <Select
                      value={user.role}
                      onChange={(e) =>
                        handleUpdateUser(user.id, e.target.value as UserData['role'], user.departmentId)
                      }
                    >
                      <MenuItem value="社員">社員</MenuItem>
                      <MenuItem value="承認者">承認者</MenuItem>
                      <MenuItem value="管理者">管理者</MenuItem>
                    </Select>
                  </FormControl>
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
      <CalendarModal
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        applications={applications}
      />
    </Box>
  );
}

export default ManagementPage;
