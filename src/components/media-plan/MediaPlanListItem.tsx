import React, { memo } from 'react';
import { CollectionIcon } from '../icons';
import ModelLabel from '../ModelLabel';
import { ListItem } from '../../design/components/ListItem';

interface MediaPlanListItemProps {
  plan: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[], personaId?: string, modelUsed?: string};
  isSelected: boolean;
  onClick: (planId: string) => void;
  onEdit: (planId: string) => void;
  language: string;
}

const MediaPlanListItemComponent: React.FC<MediaPlanListItemProps> = ({
  plan,
  isSelected,
  onClick,
  onEdit,
  language
}) => {
  return (
    <ListItem
      onSelect={() => onClick(plan.id)}
      onEdit={() => onEdit(plan.id)}
      isSelected={isSelected}
      showToggle={false}
      className="mb-2"
    >
      <div className="flex items-start gap-2 w-full">
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-md">
          <CollectionIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 break-words hyphens-auto truncate">{plan.name}</p>
            {plan.modelUsed && <ModelLabel model={plan.modelUsed} size="small" />}
          </div>
          <p className="text-gray-500 text-xs break-words hyphens-auto line-clamp-2">
            {plan.prompt || 'No prompt specified'}
          </p>
        </div>
      </div>
    </ListItem>
  );
};

const MediaPlanListItem = memo(MediaPlanListItemComponent);
export default MediaPlanListItem;