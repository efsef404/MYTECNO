import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import type { ApplicationData } from '../pages/ApplicationPage'; // 型定義をインポート

const getStatusChipColor = (status: ApplicationData['status']) => {
  switch (status) {
    case '承認':
      return 'success';
    case '否認':
      return 'error';
    case '申請中':
      return 'warning';
    default:
      return 'default';
  }
};

function ApprovalPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');

  // APIから全申請一覧を取得する関数
  const fetchAllApplications = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('全申請一覧の取得に失敗しました。');
      }

      const data: ApplicationData[] = await response.json();
      // 日付のフォーマットを整える
      const formattedData = data.map(app => ({...app, date: new Date(app.date).toLocaleDateString()}));
      setApplications(formattedData);

    } catch (err: any) {
      setError(err.message);
    }
  };

  // 申請ステータスを更新する関数
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
      fetchAllApplications();

    } catch (err: any) {
      setError(err.message);
    }
  };

  // コンポーネントのマウント時に全申請一覧を取得
  useEffect(() => {
    fetchAllApplications();
  }, []);

  const pendingApplications = applications.filter(app => app.status === '申請中');

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        申請承認
      </Typography>
      {error && <p style={{ color: 'red' }}>{error}</p>} 
      {pendingApplications.length === 0 ? (
        <Typography>承認待ちの申請はありません。</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>申請者</TableCell>
                <TableCell>申請日</TableCell>
                <TableCell>理由</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell align="right">アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.id}</TableCell>
                  <TableCell>{app.username}</TableCell>
                  <TableCell>{app.date}</TableCell>
                  <TableCell>{app.reason}</TableCell>
                  <TableCell>
                    <Chip label={app.status} color={getStatusChipColor(app.status)} />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ mr: 1 }}
                      onClick={() => updateApplicationStatus(app.id, '承認')}
                    >
                      承認
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => updateApplicationStatus(app.id, '否認')}
                    >
                      否認
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

export default ApprovalPage;
