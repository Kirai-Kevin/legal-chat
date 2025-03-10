import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import SendbirdApp from '@sendbird/uikit-react/App';
import '@sendbird/uikit-react/dist/index.css';

interface ChatProps {
  user: {
    userId: string;
    nickname: string;
  };
}

export default function Chat({ user }: ChatProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appId = import.meta.env.VITE_SENDBIRD_APP_ID;

  useEffect(() => {
    const initializeSendbird = async () => {
      try {
        setIsLoading(true);
        // Add any necessary initialization logic here
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to initialize Sendbird: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (appId && user.userId) {
      initializeSendbird();
    }
  }, [appId, user.userId]);

  if (!appId) {
    return (
      <Alert severity="error">
        Sendbird App ID is not configured. Please check your environment variables.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 100px)' }}>
      <SendbirdApp
        appId={appId}
        userId={user.userId}
        nickname={user.nickname}
        showSearchIcon={true}
        renderUserProfile={() => <div />}
      />
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, position: 'absolute', top: 0, right: 0 }}>
          {error}
        </Alert>
      )}
    </div>
  );
}
