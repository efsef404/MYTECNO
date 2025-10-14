import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Pagination } from '@mui/material'; // Paginationをインポート
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
  const [page, setPage] = useState(1); // 現在のページ
  const [totalCount, setTotalCount] = useState(0); // 総件数
  const limit = 5; // 1ページあたりの表示件数

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

  // ページ変更ハンドラ
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // コンポーネントのマウント時とページ変更時に全申請一覧を取得
  useEffect(() => {
    fetchAllApplications();
  }, [page]); // pageが変更されたら再取得

  const pendingApplications = applications.filter(app => app.status === '申請中');
  const pageCount = Math.ceil(totalCount / limit);

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
                <TableCell>処理日</TableCell>
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
                  <TableCell>{app.processedAt ? new Date(app.processedAt).toLocaleDateString() : '-'}</TableCell>
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
    </Paper>
  );
}

export default ApprovalPage;
