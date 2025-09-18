import React, { useState, useMemo, useEffect } from 'react';
import type { Trend, Idea, Settings, Persona, AffiliateLink } from '../../types';
import NavigationSidebar from './content-strategy/NavigationSidebar';
import MainContentArea from './content-strategy/MainContentArea';
import StandardPageView from './StandardPageView';
import { LightBulbIcon, SparklesIcon } from './icons';
import { Button } from './ui';

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
  onLoadData?: () => Promise<void>;
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

  const [trendType, setTrendType] = useState<'industry' | 'global'>('industry');
  const [timePeriod, setTimePeriod] = useState('Last Month');
  
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

  const handleSuggestTrends = () => {
    onSuggestTrends(trendType, timePeriod);
  };

  // Load data when component mounts if not already loaded
  useEffect(() => {
    if (!isDataLoaded && onLoadData) {
      onLoadData();
    }
  }, [isDataLoaded, onLoadData]);

  const T = {
    'Việt Nam': {
      autoSuggestTitle: "Gợi ý Xu hướng Tự động",
      trendType: "Loại Xu hướng",
      industrySpecific: "Theo Ngành",
      globalHot: "Xu hướng Toàn cầu",
      timePeriod: "Thời gian",
      lastWeek: "Tuần trước",
      lastMonth: "Tháng trước",
      last3Months: "3 Tháng trước",
      suggestTrends: "Gợi ý Xu hướng",
      suggesting: "Đang gợi ý...",
    },
    'English': {
      autoSuggestTitle: "AI-Powered Trend Suggestion",
      trendType: "Trend Type",
      industrySpecific: "Industry Specific",
      globalHot: "Global Hot Trends",
      timePeriod: "Time Period",
      lastWeek: "Last Week",
      lastMonth: "Last Month",
      last3Months: "Last 3 Months",
      suggestTrends: "Suggest Trends",
      suggesting: "Suggesting...",
    }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <StandardPageView
      title="Content Strategy"
      subtitle="Discover trends and generate content ideas"
      actions={
        <div className="flex flex-row gap-2">
          <div className="flex flex-row gap-1">
            <button
              onClick={() => setTrendType('industry')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                trendType === 'industry' 
                  ? 'bg-brand-green text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">{texts.industrySpecific}</span>
              <span className="sm:hidden">Ind</span>
            </button>
            <button
              onClick={() => setTrendType('global')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                trendType === 'global' 
                  ? 'bg-brand-green text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">{texts.globalHot}</span>
              <span className="sm:hidden">Glo</span>
            </button>
          </div>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="py-1.5 px-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="Last Week">{texts.lastWeek}</option>
            <option value="Last Month">{texts.lastMonth}</option>
            <option value="Last 3 Months">{texts.last3Months}</option>
          </select>
          <Button 
            onClick={handleSuggestTrends} 
            disabled={isSuggestingTrends}
            className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium"
          >
            {isSuggestingTrends ? (
              <>
                <span className="text-xs">{texts.suggesting}</span>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{texts.suggestTrends}</span>
                <span className="sm:hidden">Sug</span>
              </>
            )}
          </Button>
        </div>
      }
      onMobileMenuToggle={() => setIsSidebarOpen(true)}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Load data on first render if not already loaded */}
      {!isDataLoaded && onLoadData && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="h-full flex flex-col bg-gray-50/50 relative">
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
    </StandardPageView>
  );
};

export default ContentStrategyPage;