import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationList from '../components/ApplicationList';

// APIから受け取る申請データの型を定義
export interface ApplicationData {
  id: number;
  date: string;
  reason: string;
  status: '承認' | '否認' | '申請中';
}

function ApplicationPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');

  // APIから申請一覧を取得する関数
  const fetchApplications = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/applications/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('申請一覧の取得に失敗しました。');
      }

      const data: ApplicationData[] = await response.json();
      // 日付のフォーマットを整える
      const formattedData = data.map(app => ({...app, date: new Date(app.date).toLocaleDateString()}));
      setApplications(formattedData);

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
      fetchApplications();

    } catch (err: any) {
      setError(err.message);
    }
  };

  // コンポーネントのマウント時に申請一覧を取得
  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <Box>
      {error && <p style={{ color: 'red' }}>{error}</p>} 
      <ApplicationForm addApplication={addApplication} />
      <Box sx={{ mt: 5 }}>
        <ApplicationList applications={applications} />
      </Box>
    </Box>
  );
}

export default ApplicationPage;

