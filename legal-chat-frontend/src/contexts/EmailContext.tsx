import { createContext, useContext, useEffect, ReactNode } from 'react';
import { EmailService } from '../services/EmailService';

const EmailContext = createContext<EmailService | null>(null);

interface EmailProviderProps {
  children: ReactNode;
}

export function EmailProvider({ children }: EmailProviderProps) {
  const emailService = new EmailService(import.meta.env.VITE_BACKEND_URL);

  useEffect(() => {
    return () => {
      emailService.disconnect();
    };
  }, []);

  return (
    <EmailContext.Provider value={emailService}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}
