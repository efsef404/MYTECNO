import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface ApplicationFormProps {
  addApplication: (reason: string, requestedDate: string) => void;
}

function ApplicationForm({ addApplication }: ApplicationFormProps) {
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState<Dayjs | null>(dayjs()); // dateをrequestedDateに変更
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !requestedDate) { // dateをrequestedDateに変更
      setError('申請希望日と理由を両方入力してください。'); // エラーメッセージも変更
      return;
    }
    addApplication(reason, requestedDate.format('YYYY-MM-DD')); // dateをrequestedDateに変更
    setReason('');
    setRequestedDate(dayjs()); // dateをrequestedDateに変更
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
            label="申請希望日" // ラベルを変更
            value={requestedDate} // valueをrequestedDateに変更
            onChange={(newValue) => setRequestedDate(newValue)} // onChangeをrequestedDateに変更
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
