import React, { useState, useRef, useEffect } from 'react';
import type { MediaPlanGroup } from '../../../types';
import { SearchIcon } from '../icons';
import { Input } from '../ui';
import Sidebar from '../common/Sidebar';
import MediaPlanListItem from './MediaPlanListItem';

interface MediaPlanSidebarProps {
  language: string;
  planGroups: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[], personaId?: string}[];
  activePlanId: string | null;
  onSelectPlan: (planId: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onCreatePlan: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const MediaPlanSidebar: React.FC<MediaPlanSidebarProps> = ({
  language,
  planGroups,
  activePlanId,
  onSelectPlan,
  isSidebarOpen,
  setIsSidebarOpen,
  onCreatePlan,
  searchQuery = '',
  onSearchChange
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  // Debounce search input
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(query);
      }
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

  const T = {
    'Việt Nam': {
      plans: "Kế hoạch",
      addPlan: "Thêm kế hoạch",
      newPlan: "Kế hoạch mới",
      searchPlaceholder: "Tìm kiếm kế hoạch...",
    },
    'English': {
      plans: "Plans",
      addPlan: "Add Plan",
      newPlan: "New Plan",
      searchPlaceholder: "Search plans...",
    }
  };
  const texts = (T as any)[language] || T['English'];

  // Filter plan groups based on search query
  const filteredPlanGroups = planGroups.filter(plan => 
    plan.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    plan.prompt.toLowerCase().includes(localSearchQuery.toLowerCase())
  );

  const handleEditPlan = (planId: string) => {
    // For now, just select the plan (editing can be implemented separately)
    onSelectPlan(planId);
  };

  return (
    <Sidebar
      title={texts.plans}
      itemCount={filteredPlanGroups.length}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      onSearchChange={onSearchChange ? handleSearchChange : undefined}
      searchPlaceholder={texts.searchPlaceholder}
      language={language}
    >
      {filteredPlanGroups.map(plan => (
        <MediaPlanListItem
          key={plan.id}
          plan={plan}
          isSelected={activePlanId === plan.id}
          onClick={onSelectPlan}
          onEdit={handleEditPlan}
          language={language}
        />
      ))}
    </Sidebar>
  );
};

export default MediaPlanSidebar;