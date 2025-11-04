import React from 'react';
import { Modal, Box, Typography, Paper } from '@mui/material';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import type { Event as RBCEvent } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { ApplicationData } from '../types/ApplicationData';

// 日本語ローカライズ
import 'dayjs/locale/ja';
dayjs.locale('ja');

const localizer = dayjsLocalizer(dayjs);

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
  applications: ApplicationData[];
}

interface CalendarEvent extends RBCEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

function CalendarModal({ open, onClose, applications }: CalendarModalProps) {
  const events: CalendarEvent[] = applications
    .filter(app => app.status === '承認')
    .map(app => ({
      title: `${app.username} - ${app.reason} (${app.startTime || ''} - ${app.endTime || ''})`,
      start: dayjs(app.requestedDate).toDate(),
      end: dayjs(app.requestedDate).toDate(),
      allDay: true,
    }));

  return (
    <Modal open={open} onClose={onClose}>
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 900,
          height: '90%',
          maxHeight: 700,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" gutterBottom>
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
              showMore: ((total: number) => `他 ${total} 件`) as any,
            }}
          />
        </Box>
      </Paper>
    </Modal>
  );
}

export default CalendarModal;
