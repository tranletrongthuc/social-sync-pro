import React, { memo } from 'react';
import type { Trend } from '../../../types';
import { TagIcon } from '../icons';

interface TrendListItemProps {
  trend: Trend;
  isSelected: boolean;
  isProductTrend: boolean;
  language: string;
  onClick: () => void;
}

const TrendListItemComponent: React.FC<TrendListItemProps> = ({
  trend,
  isSelected,
  isProductTrend,
  language,
  onClick
}) => {
  // Translation texts
  const T = {
    'Việt Nam': {
      // Add any Vietnamese specific texts if needed
    },
    'English': {
      // Add any English specific texts if needed
    }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <button 
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md transition-colors text-xs sm:text-sm ${
        isSelected
          ? 'bg-green-100 border border-green-200' 
          : 'hover:bg-gray-100 border border-gray-200'
      }`}
    >
      <div className="flex items-start gap-2">
        {isProductTrend && (
          <TagIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{trend.topic}</p>
            {/* Industry vs Global indicator */}
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              trend.industry === 'Global' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {trend.industry === 'Global' ? 'Global' : 'Industry'}
            </span>
          </div>
          <p className="text-gray-500 text-xs truncate">
            {trend.keywords ? trend.keywords.join(', ') : ''}
          </p>
          {/* Enhanced trend metadata display */}
          <div className="flex flex-wrap gap-1 mt-1">
            {trend.searchVolume && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                Vol: {trend.searchVolume}
              </span>
            )}
            {trend.competitionLevel && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                trend.competitionLevel === 'Low' ? 'bg-green-100 text-green-800' :
                trend.competitionLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {trend.competitionLevel}
              </span>
            )}
            {trend.category && (
              <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                {trend.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const TrendListItem = memo(TrendListItemComponent);
export default TrendListItem;