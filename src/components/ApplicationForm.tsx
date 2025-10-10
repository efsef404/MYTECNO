import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface ApplicationFormProps {
  addApplication: (reason: string, date: string) => void;
}

function ApplicationForm({ addApplication }: ApplicationFormProps) {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !date) {
      setError('日付と理由を両方入力してください。');
      return;
    }
    addApplication(reason, date.format('YYYY-MM-DD'));
    setReason('');
    setDate(dayjs());
    setError('');
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        新規申請
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <DatePicker
            label="日付"
            value={date}
            onChange={(newValue) => setDate(newValue)}
            sx={{ maxWidth: '250px' }}
          />
          <TextField
            label="理由"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && <Typography color="error">{error}</Typography>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" size="large">
              申請する
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
}

export default ApplicationForm;
