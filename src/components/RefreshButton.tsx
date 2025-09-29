import React from 'react';
import { Button } from '../design/components';
import { RefreshIcon } from './icons';

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  language: string;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick, isLoading, language }) => {
  const T = {
    'Việt Nam': { refresh: "Làm mới" },
    'English': { refresh: "Refresh" }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={onClick}
      aria-label={texts.refresh}
      disabled={isLoading}
      className="flex items-center justify-center"
    >
      <RefreshIcon className={`h-4 w-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
    </Button>
  );
};

export default RefreshButton;
