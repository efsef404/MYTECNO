import React from 'react';
import { Modal, Box, Typography, Paper } from '@mui/material';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 日本語ローカライズ
import 'dayjs/locale/ja';
dayjs.locale('ja');

const localizer = dayjsLocalizer(dayjs);

interface ApplicationData {
  id: number;
  username: string;
  requestedDate: string;
  status: '承認' | '否認' | '申請中';
  reason: string;
}

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
  applications: ApplicationData[];
}

function CalendarModal({ open, onClose, applications }: CalendarModalProps) {
  const events = applications
    .filter(app => app.status === '承認') // 承認済みの申請のみをフィルタリング
    .map(app => ({
      title: `${app.username} - ${app.reason}`,
      start: dayjs(app.requestedDate).toDate(),
      end: dayjs(app.requestedDate).toDate(),
      allDay: true, // 終日イベントとして扱う
    }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="calendar-modal-title"
      aria-describedby="calendar-modal-description"
    >
      <Paper sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%', // 幅を広げる
        maxWidth: 900, // 最大幅を設定
        height: '90%', // 高さを広げる
        maxHeight: 700, // 最大高さを設定
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Typography id="calendar-modal-title" variant="h6" component="h2" gutterBottom>
          承認済み申請カレンダー
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={{
              next: '次',
              previous: '前',
              today: '今日',
              month: '月',
              week: '週',
              day: '日',
              agenda: '予定',
              date: '日付',
              time: '時間',
              event: 'イベント',
              noEventsInRange: 'この期間にイベントはありません。',
              showMore: (total) => `他 ${total} 件`,
            }}
          />
        </Box>
      </Paper>
    </Modal>
  );
}

export default CalendarModal;
