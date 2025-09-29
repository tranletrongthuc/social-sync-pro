import React from 'react';
import type { ReactNode } from 'react';

interface FormProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  id?: string;
}

const Form: React.FC<FormProps> = ({
  children,
  onSubmit,
  className = '',
  id,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={className}
      id={id}
    >
      {children}
    </form>
  );
};

interface FormFieldProps {
  children: ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  children,
  label,
  required = false,
  error,
  helperText,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

interface FormGroupProps {
  children: ReactNode;
  className?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
};

export default Object.assign(Form, {
  Field: FormField,
  Group: FormGroup,
});