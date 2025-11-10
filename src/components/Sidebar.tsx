import React from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
  Toolbar, Typography, Box, IconButton
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import { Link } from 'react-router-dom';

const drawerWidth = 240;
const miniDrawerWidth = 60;

interface SidebarProps {
  isLoggedIn: boolean;
  handleLogout: () => void;
  userRole: string | null;
  username: string | null;
  departmentName: string | null;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

function Sidebar({
  isLoggedIn,
  handleLogout,
  userRole,
  username,
  departmentName,
  sidebarOpen,
  toggleSidebar
}: SidebarProps) {
  return (
    <Drawer
      sx={{
        width: sidebarOpen ? drawerWidth : miniDrawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? drawerWidth : miniDrawerWidth,
          boxSizing: 'border-box',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
      variant="permanent"
      anchor="left"
      open={true}
    >
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "flex-end" : "center",
          px: 1,
          minHeight: 64,
        }}
      >
        {sidebarOpen && (
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1 }}
          >
            在宅勤務申請システム
          </Typography>
        )}
        <IconButton
          onClick={toggleSidebar}
          sx={{
            mx: sidebarOpen ? 0 : "auto",
            ...(sidebarOpen ? {} : { display: "flex", justifyContent: "center", alignItems: "center" }),
          }}
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      {isLoggedIn && sidebarOpen && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">{username}さん</Typography>
          <Typography variant="body2" color="text.secondary">
            {departmentName}
          </Typography>
        </Box>
      )}
      <Divider />
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
              {sidebarOpen && <ListItemText primary="ホーム" />}
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
              {sidebarOpen && <ListItemText primary="新規申請" />}
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
              {sidebarOpen && <ListItemText primary="申請一覧" />}
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
                {sidebarOpen && <ListItemText primary="承認" />}
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
                {sidebarOpen && <ListItemText primary="管理" />}
              </ListItem>
            )}
          </>
        )}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      {isLoggedIn && (
        <List>
          <Divider />
          <ListItem
            onClick={handleLogout}
            component={Link}
            to="/"
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
              <LogoutIcon />
            </ListItemIcon>
            {sidebarOpen && <ListItemText primary="ログアウト" />}
          </ListItem>
        </List>
      )}
    </Drawer>
  );
}

export default Sidebar;
