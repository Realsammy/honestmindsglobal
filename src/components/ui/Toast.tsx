import React, { createContext, useContext } from 'react';
import { cn } from '../../utils/cn';
import { Toast as ToastType, useToast as useToastHook } from './use-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const ToastContext = createContext<ReturnType<typeof useToastHook> | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastData = useToastHook();

  return (
    <ToastContext.Provider value={toastData}>
      {children}
      <ToastContainer toasts={toastData.toasts} onDismiss={toastData.dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'flex items-start p-4 mb-4 rounded-lg border',
        styles[toast.type]
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 mr-2 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-medium">{toast.title}</h3>
        {toast.description && (
          <p className="mt-1 text-sm">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastType[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
