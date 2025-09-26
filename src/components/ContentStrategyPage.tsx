import React, { useState, useEffect, useCallback } from 'react';
import type { Trend, AffiliateLink, Idea, GeneratedAssets, Persona, GenerationOptions } from '../../types';
import { Button, Input, Select } from './ui';
import { ArrowPathIcon, PlusIcon, SparklesIcon, LinkIcon, DocumentTextIcon, CollectionIcon, RefreshIcon } from './icons';
import TrendListItem from './content-strategy/TrendListItem';
import OverviewTab from './content-strategy/OverviewTab';
import RelatedQueriesTab from './content-strategy/RelatedQueriesTab';
import SourcesTab from './content-strategy/SourcesTab';
import NavigationSidebar from './content-strategy/NavigationSidebar';
import MainContentArea from './content-strategy/MainContentArea';
import StandardPageView from './StandardPageView';


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
  onCreatePlanFromIdea: (prompt?: string, productId?: string) => void; // Add this prop
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
}

const ContentStrategyPage: React.FC<ContentStrategyPageProps> = ({
  mongoBrandId,
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
  productTrendToSelect,
  selectedTrend,
  ideasForSelectedTrend,
  onSelectTrend,
  onSuggestTrends,
  isDataLoaded,
  onLoadData,
  isSelectingTrend,
  isSuggestingTrends,
  isGeneratingIdeas,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'sources'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrendType, setSelectedTrendType] = useState<'all' | 'industry' | 'global'>('all');
  const [loadingTrendIdeas, setLoadingTrendIdeas] = useState<string | null>(null);
  
  const [isAutoSuggestOpen, setIsAutoSuggestOpen] = useState(false);
  const [autoSuggestType, setAutoSuggestType] = useState<'industry' | 'global'>('industry');
  const [autoSuggestTime, setAutoSuggestTime] = useState('last_month');
  const [isFacebookOpen, setIsFacebookOpen] = useState(false);
  
  const [selectedTrendForContentPackage, setSelectedTrendForContentPackage] = useState<Trend | null>(null);
  const [selectedIdeaForContentPackage, setSelectedIdeaForContentPackage] = useState<Idea | null>(null);
  const [isContentPackageModalOpen, setIsContentPackageModalOpen] = useState(false);
  const [contentPackageOptions, setContentPackageOptions] = useState({
    tone: 'enthusiastic',
    style: 'creative',
    length: 'normal',
    includeEmojis: true,
  });

  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!isDataLoaded && onLoadData && mongoBrandId) {
      onLoadData(mongoBrandId);
    }
  }, [isDataLoaded, onLoadData, mongoBrandId]);

  // Auto-select the product trend if specified
  useEffect(() => {
    if (productTrendToSelect) {
      const trendToSelect = trends.find(t => t.id === productTrendToSelect);
      if (trendToSelect) {
        onSelectTrend(trendToSelect);
      }
    }
  }, [productTrendToSelect, trends, onSelectTrend]);

  const handleSuggestTrends = () => {
    onSuggestTrends(autoSuggestType, autoSuggestTime);
    setIsAutoSuggestOpen(false);
  };

  const handleGenerateTrendIdeas = (trend: Trend) => {
    setLoadingTrendIdeas(trend.id);
    onGenerateIdeas(trend, true);
  };

  // Filter trends based on search and type
  const filteredTrends = trends.filter(trend => {
    const matchesSearch = 
      (trend.topic && trend.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trend.analysis && trend.analysis.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedTrendType === 'all' || 
      (selectedTrendType === 'industry' && trend.industry !== 'Global') ||  // Industry trends are non-Global
      (selectedTrendType === 'global' && trend.industry === 'Global');  // Global trends are explicitly marked
    
    return matchesSearch && matchesType;
  });

  const handleCreateContentPackage = () => {
    if (selectedIdeaForContentPackage) {
      onGenerateContentPackage(
        selectedIdeaForContentPackage, 
        selectedPersonaId, 
        selectedProductId, 
        contentPackageOptions
      );
      setIsContentPackageModalOpen(false);
      setSelectedTrendForContentPackage(null);
      setSelectedIdeaForContentPackage(null);
    }
  };

  const T = {
    'Việt Nam': {
      title: "Chiến lược Nội dung",
      subtitle: "Tìm hiểu xu hướng và tạo ý tưởng nội dung hấp dẫn.",
      autoSuggest: "Tự động đề xuất",
      facebookStrategy: "Chiến lược Facebook",
      searchPlaceholder: "Tìm kiếm xu hướng...",
      allTrends: "Tất cả",
      industryTrends: "Ngành hàng",
      globalTrends: "Toàn cầu",
      selectTrendType: "Chọn loại:",
      newTrend: "Xu hướng mới",
      addTrend: "Thêm xu hướng",
      loading: "Đang tải...",
      loadingTrends: "Đang tải xu hướng...",
      loadingIdeas: "Đang tải ý tưởng...",
    },
    'English': {
      title: "Content Strategy",
      subtitle: "Discover trends and generate engaging content ideas.",
      autoSuggest: "Auto Suggest",
      facebookStrategy: "Facebook Strategy",
      searchPlaceholder: "Search trends...",
      allTrends: "All",
      industryTrends: "Industry",
      globalTrends: "Global",
      selectTrendType: "Trend Type:",
      newTrend: "New Trend",
      addTrend: "Add Trend",
      loading: "Loading...",
      loadingTrends: "Loading trends...",
      loadingIdeas: "Loading ideas...",
    }
  };
  const texts = (T as any)[language] || T['English'];

  const renderContentPackageModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Generate Content Package</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Selected Idea</label>
            <div className="bg-gray-50 p-3 rounded border">
              {selectedIdeaForContentPackage?.title || 'No idea selected'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Persona (Optional)</label>
              <Select
                value={selectedPersonaId || ''}
                onChange={(e) => setSelectedPersonaId(e.target.value || null)}
                className="w-full"
              >
                <option value="">No persona</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.nickName}</option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product (Optional)</label>
              <Select
                value={selectedProductId || ''}
                onChange={(e) => setSelectedProductId(e.target.value || null)}
                className="w-full"
              >
                <option value="">No product</option>
                {affiliateLinks.map(p => (
                  <option key={p.id} value={p.id}>{p.productName}</option>
                ))}
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <Select
                value={contentPackageOptions.tone}
                onChange={(e) => setContentPackageOptions({...contentPackageOptions, tone: e.target.value})}
                className="w-full"
              >
                <option value="enthusiastic">Enthusiastic</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="funny">Funny</option>
                <option value="inspirational">Inspirational</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
              <Select
                value={contentPackageOptions.style}
                onChange={(e) => setContentPackageOptions({...contentPackageOptions, style: e.target.value})}
                className="w-full"
              >
                <option value="creative">Creative</option>
                <option value="informative">Informative</option>
                <option value="persuasive">Persuasive</option>
                <option value="narrative">Narrative</option>
                <option value="educational">Educational</option>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
              <Select
                value={contentPackageOptions.length}
                onChange={(e) => setContentPackageOptions({...contentPackageOptions, length: e.target.value})}
                className="w-full"
              >
                <option value="short">Short</option>
                <option value="normal">Normal</option>
                <option value="long">Long</option>
              </Select>
            </div>
            
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="includeEmojis"
                checked={contentPackageOptions.includeEmojis}
                onChange={(e) => setContentPackageOptions({...contentPackageOptions, includeEmojis: e.target.checked})}
                className="h-4 w-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
              />
              <label htmlFor="includeEmojis" className="ml-2 block text-sm text-gray-700">
                Include Emojis
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="tertiary" 
              onClick={() => {
                setIsContentPackageModalOpen(false);
                setSelectedTrendForContentPackage(null);
                setSelectedIdeaForContentPackage(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateContentPackage} 
              disabled={!selectedIdeaForContentPackage}
            >
              Generate Content Package
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <StandardPageView
      title={texts.title}
      subtitle={texts.subtitle}
      actions={
        <div className="flex flex-row gap-2">
          <Button 
            onClick={() => setIsAutoSuggestOpen(true)} 
            variant="secondary"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium"
          >
            <SparklesIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.autoSuggest}</span>
          </Button>
          <Button 
            onClick={() => setIsFacebookOpen(true)} 
            variant="secondary"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium"
          >
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.facebookStrategy}</span>
          </Button>
          <Button 
            onClick={() => onCreatePlanFromIdea()} 
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.newTrend}</span>
          </Button>
          <button 
            onClick={() => onLoadData && mongoBrandId && onLoadData(mongoBrandId)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Refresh data"
            disabled={isSuggestingTrends || isSelectingTrend || isGeneratingIdeas}
          >
            <RefreshIcon className={`h-4 w-4 text-gray-600 ${isSuggestingTrends || isSelectingTrend || isGeneratingIdeas ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="h-full flex flex-col md:flex-row bg-gray-50/50">
        <NavigationSidebar 
          trends={filteredTrends}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTrend={selectedTrend}
          onSelectTrend={onSelectTrend}
          language={language}
          isSidebarOpen={true}
          setIsSidebarOpen={() => {}}
          onSuggestTrends={onSuggestTrends}
          isSuggestingTrends={isSuggestingTrends || false}
          onSaveTrend={onSaveTrend}
          onDeleteTrend={onDeleteTrend}
        />
        
        <MainContentArea 
          language={language}
          selectedTrend={selectedTrend}
          ideasForSelectedTrend={ideasForSelectedTrend}
          personas={personas}
          affiliateLinks={affiliateLinks}
          generatedImages={generatedImages}
          settings={settings}
          onGenerateIdeas={handleGenerateTrendIdeas}
          onCreatePlanFromIdea={(prompt, productId) => onCreatePlanFromIdea(prompt, productId)}
          onGenerateContentPackage={(idea, personaId, selectedProductId, options) => {
            setSelectedIdeaForContentPackage(idea);
            setSelectedPersonaId(personaId);
            setSelectedProductId(selectedProductId);
            setContentPackageOptions(options);
            setIsContentPackageModalOpen(true);
          }}
          isGeneratingIdeas={isGeneratingIdeas || !!loadingTrendIdeas}
          onSaveTrend={onSaveTrend}
          onDeleteTrend={onDeleteTrend}
          isDataLoaded={isDataLoaded}
          onLoadData={() => onLoadData && mongoBrandId && onLoadData(mongoBrandId)}
        />
      </div>
      
      {isContentPackageModalOpen && renderContentPackageModal()}
      
      {/* Auto Suggest Modal */}
      {isAutoSuggestOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Auto Suggest Trends</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trend Type</label>
                  <Select
                    value={autoSuggestType}
                    onChange={(e) => setAutoSuggestType(e.target.value as 'industry' | 'global')}
                    className="w-full"
                  >
                    <option value="industry">Industry Trends</option>
                    <option value="global">Global Trends</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                  <Select
                    value={autoSuggestTime}
                    onChange={(e) => setAutoSuggestTime(e.target.value)}
                    className="w-full"
                  >
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_quarter">Last Quarter</option>
                    <option value="last_year">Last Year</option>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="tertiary" onClick={() => setIsAutoSuggestOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSuggestTrends} 
                  disabled={isSuggestingTrends}
                >
                  {isSuggestingTrends ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      {texts.loading}
                    </>
                  ) : (
                    "Suggest Trends"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Facebook Strategy Modal */}
      {isFacebookOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Facebook Strategy</h3>
                <Button variant="tertiary" onClick={() => setIsFacebookOpen(false)}>
                  Close
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Coming Soon</h4>
                  <p className="text-gray-600 mt-1">
                    The Facebook Strategy tool will allow you to create targeted content strategies based on Facebook insights and trends.
                  </p>
                </div>
                
                <div className="pt-4">
                  <h4 className="font-medium text-gray-900">Features to Include:</h4>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li>Facebook trend analysis</li>
                    <li>Engagement prediction</li>
                    <li>Content calendar integration</li>
                    <li>Ad campaign suggestions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StandardPageView>
  );
};

export default ContentStrategyPage;