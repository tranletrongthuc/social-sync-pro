import React from 'react';
import type { Persona, GeneratedAssets } from '../../../types';
import PersonasDisplay from '../PersonasDisplay';
import StandardPageView from '../StandardPageView';
import { RefreshIcon, PlusIcon, SparklesIcon } from '../icons';

interface PersonasContentProps {
  personas: Persona[];
  onSavePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
  onAutoGeneratePersona: () => void;
  onTogglePersonaState: (personaId: string, isActive: boolean) => void;
  brandFoundation: GeneratedAssets['brandFoundation'];
  language: string;
  mongoBrandId: string | null;
  onLoadData?: (brandId: string) => Promise<void>;
  isDataLoaded?: boolean;
  isLoading?: boolean;
  generatedImages?: Record<string, string>;
  onRefresh?: () => Promise<void> | void;
}

const PersonasContent: React.FC<PersonasContentProps> = (props) => {
  const T = {
    'Việt Nam': {
      title: "KOL/KOC",
      description: "Tạo và quản lý hồ sơ người nổi tiếng/đại diện thương hiệu",
      refresh: "Làm mới",
      loading: "Đang tải...",
      newPersona: "Người đại diện mới",
      autoGenerate: "Tự động tạo"
    },
    'English': {
      title: "KOL/KOC",
      description: "Create and manage KOL/KOC profiles",
      refresh: "Refresh",
      loading: "Loading...",
      newPersona: "New Persona",
      autoGenerate: "Auto Generate"
    }
  };
  const texts = (T as any)[props.language] || T['English'];

  return (
    <StandardPageView
      title={texts.title}
      subtitle={texts.description}
      actions={
        <div className="flex flex-row gap-2">
          <button 
            onClick={props.onAutoGeneratePersona}
            className="px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed bg-white text-brand-green border border-brand-green hover:bg-green-50 flex items-center gap-2"
          >
            <SparklesIcon className="h-5 w-5" />
            {texts.autoGenerate}
          </button>
          <button 
            onClick={() => {
              // This would open the persona editor, which is handled by the component
              const event = new CustomEvent('addPersona');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed bg-brand-green text-white hover:bg-brand-green-dark flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            {texts.newPersona}
          </button>
          <button 
            onClick={props.onRefresh}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Refresh data"
            disabled={props.isLoading}
          >
            <RefreshIcon className={`h-5 w-5 text-gray-600 ${props.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <PersonasDisplay
        personas={props.personas}
        onSavePersona={props.onSavePersona}
        onDeletePersona={props.onDeletePersona}
        onAutoGeneratePersona={props.onAutoGeneratePersona}
        brandFoundation={props.brandFoundation}
        language={props.language}
        mongoBrandId={props.mongoBrandId}
        onLoadData={props.onLoadData}
        isDataLoaded={props.isDataLoaded}
        isLoading={props.isLoading}
        generatedImages={props.generatedImages || {}}
        onTogglePersonaState={props.onTogglePersonaState}
      />
    </StandardPageView>
  );
};

export default PersonasContent;