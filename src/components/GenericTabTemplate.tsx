
import React from 'react';
import StandardPageView from './StandardPageView';

interface GenericTabTemplateProps {
  title: string;
  subtitle: string;
  actionButtons?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
}

const GenericTabTemplate: React.FC<GenericTabTemplateProps> = ({
  title,
  subtitle,
  actionButtons,
  children,
  isLoading,
}) => {
  return (
    <StandardPageView
      title={title}
      subtitle={subtitle}
      actions={actionButtons}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className={`h-full ${isLoading ? 'opacity-50' : ''}`}>
        {children}
      </div>
    </StandardPageView>
  );
};

export default GenericTabTemplate;
