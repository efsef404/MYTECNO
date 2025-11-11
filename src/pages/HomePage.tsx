import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, Modal, Card, CardContent, Divider, List, ListItem, ListItemText } from '@mui/material';
import { AccessTime, EventNote, Add as AddIcon, CalendarMonth, Close as CloseIcon } from '@mui/icons-material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

interface UserStats {
  username: string;
  remote_work_count: number;
}

interface ApprovedDate {
  id: number;
  requested_date: string;
  start_time: string;
  end_time: string;
  username: string;
}

function HomePage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  const [time, setTime] = useState(dayjs());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [approvedDates, setApprovedDates] = useState<ApprovedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

    const fetchApprovedDates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/calendar/my-approved', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('承認済み日程の取得に失敗しました。');
        }
        const data = await response.json();
        setApprovedDates(data);
      } catch (err: any) {
        console.error('承認済み日程の取得エラー:', err);
      }
    };

    fetchUserStats();
    fetchApprovedDates();

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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            ようこそ、{userStats.username}さん
          </Typography>
          <Typography variant="body1" color="text.secondary">
            今日も一日頑張りましょう！
          </Typography>
        </Box>
      )}
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* 現在時刻カード */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" component="div">
                  現在の時刻
                </Typography>
              </Box>
              <Typography variant="h2" component="p" sx={{ textAlign: 'center', my: 3, fontWeight: 'bold', color: 'primary.main' }}>
                {time.format('HH:mm:ss')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {time.format('YYYY年MM月DD日 (ddd)')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 在宅勤務回数カード */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventNote sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" component="div">
                  今週の在宅勤務
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', my: 3 }}>
                <Typography variant="h2" component="p" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {userStats ? userStats.remote_work_count : '-'}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  回
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                今週の利用状況
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* アクションボタン */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              クイックアクション
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                component={Link} 
                to="/application/new" 
                variant="contained" 
                size="large"
                startIcon={<AddIcon />}
                sx={{ flex: 1, minWidth: '200px' }}
              >
                新規申請を作成
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                startIcon={<CalendarMonth />}
                onClick={() => setCalendarOpen(true)}
                sx={{ flex: 1, minWidth: '200px' }}
              >
                カレンダーを表示
              </Button>
              <Button 
                component={Link} 
                to="/application/list" 
                variant="outlined" 
                size="large"
                startIcon={<EventNote />}
                sx={{ flex: 1, minWidth: '200px' }}
              >
                申請一覧を見る
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Modal
        open={calendarOpen}
        onClose={() => {
          setCalendarOpen(false);
          setSelectedDate(null);
        }}
        aria-labelledby="calendar-modal-title"
        aria-describedby="calendar-modal-description"
      >
        <Paper sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          p: 3,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          '.react-calendar': {
            width: '100%',
            border: 'none',
            borderRadius: 2,
            boxShadow: 1,
          },
          '.react-calendar__tile': {
            height: '70px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '8px 4px',
          },
          '.react-calendar__month-view__days__day': { color: 'black' },
          '.react-calendar__tile--approved': {
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            fontWeight: 'bold',
            border: '2px solid #388e3c',
            '&:hover': {
              background: 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)',
              transform: 'scale(1.05)',
              transition: 'all 0.2s ease-in-out',
            },
            '&:enabled:focus': {
              background: 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)',
            },
          },
          '.react-calendar__tile--now': {
            background: '#fff3cd',
            '&.react-calendar__tile--approved': {
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              border: '3px solid #ffc107',
            },
          },
        }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                📅 あなたの在宅勤務カレンダー
              </Typography>
              <Button 
                onClick={() => {
                  setCalendarOpen(false);
                  setSelectedDate(null);
                }} 
                startIcon={<CloseIcon />}
                variant="outlined"
                size="small"
              >
                閉じる
              </Button>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                  borderRadius: 1,
                  border: '2px solid #388e3c'
                }} />
                <Typography variant="body2">承認済み在宅勤務</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: 'white',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }} />
                <Typography variant="body2">予定なし</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: '#fff3cd',
                  borderRadius: 1,
                  border: '2px solid #ffc107'
                }} />
                <Typography variant="body2">今日</Typography>
              </Box>
            </Box>
          </Box>
          <Calendar 
            locale="ja-JP"
            onClickDay={(date: Date) => setSelectedDate(date)}
            tileClassName={({ date }: { date: Date }) => {
              const dateStr = dayjs(date).format('YYYY-MM-DD');
              const hasApproved = approvedDates.some(
                (approved) => dayjs(approved.requested_date).format('YYYY-MM-DD') === dateStr
              );
              return hasApproved ? 'react-calendar__tile--approved' : '';
            }}
            tileContent={({ date }: { date: Date }) => {
              const dateStr = dayjs(date).format('YYYY-MM-DD');
              const approved = approvedDates.filter(
                (app) => dayjs(app.requested_date).format('YYYY-MM-DD') === dateStr
              );
              return approved.length > 0 ? (
                <Box sx={{ 
                  fontSize: '1.2rem',
                  mt: 0.5,
                  lineHeight: 1
                }}>
                  🏠
                </Box>
              ) : null;
            }}
          />
          {selectedDate && (() => {
            const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
            const dayApprovals = approvedDates.filter(
              (app) => dayjs(app.requested_date).format('YYYY-MM-DD') === dateStr
            );
            return (
              <Card sx={{ 
                mt: 3, 
                background: dayApprovals.length > 0
                  ? 'linear-gradient(135deg, #4caf5015 0%, #45a04915 100%)'
                  : 'linear-gradient(135deg, #f5f5f515 0%, #e0e0e015 100%)',
                border: dayApprovals.length > 0 ? '2px solid #4caf50' : '2px solid #e0e0e0',
                borderRadius: 2
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: dayApprovals.length > 0 ? 'success.main' : 'text.secondary' }}>
                      📆 {dayjs(selectedDate).format('YYYY年MM月DD日 (ddd)')}
                    </Typography>
                    {dayApprovals.length > 0 && (
                      <Box sx={{ 
                        bgcolor: 'success.main', 
                        color: 'white', 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 2,
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        承認済み
                      </Box>
                    )}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  {dayApprovals.length > 0 ? (
                    <List dense sx={{ bgcolor: 'white', borderRadius: 1, p: 1 }}>
                      {dayApprovals.map((app) => (
                        <ListItem 
                          key={app.id}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            width: '100%'
                          }}>
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: 'success.main' 
                            }} />
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {app.username}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    ⏰ {dayjs(app.start_time, 'HH:mm:ss').format('HH:mm')} - {dayjs(app.end_time, 'HH:mm:ss').format('HH:mm')}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 3,
                      color: 'text.secondary'
                    }}>
                      <Typography variant="body1">
                        この日は在宅勤務の予定がありません
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </Paper>
      </Modal>
    </Box>
  );
}

export default HomePage;