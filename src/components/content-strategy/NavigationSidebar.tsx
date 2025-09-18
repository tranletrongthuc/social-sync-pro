import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Trend } from '../../../types';
import { Button, Input } from '../ui';
import { PlusIcon, TagIcon, SearchIcon } from '../icons';
import TrendListItem from './TrendListItem';

interface NavigationSidebarProps {
  language: string;
  trends: Trend[];
  selectedTrend: Trend | null;
  onSelectTrend: (trend: Trend) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onSuggestTrends: (trendType: 'industry' | 'global', timePeriod: string) => void;
  isSuggestingTrends: boolean;
  onGenerateFacebookTrends: (industry: string) => void;
  isGeneratingTrendsFromSearch: boolean;
  onSaveTrend: (trend: Trend) => void;
  onDeleteTrend: (trendId: string) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  language,
  trends,
  selectedTrend,
  onSelectTrend,
  searchQuery,
  onSearchChange,
  isSidebarOpen,
  setIsSidebarOpen,
  onSuggestTrends,
  isSuggestingTrends,
  onGenerateFacebookTrends,
  isGeneratingTrendsFromSearch,
  onSaveTrend,
  onDeleteTrend
}) => {
  // State for trend suggestion
  const [industryForSearch, setIndustryForSearch] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  // Debounce search input
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange(query);
    }, 300); // 300ms debounce
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Translation texts
  const T = {
    'Việt Nam': {
      trends: "Xu hướng",
      addTrend: "Thêm Xu hướng",
      trendSearchTitle: "Tự động hóa Chiến lược Facebook",
      trendSearchSubtitle: "Tự động tìm kiếm và lưu lại các Xu hướng từ Facebook bằng công cụ tìm kiếm của Google.",
      industryPlaceholder: "Nhập ngành của bạn (ví dụ: Thời trang, Công nghệ, Ẩm thực)",
      analyzeTrends: "Tìm",
      analyzing: "Đang tìm kiếm...",
    },
    'English': {
      trends: "Trends",
      addTrend: "Add Trend",
      trendSearchTitle: "Facebook Strategy Automation",
      trendSearchSubtitle: "Automatically search and save Trends from Facebook using Google Search engine.",
      industryPlaceholder: "Enter your industry (e.g., Fashion, Tech, Food)",
      analyzeTrends: "Search",
      analyzing: "Searching...",
    }
  };
  const texts = (T as any)[language] || T['English'];

  // Group trends by type (industry vs global)
  const groupedTrends = useMemo(() => {
    const industryTrends = trends.filter(trend => trend.industry !== 'Global');
    const globalTrends = trends.filter(trend => trend.industry === 'Global');
    return { industryTrends, globalTrends };
  }, [trends]);

  const handleGenerateFacebookTrends = () => {
    if (industryForSearch) {
      onGenerateFacebookTrends(industryForSearch);
      setIsSidebarOpen(false);
    }
  };

  return (
    <aside className={`
      md:static md:translate-x-0 md:opacity-100 md:visible
      fixed inset-y-0 left-0 z-30 w-80 bg-white transform transition-transform duration-300 ease-in-out
      ${isSidebarOpen ? 'translate-x-0 opacity-100 visible' : '-translate-x-full opacity-0 invisible'}
      md:flex md:flex-col md:border md:border-gray-200 md:rounded-lg md:shadow-sm
    `}>
      <div className="flex justify-between items-center p-4 md:p-6 md:pt-0 border-b border-gray-200 md:border-0">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{texts.trends}</h3>
        <Button 
          variant="secondary" 
          onClick={() => { 
            const newTrend = {
              id: '',
              brandId: '',
              industry: '',
              topic: 'New Trend',
              keywords: [],
              links: [],
              notes: '',
              analysis: '',
              createdAt: new Date().toISOString(),
            };
            onSaveTrend(newTrend as Trend);
            setIsSidebarOpen(false);
          }} 
          className="flex items-center gap-1.5 !px-2 !py-1"
        >
          <PlusIcon className="h-4 w-4" /> {texts.addTrend}
        </Button>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search trends..."
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Trends List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-semibold text-gray-700">Trends</h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {trends.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {trends.map(trend => {
              const isProductTrend = trend.id.startsWith('product-');
              return (
                <TrendListItem
                  key={trend.id}
                  trend={trend}
                  isSelected={selectedTrend?.id === trend.id}
                  isProductTrend={isProductTrend}
                  language={language}
                  onClick={() => {
                    onSelectTrend(trend);
                    setIsSidebarOpen(false);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default NavigationSidebar;