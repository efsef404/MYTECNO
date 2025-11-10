import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Checkbox, FormControlLabel, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

export default function ApplicationForm() {
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState<Dayjs | null>(dayjs());
  const [isSpecialApproval, setIsSpecialApproval] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!reason.trim() || !requestedDate) {
      setError('申請希望日と理由を両方入力してください。');
      return;
    }

    const today = dayjs().format('YYYY-MM-DD');
    const selectedDate = requestedDate.format('YYYY-MM-DD');

    if (today === selectedDate && !isSpecialApproval) {
      setError('申請日と申請希望日が同日の場合、特認チェックボックスにチェックが必要です。');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const applicationDate = dayjs().format('YYYY-MM-DD HH:mm:ss');

      const response = await fetch('http://localhost:3001/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          applicationDate,
          requestedDate: requestedDate.format('YYYY-MM-DD'),
          isSpecialApproval,
          startTime,
          endTime
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '申請の作成に失敗しました。');
      }

      setSuccessMessage('申請が正常に作成されました。');
      setReason('');
      setRequestedDate(dayjs());
      setIsSpecialApproval(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        新規申請
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <DatePicker
            label="申請希望日"
            value={requestedDate}
            onChange={(newValue) => setRequestedDate(newValue)}
            minDate={dayjs()}
            sx={{ maxWidth: '250px' }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="開始時刻"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="終了時刻"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
          <TextField
            label="理由"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSpecialApproval}
                  onChange={(e) => setIsSpecialApproval(e.target.checked)}
                  name="specialApproval"
                  color="primary"
                />
              }
              label="特認"
            />
            <Button type="submit" variant="contained" size="large">
              申請する
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}
