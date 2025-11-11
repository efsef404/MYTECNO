import { useState, useEffect } from 'react';
import { Box, Pagination, Typography, Alert } from '@mui/material';
import ApplicationListDisplay from '../components/applications/ApplicationList'; // Renamed import
import dayjs from 'dayjs';
import type { ApplicationData } from '../types/ApplicationData';

function ApplicationList() { // Renamed function
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchApplications = async (fetchPage: number) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      // 全データを取得（クライアント側でフィルタリング・ページングを行うため）
      const response = await fetch(`http://localhost:3001/api/applications/my?page=1&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('申請一覧の取得に失敗しました。');
      }

      const { applications: fetchedApplications, totalCount: fetchedTotalCount } = await response.json();

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

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  useEffect(() => {
    fetchApplications(page);
  }, [page]);

  // クライアント側でページング
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedApplications = applications.slice(startIndex, endIndex);
  const pageCount = Math.ceil(applications.length / limit);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
          申請一覧
          {applications.length > 0 && (
            <Typography 
              component="span" 
              sx={{ 
                fontSize: '1rem', 
                fontWeight: 500, 
                color: 'text.secondary',
                bgcolor: 'action.hover',
                px: 2,
                py: 0.5,
                borderRadius: 2
              }}
            >
              全{applications.length}件
            </Typography>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          あなたが送信した在宅勤務申請の一覧です
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <ApplicationListDisplay title="自分の申請一覧" applications={paginatedApplications} />
      
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

export default ApplicationList;
