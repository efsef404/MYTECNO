import React, { useState, useEffect } from 'react';
import { Container, CssBaseline, Box } from '@mui/material';
import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Page Components
import LoginPage from './pages/LoginPage';
import ApplicationPage from './pages/ApplicationPage';
// import ApprovalPage from './pages/ApprovalPage'; // ApprovalPageは削除されたためインポートも削除
import ManagementPage from './pages/ManagementPage';

interface DecodedToken {
  id: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // アプリケーションの初回読み込み時にトークンをチェック
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        // トークンの有効期限をチェック
        if (decodedToken.exp * 1000 > Date.now()) {
          setIsLoggedIn(true);
          setUserRole(decodedToken.role);
        } else {
          // 有効期限切れのトークンは削除
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: DecodedToken = jwtDecode(token);
      setIsLoggedIn(true);
      setUserRole(decodedToken.role);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <Router>
      <CssBaseline />
      <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} userRole={userRole} />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Routes>
            <Route path="/" element={!isLoggedIn ? <LoginPage handleLogin={handleLogin} /> : <Navigate to="/apply" />} />
            <Route
              path="/apply"
              element={isLoggedIn ? <ApplicationPage /> : <Navigate to="/" />}
            />
            <Route
              path="/manage"
              element={isLoggedIn && userRole === 'admin' ? <ManagementPage /> : <Navigate to="/apply" />}
            />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
}

export default App;
