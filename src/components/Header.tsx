import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Modal,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import type { ApplicationData } from '../types/ApplicationData';

interface HeaderProps {
  username: string | null;
  departmentName: string | null;
  handleLogout: () => void;
  open: boolean;
  onToggle: () => void;
  drawerWidth: number;
}

function Header({ username, departmentName, handleLogout, open, onToggle, drawerWidth }: HeaderProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);

  // 申請詳細を取得する関数
  const fetchApplicationDetails = async (applicationId: number) => {
    console.log('申請詳細を取得中:', applicationId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log('レスポンスステータス:', response.status);

      if (response.ok) {
        const application = await response.json();
        console.log('取得した申請データ:', application);
        // 日付フォーマットを整える
        const formattedApplication = {
          ...application,
          applicationDate: application.applicationDate ? dayjs(application.applicationDate).format('YYYY/MM/DD HH:mm') : '',
          requestedDate: application.requestedDate ? dayjs(application.requestedDate).format('YYYY/MM/DD') : '',
          processedAt: application.processedAt ? dayjs(application.processedAt).format('YYYY/MM/DD HH:mm') : null,
        };
        console.log('フォーマット後の申請データ:', formattedApplication);
        setSelectedApplication(formattedApplication);
        setApplicationModalOpen(true);
        console.log('モーダルを開きました');
      } else {
        console.error('申請詳細の取得に失敗:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('申請詳細の取得に失敗しました:', error);
    }
  };

  // ステータス表示用の関数
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

  // 通知を取得する関数
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('取得した通知データ:', data);
        console.log('最初の通知の詳細:', data.notifications[0]);
        setUnreadCount(data.unreadCount);
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('通知の取得に失敗しました:', error);
    }
  };

  // 通知を既読にする関数
  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        // 通知リストを更新
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        // 未読数を更新
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('通知の既読処理に失敗しました:', error);
    }
  };

  // コンポーネントマウント時に通知を取得
  useEffect(() => {
    fetchNotifications();
    
    // 30秒ごとに通知を更新
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    // 通知メニューを開くときに最新の通知を取得
    await fetchNotifications();
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationClick = async (notification: any) => {
    console.log('=== 通知クリックイベント ===');
    console.log('通知ID:', notification.id);
    console.log('申請ID (application_id):', notification.application_id);
    console.log('申請IDの型:', typeof notification.application_id);
    console.log('申請IDは存在するか:', notification.application_id !== null && notification.application_id !== undefined);
    console.log('通知全体 (JSON):', JSON.stringify(notification, null, 2));
    console.log('通知のすべてのキー:', Object.keys(notification));
    console.log('========================');
    
    // 未読の場合は既読にする
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // 申請詳細を取得してモーダルを表示
    if (notification.application_id) {
      console.log('✅ 申請IDが存在します。申請詳細を取得します:', notification.application_id);
      await fetchApplicationDetails(notification.application_id);
      // 通知メニューを閉じる
      handleNotificationMenuClose();
    } else {
      console.warn('❌ 申請IDが存在しません');
      // 申請IDがない場合は、通知メッセージのみを表示して通知メニューを閉じる
      alert('この通知に関連する申請情報が見つかりませんでした。古い通知の可能性があります。');
      handleNotificationMenuClose();
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
    handleMenuClose();
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: '56px !important', py: 0.5, pl: 1 }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            letterSpacing: '0.3px',
            fontSize: '1.1rem',
          }}
        >
          在宅勤務申請システム
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' }}>
            {departmentName}
          </Typography>
          
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              transition: 'background-color 0.2s',
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>
              {username}さん
            </Typography>
            <AccountCircleIcon sx={{ color: 'white', fontSize: '1.3rem' }} />
          </Box>

          <IconButton color="inherit" sx={{ ml: 0.5, p: 0.75 }} onClick={handleNotificationMenuOpen}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon sx={{ fontSize: '1.3rem' }} />
            </Badge>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleLogoutClick}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>ログアウト</ListItemText>
          </MenuItem>
        </Menu>

        {/* 通知メニュー */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              width: 320,
              maxHeight: 400,
              '& .MuiList-root': {
                py: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled sx={{ opacity: 1, '&.Mui-disabled': { opacity: 1 }, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                通知
              </Typography>
              <Typography variant="caption" color="text.secondary">
                未読: {unreadCount}件
              </Typography>
            </Box>
          </MenuItem>
          
          {notifications.length === 0 ? (
            <MenuItem disabled sx={{ opacity: 1, '&.Mui-disabled': { opacity: 1 }, p: 2, textAlign: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                通知はありません
              </Typography>
            </MenuItem>
          ) : (
            notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  sx={{
                    py: 1.5,
                    px: 2,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                    {!notification.is_read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          mr: 1,
                        }}
                      />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: notification.is_read ? 'normal' : 'bold', flexGrow: 1 }}>
                      {notification.message}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-end' }}>
                    {new Date(notification.created_at).toLocaleString('ja-JP', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </MenuItem>
              ))
          )}
          
          {unreadCount > 0 && [
            <Divider key="divider" />,
            <MenuItem key="mark-all-read" disabled sx={{ opacity: 1, '&.Mui-disabled': { opacity: 1 }, p: 1 }}>
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  // すべての通知を既読にする
                  notifications.forEach(notif => {
                    if (!notif.is_read) markAsRead(notif.id);
                  });
                }}
              >
                すべて既読にする
              </Button>
            </MenuItem>
          ]}
        </Menu>

        {/* 申請詳細モーダル */}
        <Modal
          open={applicationModalOpen}
          onClose={() => setApplicationModalOpen(false)}
          aria-labelledby="application-detail-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 500,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
              p: 3,
              outline: 'none',
            }}
          >
            {selectedApplication && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography id="application-detail-modal-title" variant="h6" component="h2">
                    申請詳細
                  </Typography>
                  <IconButton onClick={() => setApplicationModalOpen(false)} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Card sx={{ mb: 2 }}>
                  <CardContent>
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

                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">申請日</Typography>
                        <Typography>
                          {selectedApplication.applicationDate || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">希望日</Typography>
                        <Typography>
                          {selectedApplication.requestedDate || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">時間</Typography>
                        <Typography>
                          {selectedApplication.startTime && selectedApplication.endTime 
                            ? `${dayjs(selectedApplication.startTime, 'HH:mm:ss').format('HH:mm')} - ${dayjs(selectedApplication.endTime, 'HH:mm:ss').format('HH:mm')}` 
                            : '終日'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">理由</Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap', textAlign: 'right' }}>
                          {selectedApplication.reason}
                        </Typography>
                      </Box>
                      {selectedApplication.status === '否認' && selectedApplication.denialReason && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary">否認理由</Typography>
                          <Typography sx={{ whiteSpace: 'pre-wrap', textAlign: 'right', color: 'error.main' }}>
                            {selectedApplication.denialReason}
                          </Typography>
                        </Box>
                      )}
                      {selectedApplication.approverUsername && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary">処理者</Typography>
                          <Typography>
                            {selectedApplication.approverUsername}（
                            {selectedApplication.approverDepartmentName || '部署なし'}）
                          </Typography>
                        </Box>
                      )}
                      {selectedApplication.processedAt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary">処理日</Typography>
                          <Typography>
                            {selectedApplication.processedAt}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </>
            )}
          </Box>
        </Modal>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
