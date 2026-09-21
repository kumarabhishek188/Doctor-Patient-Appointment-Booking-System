import './i18n';
import React, { Component, useMemo, useState } from 'react';
import { StrictMode } from 'react';
import { createTheme, ThemeProvider, CssBaseline, Box, Button, Typography } from '@mui/material';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import { ColorModeContext } from './components/Navbar';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/';

class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleRecovery = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'background.default' }}>
        <Box sx={{ maxWidth: 520, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>We could not load this page</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Your session may have expired. Return to login and try again.</Typography>
          <Button variant="contained" onClick={this.handleRecovery}>Return to login</Button>
        </Box>
      </Box>
    );
  }
}

const Main = () => {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => setMode((prev) => {
        const nextMode = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('themeMode', nextMode);
        return nextMode;
      }),
    }),
    [mode]
  );
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'dark'
            ? {
                background: { default: '#181a1b', paper: '#23272a' },
                text: { primary: '#fff' },
              }
            : {}),
        },
      }),
    [mode]
  );
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Main />
  </StrictMode>
);
