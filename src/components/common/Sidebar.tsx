import React, { useState, useRef, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { Input } from '../ui';
import { SearchIcon } from '../icons';

interface SidebarProps {
  title: string;
  itemCount: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
  language: string;
  searchInput?: React.ReactNode; // Custom search input (overrides built-in search)
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  title, 
  itemCount, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  children, 
  searchInput, 
  onSearchChange,
  searchPlaceholder,
  language,
  className = '' 
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  // State for search query
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Ref for debounce timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search change handler
  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce the search call by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(query);
      }
    }, 300);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const T = {
    'Việt Nam': {
      close: "Đóng",
      searchPlaceholder: "Tìm kiếm...",
    },
    'English': {
      close: "Close",
      searchPlaceholder: "Search...",
    }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <div className="flex min-h-screen">
    <aside 
      className={`
        bg-white
        md:border-r border-gray-200
        fixed md:static inset-y-0 left-0 z-40
        h-screen max-h-screen
        transform md:transform-none
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        overflow-y-auto
        ${className}
      `}
    >
      <div className="flex-grow overflow-y-auto p-4 md:p-6">
        {/* Close button for mobile */}
        <div className="md:hidden flex justify-end mb-3">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label={texts.close}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-semibold text-gray-700">{title}</h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {itemCount}
            </span>
          </div>
          
          {/* Built-in search input if no custom search input is provided */}
          {!searchInput && onSearchChange && (
            <div className="relative mt-3">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder || texts.searchPlaceholder}
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          )}
          
          {/* Custom search input if provided */}
          {searchInput && (
            <div className="mt-3">
              {searchInput}
            </div>
          )}
          
          {/* Main content */}
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {children}
          </div>
        </div>
      </div>
    </aside>
    </div>
  );
};

export default Sidebar;