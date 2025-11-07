import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, Paper } from '@mui/material';

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  title?: string;
  countdown?: number; // 新しいプロップ
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ open, onClose, onConfirm, message, title = '確認', countdown = 0 }) => {
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [confirmDisabled, setConfirmDisabled] = useState(countdown > 0);

  useEffect(() => {
    if (open && countdown > 0) {
      setTimeLeft(countdown);
      setConfirmDisabled(true);
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setConfirmDisabled(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
      setConfirmDisabled(false);
    }
  }, [open, countdown]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
    >
      <Paper sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
      }}>
        <Typography id="confirmation-modal-title" variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        <Typography id="confirmation-modal-description" sx={{ mt: 2, mb: 3 }}>
          {message}
          {countdown > 0 && timeLeft > 0 && ` (${timeLeft}秒後に有効になります)`}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={onConfirm} autoFocus disabled={confirmDisabled}>
            確認
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default ConfirmationModal;
