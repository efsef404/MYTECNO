import React, { useState, useEffect } from 'react';
import { Box, Pagination, Typography } from '@mui/material';
import ApplicationForm from './ApplicationPage/components/ApplicationForm';
import ApplicationList from '../components/applications/ApplicationList';
import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode';
import type { ApplicationData } from '../types/ApplicationData';

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
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const [userDepartment, setUserDepartment] = useState<string | null>(null);

  const fetchApplications = async (fetchPage: number) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/applications/my?page=${fetchPage}&limit=${limit}`, {
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

  const addApplication = async (
    reason: string,
    requestedDate: string,
    isSpecialApproval: boolean,
    startTime: string,
    endTime: string
  ) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const applicationDate = dayjs().format('YYYY-MM-DD HH:mm:ss');

      const response = await fetch('http://localhost:3001/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, applicationDate, requestedDate, isSpecialApproval, startTime, endTime }),
      });

      if (!response.ok) throw new Error('申請の作成に失敗しました。');

      if (page === 1) {
        fetchApplications(page);
      } else {
        setPage(1);
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

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
  }, [page]);

  const pageCount = Math.ceil(totalCount / limit);

  return (
    <Box>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Typography variant="h5" gutterBottom>
        所属部署: {userDepartment}
      </Typography>
      <ApplicationForm addApplication={addApplication} />
      <Box sx={{ mt: 5 }}>
        <ApplicationList title="自分の申請一覧" applications={applications} />
        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
            <Typography>
              {totalCount > 0 ? `${(page - 1) * limit + 1} - ${Math.min(page * limit, totalCount)}` : '0'} / {totalCount}件
            </Typography>
            <Pagination count={pageCount} page={page} onChange={handlePageChange} color="primary" />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ApplicationPage;
