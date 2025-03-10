import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import SendbirdApp from '@sendbird/uikit-react/App';
import { useEmail } from '../contexts/EmailContext';
import '@sendbird/uikit-react/dist/index.css';
import type { SendbirdChatParams } from '@sendbird/chat/lib/SendbirdChat';
import type { ModuleNamespaces } from '@sendbird/chat';

interface ChatProps {
  user: {
    userId: string;
    nickname: string;
  };
}

interface ChannelMember {
  userId: string;
  nickname: string;
  metaData?: {
    email?: string;
  };
}

interface MessageType {
  messageType: string;
  sender: any;
  receiver: any;
  channelUrl: string;
  messageId: string;
  message: string;
  customType: string;
  data: any;
  files?: Array<{
    url: string;
    name: string;
  }>;
  channel?: {
    url: string;
    members: ChannelMember[];
    customType: string;
    data: any;
    getChannel?: () => Promise<any>;
  };
}

export default function Chat({ user }: ChatProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appId = import.meta.env.VITE_SENDBIRD_APP_ID;
  const emailService = useEmail();

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

  const handleMessageSend = async (message: MessageType) => {
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

      if (message.messageType === 'email' && message.channel) {
        // Extract recipient info from channel or message
        const channel = message.channel;
        console.log('Channel info:', {
          url: channel.url,
          members: channel.members?.map((m: ChannelMember) => ({ 
            userId: m.userId,
            nickname: m.nickname,
            email: m.metaData?.email
          })),
          customType: channel.customType,
          data: channel.data
        });

        // Find recipient (member who is not the sender)
        const recipient = channel.members?.find((m: ChannelMember) => m.userId !== user.userId);
        console.log('Identified recipient:', recipient);

        if (!recipient?.metaData?.email && !recipient?.userId) {
          throw new Error('Recipient email or user ID not found');
        }

        await emailService.sendEmail({
          from: user.userId,
          to: recipient.metaData?.email || recipient.userId,
          replyBody: message.message,
          threadId: message.messageId,
          attachments: message.files?.map((file) => ({
            url: file.url,
            filename: file.name
          }))
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error in handleMessageSend:', err);
      setError(`Failed to send email: ${errorMessage}`);
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

  const sendbirdConfig: SendbirdChatParams<ModuleNamespaces> = {
    appId: appId,
    userId: user.userId,
    nickname: user.nickname,
    logLevel: 'debug',
    reconnection: true
  };

  return (
    <div style={{ height: 'calc(100vh - 100px)' }}>
      <SendbirdApp
        {...sendbirdConfig}
        showSearchIcon={true}
        renderUserProfile={() => <div />}
        onMessageSend={handleMessageSend}
      />
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, position: 'absolute', top: 0, right: 0 }}>
          {error}
        </Alert>
      )}
    </div>
  );
}
