import './i18n';
import React, { useMemo, useState } from 'react';
import { StrictMode } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ColorModeContext } from './components/NavBar';

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
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Main />
  </StrictMode>
);
