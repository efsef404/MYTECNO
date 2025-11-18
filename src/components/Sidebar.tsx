import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Toolbar, Box, Divider
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import { Link } from 'react-router-dom';

const drawerWidth = 220;
const drawerWidthClosed = 60;

interface SidebarProps {
  isLoggedIn: boolean;
  userRole: string | null;
  open: boolean;
}

function Sidebar({
  isLoggedIn,
  userRole,
  open,
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
                  flexDirection: open ? 'row' : 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#1976d2',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black', minWidth: 'auto', justifyContent: 'center', mr: open ? 1.5 : 0, mb: open ? 0 : 0.5 }}>
                  <HomeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="ホーム" 
                  primaryTypographyProps={{ 
                    fontSize: open ? '0.9rem' : '0.7rem',
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                  }} 
                  sx={{ display: open ? 'block' : 'block', mt: 0 }}
                />
              </ListItem>
            <ListItem
                component={Link}
                to="/application/new"
                sx={{
                  color: 'black',
                  py: 1,
                  px: open ? 2 : 1,
                  flexDirection: open ? 'row' : 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#d32f2f',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black', minWidth: 'auto', justifyContent: 'center', mr: open ? 1.5 : 0, mb: open ? 0 : 0.5 }}>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="新規申請" 
                  primaryTypographyProps={{ 
                    fontSize: open ? '0.9rem' : '0.7rem',
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                  }}
                  sx={{ display: open ? 'block' : 'block', mt: 0 }}
                />
              </ListItem>
              <ListItem
                component={Link}
                to="/application/list"
                sx={{
                  color: 'black',
                  py: 1,
                  px: open ? 2 : 1,
                  flexDirection: open ? 'row' : 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#d32f2f',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black', minWidth: 'auto', justifyContent: 'center', mr: open ? 1.5 : 0, mb: open ? 0 : 0.5 }}>
                  <AssignmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="申請一覧" 
                  primaryTypographyProps={{ 
                    fontSize: open ? '0.9rem' : '0.7rem',
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                  }}
                  sx={{ display: open ? 'block' : 'block', mt: 0 }}
                />
              </ListItem>
              {(userRole === '承認者' || userRole === '管理者') && (
                <ListItem
                  component={Link}
                  to="/approve"
                  sx={{
                    color: 'black',
                    py: 1,
                    px: open ? 2 : 1,
                    flexDirection: open ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#388e3c',
                      transition: 'background 0.2s, color 0.2s',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'black', minWidth: 'auto', justifyContent: 'center', mr: open ? 1.5 : 0, mb: open ? 0 : 0.5 }}>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="承認" 
                    primaryTypographyProps={{ 
                      fontSize: open ? '0.9rem' : '0.7rem',
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                    }}
                    sx={{ display: open ? 'block' : 'block', mt: 0 }}
                  />
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
                    flexDirection: open ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#fbc02d',
                      transition: 'background 0.2s, color 0.2s',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'black', minWidth: 'auto', justifyContent: 'center', mr: open ? 1.5 : 0, mb: open ? 0 : 0.5 }}>
                    <GroupIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="管理" 
                    primaryTypographyProps={{ 
                      fontSize: open ? '0.9rem' : '0.7rem',
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                    }}
                    sx={{ display: open ? 'block' : 'block', mt: 0 }}
                  />
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
