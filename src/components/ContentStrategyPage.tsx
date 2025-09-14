import React, { useState, useMemo } from 'react';
import type { Trend, Idea, Settings, Persona, AffiliateLink } from '../../types';
import NavigationSidebar from './content-strategy/NavigationSidebar';
import MainContentArea from './content-strategy/MainContentArea';

interface ContentStrategyPageProps {
  language: string;
  trends: Trend[];
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  generatedImages: Record<string, string>;
  settings: Settings;
  onSaveTrend: (trend: Trend) => void;
  onDeleteTrend: (trendId: string) => void;
  onGenerateIdeas: (trend: Trend, useSearch: boolean) => void;
  onCreatePlanFromIdea: (prompt: string, productId?: string) => void;
  onGenerateContentPackage: (idea: Idea, personaId: string | null, selectedProductId: string | null, options: { tone: string; style: string; length: string; includeEmojis: boolean; }) => void;
  isGeneratingIdeas: boolean;
  onGenerateFacebookTrends: (industry: string) => void;
  isGeneratingTrendsFromSearch: boolean;
  productTrendToSelect?: string | null;
  selectedTrend: Trend | null;
  ideasForSelectedTrend: Idea[];
  onSelectTrend: (trend: Trend) => void;
  onSuggestTrends: (trendType: 'industry' | 'global', timePeriod: string) => void;
  isSuggestingTrends: boolean;
  isDataLoaded?: boolean;
  onLoadData?: () => void;
  isLoading?: boolean;
}

const ContentStrategyPage: React.FC<ContentStrategyPageProps> = (props) => {
  const {
    language,
    trends,
    personas,
    affiliateLinks,
    generatedImages,
    settings,
    onSaveTrend,
    onDeleteTrend,
    onGenerateIdeas,
    onCreatePlanFromIdea,
    onGenerateContentPackage,
    isGeneratingIdeas,
    onGenerateFacebookTrends,
    isGeneratingTrendsFromSearch,
    productTrendToSelect,
    selectedTrend,
    ideasForSelectedTrend,
    onSelectTrend,
    onSuggestTrends,
    isSuggestingTrends,
    isDataLoaded,
    onLoadData,
    isLoading
  } = props;

  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter trends based on search
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTrends = useMemo(() => {
    if (!searchQuery) return trends;
    const query = searchQuery.toLowerCase();
    return trends.filter(trend => 
      trend.topic.toLowerCase().includes(query) ||
      (trend.keywords && trend.keywords.some(keyword => keyword.toLowerCase().includes(query))) ||
      (trend.industry && trend.industry.toLowerCase().includes(query))
    );
  }, [trends, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-gray-50/50 relative">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-sans text-gray-900">
            Content Strategy
          </h2>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <NavigationSidebar
          language={language}
          trends={filteredTrends}
          selectedTrend={selectedTrend}
          onSelectTrend={onSelectTrend}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onSuggestTrends={onSuggestTrends}
          isSuggestingTrends={isSuggestingTrends}
          onGenerateFacebookTrends={onGenerateFacebookTrends}
          isGeneratingTrendsFromSearch={isGeneratingTrendsFromSearch}
          onSaveTrend={onSaveTrend}
          onDeleteTrend={onDeleteTrend}
        />

        {/* Main Content Area */}
        <MainContentArea
          language={language}
          selectedTrend={selectedTrend}
          ideasForSelectedTrend={ideasForSelectedTrend}
          personas={personas}
          affiliateLinks={affiliateLinks}
          generatedImages={generatedImages}
          settings={settings}
          onGenerateIdeas={onGenerateIdeas}
          onCreatePlanFromIdea={onCreatePlanFromIdea}
          onGenerateContentPackage={onGenerateContentPackage}
          isGeneratingIdeas={isGeneratingIdeas}
          onSaveTrend={onSaveTrend}
          onDeleteTrend={onDeleteTrend}
          isDataLoaded={isDataLoaded}
          onLoadData={onLoadData}
        />
      </div>
    </div>
  );
};

export default ContentStrategyPage;