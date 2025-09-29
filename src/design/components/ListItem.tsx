import React from 'react';
import { PencilIcon, CheckIcon } from '../../components/icons';
import Button from './Button';
import { colors, borderRadius, spacing, transitions } from '../tokens';
import Loader from '../../components/Loader';

interface ListItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  onEdit?: () => void;
  onToggle?: (newState: boolean) => void;
  isSelected?: boolean;
  isToggled?: boolean;
  isLoading?: boolean;
  showEdit?: boolean;
  showToggle?: boolean;
  className?: string;
  toggleTooltip?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  onSelect,
  onEdit,
  onToggle,
  isSelected = false,
  isToggled = false,
  isLoading = false,
  showEdit = true,
  showToggle = true,
  className = '',
  toggleTooltip,
}) => {
  const baseClasses = `
    relative flex flex-col w-full p-3
    border-b
    transition-all duration-200 ease-in-out
  `;

  const stateClasses = `
    ${onSelect ? 'cursor-pointer' : ''}
    ${isSelected
      ? `bg-emerald-50 border-emerald-300`
      : `bg-white border-gray-200 ${onSelect ? 'hover:bg-gray-50' : ''}`
    }
  `;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle(!isToggled);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${className}`}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      aria-pressed={onSelect ? isSelected : undefined}
      tabIndex={onSelect ? 0 : -1}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <Loader title="Loading..." steps={[]} />
        </div>
      )}

      {onToggle && showToggle && (
        <div
          onClick={handleToggle}
          className={`
            flex items-center justify-center w-6 h-6 mr-4 rounded
            border-2
            transition-all duration-200
            ${isToggled
              ? 'bg-emerald-500 border-emerald-500'
              : 'bg-white border-gray-300 hover:border-emerald-400'
            }
          `}
          role="checkbox"
          aria-checked={isToggled}
          title={toggleTooltip}
        >
          {isToggled && <CheckIcon className="w-4 h-4 text-white" />}
        </div>
      )}

      <div className="flex-grow overflow-hidden">
        {children}
      </div>

      {onEdit && showEdit && (
        <div className="ml-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <PencilIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};