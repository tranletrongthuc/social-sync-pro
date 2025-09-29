import React from 'react';
import type { ReactNode } from 'react';

// Define label variants
export type LabelVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';

// Define label sizes
export type LabelSize = 'sm' | 'md' | 'lg';

interface LabelProps {
  children: ReactNode;
  variant?: LabelVariant;
  size?: LabelSize;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const Label: React.FC<LabelProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'left',
}) => {
  // Base classes that are always applied
  const baseClasses = 'inline-flex items-center rounded-full font-medium';

  // Variant-specific classes
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    brand: 'bg-brand-green bg-opacity-10 text-brand-green',
  };

  // Size-specific classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-0.5 gap-1.5',
    lg: 'text-base px-3 py-1 gap-2',
  };

  // Combine all classes
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(' ');

  return (
    <span className={combinedClasses}>
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </span>
  );
};

export default Label;