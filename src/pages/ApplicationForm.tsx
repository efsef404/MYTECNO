import { useState } from 'react';
import { Box, TextField, Button, Typography, Checkbox, FormControlLabel, Alert, Paper, Card, CardContent, Divider } from '@mui/material';
import { Send as SendIcon, Info as InfoIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

export default function ApplicationForm() {
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState<Dayjs | null>(dayjs());
  const [isSpecialApproval, setIsSpecialApproval] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [isPartialWorkFromHome, setIsPartialWorkFromHome] = useState(false);
  const [isOvertimeApproval, setIsOvertimeApproval] = useState(false);
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

    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = dayjs(`2000-01-01 ${endTime}`);
    const durationHours = end.diff(start, 'hour');

    if (durationHours > 8 && !isOvertimeApproval) {
      setError('勤務時間が8時間を超える場合、上限超過チェックボックスにチェックを入れてください。');
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
          isPartialWorkFromHome,
          startTime,
          endTime,
          isOvertimeApproval,
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
      setIsPartialWorkFromHome(false);
      setIsOvertimeApproval(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        新規申請
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      
      {/* 注意事項 */}
      <Card sx={{ mb: 3, bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <InfoIcon sx={{ mr: 1, color: 'info.main', mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                申請時の注意事項
              </Typography>
              <Typography variant="body2" component="div">
                ・ 申請希望日は本日以降の日付を選択してください<br />
                ・ 当日申請の場合は「特認」にチェックが必要です<br />
                ・ 理由は具体的に記載してください
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 申請希望日 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                申請希望日 *
              </Typography>
              <DatePicker
                label="日付を選択"
                value={requestedDate}
                onChange={(newValue: Dayjs | null) => setRequestedDate(newValue)}
                minDate={dayjs()}
                sx={{ width: '100%', maxWidth: '300px' }}
              />
            </Box>

            <Divider />

            {/* 勤務時間 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                勤務時間
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="開始時刻"
                  type="time"
                  value={startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ flex: 1, minWidth: '150px' }}
                />
                <TextField
                  label="終了時刻"
                  type="time"
                  value={endTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ flex: 1, minWidth: '150px' }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isPartialWorkFromHome}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setIsPartialWorkFromHome(e.target.checked);
                    }}
                    name="isPartialWorkFromHome"
                    color="primary"
                  />
                }
                label="部分在宅勤務"
                sx={{ mt: 1 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isOvertimeApproval}
                    onChange={(e) => setIsOvertimeApproval(e.target.checked)}
                    name="isOvertimeApproval"
                    color="primary"
                  />
                }
                label="上限超過"
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider />

            {/* 理由 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                理由 *
              </Typography>
              <TextField
                placeholder="在宅勤務を希望する理由を具体的に記載してください"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
                required
              />
            </Box>

            <Divider />

            {/* 特認チェックボックスと送信ボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSpecialApproval}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsSpecialApproval(e.target.checked)}
                    name="specialApproval"
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      特認申請
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      当日申請の場合はチェックが必要です
                    </Typography>
                  </Box>
                }
              />
              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                startIcon={<SendIcon />}
                sx={{ minWidth: '150px' }}
              >
                申請する
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
