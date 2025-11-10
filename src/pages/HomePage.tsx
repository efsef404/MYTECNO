import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, Modal } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

interface UserStats {
  username: string;
  remote_work_count: number;
}

function HomePage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  const [time, setTime] = useState(dayjs());
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('ユーザー統計の取得に失敗しました。');
        }
        const data = await response.json();
        setUserStats(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchUserStats();

    const timer = setInterval(() => {
      setTime(dayjs());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box>
      {userStats && (
        <Typography variant="h4" gutterBottom>
          {userStats.username}さんのステータス
        </Typography>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textAlign: 'center' }}>
        <Paper sx={{ p: 2, width: '100%', maxWidth: '600px' }}>
          <Typography variant="h6" gutterBottom>
            現在の時刻
          </Typography>
          <Typography variant="h2" component="p">
            {time.format('HH:mm:ss')}
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            今週の在宅勤務回数
          </Typography>
          <Typography variant="h3" component="p">
            {userStats ? `${userStats.remote_work_count} 回` : '読み込み中...'}
          </Typography>
        </Paper>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => setCalendarOpen(true)}>
            カレンダー表示
          </Button>
          <Button component={Link} to="/application/new" variant="contained" color="primary">
            申請作成
          </Button>
        </Box>
      </Box>
      <Modal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        aria-labelledby="calendar-modal-title"
        aria-describedby="calendar-modal-description"
      >
        <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', p: 2, '.react-calendar__month-view__days__day': { color: 'black' } }}>
          <Calendar locale="ja-JP" />
        </Paper>
      </Modal>
    </Box>
  );
}

export default HomePage;