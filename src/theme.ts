
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light', // 全体をライトモードに変更
    primary: {
      main: '#1976d2', // ライトモードに適したプライマリカラー
    },
    background: {
      default: 'transparent', // 背景は透明のまま
      paper: 'rgba(255, 255, 255, 0.8)', // 明るい半透明の背景
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)', // ライトモードの主要テキスト色
      secondary: 'rgba(0, 0, 0, 0.6)', // ライトモードの補助テキスト色
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '3.2em',
      lineHeight: 1.1,
      color: 'rgba(0, 0, 0, 0.87)', // ライトモードのh1テキスト色
      textShadow: 'none', // テキストシャドウを削除または薄くする
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-image: url('https://source.unsplash.com/random/1920x1080/?abstract,nature');
          background-size: cover;
          background-attachment: fixed;
          background-position: center;
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: '1px solid rgba(0, 0, 0, 0.1)', // ライトモードのボタンボーダー
          backgroundColor: 'rgba(0, 0, 0, 0.05)', // ライトモードのボタン背景
          color: 'rgba(0, 0, 0, 0.87)', // ライトモードのボタンテキスト色
          transition: 'all 0.25s',
          '&:hover': {
            borderColor: '#1976d2', // ホバー時のボーダー色
            backgroundColor: 'rgba(0, 0, 0, 0.1)', // ホバー時の背景色
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)', // ライトモードの入力フィールド背景
            borderRadius: '4px',
            color: 'rgba(0, 0, 0, 0.87)', // ライトモードの入力テキスト色
            '& .MuiOutlinedInput-notchedOutline': {
              border: '1px solid rgba(0, 0, 0, 0.1)', // ライトモードのボーダー
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2', // ホバー時のボーダー色
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2', // フォーカス時のボーダー色
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(0, 0, 0, 0.7)', // ライトモードのラベル色
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#1976d2', // フォーカス時のラベル色
          },
        },
      },
    },
  },
});

export default theme;
