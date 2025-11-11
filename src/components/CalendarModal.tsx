import { useState, useEffect } from 'react';
import { Modal, Box, Typography, Paper, Button, Card, CardContent, Divider, List, ListItem, ListItemText } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { ApplicationData } from '../types/ApplicationData';

dayjs.extend(utc);

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
  applications: ApplicationData[];
}

interface CalendarData {
  date: string;
  count: number;
  details: string;
}

function CalendarModal({ open, onClose }: CalendarModalProps) {
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchCalendarData();
    }
  }, [open]);

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/calendar/all-approved', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('カレンダーデータの取得に失敗しました。');
      }
      const data = await response.json();
      console.log('Calendar data received:', data); // デバッグ用ログ
      setCalendarData(data);
    } catch (err: any) {
      console.error('Calendar fetch error:', err); // デバッグ用ログ
      setError(err.message);
    }
  };

  const getDateData = (date: Date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const found = calendarData.find(d => {
      // サーバーから返される日付はUTCで返されるため、ローカル時間に変換
      const serverDate = dayjs.utc(d.date).local().format('YYYY-MM-DD');
      return serverDate === dateStr;
    });
    return found;
  };

  const parseDetails = (details: string) => {
    if (!details) return [];
    return details.split(';;').map(item => {
      const [name, time] = item.split('|');
      return { name, time };
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 1000,
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          '.react-calendar': {
            width: '100%',
            border: 'none',
            borderRadius: 2,
            boxShadow: 1,
          },
          '.react-calendar__tile': {
            height: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '8px 4px',
            position: 'relative',
          },
          '.react-calendar__month-view__days__day': { 
            color: 'black',
          },
          '.react-calendar__tile--has-data': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold',
            border: '2px solid #5a67d8',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%)',
              transform: 'scale(1.05)',
              transition: 'all 0.2s ease-in-out',
            },
            '&:enabled:focus': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%)',
            },
          },
          '.react-calendar__tile--now': {
            background: '#fff3cd',
            '&.react-calendar__tile--has-data': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '3px solid #ffc107',
            },
          },
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              📅 全社員の在宅勤務カレンダー
            </Typography>
            <Button 
              onClick={onClose} 
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 1,
                border: '2px solid #5a67d8'
              }} />
              <Typography variant="body2">在宅勤務あり</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: 'white',
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }} />
              <Typography variant="body2">在宅勤務なし</Typography>
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
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Calendar 
          locale="ja-JP"
          onClickDay={(date: Date) => setSelectedDate(date)}
          tileClassName={({ date }: { date: Date }) => {
            const data = getDateData(date);
            const hasData = data && data.details;
            return hasData ? 'react-calendar__tile--has-data' : '';
          }}
          tileContent={({ date }: { date: Date }) => {
            const data = getDateData(date);
            return (data && data.details) ? (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5
              }}>
                <Box sx={{ 
                  fontSize: '1.2rem',
                  lineHeight: 1
                }}>
                  🏠
                </Box>
                <Box sx={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 'bold',
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1
                }}>
                  {data.count}人
                </Box>
              </Box>
            ) : null;
          }}
        />

        {selectedDate && (() => {
          const data = getDateData(selectedDate);
          const details = data ? parseDetails(data.details) : [];
          return (
            <Card sx={{ 
              mt: 3, 
              background: data 
                ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
                : 'linear-gradient(135deg, #f5f5f515 0%, #e0e0e015 100%)',
              border: data ? '2px solid #667eea' : '2px solid #e0e0e0',
              borderRadius: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: data ? 'primary.main' : 'text.secondary' }}>
                    📆 {dayjs(selectedDate).format('YYYY年MM月DD日 (ddd)')}
                  </Typography>
                  {data && (
                    <Box sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: 2,
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      {data.count}人が在宅勤務
                    </Box>
                  )}
                </Box>
                <Divider sx={{ my: 2 }} />
                {data && details.length > 0 ? (
                  <List dense sx={{ bgcolor: 'white', borderRadius: 1, p: 1 }}>
                    {details.map((detail, index) => (
                      <ListItem 
                        key={index}
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
                            bgcolor: 'primary.main' 
                          }} />
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {detail.name}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  ⏰ {detail.time}
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
  );
}

export default CalendarModal;
