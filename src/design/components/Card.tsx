import React from 'react';
import type { ReactNode } from 'react';

// Define card variants
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'compact';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  header,
  footer,
  onClick,
  hoverable = false,
}) => {
  // Base classes that are always applied
  const baseClasses = 'rounded-lg border transition-all duration-200';

  // Variant-specific classes
  const variantClasses = {
    default: 'bg-white border-gray-200',
    elevated: 'bg-white border-gray-200 shadow-md',
    outlined: 'bg-transparent border-gray-300',
    compact: 'bg-white border-gray-200 p-3',
  };

  // Hover classes
  const hoverClasses = hoverable ? 'hover:shadow-md cursor-pointer' : '';

  // Combine all classes
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    hoverClasses,
    className,
  ].join(' ');

  return (
    <div className={combinedClasses} onClick={onClick}>
      {header && (
        <div className="border-b border-gray-200 px-4 py-3">
          {header}
        </div>
      )}
      <div className={variant === 'compact' ? '' : 'p-4'}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-gray-200 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;