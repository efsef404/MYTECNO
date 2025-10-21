import React, { useState, useEffect } from 'react';
import { Box, Pagination, Typography } from '@mui/material'; // Pagination, Typographyをインポート
import ApplicationForm from '../components/ApplicationForm';
import ApplicationList from '../components/ApplicationList';
import dayjs from 'dayjs'; // dayjsをインポート
import { jwtDecode } from 'jwt-decode';

// APIから受け取る申請データの型を定義
export interface ApplicationData {
  id: number;
  username: string;
  departmentName: string; // 部署名を追加
  applicationDate: string; // 申請日を追加
  requestedDate: string; // 申請希望日
  reason: string;
  status: '承認' | '否認' | '申請中';
  approverUsername: string | null; // 追加
  approverDepartmentName: string | null; // 処理者の部署名を追加
  processedAt: string | null; // 追加
  isSpecialApproval: boolean | number; // 特認フラグを追加 (booleanまたは数値)
}

interface DecodedToken {
  id: number;
  username: string;
  role: string;
  departmentName: string;
  iat: number;
  exp: number;
}

function ApplicationPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // 現在のページ
  const [totalCount, setTotalCount] = useState(0); // 総件数
  const limit = 10; // 1ページあたりの表示件数 (管理画面と合わせる)
  const [userDepartment, setUserDepartment] = useState<string | null>(null);

  // APIから申請一覧を取得する関数
  const fetchApplications = async (fetchPage: number) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/applications/my?page=${fetchPage}&limit=${limit}`, {
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

  // 新しい申請を追加する関数
  const addApplication = async (reason: string, requestedDate: string, isSpecialApproval: boolean) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const applicationDate = dayjs().format('YYYY-MM-DD HH:mm:ss'); // MySQLのDATETIME形式にフォーマット

      const response = await fetch('http://localhost:3001/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, applicationDate, requestedDate, isSpecialApproval }), // isSpecialApprovalを追加
      });

      if (!response.ok) {
        throw new Error('申請の作成に失敗しました。');
      }

      // 成功したら申請一覧を再取得して画面を更新
      // ページ1に戻って最新の申請を表示
      if (page === 1) {
        fetchApplications(page);
      } else {
        setPage(1);
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  // ページ変更ハンドラ
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // コンポーネントのマウント時とページ変更時に申請一覧を取得
  useEffect(() => {
    fetchApplications(page);

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        setUserDepartment(decodedToken.departmentName);
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }, [page]); // pageが変更されたら再取得

  const pageCount = Math.ceil(totalCount / limit);

  return (
    <Box>
      {error && <p style={{ color: 'red' }}>{error}</p>} 
      <Typography variant="h5" gutterBottom>
        所属部署: {userDepartment}
      </Typography>
      <ApplicationForm addApplication={addApplication} />
      <Box sx={{ mt: 5 }}>
        <ApplicationList applications={applications} />
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
    </Box>
  );
}

export default ApplicationPage;
