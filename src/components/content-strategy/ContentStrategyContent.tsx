import React from 'react';
import type { Trend, AffiliateLink, Idea, Persona, PostInfo, GenerationOptions, Settings } from '../../../types';
import ContentStrategyPage from '../ContentStrategyPage';

interface ContentStrategyContentProps {
  language: string;
  trends: Trend[];
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  settings: Settings; // Using proper Settings type
  onSaveTrend: (trend: Trend) => void;
  onDeleteTrend: (trendId: string) => void;
  onGenerateIdeas: (trend: Trend, useSearch: boolean) => void;
  onCreatePlanFromIdea: (prompt?: string, productId?: string) => void;
  onGenerateContentPackage: (idea: Idea, personaId: string | null, selectedProductId: string | null, options: { tone: string; style: string; length: string; includeEmojis: boolean; }) => void;
  productTrendToSelect: string | null;
  selectedTrend: Trend | null;
  ideasForSelectedTrend: Idea[];
  onSelectTrend: (trend: Trend) => void;
  onSuggestTrends: (trendType: 'industry' | 'global', timePeriod: string) => void;
  isDataLoaded?: boolean;
  onLoadData?: (brandId: string) => Promise<void>;
  isSelectingTrend?: boolean;
  isSuggestingTrends?: boolean;
  isGeneratingIdeas?: boolean;
  mongoBrandId: string | null;
  generatedImages?: Record<string, string>;
  onToggleTrendArchive: (trendId: string) => void;
  onToggleIdeaArchive: (ideaId: string) => void;
  onEditIdea: (idea: Idea) => void;
}

const ContentStrategyContent: React.FC<ContentStrategyContentProps> = (props) => {
  return (
    <ContentStrategyPage
      mongoBrandId={props.mongoBrandId}
      language={props.language}
      trends={props.trends}
      personas={props.personas}
      affiliateLinks={props.affiliateLinks}
      generatedImages={props.generatedImages || {}}
      settings={props.settings}
      onSaveTrend={props.onSaveTrend}
      onDeleteTrend={props.onDeleteTrend}
      onGenerateIdeas={props.onGenerateIdeas}
      onCreatePlanFromIdea={props.onCreatePlanFromIdea}
      onGenerateContentPackage={props.onGenerateContentPackage}
      productTrendToSelect={props.productTrendToSelect}
      selectedTrend={props.selectedTrend}
      ideasForSelectedTrend={props.ideasForSelectedTrend}
      onSelectTrend={props.onSelectTrend}
      onSuggestTrends={props.onSuggestTrends}
      onToggleTrendArchive={props.onToggleTrendArchive}
      onToggleIdeaArchive={props.onToggleIdeaArchive}
      onEditIdea={props.onEditIdea}
      isDataLoaded={props.isDataLoaded}
      onLoadData={props.onLoadData}
      isSelectingTrend={props.isSelectingTrend}
      isSuggestingTrends={props.isSuggestingTrends}
      isGeneratingIdeas={props.isGeneratingIdeas}
    />
  );
};

export default ContentStrategyContent;