import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, InputAdornment, IconButton, Alert } from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
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
  const [showPassword, setShowPassword] = useState(false);

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
            console.log('Redirecting to /home');
            handleLogin(); // App.tsxのログイン状態を更新
            navigate('/home'); // メインページへ遷移
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
      navigate('/home');

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false); // エラー時はローディング解除
    }
  };

  if (isLoading && welcomeMessage) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Typography variant="h4" component="h1" >
          {welcomeMessage}
        </Typography>
        <CircularProgress sx={{ mt: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" align="center" gutterBottom>
            ログイン
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            在宅勤務申請システム
          </Typography>
        </Box>
        <form onSubmit={onLogin}>
          <TextField
            label="ユーザー名"
            variant="outlined"
            fullWidth
            margin="normal"
            value={usernameInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsernameInput(e.target.value)}
            required
            autoComplete="username"
          />
          <TextField
            label="パスワード"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default LoginPage;
