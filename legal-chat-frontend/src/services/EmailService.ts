import { io, Socket } from 'socket.io-client';
import emailjs from '@emailjs/browser';

export class EmailService {
  private socket: Socket;
  private isConnecting: boolean = false;

  constructor() {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    
    // Initialize EmailJS with public key only
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
    console.log('EmailJS initialized with public key');
    
    // Configure Socket.IO with proper namespace and options
    this.socket = io(`${backendUrl}/email`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      autoConnect: false
    });

    this.connect();
    this.setupSocketListeners();
  }

  private async connect() {
    if (this.isConnecting) return;
    
    try {
      this.isConnecting = true;
      await this.socket.connect();
      console.log('Connected to email service');
    } catch (error) {
      console.error('Failed to connect to email service:', error);
    } finally {
      this.isConnecting = false;
    }
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to email service');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setTimeout(() => this.connect(), 2000);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from email service:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setTimeout(() => this.connect(), 1000);
      }
    });

    this.socket.on('send-email', async (emailData) => {
      console.log('Received email request:', {
        id: emailData.id,
        serviceId: emailData.serviceId,
        templateId: emailData.templateId,
        templateParamsKeys: Object.keys(emailData.templateParams),
        templateParamsExample: JSON.stringify(emailData.templateParams).substring(0, 200)
      });

      try {
        // Use the service ID and template ID from the backend request
        // If not provided, fall back to environment variables
        const response = await emailjs.send(
          emailData.serviceId || import.meta.env.VITE_EMAILJS_SERVICE_ID,
          emailData.templateId || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          emailData.templateParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );

        console.log('Email sent successfully:', {
          id: emailData.id,
          status: response.status,
          text: response.text
        });

        this.socket.emit('email-sent', {
          emailId: emailData.id,
          success: true,
          response: {
            status: response.status,
            text: response.text
          }
        });
      } catch (error: any) {
        console.error('Failed to send email:', {
          id: emailData.id,
          error: error.text || error.message || 'Unknown error',
          status: error.status
        });

        this.socket.emit('email-error', {
          emailId: emailData.id,
          error: {
            message: error.text || error.message || 'Unknown error',
            status: error.status,
            details: error
          }
        });
      }
    });

    this.socket.on('emailProcessed', (result) => {
      console.log('Email processed:', result);
    });
  }

  async sendEmail(params: {
    from: string;
    to: string;
    replyBody: string;
    threadId: string;
    attachments?: Array<{ url: string; filename: string }>;
  }) {
    if (!this.socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      await this.connect();
    }

    try {
      const templateParams = {
        from_name: params.from,
        to_email: params.to,
        message: params.replyBody,
        channel_url: `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/chat/${params.threadId}`,
        attachments: params.attachments || [],
      };

      console.log('Sending direct email with params:', {
        templateParamsKeys: Object.keys(templateParams),
        templateParamsExample: JSON.stringify(templateParams).substring(0, 200)
      });

      const response = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      console.log('Direct email sent successfully:', {
        status: response.status,
        text: response.text
      });

      this.socket.emit('emailSent', {
        ...params,
        success: true,
        response: {
          status: response.status,
          text: response.text
        }
      });
      
      return response;
    } catch (error: any) {
      console.error('Failed to send direct email:', {
        error: error.text || error.message || 'Unknown error',
        status: error.status
      });
      throw error;
    }
  }

  disconnect() {
    if (this.socket?.connected) {
      console.log('Disconnecting from email service');
      this.socket.disconnect();
    }
  }
}
