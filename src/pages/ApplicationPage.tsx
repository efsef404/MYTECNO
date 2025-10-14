import React, { useState, useEffect } from 'react';
import { Box, Pagination } from '@mui/material'; // Paginationをインポート
import ApplicationForm from '../components/ApplicationForm';
import ApplicationList from '../components/ApplicationList';

// APIから受け取る申請データの型を定義
export interface ApplicationData {
  id: number;
  username: string;
  date: string;
  reason: string;
  status: '承認' | '否認' | '申請中';
  approverUsername: string | null; // 追加
  processedAt: string | null; // 追加
}

function ApplicationPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // 現在のページ
  const [totalCount, setTotalCount] = useState(0); // 総件数
  const limit = 5; // 1ページあたりの表示件数

  // APIから申請一覧を取得する関数
  const fetchApplications = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/applications/my?page=${page}&limit=${limit}`, {
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
        date: new Date(app.date).toLocaleDateString(),
        processedAt: app.processedAt ? new Date(app.processedAt).toLocaleDateString() : null,
      }));
      setApplications(formattedData);
      setTotalCount(fetchedTotalCount);

    } catch (err: any) {
      setError(err.message);
    }
  };

  // 新しい申請を追加する関数
  const addApplication = async (reason: string, date: string) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, date }),
      });

      if (!response.ok) {
        throw new Error('申請の作成に失敗しました。');
      }

      // 成功したら申請一覧を再取得して画面を更新
      // ページ1に戻って最新の申請を表示
      if (page === 1) {
        fetchApplications();
      } else {
        setPage(1);
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  // ページ変更ハンドラ
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // コンポーネントのマウント時とページ変更時に申請一覧を取得
  useEffect(() => {
    fetchApplications();
  }, [page]); // pageが変更されたら再取得

  const pageCount = Math.ceil(totalCount / limit);

  return (
    <Box>
      {error && <p style={{ color: 'red' }}>{error}</p>} 
      <ApplicationForm addApplication={addApplication} />
      <Box sx={{ mt: 5 }}>
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
    </Box>
  );
}

export default ApplicationPage;

