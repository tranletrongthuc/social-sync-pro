import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { MenuIcon } from './icons';

interface StandardPageViewProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  mobileActions?: React.ReactNode;
  onMobileMenuToggle?: () => void;
  children: React.ReactNode;
}

const StandardPageView: React.FC<StandardPageViewProps> = ({ 
  title, 
  subtitle, 
  icon, 
  actions, 
  mobileActions,
  onMobileMenuToggle,
  children 
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  
  return (
    <div className="flex flex-col h-full">
      {/* Standardized header with cleaner design */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            {isMobile && onMobileMenuToggle && (
              <button 
                onClick={onMobileMenuToggle}
                className="mr-3 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-xs text-gray-500 truncate">{subtitle}</p>
            </div>
          </div>
          {(actions || mobileActions) && (
            <div className="flex-shrink-0 ml-4">
              {isMobile ? mobileActions || actions : actions}
            </div>
          )}
        </div>
      </div>
      
      {/* Content area with consistent padding */}
      <div className="flex-grow overflow-auto p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default StandardPageView;