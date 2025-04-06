
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type ToastProps = {
  title: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
};

type ToastState = ToastProps & {
  id: string;
};

let toasts: ToastState[] = [];
let listeners: Array<(toasts: ToastState[]) => void> = [];

export function toast(props: ToastProps) {
  const id = Math.random().toString(36).substring(2, 9);
  const toast = { id, ...props };
  
  toasts = [...toasts, toast];
  listeners.forEach(listener => listener(toasts));
  
  setTimeout(() => {
    removeToast(id);
  }, props.duration || 5000);
  
  return id;
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  listeners.forEach(listener => listener(toasts));
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<ToastState[]>(toasts);
  
  useEffect(() => {
    const listener = (updatedToasts: ToastState[]) => {
      setCurrentToasts([...updatedToasts]);
    };
    
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {currentToasts.map(toast => (
        <div 
          key={toast.id} 
          className="bg-white shadow-lg rounded-lg p-4 w-80 flex flex-col gap-1 animate-slideIn"
          style={{
            animation: 'slideIn 0.3s ease-out forwards'
          }}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900">{toast.title}</h3>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={16} />
            </button>
          </div>
          {toast.description && (
            <p className="text-sm text-gray-500">{toast.description}</p>
          )}
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
