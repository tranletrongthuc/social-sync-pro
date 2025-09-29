import React from 'react';
import type { ReactNode } from 'react';

// Define sidebar variants
export type SidebarVariant = 'default' | 'compact' | 'navigation';

interface SidebarProps {
  children: ReactNode;
  variant?: SidebarVariant;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  children,
  variant = 'default',
  className = '',
  header,
  footer,
  collapsible = false,
  collapsed = false,
  onCollapse,
}) => {
  // Base classes that are always applied
  const baseClasses = 'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300';

  // Variant-specific classes
  const variantClasses = {
    default: 'w-80',
    compact: 'w-64',
    navigation: 'w-64',
  };

  // Collapsed state classes
  const collapsedClasses = collapsed ? 'w-16' : '';

  // Combine all classes
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    collapsedClasses,
    className,
  ].join(' ');

  return (
    <aside className={combinedClasses}>
      {header && !collapsed && (
        <div className="border-b border-gray-200 p-4">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
      {footer && !collapsed && (
        <div className="border-t border-gray-200 p-4">
          {footer}
        </div>
      )}
      {collapsible && (
        <button
          onClick={() => onCollapse && onCollapse(!collapsed)}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-white border border-gray-300 shadow-md hover:bg-gray-50"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )}
    </aside>
  );
};

export default Sidebar;