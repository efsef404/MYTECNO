import React, { useState, useEffect } from 'react';
import { CssBaseline, Box, Container } from '@mui/material';
import Sidebar from './components/Sidebar';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Page Components
import LoginPage from './pages/LoginPage';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationList from './pages/ApplicationList';
import ApprovalPage from './pages/ApprovalPage';
import ManagementPage from './pages/ManagementPage';
import HomePage from './pages/HomePage';

interface DecodedToken {
  id: number;
  username: string;
  role: string;
  departmentName: string;
  iat: number;
  exp: number;
}

const drawerWidth = 240;
const miniDrawerWidth = 60;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          setIsLoggedIn(true);
          setUserRole(decodedToken.role);
          setUsername(decodedToken.username);
          setDepartmentName(decodedToken.departmentName);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  console.log('Current userRole:', userRole); // Added for debugging


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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {isLoggedIn && (
          <Sidebar
            isLoggedIn={isLoggedIn}
            handleLogout={handleLogout}
            userRole={userRole}
            username={username}
            departmentName={departmentName}
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        )}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isLoggedIn
              ? (sidebarOpen ? `${drawerWidth}px` : `${miniDrawerWidth}px`)
              : 0,
            transition: (theme) => theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <Container maxWidth="lg" sx={{ mt: 4, p: 3, width: '100%' }}>
            <Box className="glass-container">
              <Routes>
                <Route
                  path="/"
                  element={!isLoggedIn ? <LoginPage handleLogin={handleLogin} /> : <Navigate to="/home" />}
                />
                <Route
                  path="/home"
                  element={isLoggedIn ? <HomePage /> : <Navigate to="/" />}
                />
                <Route
                  path="/application/new"
                  element={isLoggedIn ? <ApplicationForm /> : <Navigate to="/" />}
                />
                <Route
                  path="/application/list"
                  element={isLoggedIn ? <ApplicationList /> : <Navigate to="/" />}
                />
                <Route
                  path="/approve"
                  element={isLoggedIn && (userRole === '承認者' || userRole === '管理者') ? <ApprovalPage /> : <Navigate to="/application/list" />}
                />
                <Route
                  path="/manage"
                  element={isLoggedIn && userRole === '管理者' ? <ManagementPage handleLogout={handleLogout} /> : <Navigate to="/application/list" />}
                />
              </Routes>
            </Box>
          </Container>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
