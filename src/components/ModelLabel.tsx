import React from 'react';

interface ModelLabelProps {
  model: string;
  size?: 'small' | 'medium';
  className?: string;
}

const ModelLabel: React.FC<ModelLabelProps> = ({ model, size = 'medium', className = '' }) => {
  if (!model) return null;
  
  // Extract model name without suffixes like :free and truncate if too long
  let displayModel = model.replace(/[:\-_]/g, ' ').toUpperCase().trim();
  
  // Truncate long model names to prevent UI overflow
  if (displayModel.length > 20) {
    displayModel = displayModel.substring(0, 17) + '...';
  }
  
  const sizeClasses = size === 'small' 
    ? 'text-xs px-2 py-1 rounded text-center truncate max-w-[120px]' 
    : 'text-sm px-3 py-1.5 rounded-md text-center truncate max-w-[150px]';
  
  return (
    <span 
      className={`inline-block ${sizeClasses} bg-blue-100 text-blue-800 font-medium ${className}`}
      title={model} // Show full model name on hover
    >
      {displayModel}
    </span>
  );
};

export default ModelLabel;