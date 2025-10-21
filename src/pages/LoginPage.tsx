import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface LoginPageProps {
  handleLogin: () => void;
}

interface DecodedToken {
  id: number;
  username: string;
  role: string;
  departmentName: string;
  iat: number;
  exp: number;
}

function LoginPage({ handleLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true); // 初期ロード状態
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('LoginPage useEffect triggered');
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        console.log('Decoded Token:', decodedToken);
        if (decodedToken.exp * 1000 > Date.now()) {
          console.log('Token is valid');
          setWelcomeMessage(`ようこそ、${decodedToken.username}さん`);
          setIsLoading(true); // ウェルカムメッセージ表示中はローディング状態
          setTimeout(() => {
            console.log('Redirecting to /apply');
            handleLogin(); // App.tsxのログイン状態を更新
            navigate('/apply'); // メインページへ遷移
          }, 1500); // 1.5秒後に遷移
        } else {
          console.log('Token expired');
          localStorage.removeItem('token');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Invalid token on login page:', err);
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    } else {
      console.log('No token found');
      setIsLoading(false);
    }
  }, [navigate, handleLogin]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // ログイン処理中はローディング状態

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameInput, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'ログインに失敗しました。');
      }

      localStorage.setItem('token', data.token);
      handleLogin();
      navigate('/apply');

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false); // エラー時はローディング解除
    }
  };

  if (isLoading && welcomeMessage) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {welcomeMessage}
        </Typography>
        <CircularProgress sx={{ mt: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          ログイン
        </Typography>
        <form onSubmit={onLogin}>
          <TextField
            label="ユーザー名"
            variant="outlined"
            fullWidth
            margin="normal"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <TextField
            label="パスワード"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            disabled={isLoading} // ローディング中はボタンを無効化
          >
            ログイン
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default LoginPage;
