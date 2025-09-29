import React from 'react';
import type { ReactNode } from 'react';

// Define button variants
export type ButtonVariant = 
  | 'primary'     // Primary action buttons (filled brand green)
  | 'secondary'   // Secondary action buttons (outlined brand green)
  | 'tertiary'   // Tertiary action buttons (text only)
  | 'danger'     // Danger/action buttons (filled red)
  | 'warning'    // Warning buttons (filled amber)
  | 'ghost'      // Minimal buttons (text with hover effect)
  | 'link';      // Link-style buttons (text with underline on hover)

// Define button sizes
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
}) => {
  // Base classes that are always applied
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  // Variant-specific classes
  const variantClasses = {
    primary: 'bg-brand-green text-white border border-brand-green hover:bg-brand-green-dark focus:ring-brand-green',
    secondary: 'bg-white text-brand-green border border-brand-green hover:bg-green-50 focus:ring-brand-green',
    tertiary: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-500 text-white border border-amber-500 hover:bg-amber-600 focus:ring-amber-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    link: 'bg-transparent text-brand-green underline hover:text-brand-green-dark focus:ring-brand-green',
  };

  // Size-specific classes
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  };

  // Width classes
  const widthClasses = fullWidth ? 'w-full justify-center' : '';

  // Combine all classes
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className,
  ].join(' ');

  // Handle loading state
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      <span className={loading ? 'invisible' : ''}>{children}</span>
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
};

export default Button;