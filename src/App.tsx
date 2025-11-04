import React, { useState, useEffect } from 'react';
import { Container, CssBaseline, Box } from '@mui/material';
import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Page Components
import LoginPage from './pages/LoginPage';
import ApplicationPage from './pages/ApplicationPage';
import ApprovalPage from './pages/ApprovalPage';
import ManagementPage from './pages/ManagementPage';
import HomePage from './pages/HomePage';

interface DecodedToken {
  id: number;
  username: string;
  role: string;
  departmentName: string; // Add departmentName
  iat: number;
  exp: number;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);

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
          setUsername(decodedToken.username);
          setDepartmentName(decodedToken.departmentName);
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
      setUsername(decodedToken.username);
      setDepartmentName(decodedToken.departmentName);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole(null);
    setUsername(null);
    setDepartmentName(null);
  };

  return (
    <Router>
      <CssBaseline />
      <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} userRole={userRole} username={username} departmentName={departmentName} />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }} className="glass-container">
          <Routes>
            <Route path="/" element={!isLoggedIn ? <LoginPage handleLogin={handleLogin} /> : <Navigate to="/home" />} />
            <Route
              path="/home"
              element={isLoggedIn ? <HomePage /> : <Navigate to="/" />}
            />
            <Route
              path="/apply"
              element={isLoggedIn ? <ApplicationPage /> : <Navigate to="/" />}
            />
            <Route
              path="/approve"
              element={isLoggedIn && (userRole === '承認者' || userRole === '管理者') ? <ApprovalPage /> : <Navigate to="/apply" />}
            />
            <Route
              path="/manage"
              element={isLoggedIn && userRole === '管理者' ? <ManagementPage /> : <Navigate to="/apply" />}
            />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
}

export default App;
