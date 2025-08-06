
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, InformationCircleIcon, XIcon } from './icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircleIcon : InformationCircleIcon;

  return (
    <div className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg text-white ${bgColor} shadow-lg z-50`}>
      <Icon className="h-6 w-6 mr-3" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;
