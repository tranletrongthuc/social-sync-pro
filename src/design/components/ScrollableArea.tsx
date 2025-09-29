import React from 'react';
import type { ReactNode } from 'react';

interface ScrollableAreaProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
  horizontal?: boolean;
  hideScrollbar?: boolean;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

const ScrollableArea: React.FC<ScrollableAreaProps> = ({
  children,
  className = '',
  maxHeight,
  horizontal = false,
  hideScrollbar = false,
  onScroll,
}) => {
  // Base classes that are always applied
  const baseClasses = 'overflow-auto';

  // Scrollbar classes
  const scrollbarClasses = hideScrollbar 
    ? 'scrollbar-hide' 
    : 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400';

  // Horizontal scroll classes
  const horizontalClasses = horizontal ? 'overflow-x-auto overflow-y-hidden' : '';

  // Max height style
  const style = maxHeight ? { maxHeight } : {};

  // Combine all classes
  const combinedClasses = [
    baseClasses,
    scrollbarClasses,
    horizontalClasses,
    className,
  ].join(' ');

  return (
    <div 
      className={combinedClasses}
      style={style}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
};

export default ScrollableArea;