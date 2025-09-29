import React, { useState, useEffect } from 'react';
import type { Trend, AffiliateLink, Idea, GeneratedAssets, Persona } from '../../types';
import { Button, Input, Select } from './ui';
import { PlusIcon, SparklesIcon, LinkIcon, RefreshIcon, MenuIcon } from './icons';
import RefreshButton from './RefreshButton';
import NavigationSidebar from './content-strategy/NavigationSidebar';
import MainContentArea from './content-strategy/MainContentArea';
import GenericTabTemplate from './GenericTabTemplate';
import TrendEditorModal from './content-strategy/TrendEditorModal';

interface ContentStrategyPageProps {
  mongoBrandId: string | null;
  language: string;
  trends: Trend[];
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  generatedImages: Record<string, string>;
  settings: GeneratedAssets['settings'];
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
  onToggleTrendArchive: (trendId: string) => void;
  onToggleIdeaArchive: (ideaId: string) => void;
  onEditIdea: (idea: Idea) => void; // New prop for editing ideas
  isDataLoaded?: boolean;
  onLoadData?: (brandId: string) => Promise<void>;
  isSelectingTrend?: boolean;
  isSuggestingTrends?: boolean;
  isGeneratingIdeas?: boolean;
}

const ContentStrategyPage: React.FC<ContentStrategyPageProps> = (props) => {
  const { mongoBrandId, language, trends, onSaveTrend, onLoadData, onToggleTrendArchive, onToggleIdeaArchive, onEditIdea, ...rest } = props;
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoSuggestOpen, setIsAutoSuggestOpen] = useState(false);
  const [autoSuggestType, setAutoSuggestType] = useState<'industry' | 'global'>('industry');
  const [autoSuggestTime, setAutoSuggestTime] = useState('last_month');
  const [isFacebookOpen, setIsFacebookOpen] = useState(false);
  const [isTrendEditorOpen, setIsTrendEditorOpen] = useState(false);
  const [editingTrend, setEditingTrend] = useState<Trend | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleEditTrend = (trend: Trend) => {
    setEditingTrend(trend);
    setIsTrendEditorOpen(true);
  };

  useEffect(() => {
    if (!props.isDataLoaded && onLoadData && mongoBrandId) {
      onLoadData(mongoBrandId);
    }
  }, [props.isDataLoaded, onLoadData, mongoBrandId]);

  const handleSuggestTrends = () => {
    props.onSuggestTrends(autoSuggestType, autoSuggestTime);
    setIsAutoSuggestOpen(false);
  };

  const handleOpenNewTrendModal = () => {
    setEditingTrend({
      id: '',
      brandId: mongoBrandId || '',
      topic: '',
      industry: '',
      keywords: [],
      analysis: '',
      notes: '',
      links: [],
      createdAt: new Date().toISOString(),
    });
    setIsTrendEditorOpen(true);
  };

  const handleSaveTrend = (trend: Trend) => {
    onSaveTrend(trend);
    setIsTrendEditorOpen(false);
    setEditingTrend(null);
  };

  const filteredTrends = trends.filter(trend => 
    (trend.topic && trend.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (trend.analysis && trend.analysis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const T = {
    'Việt Nam': {
      title: "Chiến lược Nội dung",
      subtitle: "Tìm hiểu xu hướng và tạo ý tưởng nội dung hấp dẫn.",
      autoSuggest: "Tự động đề xuất",
      facebookStrategy: "Chiến lược Facebook",
      newTrend: "Xu hướng mới",
      loading: "Đang tải...",
    },
    'English': {
      title: "Content Strategy",
      subtitle: "Discover trends and generate engaging content ideas.",
      autoSuggest: "Auto Suggest",
      facebookStrategy: "Facebook Strategy",
      newTrend: "New Trend",
      loading: "Loading...",
    }
  };
  const texts = T[language as keyof typeof T] || T['English'];

  const actionButtons = (
    <div className="flex items-center gap-2">
      <Button 
        variant="secondary" 
        size="sm"
        className="md:hidden"
        onClick={() => setIsSidebarOpen(true)}
      >
        <MenuIcon className="h-4 w-4" />
      </Button>
      <Button onClick={() => setIsAutoSuggestOpen(true)} variant="secondary" size="sm" className="whitespace-nowrap">
        <SparklesIcon className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">{texts.autoSuggest}</span>
      </Button>
      <Button onClick={() => setIsFacebookOpen(true)} variant="secondary" size="sm" className="whitespace-nowrap">
        <LinkIcon className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">{texts.facebookStrategy}</span>
      </Button>
      <Button onClick={handleOpenNewTrendModal} size="sm" className="whitespace-nowrap">
        <PlusIcon className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">{texts.newTrend}</span>
      </Button>
      <RefreshButton 
        onClick={() => onLoadData && mongoBrandId && onLoadData(mongoBrandId)}
        isLoading={props.isSuggestingTrends || props.isSelectingTrend || props.isGeneratingIdeas}
        language={language}
      />
    </div>
  );

  return (
    <>
      <GenericTabTemplate
        title={texts.title}
        subtitle={texts.subtitle}
        actionButtons={actionButtons}
        isLoading={props.isSelectingTrend || props.isSuggestingTrends}
      >
        <div className="h-full flex flex-col md:flex-row bg-gray-50/50">
          <NavigationSidebar 
            trends={filteredTrends}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTrend={props.selectedTrend}
            onSelectTrend={props.onSelectTrend}
            language={language}
            onSuggestTrends={props.onSuggestTrends}
            isSuggestingTrends={props.isSuggestingTrends || false}
            onSaveTrend={onSaveTrend}
            onDeleteTrend={props.onDeleteTrend}
            onEditTrend={handleEditTrend}
            onToggleTrendArchive={onToggleTrendArchive}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <MainContentArea 
            {...props} 
            onToggleIdeaArchive={onToggleIdeaArchive}
            onLoadData={onLoadData && mongoBrandId ? () => onLoadData(mongoBrandId) : undefined}
            onEditIdea={onEditIdea}
          />
        </div>
      </GenericTabTemplate>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {isTrendEditorOpen && (
        <TrendEditorModal
          isOpen={isTrendEditorOpen}
          onClose={() => setIsTrendEditorOpen(false)}
          onSave={handleSaveTrend}
          trend={editingTrend}
          language={language}
        />
      )}

      {isAutoSuggestOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Auto Suggest Trends</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trend Type</label>
                  <Select value={autoSuggestType} onChange={(e) => setAutoSuggestType(e.target.value as 'industry' | 'global')} className="w-full">
                    <option value="industry">Industry Trends</option>
                    <option value="global">Global Trends</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                  <Select value={autoSuggestTime} onChange={(e) => setAutoSuggestTime(e.target.value)} className="w-full">
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_quarter">Last Quarter</option>
                    <option value="last_year">Last Year</option>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="tertiary" onClick={() => setIsAutoSuggestOpen(false)}>Cancel</Button>
                <Button onClick={handleSuggestTrends} disabled={props.isSuggestingTrends}>
                  {props.isSuggestingTrends ? (
                    <>{/* Spinner */}{texts.loading}</>
                  ) : (
                    "Suggest Trends"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFacebookOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900">Facebook Strategy (Coming Soon)</h3>
              <Button variant="tertiary" onClick={() => setIsFacebookOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContentStrategyPage;
