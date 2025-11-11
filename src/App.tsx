import { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);

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

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        {isLoggedIn && (
          <>
            <Header
              username={username}
              departmentName={departmentName}
              handleLogout={handleLogout}
            />
            <Sidebar
              isLoggedIn={isLoggedIn}
              userRole={userRole}
            />
          </>
        )}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isLoggedIn ? `${drawerWidth}px` : 0,
            mt: isLoggedIn ? 8 : 0, // Add top margin for fixed header
            transition: (theme) => theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start', // Changed from center to flex-start
            minHeight: '100vh',
          }}
        >
          <Container maxWidth="lg" sx={{ mt: 4, p: 3, width: '100%' }}>
            <Box sx={{
              background: 'rgba(255, 255, 255, 0.8)', // Lighter transparent background for light mode
              borderRadius: '16px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.8)', // Lighter border
              padding: '20px',
              margin: '20px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflowY: 'auto',
            }}>
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
