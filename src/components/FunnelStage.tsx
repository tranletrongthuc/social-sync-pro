import React from 'react';
import type { MediaPlanGroup } from '../../types';

interface FunnelStageProps {
  stage: {
    name: string;
    description: string;
    goal: string;
    contentTypes: string[];
  };
  language: string;
  isSelected: boolean;
  onClick: () => void;
}

const FunnelStage: React.FC<FunnelStageProps> = ({ stage, language, isSelected, onClick }) => {
  const T = {
    'Việt Nam': {
      goal: "Mục tiêu:",
      contentTypes: "Loại nội dung:",
    },
    'English': {
      goal: "Goal:",
      contentTypes: "Content Types:",
    }
  };

  const texts = (T as any)[language] || T['English'];

  return (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected 
          ? 'bg-green-50 border-brand-green shadow-sm' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <h3 className="font-bold text-lg text-gray-900">{stage.name}</h3>
      <p className="text-gray-600 text-sm mt-1">{stage.description}</p>
      
      <div className="mt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase">{texts.goal}</p>
        <p className="text-sm text-gray-800">{stage.goal}</p>
      </div>
      
      <div className="mt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase">{texts.contentTypes}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {stage.contentTypes.map((type, index) => (
            <span 
              key={index} 
              className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FunnelStage;