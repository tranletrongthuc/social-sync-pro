import React, { memo } from 'react';
import type { Trend } from '../../../types';
import { TagIcon } from '../icons';
import ModelLabel from '../ModelLabel';
import { ListItem } from '../../design/components/ListItem';

interface TrendListItemProps {
  trend: Trend;
  isSelected: boolean;
  isProductTrend: boolean;
  language: string;
  onClick: (trend: Trend) => void;
  onEdit: (trend: Trend) => void;
  onToggleArchive: (trendId: string) => void;
}

const TrendListItemComponent: React.FC<TrendListItemProps> = ({
  trend,
  isSelected,
  isProductTrend,
  language,
  onClick,
  onEdit,
  onToggleArchive
}) => {
  const T = {
    'Việt Nam': { archived: "Đã lưu trữ" },
    'English': { archived: "Archived" }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <ListItem
      onSelect={() => onClick(trend)}
      onEdit={() => onEdit(trend)}
      onToggle={() => onToggleArchive(trend.id)}
      isSelected={isSelected}
      isToggled={trend.isArchived}
      showToggle={true}
      toggleTooltip={trend.isArchived ? "Unarchive Trend" : "Archive Trend"}
      className="mb-2"
    >
      <div className="flex items-start gap-2 w-full">
        {isProductTrend && (
          <TagIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 break-words hyphens-auto">{trend.topic}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded ${ trend.industry === 'Global' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800' }`}>
              {trend.industry === 'Global' ? 'Global' : 'Industry'}
            </span>
            {trend.modelUsed && <ModelLabel model={trend.modelUsed} size="small" />}
            {trend.isArchived && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-600">{texts.archived}</span>}
            {trend.ideaCount && trend.ideaCount > 0 && (
              <span className="ml-auto text-xs bg-red-100 text-red-800 font-medium w-5 h-5 flex items-center justify-center rounded-full">
                {trend.ideaCount}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs break-words hyphens-auto">
            {trend.keywords ? trend.keywords.join(', ') : ''}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {trend.searchVolume && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                Vol: {trend.searchVolume}
              </span>
            )}
            {trend.competitionLevel && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${ trend.competitionLevel === 'Low' ? 'bg-green-100 text-green-800' : trend.competitionLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800' }`}>
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
    </ListItem>
  );
};

const TrendListItem = memo(TrendListItemComponent);
export default TrendListItem;