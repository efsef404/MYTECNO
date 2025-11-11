import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Toolbar, Box, IconButton, Divider, Typography
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link } from 'react-router-dom';

const drawerWidth = 220;
const drawerWidthClosed = 60;

interface SidebarProps {
  isLoggedIn: boolean;
  userRole: string | null;
  open: boolean;
  onToggle: () => void;
}

function Sidebar({
  isLoggedIn,
  userRole,
  open,
  onToggle
}: SidebarProps) {
  return (
    <Drawer
      sx={{
        width: open ? drawerWidth : drawerWidthClosed,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: 'width 0.3s',
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : drawerWidthClosed,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.3s',
          top: '56px', // Position below header
          height: 'calc(100% - 56px)',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 1 }}>
        {open && (
          <Typography variant="subtitle1" sx={{ mr: 1, fontWeight: 'bold' }}>
            メニュー
          </Typography>
        )}
        <IconButton 
          onClick={onToggle} 
          size="small"
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ overflow: 'auto', pt: 1 }}>
        <List sx={{ py: 0 }}>
          {isLoggedIn && (
            <>
              <ListItem
                component={Link}
                to="/home"
                sx={{
                  color: 'black',
                  py: 1,
                  px: open ? 2 : 1,
                  justifyContent: open ? 'flex-start' : 'center',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#1976d2',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black', minWidth: open ? 40 : 'auto', justifyContent: 'center' }}>
                  <HomeIcon fontSize="small" />
                </ListItemIcon>
                {open && <ListItemText primary="ホーム" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
              </ListItem>
            <ListItem
                component={Link}
                to="/application/new"
                sx={{
                  color: 'black',
                  py: 1,
                  px: open ? 2 : 1,
                  justifyContent: open ? 'flex-start' : 'center',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#d32f2f',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black', minWidth: open ? 40 : 'auto', justifyContent: 'center' }}>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                {open && <ListItemText primary="新規申請" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
              </ListItem>
              <ListItem
                component={Link}
                to="/application/list"
                sx={{
                  color: 'black',
                  py: 1,
                  px: open ? 2 : 1,
                  justifyContent: open ? 'flex-start' : 'center',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#d32f2f',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black', minWidth: open ? 40 : 'auto', justifyContent: 'center' }}>
                  <AssignmentIcon fontSize="small" />
                </ListItemIcon>
                {open && <ListItemText primary="申請一覧" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
              </ListItem>
              {(userRole === '承認者' || userRole === '管理者') && (
                <ListItem
                  component={Link}
                  to="/approve"
                  sx={{
                    color: 'black',
                    py: 1,
                    px: open ? 2 : 1,
                    justifyContent: open ? 'flex-start' : 'center',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#388e3c',
                      transition: 'background 0.2s, color 0.2s',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'black', minWidth: open ? 40 : 'auto', justifyContent: 'center' }}>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  {open && <ListItemText primary="承認" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
                </ListItem>
              )}
              {userRole === '管理者' && (
                <ListItem
                  component={Link}
                  to="/manage"
                  sx={{
                    color: 'black',
                    py: 1,
                    px: open ? 2 : 1,
                    justifyContent: open ? 'flex-start' : 'center',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#fbc02d',
                      transition: 'background 0.2s, color 0.2s',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'black', minWidth: open ? 40 : 'auto', justifyContent: 'center' }}>
                    <GroupIcon fontSize="small" />
                  </ListItemIcon>
                  {open && <ListItemText primary="管理" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
                </ListItem>
              )}
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
