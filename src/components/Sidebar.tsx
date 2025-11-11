import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Toolbar, Box
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

interface SidebarProps {
  isLoggedIn: boolean;
  userRole: string | null;
}

function Sidebar({
  isLoggedIn,
  userRole
}: SidebarProps) {
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
        },
      }}
      variant="permanent"
      anchor="left"
      open={true}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {isLoggedIn && (
            <>
              <ListItem
                component={Link}
                to="/home"
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#1976d2',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black' }}>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="ホーム" />
              </ListItem>
            <ListItem
                component={Link}
                to="/application/new"
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#d32f2f',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black' }}>
                  <EditIcon />
                </ListItemIcon>
                <ListItemText primary="新規申請" />
              </ListItem>
              <ListItem
                component={Link}
                to="/application/list"
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#d32f2f',
                    transition: 'background 0.2s, color 0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'black' }}>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary="申請一覧" />
              </ListItem>
              {(userRole === '承認者' || userRole === '管理者') && (
                <ListItem
                  component={Link}
                  to="/approve"
                  sx={{
                    color: 'black',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#388e3c',
                      transition: 'background 0.2s, color 0.2s',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'black' }}>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText primary="承認" />
                </ListItem>
              )}
              {userRole === '管理者' && (
                <ListItem
                  component={Link}
                  to="/manage"
                  sx={{
                    color: 'black',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#fbc02d',
                      transition: 'background 0.2s, color 0.2s',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'black' }}>
                    <GroupIcon />
                  </ListItemIcon>
                  <ListItemText primary="管理" />
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
