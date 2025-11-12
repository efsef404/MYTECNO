import { useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
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
  TextField,
  Collapse,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import dayjs from 'dayjs';
import type { ApplicationData } from '../../types/ApplicationData';

interface ApplicationListProps {
  title: string;
  applications: ApplicationData[];
  updateApplicationStatus?: (id: number, newStatus: ApplicationData['status'], denialReason?: string) => void;
  selectedTab?: 'pending' | 'processed';
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (denialReason?: string) => void;
  action: '承認' | '否認';
}

// 確認モーダル（承認・否認時に表示）
const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, onClose, onConfirm, action }) => {
  const [denialReason, setDenialReason] = useState('');

  const handleConfirm = () => {
    if (action === '否認' && !denialReason.trim()) {
      alert('否認する場合は理由を入力してください。');
      return;
    }
    onConfirm(action === '否認' ? denialReason.trim() : undefined);
    onClose();
    setDenialReason(''); // モーダルを閉じるときに入力をクリア
  };

  return (
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
        
        {action === '否認' && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="否認理由"
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            sx={{ mb: 3 }}
            placeholder="否認する理由を入力してください..."
          />
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose}>キャンセル</Button>
          <Button
            variant="contained"
            color={action === '承認' ? 'success' : 'error'}
            onClick={handleConfirm}
          >
            {action}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

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

type SortField = 'date' | 'name' | 'status';
type SortOrder = 'asc' | 'desc';

function ApplicationList({ title, applications, updateApplicationStatus, selectedTab }: ApplicationListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterSpecialApproval, setFilterSpecialApproval] = useState<'all' | 'special' | 'normal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | '申請中' | '承認' | '否認'>('all');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: '承認' | '否認';
    applicationId: number | null;
  }>({
    open: false,
    action: '承認',
    applicationId: null,
  });

  const handleToggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // フィルタリングとソートを適用
  const filteredAndSortedApplications = applications
    .filter((app) => {
      // 特認フィルター
      if (filterSpecialApproval === 'special' && !app.isSpecialApproval) return false;
      if (filterSpecialApproval === 'normal' && app.isSpecialApproval) return false;
      
      // ステータスフィルター
      if (filterStatus !== 'all' && app.status !== filterStatus) return false;
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = dayjs(a.requestedDate).valueOf() - dayjs(b.requestedDate).valueOf();
          break;
        case 'name':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'status':
          const statusOrder = { '申請中': 1, '承認': 2, '否認': 3 };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: '0.9rem' }} /> : <ArrowDownwardIcon sx={{ fontSize: '0.9rem' }} />;
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
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -1,
              left: 0,
              width: '100%',
              height: 3,
              backgroundColor: 'primary.main',
              borderRadius: 1,
            },
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* フィルター */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>特認</InputLabel>
          <Select
            value={filterSpecialApproval}
            label="特認"
            onChange={(e) => setFilterSpecialApproval(e.target.value as 'all' | 'special' | 'normal')}
          >
            <MenuItem value="all">すべて</MenuItem>
            <MenuItem value="special">特認のみ</MenuItem>
            <MenuItem value="normal">通常のみ</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>ステータス</InputLabel>
          <Select
            value={filterStatus}
            label="ステータス"
            onChange={(e) => setFilterStatus(e.target.value as 'all' | '申請中' | '承認' | '否認')}
          >
            <MenuItem value="all">すべて</MenuItem>
            <MenuItem value="申請中">申請中</MenuItem>
            <MenuItem value="承認">承認済</MenuItem>
            <MenuItem value="否認">否認済</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredAndSortedApplications.length}件 / {applications.length}件
          </Typography>
        </Box>
      </Box>

      {/* 一覧表示部分 */}
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {filteredAndSortedApplications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {applications.length === 0 ? '表示する申請がありません。' : '条件に一致する申請がありません。'}
            </Typography>
          </Box>
        ) : (
          <>
            {/* ヘッダー行 */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                px: 1.5,
                py: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
                mb: 0.5
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0, pl: 1 }}> {/* 特認 */}
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
                  特認
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  flex: 1, 
                  minWidth: 0,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' }
                }}
                onClick={() => handleSort('date')}
              >
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  勤務日
                  <SortIcon field="date" />
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  flex: 1,
                  minWidth: 0,
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' }
                }}
                onClick={() => handleSort('name')}
              >
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  申請者
                  <SortIcon field="name" />
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
                  勤務時間
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  flex: 1, 
                  minWidth: 0,
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' }
                }}
                onClick={() => handleSort('status')}
              >
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  ステータス
                  <SortIcon field="status" />
                </Typography>
              </Box>
            </Box>

            {/* データ行 */}
            {filteredAndSortedApplications.map((app) => (
            <Card
              key={app.id}
              sx={{
                borderRadius: 1,
                border: app.isSpecialApproval ? '2px solid' : '1px solid',
                borderColor: app.isSpecialApproval ? 'error.main' : 'divider',
                backgroundColor: app.isSpecialApproval ? 'rgba(255, 0, 0, 0.02)' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              {/* コンパクトな表示部分（常に表示） */}
              <CardContent 
                sx={{ 
                  p: 1, 
                  '&:last-child': { pb: 1 },
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleToggleExpand(app.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0, pl: 1 }}> {/* 特認 */}
                    {app.isSpecialApproval ? (
                      <FiberManualRecordIcon sx={{ color: 'error.main', fontSize: '0.8rem' }} />
                    ) : null}
                  </Box>
                  {/* 勤務日 */}
                  <Box 
                    sx={{ 
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.9rem', lineHeight: 1.2 }}>
                        {dayjs(app.requestedDate).format('M/D')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
                        ({dayjs(app.requestedDate).format('ddd')})
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* 申請者名（コンパクト） */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 400, 
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {app.username}
                    </Typography>
                  </Box>

                  {/* 勤務時間 */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: '0.9rem' }} />
                      {app.startTime && app.endTime 
                        ? `${dayjs(app.startTime, 'HH:mm:ss').format('HH:mm')}-${dayjs(app.endTime, 'HH:mm:ss').format('HH:mm')}`
                        : '終日'}
                    </Typography>
                  </Box>

                  {/* バッジ群 */}
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={getStatusChipProps(app.status).label}
                      color={getStatusChipProps(app.status).color}
                      size="small"
                      icon={getStatusChipProps(app.status).icon}
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, '& .MuiChip-label': { px: 1 } }}
                    />
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      {expandedId === app.id ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>

              {/* 展開可能な詳細部分 */}
              <Collapse in={expandedId === app.id} timeout="auto" unmountOnExit>
                <Divider />
                <CardContent sx={{ p: 2, pt: 1.5, bgcolor: 'action.hover' }}>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {/* 勤務時間 */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                        勤務時間
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {app.startTime && app.endTime 
                          ? `${dayjs(app.startTime, 'HH:mm:ss').format('HH:mm')} - ${dayjs(app.endTime, 'HH:mm:ss').format('HH:mm')}`
                          : '終日'}
                      </Typography>
                    </Box>

                    {/* 申請日時 */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                        申請日時
                      </Typography>
                      <Typography variant="body2">
                        {dayjs(app.applicationDate).format('YYYY/MM/DD HH:mm')}
                      </Typography>
                    </Box>

                    {/* 理由 */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                        理由
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {app.reason}
                      </Typography>
                    </Box>

                    {/* 否認理由（否認時のみ） */}
                    {app.status === '否認' && app.denialReason && (
                      <Box sx={{ p: 1, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.light' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', display: 'block', fontSize: '0.7rem' }}>
                          否認理由
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'error.dark' }}>
                          {app.denialReason}
                        </Typography>
                      </Box>
                    )}

                    {/* 処理情報（承認済み/否認済みの場合） */}
                    {app.status !== '申請中' && app.approverUsername && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                          処理者
                        </Typography>
                        <Typography variant="body2">
                          {app.approverUsername}（{app.approverDepartmentName || '部署なし'}）
                        </Typography>
                        {app.processedAt && (
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(app.processedAt).format('YYYY/MM/DD HH:mm')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </CardContent>

                {/* アクションボタン */}
                {selectedTab === 'pending' && app.status === '申請中' && updateApplicationStatus && (
                  <CardActions sx={{ justifyContent: 'flex-end', p: 1.5, pt: 0 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ open: true, action: '承認', applicationId: app.id });
                      }}
                    >
                      承認
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ open: true, action: '否認', applicationId: app.id });
                      }}
                    >
                      否認
                    </Button>
                  </CardActions>
                )}
              </Collapse>
            </Card>
          ))}
          </>
        )}
      </Box>


      {/* 承認/否認確認モーダル */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={(denialReason?: string) => {
          console.log('ConfirmModal onConfirm called with:', confirmModal, denialReason);
          if (confirmModal.applicationId && updateApplicationStatus) {
            console.log('Calling updateApplicationStatus with:', confirmModal.applicationId, confirmModal.action, denialReason);
            updateApplicationStatus(confirmModal.applicationId, confirmModal.action, denialReason);
          }
        }}
        action={confirmModal.action}
      />
    </Paper>
  );
}

export default ApplicationList;
