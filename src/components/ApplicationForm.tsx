import React, { useState } from 'react'; // useStateをインポート
import { Box, TextField, Button, Typography, Paper, Checkbox, FormControlLabel } from '@mui/material'; // Checkbox, FormControlLabelを追加
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface ApplicationFormProps {
  addApplication: (reason: string, requestedDate: string, isSpecialApproval: boolean) => void; // 引数を追加
}

function ApplicationForm({ addApplication }: ApplicationFormProps) {
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState<Dayjs | null>(dayjs());
  const [isSpecialApproval, setIsSpecialApproval] = useState(false); // 新しいstate
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !requestedDate) {
      setError('申請希望日と理由を両方入力してください。');
      return;
    }

    // 申請日と申請希望日が同じ日付かどうかをチェック
    const today = dayjs().format('YYYY-MM-DD');
    const selectedDate = requestedDate.format('YYYY-MM-DD');

    if (today === selectedDate && !isSpecialApproval) {
      setError('申請日と申請希望日が同日の場合、特認チェックボックスにチェックが必要です。' );
      return;
    }

    addApplication(reason, requestedDate.format('YYYY-MM-DDTHH:mm:ss'), isSpecialApproval); // 引数を追加
    setReason('');
    setRequestedDate(dayjs());
    setIsSpecialApproval(false); // リセット
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
            label="申請希望日"
            value={requestedDate}
            onChange={(newValue) => setRequestedDate(newValue)}
            minDate={dayjs()}
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}> {/* 配置調整 */}
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
    </Paper>
  );
}

export default ApplicationForm;
