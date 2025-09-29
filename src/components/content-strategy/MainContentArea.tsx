import React, { useState, lazy, Suspense } from 'react';
import type { Trend, Idea, Settings, Persona, AffiliateLink } from '../../../types';
import { Button } from '../ui';
import { PencilIcon, TrashIcon, SparklesIcon } from '../icons';
import Loader from '../Loader';

// Lazy load tab components for performance
const OverviewTab = lazy(() => import('./OverviewTab'));
const RelatedQueriesTab = lazy(() => import('./RelatedQueriesTab'));
const SourcesTab = lazy(() => import('./SourcesTab'));

interface MainContentAreaProps {
  language: string;
  selectedTrend: Trend | null;
  ideasForSelectedTrend: Idea[];
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  generatedImages: Record<string, string>;
  settings: Settings;
  onGenerateIdeas: (trend: Trend, useSearch: boolean) => void;
  onCreatePlanFromIdea: (prompt: string, productId?: string) => void;
  onGenerateContentPackage: (idea: Idea, personaId: string | null, selectedProductId: string | null, options: { tone: string; style: string; length: string; includeEmojis: boolean; }) => void;
  isGeneratingIdeas?: boolean;
  onSaveTrend: (trend: Trend) => void;
  onDeleteTrend: (trendId: string) => void;
  onToggleIdeaArchive: (ideaId: string) => void;
  onEditIdea: (idea: Idea) => void;
  isDataLoaded?: boolean;
  onLoadData?: () => void;
}

const MainContentArea: React.FC<MainContentAreaProps> = ({
  language,
  selectedTrend,
  ideasForSelectedTrend,
  personas,
  affiliateLinks,
  generatedImages,
  settings,
  onGenerateIdeas,
  onCreatePlanFromIdea,
  onGenerateContentPackage,
  isGeneratingIdeas,
  onSaveTrend,
  onDeleteTrend,
  onToggleIdeaArchive,
  onEditIdea,
  isDataLoaded
}) => {
  // State for tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'sources'>('overview');
  
  // State for idea generation options
  const [useSearchForIdeas, setUseSearchForIdeas] = useState(false);
  const isGeminiModel = (settings.textGenerationModel || '').startsWith('gemini-');

  // Translation texts
  const T = {
    'Việt Nam': {
      ideasFor: "Ý tưởng cho:",
      noTrendSelected: "Chọn một xu hướng để xem ý tưởng.",
      generateIdeas: "Tạo Ý tưởng",
      generating: "Đang tạo...",
      useSearch: "Dùng Google Search",
      useSearchDesc: "Sử dụng Google Tìm kiếm để có nội dung thực tế, cập nhật.",
      geminiOnly: "Chỉ dành cho Gemini",
      createPlan: "Tạo Kế hoạch",
      createPackage: "Tạo Gói Nội dung",
      confirmDelete: "Bạn có chắc muốn xóa xu hướng này và tất cả các ý tưởng liên quan không?",
    },
    'English': {
      ideasFor: "Ideas for:",
      noTrendSelected: "Select a trend to see ideas.",
      generateIdeas: "Generate Ideas",
      generating: "Generating...",
      useSearch: "Use Google Search",
      useSearchDesc: "Uses Google Search for factual, up-to-date content.",
      geminiOnly: "Gemini only",
      createPlan: "Create Plan",
      createPackage: "Generate Content Package",
      confirmDelete: "Are you sure you want to delete this trend and all its associated ideas?",
    }
  };
  const texts = (T as any)[language] || T['English'];
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleDeleteTrend = (trendId: string) => {
    if(window.confirm(texts.confirmDelete)) {
      onDeleteTrend(trendId);
    }
  };

  if (!selectedTrend) {
    return (
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="text-center py-20 text-gray-400 h-full flex flex-col items-center justify-center">
          <p className="text-lg font-semibold">{texts.noTrendSelected}</p>
          <p className="text-sm mt-2 hidden sm:block">Select a trend from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  const isProductTrend = selectedTrend.id.startsWith('product-');

  return (
    <main className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-hidden bg-white rounded-lg border border-gray-200 flex flex-col">
        {/* Fixed height header section */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
          {/* --- THAY ĐỔI CHÍNH NẰM Ở ĐÂY ---
              - Mặc định là 'flex-col' (xếp dọc) và có khoảng cách 'gap-4'.
              - Trên màn hình 'sm' (640px) trở lên, chuyển thành 'sm:flex-row', 'sm:justify-between', và 'sm:items-center'.
          */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              
              {/* PHẦN BÊN TRÁI: TIÊU ĐỀ VÀ TAG */}
              {/* Phần này không cần thay đổi nhiều, chỉ xóa 'truncate' */}
              <div>
                  {/* --- ĐÃ XÓA CLASS 'truncate' ĐỂ TIÊU ĐỀ TỰ XUỐNG DÒNG --- */}
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900" title={selectedTrend.topic}>
                      {selectedTrend.topic}
                  </h2>
                  <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTrend.industry === 'Global' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                          {selectedTrend.industry === 'Global' ? 'Global Trend' : `Industry Trend (${selectedTrend.industry})`}
                      </span>
                  </div>
              </div>

              {/* PHẦN BÊN PHẢI: NHÓM HÀNH ĐỘNG */}
              {/* --- ĐÃ XÓA CLASS 'flex-shrink-0' VÌ KHÔNG CÒN CẦN THIẾT --- */}
              <div className="flex items-center gap-1 sm:gap-2">
                  
                  {/* NÚT CÀI ĐẶT VÀ POPOVER */}
                  {!isProductTrend && isGeminiModel && (
                      <div className="relative">
                          <button
                              type="button"
                              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L8 7.45c-.47.23-.92.54-1.34.9l-4.12-1.53c-1.46-.54-2.86.86-2.32 2.32l1.53 4.12c-.36.42-.67.87-.9 1.34l-4.27.51c-1.56.38-1.56 2.6 0 2.98l4.27.51c.23.47.54.92.9 1.34l-1.53 4.12c-.54 1.46.86 2.86 2.32 2.32l4.12-1.53c.42.36.87.67 1.34.9l.51 4.27c.38 1.56 2.6 1.56 2.98 0l.51-4.27c.47-.23.92-.54 1.34-.9l4.12 1.53c1.46.54 2.86-.86 2.32-2.32l-1.53-4.12c.36-.42-.67-.87.9-1.34l4.27-.51c1.56-.38-1.56-2.6 0-2.98l-4.27-.51c-.23-.47-.54-.92-.9-1.34l1.53-4.12c.54-1.46-.86-2.86-2.32-2.32l-4.12-1.53c-.42-.36-.87-.67-1.34-.9L11.49 3.17zm-1.49 8.33a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" clipRule="evenodd" /></svg>
                          </button>
                          
                          {isSettingsOpen && (
                              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10">
                                  <p className="text-sm font-semibold text-gray-800 mb-3">Tùy chọn</p>
                                  <div className="flex items-center justify-between">
                                      <label htmlFor="idea-hub-use-search" className="text-sm text-gray-700">
                                          {texts.useSearch}
                                      </label>
                                      <button
                                          type="button"
                                          onClick={() => setUseSearchForIdeas(!useSearchForIdeas)}
                                          className={`${
                                              useSearchForIdeas ? 'bg-brand-green' : 'bg-gray-200'
                                          } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green`}
                                          role="switch"
                                          aria-checked={useSearchForIdeas}
                                      >
                                          <span className={`${
                                              useSearchForIdeas ? 'translate-x-5' : 'translate-x-0'
                                          } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}></span>
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  {/* NÚT EDIT VÀ DELETE */}
                  {!isProductTrend && (
                      <>
                          <Button variant="tertiary" onClick={() => onSaveTrend(selectedTrend)}><PencilIcon className="h-4 w-4" /></Button>
                          <Button variant="tertiary" onClick={() => handleDeleteTrend(selectedTrend.id)} className="text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4" /></Button>
                      </>
                  )}

                  {/* NÚT GENERATE CHÍNH */}
                  <Button 
                      onClick={() => onGenerateIdeas(selectedTrend, useSearchForIdeas)} 
                      disabled={isGeneratingIdeas || isProductTrend} 
                      className="flex items-center justify-center gap-1.5"
                      title={isProductTrend ? "Cannot generate new ideas for product-based trends" : ""}
                  >
                      {isGeneratingIdeas ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                          <>
                              <SparklesIcon className="h-4 w-4" /> 
                              <span className="hidden sm:inline">{isProductTrend ? "Product Ideas" : texts.generateIdeas}</span>
                              <span className="sm:hidden">{isProductTrend ? "Ideas" : "Generate"}</span>
                          </>
                      )}
                  </Button>
              </div>
          </div>
      </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Only the elements below are in the scrollable area */}
              
              {!isProductTrend && selectedTrend.analysis && (
                <p className="text-sm text-gray-600 italic border-l-4 border-gray-200 pl-4 my-4">{selectedTrend.analysis}</p>
              )}
              
              {/* Stats Dashboard - Leaner and more compact */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedTrend.searchVolume && (
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Search Volume</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedTrend.searchVolume.toLocaleString()}</p>
                  </div>
                )}
                
                {selectedTrend.competitionLevel && (
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Competition</p>
                    <p className={`text-sm font-semibold ${
                      selectedTrend.competitionLevel === 'Low' ? 'text-green-600' :
                      selectedTrend.competitionLevel === 'Medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedTrend.competitionLevel}
                    </p>
                  </div>
                )}
                
                {selectedTrend.category && (
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Category</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{selectedTrend.category}</p>
                  </div>
                )}
                
                {selectedTrend.sentiment && (
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Sentiment</p>
                    <p className={`text-sm font-semibold ${
                      selectedTrend.sentiment === 'Positive' ? 'text-green-600' :
                      selectedTrend.sentiment === 'Negative' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {selectedTrend.sentiment}
                    </p>
                  </div>
                )}
                
                {selectedTrend.peakTimeFrame && (
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Peak Time</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{selectedTrend.peakTimeFrame}</p>
                  </div>
                )}
                
                {selectedTrend.predictedLifespan && (
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Lifespan</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{selectedTrend.predictedLifespan}</p>
                  </div>
                )}
                
                {selectedTrend.trendingScore && (
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Trending Score</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${selectedTrend.trendingScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedTrend.trendingScore}/100</p>
                  </div>
                )}
              </div>
              
              {/* Tabbed Details Section */}
              <div className="mt-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-brand-green text-brand-green'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('queries')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'queries'
                          ? 'border-brand-green text-brand-green'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Related Queries
                    </button>
                    <button
                      onClick={() => setActiveTab('sources')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'sources'
                          ? 'border-brand-green text-brand-green'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Sources
                    </button>
                  </nav>
                </div>
                
                <div className="mt-4">
                  <Suspense fallback={<Loader title="Loading tab content..." steps={[]} />}>
                    {activeTab === 'overview' && (
                      <OverviewTab 
                        trend={selectedTrend}
                        ideas={ideasForSelectedTrend}
                        language={language}
                        onCreatePlanFromIdea={onCreatePlanFromIdea}
                        onGenerateContentPackage={onGenerateContentPackage}
                        personas={personas}
                        affiliateLinks={affiliateLinks}
                        generatedImages={generatedImages}
                        isGeneratingIdeas={isGeneratingIdeas}
                        onToggleIdeaArchive={onToggleIdeaArchive}
                        onEditIdea={onEditIdea}
                      />
                    )}
                    {activeTab === 'queries' && (
                      <RelatedQueriesTab 
                        relatedQueries={selectedTrend.relatedQueries || []}
                        language={language}
                      />
                    )}
                    {activeTab === 'sources' && (
                      <SourcesTab 
                        sourceUrls={selectedTrend.sourceUrls || []}
                        language={language}
                      />
                    )}
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  };

export default MainContentArea;