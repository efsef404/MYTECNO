import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import ApplicationList from '../components/ApplicationList';
import type { ApplicationData } from '../pages/ApplicationPage'; // 型定義をインポート

function ManagementPage() {
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

  // コンポーネントのマウント時に全申請一覧を取得
  useEffect(() => {
    fetchAllApplications();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        申請管理
      </Typography>
      {error && <p style={{ color: 'red' }}>{error}</p>} 
      <ApplicationList applications={applications} />
    </Box>
  );
}

export default ManagementPage;
