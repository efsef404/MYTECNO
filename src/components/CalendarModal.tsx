import { useState, useEffect } from 'react';
import { Modal, Box, Typography, Paper, Button, Card, CardContent, Divider, Popover, TextField, InputAdornment, Chip } from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
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
  const [filteredData, setFilteredData] = useState<CalendarData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      setFilteredData(data);
    } catch (err: any) {
      console.error('Calendar fetch error:', err); // デバッグ用ログ
      setError(err.message);
    }
  };

  // 検索機能
  const filterData = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredData(calendarData);
      return;
    }

    const filtered = calendarData.filter(item => {
      if (!item.details) return false;
      
      const details = item.details.split(';;');
      return details.some(detail => {
        const [name] = detail.split('|');
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    });

    setFilteredData(filtered);
  };

  useEffect(() => {
    filterData(searchTerm);
  }, [searchTerm, calendarData]);

  const getDateData = (date: Date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const found = filteredData.find(d => {
      // サーバーから返される日付はUTCで返されるため、ローカル時間に変換
      const serverDate = dayjs.utc(d.date).local().format('YYYY-MM-DD');
      const match = serverDate === dateStr;
      return match;
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
            height: '60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '4px 2px',
            position: 'relative',
            fontSize: '0.75rem',
          },
          '.react-calendar__month-view__days__day': { 
            color: 'black',
          },
          '.react-calendar__tile--has-data': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold',
            border: '1px solid #5a67d8',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%)',
              transform: 'scale(1.02)',
              transition: 'all 0.2s ease-in-out',
            },
            '&:enabled:focus': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%)',
            },
          },
          '.react-calendar__tile--high-traffic': {
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            fontWeight: 'bold',
            border: '2px solid #c44569',
            '&:hover': {
              background: 'linear-gradient(135deg, #ee5a24 0%, #c44569 100%)',
              transform: 'scale(1.02)',
              transition: 'all 0.2s ease-in-out',
            },
          },
          '.react-calendar__tile--medium-traffic': {
            background: 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
            color: 'black',
            fontWeight: 'bold',
            border: '1px solid #f39c12',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff9ff3 0%, #f39c12 100%)',
              transform: 'scale(1.02)',
              transition: 'all 0.2s ease-in-out',
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
          
          {/* 検索バー */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="社員名で検索..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={() => setSearchTerm('')}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      <ClearIcon />
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            {searchTerm && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${filteredData.length}件見つかりました`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  検索: "{searchTerm}"
                </Typography>
              </Box>
            )}
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
                width: 20, 
                height: 20, 
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                borderRadius: 1,
                border: '2px solid #c44569'
              }} />
              <Typography variant="body2">高密度 (50人以上)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                background: 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
                borderRadius: 1,
                border: '1px solid #f39c12'
              }} />
              <Typography variant="body2">中密度 (10-49人)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 1,
                border: '2px solid #5a67d8'
              }} />
              <Typography variant="body2">低密度 (1-9人)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                bgcolor: 'white',
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }} />
              <Typography variant="body2">在宅勤務なし</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
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
          onClickDay={(date: Date, event: React.MouseEvent<HTMLButtonElement>) => {
            console.log('Calendar day clicked:', date);
            setSelectedDate(date);
            setAnchorEl(event.currentTarget);
          }}
          tileClassName={({ date }: { date: Date }) => {
            const data = getDateData(date);
            const hasData = data && data.details;
            if (!hasData) return '';
            
            // 密度レベルに応じてクラスを返す
            const count = data.count;
            if (count >= 50) return 'react-calendar__tile--high-traffic';
            if (count >= 10) return 'react-calendar__tile--medium-traffic';
            return 'react-calendar__tile--has-data';
          }}
          tileContent={({ date }: { date: Date }) => {
            const data = getDateData(date);
            if (!data || !data.details) return null;
            
            const count = data.count;
            let icon = '🏠';
            let bgColor = 'rgba(255, 255, 255, 0.3)';
            
            // 密度レベルに応じてアイコンと色を変更
            if (count >= 50) {
              icon = '🔥';
              bgColor = 'rgba(255, 255, 255, 0.4)';
            } else if (count >= 10) {
              icon = '👥';
              bgColor = 'rgba(0, 0, 0, 0.2)';
            }
            
            return (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.25,
                mt: 0.25,
                cursor: 'pointer'
              }}>
                <Box sx={{ 
                  fontSize: '0.9rem',
                  lineHeight: 1
                }}>
                  {icon}
                </Box>
                <Box sx={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold',
                  bgcolor: bgColor,
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {count}
                </Box>
              </Box>
            );
          }}
        />

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => {
            setAnchorEl(null);
            setSelectedDate(null);
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          {selectedDate && (() => {
            const data = getDateData(selectedDate);
            const details = data ? parseDetails(data.details) : [];
            console.log('Selected date:', selectedDate, 'Data:', data, 'Details:', details);
            return (
              <Card sx={{ 
                minWidth: 300,
                maxWidth: 400,
                background: data 
                  ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
                  : 'linear-gradient(135deg, #f5f5f515 0%, #e0e0e015 100%)',
                border: data ? '2px solid #667eea' : '2px solid #e0e0e0',
                borderRadius: 2,
                m: 1
              }}>
                <CardContent sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: data ? 'primary.main' : 'text.secondary' }}>
                      📆 {dayjs(selectedDate).format('MM/DD (ddd)')}
                    </Typography>
                    {data && (
                      <Box sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: 2,
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {data.count}人
                      </Box>
                    )}
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  {data && details.length > 0 ? (
                    <Box sx={{ 
                      bgcolor: 'white', 
                      borderRadius: 1, 
                      p: 1,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                        {details.length}名の在宅勤務者
                      </Typography>
                      {details.map((detail, index) => (
                        <Box 
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.5,
                            px: 0.5,
                            borderBottom: index < details.length - 1 ? '1px solid #f0f0f0' : 'none',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderRadius: 0.5
                            }
                          }}
                        >
                          <Box sx={{ 
                            width: 4, 
                            height: 4, 
                            borderRadius: '50%', 
                            bgcolor: 'primary.main',
                            flexShrink: 0
                          }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                              {detail.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {detail.time}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 2,
                      color: 'text.secondary'
                    }}>
                      <Typography variant="body2">
                        この日は在宅勤務の予定がありません
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </Popover>
      </Paper>
    </Modal>
  );
}

export default CalendarModal;
