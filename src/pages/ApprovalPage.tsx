import { useState, useEffect } from 'react';
import { Box, Typography, Pagination, Tabs, Tab, Paper, Alert, Badge } from '@mui/material';
import { HourglassEmpty, CheckCircle } from '@mui/icons-material';
import ApplicationList from '../components/applications/ApplicationList';
import type { ApplicationData } from '../types/ApplicationData'; // 型定義をインポート
import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: number;
  username: string;
  role: string;
  departmentName: string;
  iat: number;
  exp: number;
}

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
       if (!token) {
        setError("認証トークンがありません。");
        return;
      }
      const decodedToken: DecodedToken = jwtDecode(token);
      const currentUsername = decodedToken.username;

      // 全データを取得（クライアント側でフィルタリング・ページングを行うため）
      let apiUrl = `http://localhost:3001/api/approver/applications?page=1&limit=1000`;
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
      
      // 自分の申請を除外する
      const filteredApplications = fetchedApplications.filter(
        (app: ApplicationData) => app.username !== currentUsername
      );

      // 日付のフォーマットを整える
      const formattedData = filteredApplications.map((app: ApplicationData) => ({
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

  // クライアント側でページング
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedApplications = applications.slice(startIndex, endIndex);
  const pageCount = Math.ceil(applications.length / limit);

  // 申請ステータスを更新する関数
  const updateApplicationStatus = async (id: number, newStatus: ApplicationData['status'], denialReason?: string) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const requestBody: { newStatus: string; denialReason?: string } = { newStatus };
      
      console.log('Updating application status:', { id, newStatus, denialReason, requestBody });
      
      // 否認の場合は理由を追加
      if (newStatus === '否認' && denialReason) {
        requestBody.denialReason = denialReason;
      }
      
      console.log('Final request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`http://localhost:3001/api/applications/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(`申請ステータスの更新に失敗しました。 Status: ${response.status}, Message: ${errorData.message}`);
      }

      // 成功したら申請一覧を再取得して画面を更新
      fetchApplications(page, selectedTab); // selectedTabも渡す

    } catch (err: any) {
      setError(err.message);
    }
  };

  const title = selectedTab === 'pending' ? '承認待ち一覧' : '承認済み一覧';

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          承認ページ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          部門の在宅勤務申請を承認・否認できます
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_event: React.SyntheticEvent, newValue: 'pending' | 'processed') => {
            setSelectedTab(newValue);
            setPage(1);
          }} 
          aria-label="application status tabs"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 600,
            },
          }}
        >
          <Tab 
            icon={<HourglassEmpty />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                申請中
                {selectedTab === 'pending' && applications.length > 0 && (
                  <Badge badgeContent={applications.length} color="warning" max={99} />
                )}
              </Box>
            }
            value="pending" 
          />
          <Tab 
            icon={<CheckCircle />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                承認済み / 否認
                {selectedTab === 'processed' && applications.length > 0 && (
                  <Badge badgeContent={applications.length} color="default" max={99} />
                )}
              </Box>
            }
            value="processed" 
          />
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <ApplicationList 
        title={title} 
        applications={paginatedApplications} 
        updateApplicationStatus={updateApplicationStatus} 
        selectedTab={selectedTab} 
      />
      
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {applications.length > 0 ? `${startIndex + 1} - ${Math.min(endIndex, applications.length)}` : '0'} / {applications.length}件
          </Typography>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
}

export default ApprovalPage;
