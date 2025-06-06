import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { ThriftProvider } from '../contexts/ThriftContext';
import { NotificationProvider } from '../hooks/useNotification.tsx';
import { ToastProvider } from '../components/ui/Toast';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThriftProvider>
        <ToastProvider>
          <NotificationProvider>
            <Component {...pageProps} />
          </NotificationProvider>
        </ToastProvider>
      </ThriftProvider>
    </AuthProvider>
  );
}
