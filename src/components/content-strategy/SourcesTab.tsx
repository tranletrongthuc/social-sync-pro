import React from 'react';

interface SourcesTabProps {
  sourceUrls: string[];
  language: string;
}

const SourcesTab: React.FC<SourcesTabProps> = ({
  sourceUrls,
  language
}) => {
  // Translation texts
  const T = {
    'Việt Nam': {
      sources: "Nguồn",
      noSources: "Không có nguồn",
      moreSources: "+ {count} nguồn khác",
    },
    'English': {
      sources: "Sources",
      noSources: "No sources",
      moreSources: "+ {count} more sources",
    }
  };
  const texts = (T as any)[language] || T['English'];

  if (sourceUrls.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="font-medium">{texts.noSources}</p>
      </div>
    );
  }

  // Show only first 10 sources to avoid overwhelming the UI
  const displayedSources = sourceUrls.slice(0, 10);
  const remainingCount = sourceUrls.length - 10;

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.sources}</h3>
      <div className="space-y-2">
        {displayedSources.map((url, index) => (
          <a 
            key={index} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm block truncate"
          >
            {url}
          </a>
        ))}
        {remainingCount > 0 && (
          <p className="text-gray-500 text-sm">
            {texts.moreSources.replace('{count}', remainingCount.toString())}
          </p>
        )}
      </div>
    </div>
  );
};

export default SourcesTab;