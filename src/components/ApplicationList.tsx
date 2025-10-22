import React, { useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  Paper,
  Typography,
  Chip,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Modal,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import type { ApplicationData } from '../pages/ApplicationPage';

interface ApplicationListProps {
  applications: ApplicationData[];
  updateApplicationStatus?: (id: number, newStatus: ApplicationData['status']) => void;
  selectedTab?: 'pending' | 'processed';
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: '承認' | '否認';
}

// 確認モーダル（承認・否認時に表示）
const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, onClose, onConfirm, action }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="confirm-modal-title">
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 2,
        p: 3,
      }}
    >
      <Typography id="confirm-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
        {action}の確認
      </Typography>
      <Typography sx={{ mb: 3 }}>この申請を{action}してよろしいですか？</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          color={action === '承認' ? 'success' : 'error'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {action}
        </Button>
      </Box>
    </Box>
  </Modal>
);

// ---- ここだけ変更: ステータス表示の文言・色・アイコンを明確にする ----
// 目的: デザイン（位置・サイズ等）は変えずに「申請中」「承認済」「否認済」をわかりやすくする
const getStatusChipProps = (status: string) => {
  switch (status) {
    case '承認':
      return { color: 'success' as const, icon: <CheckCircleIcon fontSize="small" />, label: '承認済' };
    case '否認':
      return { color: 'error' as const, icon: <CancelIcon fontSize="small" />, label: '否認済' };
    case '申請中':
      return { color: 'warning' as const, icon: <AccessTimeIcon fontSize="small" />, label: '申請中' };
    default:
      return { color: 'default' as const, icon: undefined, label: status };
  }
};
// --------------------------------------------------------------------

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 2,
  p: 3,
  outline: 'none',
};

function ApplicationList({ applications, updateApplicationStatus, selectedTab }: ApplicationListProps) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: '承認' | '否認';
    applicationId: number | null;
  }>({
    open: false,
    action: '承認',
    applicationId: null,
  });

  const handleOpenModal = (app: ApplicationData) => {
    setSelectedApplication(app);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedApplication(null);
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 'var(--shadow-sm)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -1,
              left: 0,
              width: '7em',
              height: 3,
              backgroundColor: 'primary.main',
              borderRadius: 1,
            },
          }}
        >
          自分の申請一覧
        </Typography>
      </Box>

      {/* 一覧表示部分 */}
      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
        }}
      >
        {applications.length === 0 ? (
          <Box sx={{ gridColumn: '1/-1' }}>
            <Typography variant="subtitle1" align="center" sx={{ mt: 2 }}>
              表示する申請がありません。
            </Typography>
          </Box>
        ) : (
          applications.map((app) => (
            <Card
              key={app.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 1,
                border: app.isSpecialApproval ? '2px solid' : '1px solid',
                borderColor: app.isSpecialApproval ? 'error.main' : 'divider',
                backgroundColor: app.isSpecialApproval ? 'rgba(255, 0, 0, 0.03)' : 'background.paper',
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">
                    {app.departmentName} {app.username}
                  </Typography>
                  {/* ステータスと特認チップ表示（デザイン変更なし） */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {app.isSpecialApproval ? (
                      <Chip
                        label="特認"
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : null}
                    {/* ここで全ステータス（申請中 / 承認済 / 否認済）を表示 */}
                    <Chip
                      label={getStatusChipProps(app.status).label}
                      color={getStatusChipProps(app.status).color}
                      size="small"
                      icon={getStatusChipProps(app.status).icon}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  申請日: {dayjs(app.applicationDate).format('YYYY/MM/DD')} 
                  <br/>
                  希望日: {dayjs(app.requestedDate).format('YYYY/MM/DD')}
                </Typography>
              </CardContent>

              {/* アクションボタン */}
              <CardActions sx={{ justifyContent: 'flex-end', mt: 'auto' }}>
                {selectedTab === 'pending' && app.status === '申請中' && updateApplicationStatus && (
                  <>
                    <Button
                      size="small"
                      color="success"
                      onClick={() => setConfirmModal({ open: true, action: '承認', applicationId: app.id })}
                    >
                      承認
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setConfirmModal({ open: true, action: '否認', applicationId: app.id })}
                    >
                      否認
                    </Button>
                  </>
                )}
                <Button size="small" onClick={() => handleOpenModal(app)}>
                  詳細
                </Button>
              </CardActions>
            </Card>
          ))
        )}
      </Box>

      {/* 詳細モーダル */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" component="h2">
                申請詳細
              </Typography>
              <IconButton onClick={handleCloseModal} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {selectedApplication && (
              <Box sx={{ display: 'grid', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    {selectedApplication.username}（{selectedApplication.departmentName}）
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={getStatusChipProps(selectedApplication.status).label}
                      color={getStatusChipProps(selectedApplication.status).color}
                      size="small"
                      icon={getStatusChipProps(selectedApplication.status).icon}
                      sx={{ fontWeight: 600 }}
                    />
                    {!!selectedApplication.isSpecialApproval && (
                      <Chip
                        label="特認"
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    '& .detail-row': {
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr',
                      gap: 1.5,
                      alignItems: 'baseline',
                    },
                  }}
                >
                  <Box className="detail-row">
                    <Typography color="text.secondary">申請日</Typography>
                    <Typography>
                      {selectedApplication.applicationDate
                        ? dayjs(selectedApplication.applicationDate).format('YYYY/MM/DD HH:mm')
                        : '-'}
                    </Typography>
                  </Box>
                  <Box className="detail-row">
                    <Typography color="text.secondary">希望日</Typography>
                    <Typography>
                      {selectedApplication.requestedDate
                        ? dayjs(selectedApplication.requestedDate).format('YYYY/MM/DD')
                        : '-'}
                    </Typography>
                  </Box>
                  <Box className="detail-row">
                    <Typography color="text.secondary">理由</Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedApplication.reason}</Typography>
                  </Box>
                  {selectedApplication.approverUsername && (
                    <Box className="detail-row">
                      <Typography color="text.secondary">処理者</Typography>
                      <Typography>
                        {selectedApplication.approverUsername}（
                        {selectedApplication.approverDepartmentName || '部署なし'}）
                      </Typography>
                    </Box>
                  )}
                  {selectedApplication.processedAt && (
                    <Box className="detail-row">
                      <Typography color="text.secondary">処理日</Typography>
                      <Typography>
                        {dayjs(selectedApplication.processedAt).format('YYYY/MM/DD HH:mm')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>

      {/* 承認/否認確認モーダル */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={() => {
          if (confirmModal.applicationId && updateApplicationStatus) {
            updateApplicationStatus(confirmModal.applicationId, confirmModal.action);
          }
        }}
        action={confirmModal.action}
      />
    </Paper>
  );
}

export default ApplicationList;