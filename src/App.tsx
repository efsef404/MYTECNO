import React, { useState } from 'react';
import { Container, CssBaseline, Box } from '@mui/material';
import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Page Components (will be created next)
import LoginPage from './pages/LoginPage';
import ApplicationPage from './pages/ApplicationPage';
import ApprovalPage from './pages/ApprovalPage';
import ManagementPage from './pages/ManagementPage';

// 申請データの型定義
export interface ApplicationData {
  id: number;
  date: string;
  reason: string;
  status: '承認' | '否認' | '申請中';
}

function App() {
  // アプリケーションの状態を管理するためのダミーデータ
  const [applications, setApplications] = useState<ApplicationData[]>([
    { id: 1, date: '2025-10-10', reason: '私用のため', status: '承認' },
    { id: 2, date: '2025-10-11', reason: '体調不良', status: '申請中' },
  ]);

  // 新しい申請を追加する関数
  const addApplication = (reason: string, date: string) => {
    setApplications(prev => [
      ...prev,
      {
        id: prev.length + 1,
        date,
        reason,
        status: '申請中',
      },
    ]);
  };

  // 申請のステータスを更新する関数
  const updateApplicationStatus = (id: number, newStatus: ApplicationData['status']) => {
    setApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  return (
    <Router>
      <CssBaseline />
      <Header /> {/* Header is outside Routes to be always visible */}
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/apply"
              element={<ApplicationPage addApplication={addApplication} applications={applications} />}
            />
            <Route
              path="/approve"
              element={<ApprovalPage applications={applications} updateApplicationStatus={updateApplicationStatus} />}
            />
            <Route
              path="/manage"
              element={<ManagementPage applications={applications} />} 
            />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
}

export default App;
