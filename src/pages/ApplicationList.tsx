import { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import ApplicationListDisplay from '../components/applications/ApplicationList';
import dayjs from 'dayjs';
import type { ApplicationData } from '../types/ApplicationData';

function ApplicationList() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/applications/my?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('申請一覧の取得に失敗しました。');
      }

      const { applications: fetchedApplications } = await response.json();

      const formattedData = fetchedApplications.map((app: ApplicationData) => ({
        ...app,
        applicationDate: app.applicationDate ? dayjs(app.applicationDate).format('YYYY/MM/DD HH:mm') : '',
        requestedDate: app.requestedDate ? dayjs(app.requestedDate).format('YYYY/MM/DD') : '',
        processedAt: app.processedAt ? dayjs(app.processedAt).format('YYYY/MM/DD HH:mm') : null,
      }));

      setApplications(formattedData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
          申請一覧
        </Typography>
        <Typography variant="body2" color="text.secondary">
          あなたが送信した在宅勤務申請の一覧です
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <ApplicationListDisplay title="自分の申請一覧" applications={applications} showPagination={true} />
      
    </Box>
  );
}

export default ApplicationList;
