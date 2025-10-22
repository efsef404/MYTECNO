import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Avatar, Tooltip } from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isLoggedIn: boolean;
  handleLogout: () => void;
  userRole: string | null;
  username: string | null;
  departmentName: string | null;
}

function Header({ isLoggedIn, handleLogout, userRole, username, departmentName }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  return (
    <AppBar 
      position="static" 
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Transparent background
        backdropFilter: 'blur(10px)', // Frosted glass effect
        WebkitBackdropFilter: 'blur(10px)', // Safari support
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)', // Subtle border
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', // Subtle shadow
        color: 'white', // Adjust text color for better contrast
      }}
    >
      <Toolbar>
        <HomeWorkIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography 
          variant="h6" 
          component={Link} 
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none',
            color: 'text.primary',
            fontWeight: 600,
            '&:hover': {
              color: 'primary.main',
            }
          }}
        >
          在宅勤務申請システム
        </Typography>

        {isLoggedIn && (
          <>
            {/* デスクトップメニュー */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              <Button 
                component={Link} 
                to="/apply"
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                申請
              </Button>
              
              {(userRole === '承認者' || userRole === '管理者') && (
                <Button 
                  component={Link} 
                  to="/approve"
                  sx={{
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  承認
                </Button>
              )}
              
              {userRole === '管理者' && (
                <Button 
                  component={Link} 
                  to="/manage"
                  sx={{
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  管理
                </Button>
              )}

              <Tooltip title="アカウント設定">
                <IconButton onClick={handleMenuOpen} size="small">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {username ? username[0] : 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem sx={{ minWidth: 200 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2">{username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {departmentName}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleLogout} component={Link} to="/">
                  ログアウト
                </MenuItem>
              </Menu>
            </Box>

            {/* モバイルメニュー */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                color="inherit"
                onClick={handleMobileMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              
              <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                onClick={handleMobileMenuClose}
              >
                <MenuItem>
                  <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
                    <Typography variant="subtitle2">{username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {departmentName}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem component={Link} to="/apply">申請</MenuItem>
                {(userRole === '承認者' || userRole === '管理者') && (
                  <MenuItem component={Link} to="/approve">承認</MenuItem>
                )}
                {userRole === '管理者' && (
                  <MenuItem component={Link} to="/manage">管理</MenuItem>
                )}
                <MenuItem onClick={handleLogout} component={Link} to="/">
                  ログアウト
                </MenuItem>
              </Menu>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
