import React, { useState, useEffect } from 'react';
import { Box, Typography, Pagination, Tabs, Tab } from '@mui/material';
import ApplicationList from '../components/ApplicationList';
import type { ApplicationData } from './ApplicationPage'; // 型定義をインポート
import dayjs from 'dayjs';

function ApprovalPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // 現在のページ
  const [totalCount, setTotalCount] = useState(0); // 総件数
  const limit = 10; // 1ページあたりの表示件数

  // タブ選択用のステート
  const [selectedTab, setSelectedTab] = useState<'pending' | 'processed'>('pending'); // 'pending' (申請中) または 'processed' (承認済み/否認)

  // APIから申請一覧を取得する関数
  const fetchApplications = async (fetchPage: number, statusFilter?: 'pending' | 'processed') => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      let apiUrl = `http://localhost:3001/api/approver/applications?page=${fetchPage}&limit=${limit}`;
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
        throw new Error('申請一覧の取得に失敗しました。');
      }

      const { applications: fetchedApplications, totalCount: fetchedTotalCount } = await response.json();
      // 日付のフォーマットを整える
      const formattedData = fetchedApplications.map((app: ApplicationData) => ({
        ...app,
        applicationDate: app.applicationDate ? dayjs(app.applicationDate).format('YYYY/MM/DD HH:mm') : '',
        requestedDate: app.requestedDate ? dayjs(app.requestedDate).format('YYYY/MM/DD') : '',
        processedAt: app.processedAt ? dayjs(app.processedAt).format('YYYY/MM/DD HH:mm') : null,
      }));
      setApplications(formattedData);
      setTotalCount(fetchedTotalCount);

    } catch (err: any) {
      setError(err.message);
    }
  };

  // ページ変更ハンドラ
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // コンポーネントのマウント時とページ変更時、タブ変更時に申請一覧を取得
  useEffect(() => {
    fetchApplications(page, selectedTab);
  }, [page, selectedTab]); // pageまたはselectedTabが変更されたら再取得

  const pageCount = Math.ceil(totalCount / limit);

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
      fetchApplications(page, selectedTab); // selectedTabも渡す

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        承認ページ
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_event, newValue) => {
          setSelectedTab(newValue);
          setPage(1); // タブ切り替え時にページを1に戻す
        }} aria-label="application status tabs">
          <Tab label="申請中" value="pending" />
          <Tab label="承認済み / 否認" value="processed" />
        </Tabs>
      </Box>

      {error && <p style={{ color: 'red' }}>{error}</p>} 
      <ApplicationList applications={applications} updateApplicationStatus={updateApplicationStatus} selectedTab={selectedTab} />
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

export default ApprovalPage;
