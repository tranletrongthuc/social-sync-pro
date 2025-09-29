import React, { useState, useRef, useEffect } from 'react';
import type { Trend } from '../../../types';
import { Input } from '../ui';
import { SearchIcon } from '../icons';
import TrendListItem from './TrendListItem';
import Sidebar from '../common/Sidebar';

interface NavigationSidebarProps {
  language: string;
  trends: Trend[];
  selectedTrend: Trend | null;
  onSelectTrend: (trend: Trend) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSuggestTrends: (trendType: 'industry' | 'global', timePeriod: string) => void;
  isSuggestingTrends: boolean;
  onSaveTrend: (trend: Trend) => void;
  onDeleteTrend: (trendId: string) => void;
  onEditTrend: (trend: Trend) => void;
  onToggleTrendArchive: (trendId: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  language,
  trends,
  selectedTrend,
  onSelectTrend,
  searchQuery,
  onSearchChange,
  onSuggestTrends,
  isSuggestingTrends,
  onSaveTrend,
  onDeleteTrend,
  onEditTrend,
  onToggleTrendArchive,
  isSidebarOpen,
  setIsSidebarOpen
}) => {
  // State for trend suggestion
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

  // Filter trends based on search query
  const filteredTrends = trends.filter(trend => 
    trend.topic?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    trend.industry?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    trend.category?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    trend.analysis?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    trend.notes?.toLowerCase().includes(localSearchQuery.toLowerCase())
  );

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
      searchPlaceholder: "Tìm kiếm xu hướng...",
    },
    'English': {
      trends: "Trends",
      addTrend: "Add Trend",
      trendSearchTitle: "Facebook Strategy Automation",
      trendSearchSubtitle: "Automatically search and save Trends from Facebook using Google Search engine.",
      industryPlaceholder: "Enter your industry (e.g., Fashion, Tech, Food)",
      analyzeTrends: "Search",
      analyzing: "Searching...",
      searchPlaceholder: "Search trends...",
    }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <Sidebar
      title={texts.trends}
      itemCount={filteredTrends.length}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      onSearchChange={onSearchChange}
      searchPlaceholder={texts.searchPlaceholder}
      language={language}
    >
      {filteredTrends.map(trend => {
        const isProductTrend = trend.id.startsWith('product-');
        return (
          <TrendListItem
            key={trend.id}
            trend={trend}
            isSelected={selectedTrend?.id === trend.id}
            isProductTrend={isProductTrend}
            language={language}
            onClick={onSelectTrend}
            onEdit={onEditTrend}
            onToggleArchive={onToggleTrendArchive}
          />
        );
      })}
    </Sidebar>
  );
};

export default NavigationSidebar;