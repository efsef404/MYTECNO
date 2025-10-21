import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isLoggedIn: boolean;
  handleLogout: () => void;
  userRole: string | null;
}

function Header({ isLoggedIn, handleLogout, userRole }: HeaderProps) {
  return (
    <AppBar position="static">
      <Toolbar>
        <HomeWorkIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          在宅勤務申請システム
        </Typography>
        {isLoggedIn && (
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button color="inherit" component={Link} to="/apply">
              申請
            </Button>
            {(userRole === '承認者' || userRole === '管理者') && (
              <Button color="inherit" component={Link} to="/approve">
                承認
              </Button>
            )}
            {userRole === '管理者' && (
              <Button color="inherit" component={Link} to="/manage">
                管理
              </Button>
            )}
            <Button color="inherit" onClick={handleLogout} component={Link} to="/">
              ログアウト
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
