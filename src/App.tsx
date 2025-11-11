import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

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

  const drawerWidth = 220;
  const drawerWidthClosed = 60;

  return (
    <Router>
      <Box>
        {isLoggedIn && (
          <Header
            username={username}
            departmentName={departmentName}
            handleLogout={handleLogout}
          />
        )}
        <Box sx={{ display: 'flex' }}>
          {isLoggedIn && (
            <Sidebar
              isLoggedIn={isLoggedIn}
              userRole={userRole}
              open={sidebarOpen}
              onToggle={handleSidebarToggle}
            />
          )}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              mt: isLoggedIn ? '100px' : 0,
              ml: isLoggedIn ? '25px' : 0,
              minHeight: '100vh',
              p: 2,
            }}
          >
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
        </Box>
      </Box>
    </Router>
  );
}

export default App;
