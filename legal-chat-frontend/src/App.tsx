import { useState } from 'react';
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { SendBirdProvider } from '@sendbird/uikit-react';
import '@sendbird/uikit-react/dist/index.css';
import Login from './components/Login';
import Chat from './components/Chat';
import { EmailProvider } from './contexts/EmailContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [user, setUser] = useState<{ userId: string; nickname: string } | null>(null);
  const SENDBIRD_APP_ID = import.meta.env.VITE_SENDBIRD_APP_ID || '';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="lg">
        <Box sx={{ minHeight: '100vh', py: 4 }}>
          {!user ? (
            <Login onLogin={setUser} />
          ) : (
            <EmailProvider>
              <SendBirdProvider appId={SENDBIRD_APP_ID} userId={user.userId} nickname={user.nickname}>
                <Chat user={user} />
              </SendBirdProvider>
            </EmailProvider>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
