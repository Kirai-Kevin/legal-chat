import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import SendbirdApp from '@sendbird/uikit-react/App';
import { useEmail } from '../contexts/EmailContext';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const appId = import.meta.env.VITE_SENDBIRD_APP_ID;
  const emailService = useEmail();

  useEffect(() => {
    const initializeSendbird = async () => {
      try {
        setIsLoading(true);
        // Add any necessary initialization logic here
        setIsInitialized(true);
      } catch (err: any) {
        setError(`Failed to initialize Sendbird: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (appId && user.userId) {
      initializeSendbird();
    }
  }, [appId, user.userId]);

  const handleMessageSend = async (message: any) => {
    try {
      console.log('Message received in handleMessageSend:', {
        messageType: message.messageType,
        sender: message.sender,
        receiver: message.receiver,
        channelUrl: message.channelUrl,
        messageId: message.messageId,
        message: message.message,
        customType: message.customType,
        data: message.data
      });

      if (message.messageType === 'email') {
        // Extract recipient info from channel or message
        const channel = message.channel || await message.getChannel();
        console.log('Channel info:', {
          url: channel.url,
          members: channel.members?.map(m => ({ 
            userId: m.userId,
            nickname: m.nickname,
            email: m.metaData?.email
          })),
          customType: channel.customType,
          data: channel.data
        });

        // Find recipient (member who is not the sender)
        const recipient = channel.members?.find(m => m.userId !== user.userId);
        console.log('Identified recipient:', recipient);

        await emailService.sendEmail({
          from: user.userId,
          to: recipient?.metaData?.email || recipient?.userId,
          replyBody: message.message,
          threadId: message.messageId,
          attachments: message.files?.map((file: any) => ({
            url: file.url,
            filename: file.name
          }))
        });
      }
    } catch (error: any) {
      console.error('Error in handleMessageSend:', error);
      setError(`Failed to send email: ${error.message}`);
    }
  };

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
        theme="light"
        showSearchIcon={true}
        renderUserProfile={() => null}
        onError={(error) => {
          console.error('Sendbird error:', error);
          setError(error.message);
        }}
        onMessageSend={handleMessageSend}
        config={{
          logLevel: 'debug',
          isOnline: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        }}
      />
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, position: 'absolute', top: 0, right: 0 }}>
          {error}
        </Alert>
      )}
    </div>
  );
}
