import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MediaPlanGroup, MediaPlanPost, Settings, AffiliateLink, SchedulingPost, Persona, PostInfo, Idea } from '../../types';
import { Button, Input, Select } from './ui';
import { 
  ArchiveIcon, 
  SparklesIcon, 
  PlusIcon, 
  CalendarIcon, 
  CollectionIcon, 
  TagIcon, 
  YouTubeIcon, 
  FacebookIcon, 
  InstagramIcon, 
  TikTokIcon, 
  PinterestIcon, 
  KhongMinhIcon, 
  ChatBubbleLeftIcon, 
  SearchIcon, 
  PencilIcon, 
  PhotographIcon, 
  CheckSolidIcon, 
  TrashIcon, 
  ListBulletIcon, 
  LightBulbIcon, 
  LinkIcon, 
  DotsVerticalIcon, 
  ChevronDownIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  UsersIcon,
  FunnelIcon // New icon import
} from './icons';
import PostCard from './PostCard';
import PostDetailModal from './PostDetailModal';
import CalendarView from './CalendarView';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

interface MediaPlanDisplayProps {
  plans: MediaPlanGroup[];
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  onOpenWizard: (prompt?: string) => void;
  onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9", postInfo?: PostInfo) => void;
  onSetImage: (dataUrl: string, key: string, postInfo?: PostInfo) => void;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  onSetVideo: (dataUrl: string, key: string, postInfo: PostInfo) => void;
  isGeneratingImage: (key: string) => boolean;
  settings: Settings;
  onExport: () => void;
  isExporting: boolean;
  onRegenerateWeekImages: (planId: string, weekIndex: number) => void;
  planGroupsList: {id: string; name: string; prompt: string; source?: MediaPlanGroup['source']; productImages?: { name: string, type: string, data: string }[], personaId?: string;}[];
  onSelectPlan: (planId: string) => void;
  activePlanId: string | null;
  onUpdatePost: (postInfo: PostInfo) => void;
  onRefinePost: (text: string) => Promise<string>;
  onAssignPersonaToPlan: (planId: string, personaId: string | null) => void;
  // KhongMinh Props
  analyzingPostIds: Set<string>;
  isAnyAnalysisRunning: boolean;
  khongMinhSuggestions: Record<string, AffiliateLink[]>;
  onAcceptSuggestion: (postInfo: PostInfo, productId: string) => void;
  onRunKhongMinhForPost: (postInfo: PostInfo) => void;
  // On-demand prompt generation
  generatingPromptKeys: Set<string>;
  onGeneratePrompt: (postInfo: PostInfo) => Promise<MediaPlanPost | null>;
  // Comment Generation
  onGenerateAffiliateComment: (postInfo: PostInfo) => Promise<MediaPlanPost | null>;
  generatingCommentPostIds: Set<string>;
  // Selection & Scheduling
  selectedPostIds: Set<string>;
  onTogglePostSelection: (postId: string) => void;
  onSelectAllPosts: (posts: PostInfo[]) => void;
  onClearSelection: () => void;
  onOpenScheduleModal: (post: SchedulingPost | null) => void;
  onOpenBulkScheduleModal: () => void;
  onPostDrop: (postInfo: SchedulingPost, newDate: Date) => void;
  // Bulk Actions
  isPerformingBulkAction: boolean;
  onBulkGenerateImages: (posts: PostInfo[]) => void;
  onBulkSuggestPromotions: (posts: PostInfo[]) => void;
  onBulkGenerateComments: (posts: PostInfo[]) => void;
  onPublishPost: (postInfo: PostInfo) => void; // New prop for direct publishing
  brandFoundation: GeneratedAssets['brandFoundation'];
  // New prop for opening funnel wizard
  onOpenFunnelWizard: () => void;
  viewingPost: PostInfo | null;
  setViewingPost: (postInfo: PostInfo | null) => void;
}

const MediaPlanDisplay: React.FC<MediaPlanDisplayProps> = (props) => {
  console.log("MediaPlanDisplay rendered with props:", props);
  
  const { 
    plans, 
    personas, 
    settings, 
    onExport, 
    isExporting, 
    onOpenWizard, 
    planGroupsList, 
    onSelectPlan, 
    activePlanId, 
    isAnyAnalysisRunning, 
    onUpdatePost, 
    onOpenScheduleModal, 
    onOpenBulkScheduleModal, 
    onPostDrop, 
    isPerformingBulkAction, 
    onBulkGenerateImages, 
    onBulkSuggestPromotions, 
    onBulkGenerateComments, 
    onAssignPersonaToPlan, 
    onPublishPost, 
    brandFoundation,
    onOpenFunnelWizard, // New prop
    viewingPost,
    setViewingPost
  } = props;
  const { language } = settings;
  
    const [viewMode, setViewMode] = useState<'feed' | 'calendar'>('feed');
    const [isPlanSidebarOpen, setIsPlanSidebarOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('date-desc');
    
    const [currentPage, setCurrentPage] = useState(1);

  const T = {
    'Việt Nam': { 
      export_plans: 'Xuất Kế hoạch', 
      exporting: 'Đang xuất...', 
      select_plan_title: "Chọn một Kế hoạch",
      select_plan_subtitle: "Chọn một kế hoạch từ thanh bên để xem chi tiết, hoặc tạo một kế hoạch mới.",
      generate_plan_title: "Tạo Kế hoạch Đầu tiên của bạn",
      generate_plan_subtitle: "Bắt đầu chiến lược nội dung của bạn.",
      plans_sidebar_title: "Kế hoạch",
      plan_prompt: "Prompt",
      pkgLabel: "Gói ND",
      newPlanButton: "Kế hoạch Mới",
      newFunnelPlanButton: "Chiến dịch Funnel", // New button text
      kpiTotalPosts: "Tổng số bài đăng",
      kpiPlatforms: "Nền tảng được sử dụng",
      kpiPostsThisWeek: "Bài đăng tuần này",
      assignPersona: "Gán KOL/KOC",
      noPersonaAssigned: "Chưa gán KOL/KOC",
      listViewTitle: "Dòng nội dung",
      filter_search: "Tìm kiếm bài đăng...",
      filter_sort_by: "Sắp xếp theo",
      filter_sort_date_desc: "Ngày (Mới nhất)",
      filter_sort_date_asc: "Ngày (Cũ nhất)",
      filter_sort_title_asc: "Tiêu đề (A-Z)",
      filter_sort_title_desc: "Tiêu đề (Z-A)",
      filter_platforms: "Nền tảng:",
      filter_status: "Trạng thái:",
      filter_status_scheduled: "Đã lên lịch",
      filter_status_draft: "Bản nháp",
      filter_status_published: "Đã đăng",
      filter_status_promo: "Có khuyến mãi",
      filter_status_comment: "Có bình luận",
      filter_status_image: "Có ảnh",
      filter_no_results: "Không tìm thấy bài đăng nào",
      filter_no_results_desc: "Thử xóa một số bộ lọc để xem nhiều kết quả hơn.",
      selection_title: "Đã chọn:",
      selection_clear: "Xóa",
      selection_schedule: "Lên lịch",
      selection_delete: "Xóa",
      selection_gen_images: "Tạo ảnh",
      selection_sug_promo: "Gợi ý KM",
      selection_gen_comment: "Tạo BL (NgoSiLien)",
      view_toggle_feed: "Dạng Lưới",
      view_toggle_calendar: "Dạng Lịch",
      filters_title: "Bộ lọc",
      select_plan_mobile: "Chọn Kế hoạch",
    },
    'English': { 
      export_plans: 'Export Plan', 
      exporting: 'Exporting...', 
      select_plan_title: "Select a Plan",
      select_plan_subtitle: "Choose a plan from the sidebar to see its details, or generate a new one.",
      generate_plan_title: "Generate Your First Plan",
      generate_plan_subtitle: "Kickstart your content strategy.",
      plans_sidebar_title: "Plans",
      plan_prompt: "Prompt",
      pkgLabel: "Content Pkg",
      newPlanButton: "New Plan",
      newFunnelPlanButton: "Funnel Campaign", // New button text
      kpiTotalPosts: "Total Posts",
      kpiPlatforms: "Platforms Used",
      kpiPostsThisWeek: "Posts This Week",
      assignPersona: "Assign KOL/KOC",
      noPersonaAssigned: "No KOL/KOC Assigned",
      listViewTitle: "Content Feed",
      filter_search: "Search posts...",
      filter_sort_by: "Sort by",
      filter_sort_date_desc: "Date (Newest)",
      filter_sort_date_asc: "Date (Oldest)",
      filter_sort_title_asc: "Title (A-Z)",
      filter_sort_title_desc: "Title (Z-A)",
      filter_platforms: "Platforms:",
      filter_status: "Status:",
      filter_status_scheduled: "Scheduled",
      filter_status_draft: "Draft",
      filter_status_published: "Published",
      filter_status_promo: "Has Promo",
      filter_status_comment: "Has Comment",
      filter_status_image: "Has Image",
      filter_no_results: "No posts found",
      filter_no_results_desc: "Try clearing some filters to see more results.",
      selection_title: "Selected:",
      selection_clear: "Clear",
      selection_schedule: "Schedule",
      selection_delete: "Delete",
      selection_gen_images: "Gen. Images",
      selection_sug_promo: "Sug. Promos",
      selection_gen_comment: "Gen. Comments (NgoSiLien)",
      view_toggle_feed: "Feed View",
      view_toggle_calendar: "Calendar View",
      filters_title: "Filters",
      select_plan_mobile: "Select Plan",
    }
  };
  const currentTexts = (T as any)[language] || T['English'];

  const unifiedSidebarItems = useMemo(() => {
    return (planGroupsList || []).map(group => ({
      id: group.id,
      name: group.name,
      description: `${currentTexts.plan_prompt}: "${group.prompt}"`,
      source: group.source,
    }));
  }, [planGroupsList, currentTexts.plan_prompt]);

  const selectedPlan = useMemo(() => {
    if (!activePlanId) return null;
    return plans.find(p => p.id === activePlanId) || null;
  }, [activePlanId, plans]);

  // Get initial posts from the selected plan
  const initialPosts = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.plan.flatMap(week => week.posts || []);
  }, [selectedPlan]);

  // Use the infinite scroll hook
  const { 
    posts: paginatedPosts, 
    loadMorePosts, 
    hasMore, 
    loading: isLoadingMorePosts,
    error: paginationError,
    totalPosts
  } = useInfiniteScroll(activePlanId, initialPosts);

  // Calculate total pages for pagination display
  const totalPages = useMemo(() => {
    return Math.ceil(totalPosts / 30);
  }, [totalPosts]);


  // This effect ensures that if the modal is open (`viewingPost` is not null),
  // and the underlying data changes (e.g., after an image generation),
  // the modal's data (`viewingPost`) is updated to reflect those changes.
  useEffect(() => {
    if (!viewingPost) return;

    const plan = plans.find(p => p.id === viewingPost.planId);
    const updatedPost = plan?.plan[viewingPost.weekIndex]?.posts[viewingPost.postIndex];
    
    if (updatedPost && updatedPost.id === viewingPost.post.id) {
      if (JSON.stringify(updatedPost) !== JSON.stringify(viewingPost.post)) {
        setViewingPost(prev => prev ? { ...prev, post: updatedPost } : null);
      }
    } else {
      // Post was not found (e.g., plan changed), but we don't close the modal
      // to prevent it from disappearing unexpectedly.
      // The user can close it manually.
    }
  }, [plans, viewingPost, setViewingPost]);

  const handleViewDetails = (postInfo: PostInfo) => {
    setViewingPost(postInfo);
  };
  
  const platformOptions = [
    { id: 'YouTube', Icon: YouTubeIcon }, { id: 'Facebook', Icon: FacebookIcon }, { id: 'Instagram', Icon: InstagramIcon }, { id: 'TikTok', Icon: TikTokIcon }, { id: 'Pinterest', Icon: PinterestIcon }
  ];

  const statusOptions = [
    { id: 'published', text: currentTexts.filter_status_published, Icon: CheckSolidIcon },
    { id: 'scheduled', text: currentTexts.filter_status_scheduled, Icon: CalendarIcon },
    { id: 'draft', text: currentTexts.filter_status_draft, Icon: PencilIcon },
    { id: 'promo', text: currentTexts.filter_status_promo, Icon: KhongMinhIcon },
    { id: 'comment', text: currentTexts.filter_status_comment, Icon: ChatBubbleLeftIcon },
    { id: 'image', text: currentTexts.filter_status_image, Icon: PhotographIcon },
  ];

  const { planKPIs, assignedPersona } = useMemo(() => {
    if (!selectedPlan) return { planKPIs: { totalPosts: 0, platformCount: 0, postsThisWeek: 0 }, assignedPersona: null };
    
    const allPosts = selectedPlan.plan.flatMap(w => w.posts || []);
    const platformCount = new Set(allPosts.map(p => p.platform)).size;
    
    const postsThisWeek = selectedPlan.plan[0]?.posts?.length || 0;
    
    const persona = personas.find(p => p.id === selectedPlan.personaId);

    return {
      planKPIs: {
        totalPosts: allPosts.length,
        platformCount,
        postsThisWeek
      },
      assignedPersona: persona || null
    };
  }, [selectedPlan, personas]);

      // Convert paginated posts to PostInfo format with correct weekIndex and postIndex
    const paginatedPostInfos = useMemo(() => {
        if (!selectedPlan) return [];
        
        // Create a map of post.id to its location for quick lookup
        const postLocationMap = new Map<string, { weekIndex: number, postIndex: number }>();
        selectedPlan.plan.forEach((week, weekIndex) => {
            week.posts.forEach((post, postIndex) => {
                postLocationMap.set(post.id, { weekIndex, postIndex });
            });
        });
        
        // Map paginatedPosts to PostInfo with correct indices
        return paginatedPosts.map((post) => {
            const location = postLocationMap.get(post.id);
            if (!location) {
                // Fallback, though this shouldn't happen if data is consistent
                console.warn(`Post with id ${post.id} not found in plan structure`);
                return {
                    planId: selectedPlan.id,
                    weekIndex: 0,
                    postIndex: 0,
                    post,
                };
            }
            
            return {
                planId: selectedPlan.id,
                weekIndex: location.weekIndex,
                postIndex: location.postIndex,
                post,
            };
        });
    }, [paginatedPosts, selectedPlan]);

    const displayedPosts = useMemo(() => {
        let filteredPosts = [...paginatedPostInfos];

        if (searchQuery) {
            filteredPosts = filteredPosts.filter(p =>
                p.post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.post.hashtags || []).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedPlatforms.length > 0) {
            filteredPosts = filteredPosts.filter(p => selectedPlatforms.includes(p.post.platform));
        }

        if (selectedStatuses.length > 0) {
            filteredPosts = filteredPosts.filter(p => {
                const imageUrl = p.post.imageKey ? props.generatedImages[p.post.imageKey] : undefined;
                return selectedStatuses.every(status => {
                    switch (status) {
                        case 'published': return p.post.status === 'published';
                        case 'scheduled': return p.post.status === 'scheduled';
                        case 'draft': return p.post.status === 'draft' || !p.post.status;
                        case 'promo': return (p.post.promotedProductIds?.length || 0) > 0;
                        case 'comment': return !!p.post.autoComment;
                        case 'image': return !!imageUrl;
                        default: return true;
                    }
                });
            });
        }

        filteredPosts.sort((a, b) => {
            const [key, dir] = sortBy.split('-');
            const isAsc = dir === 'asc';

            if (key === 'date') {
                const dateA = a.post.publishedAt ? new Date(a.post.publishedAt).getTime() : (a.post.scheduledAt ? new Date(a.post.scheduledAt).getTime() : 0);
                const dateB = b.post.publishedAt ? new Date(b.post.publishedAt).getTime() : (b.post.scheduledAt ? new Date(b.post.scheduledAt).getTime() : 0);
                if (dateA === 0 && dateB !== 0) return 1;
                if (dateB === 0 && dateA !== 0) return -1;
                return isAsc ? dateA - dateB : dateB - dateA;
            }

            if (key === 'title') {
                return isAsc ? a.post.title.localeCompare(b.post.title) : b.post.title.localeCompare(a.post.title);
            }
            return 0;
        });

        return filteredPosts;
    }, [paginatedPostInfos, searchQuery, selectedPlatforms, selectedStatuses, sortBy, props.generatedImages]);
  
  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]);
  };
  
  const handleStatusToggle = (statusId: string) => {
    setSelectedStatuses(prev => prev.includes(statusId) ? prev.filter(s => s !== statusId) : [...prev, statusId]);
  };
  
  const isAllDisplayedSelected = displayedPosts.length > 0 && props.selectedPostIds.size === displayedPosts.length && displayedPosts.every(p => props.selectedPostIds.has(p.post.id));

  const handleSelectAllToggle = () => {
    if (isAllDisplayedSelected) {
      props.onClearSelection();
    } else {
      props.onSelectAllPosts(displayedPosts);
    }
  };
  
  const handleBulkAction = (action: (posts: PostInfo[]) => void) => {
    const selectedPostsInOrder = displayedPosts.filter(p => props.selectedPostIds.has(p.post.id));
    action(selectedPostsInOrder);
  };

  const FilterToggleButton: React.FC<{ children: React.ReactNode, onClick: () => void, isActive: boolean }> = ({ children, onClick, isActive }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-colors flex items-center gap-2 ${isActive ? 'bg-green-50 border-brand-green shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
    >
      {children}
    </button>
  );

  const showFeed = viewMode === 'feed';
  const showCalendar = viewMode === 'calendar';

  const sidebarContent = (
    <div className="p-6 flex flex-col h-full bg-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold font-sans text-gray-900 shrink-0">{currentTexts.plans_sidebar_title}</h2>
        <div className="flex flex-col items-stretch gap-2 shrink-0">
          {/* New Funnel Campaign button */}
          <Button 
            onClick={onOpenFunnelWizard}
            variant="secondary" 
            className="w-full whitespace-nowrap flex items-center justify-center gap-2 rounded-md px-3 py-2"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>{currentTexts.newFunnelPlanButton}</span>
          </Button>
          <Button 
            onClick={() => onOpenWizard()}
            variant="primary" 
            className="w-full whitespace-nowrap flex items-center justify-center gap-2 rounded-md px-3 py-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>{currentTexts.newPlanButton}</span>
          </Button>
        </div>
      </div>
      <div className="space-y-2 flex-grow overflow-y-auto">
         {unifiedSidebarItems.map(item => (
          <button
            key={item.id}
            onClick={() => {onSelectPlan(item.id); setIsPlanSidebarOpen(false);}}
            className={`w-full text-left p-4 rounded-lg transition-colors border-2 ${activePlanId === item.id ? 'bg-green-50 border-brand-green' : 'bg-white hover:bg-gray-100 border-gray-200'}`}
          >
            <div className="flex justify-between items-start">
               <h3 className="font-bold font-sans text-gray-900">{item.name}</h3>
               {item.source === 'content-package' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{currentTexts.pkgLabel}</span>
               )}
            </div>
            <p className="text-sm text-gray-500 mt-1 font-serif truncate">{item.description}</p>
          </button>
        ))}
        {unifiedSidebarItems.length === 0 && (
           <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
             <p>{currentTexts.generate_plan_subtitle}</p>
           </div>
        )}
      </div>
       <div className="mt-auto pt-4 flex flex-col gap-2">
         <Button 
            onClick={onExport} 
            disabled={isExporting || plans.length === 0}
            variant="tertiary" 
            className="w-full flex items-center justify-center gap-2"
          >
            {isExporting ? <div className="w-5 h-5 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div> : <ArchiveIcon className="h-5 w-5" />}
            {currentTexts.export_plans}
          </Button>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col xl:flex-row h-full bg-gray-50/50">
        {/* Mobile sidebar overlay */}
        {isPlanSidebarOpen && (
          <div className="xl:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setIsPlanSidebarOpen(false)}></div>
        )}
        {/* Sidebar */}
        <aside className={`fixed xl:relative inset-y-0 left-0 w-80 md:w-96 border-r border-gray-200 transform transition-transform z-40 ${isPlanSidebarOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0 shrink-0`}>
          {sidebarContent}
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
           {selectedPlan ? (
            <div className="max-w-7xl mx-auto">
              <header className="mb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-3xl font-bold font-sans text-gray-900">
                      {selectedPlan.name}
                    </h3>
                    <p className="text-lg text-gray-500 font-serif">
                      {selectedPlan.prompt}
                    </p>
                  </div>
                  <Button onClick={() => setIsPlanSidebarOpen(true)} className="xl:hidden flex-shrink-0 ml-4" variant="secondary">{currentTexts.select_plan_mobile}</Button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2">
                    <CollectionIcon className="h-5 w-5 text-gray-400" />
                    <p><span className="font-semibold text-gray-800">{planKPIs.totalPosts}</span> {language === 'Việt Nam' ? 'bài đăng' : 'posts'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-5 w-5 text-gray-400" />
                    <p><span className="font-semibold text-gray-800">{planKPIs.platformCount}</span> {language === 'Việt Nam' ? 'nền tảng' : 'platforms'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-gray-400" />
                    {assignedPersona ? (
                      <div className="flex items-center gap-2 bg-white rounded-md p-2 shadow-sm border border-gray-200">
                        {assignedPersona.avatarImageUrl || (assignedPersona.photos.length > 0 && props.generatedImages[assignedPersona.photos[0].imageKey]) ? (
                          <img
                            src={assignedPersona.avatarImageUrl || props.generatedImages[assignedPersona.photos[0].imageKey]}
                            alt={assignedPersona.nickName}
                            className="h-8 w-8 rounded-full object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                            <UsersIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{assignedPersona.nickName}</p>
                          <p className="text-xs text-gray-500 leading-tight">{assignedPersona.mainStyle} | {assignedPersona.activityField}</p>
                        </div>
                        <select
                          value={selectedPlan.personaId || ''}
                          onChange={(e) => onAssignPersonaToPlan(activePlanId!, e.target.value || null)}
                          className="text-sm bg-transparent border-gray-300 rounded-md py-1 pl-2 pr-8 focus:ring-brand-green focus:border-brand-green ml-2"
                        >
                          <option value="">{currentTexts.noPersonaAssigned}</option>
                          {personas.map(p => <option key={p.id} value={p.id}>{p.nickName}</option>)}
                        </select>
                      </div>
                    ) : (
                      <select
                        value={selectedPlan.personaId || ''}
                        onChange={(e) => onAssignPersonaToPlan(activePlanId!, e.target.value || null)}
                        className="text-sm bg-transparent border-gray-300 rounded-md py-1 pl-2 pr-8 focus:ring-brand-green focus:border-brand-green"
                      >
                        <option value="">{currentTexts.noPersonaAssigned}</option>
                        {personas.map(p => <option key={p.id} value={p.id}>{p.nickName}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </header>
              
              <div className="flex justify-center mb-8">
                <div className="inline-flex rounded-lg shadow-sm border border-gray-200 bg-white p-1">
                  <Button
                    variant={viewMode === 'feed' ? 'primary' : 'tertiary'}
                    onClick={() => setViewMode('feed')}
                    className={`!rounded-md px-4 py-1.5 flex items-center gap-2 !text-sm ${viewMode === 'feed' ? '' : 'text-gray-600'}`}
                  >
                    <ListBulletIcon className="h-5 w-5"/>
                    {currentTexts.view_toggle_feed}
                  </Button>
                  <Button
                     variant={viewMode === 'calendar' ? 'primary' : 'tertiary'}
                    onClick={() => setViewMode('calendar')}
                    className={`!rounded-md px-4 py-1.5 flex items-center gap-2 !text-sm ${viewMode === 'calendar' ? '' : 'text-gray-600'}`}
                  >
                    <CalendarIcon className="h-5 w-5"/>
                    {currentTexts.view_toggle_calendar}
                  </Button>
                </div>
              </div>
              
              {showFeed && (
                <div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8">
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="w-full flex justify-between items-center font-semibold md:hidden">
                      <span>{currentTexts.filters_title}</span>
                      <ChevronDownIcon className={`h-5 w-5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`space-y-4 ${isFilterOpen ? 'mt-4' : 'hidden'} md:block`}>
                      {props.selectedPostIds.size > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm border-t-2 border-brand-green shadow-lg z-20 animate-fade-in md:relative md:bottom-auto md:p-3 md:bg-green-50 md:border md:border-green-200 md:rounded-lg md:shadow-sm">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <input
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                                checked={isAllDisplayedSelected}
                                onChange={handleSelectAllToggle}
                                aria-label="Select all displayed posts"
                                disabled={isPerformingBulkAction}
                              />
                              <span className="font-semibold text-gray-800">{currentTexts.selection_title} {props.selectedPostIds.size}</span>
                              <Button variant="tertiary" onClick={props.onClearSelection} className="text-sm py-1 px-2" disabled={isPerformingBulkAction}>{currentTexts.selection_clear}</Button>
                            </div>
                            <div className="flex items-center gap-2 sm:ml-auto flex-wrap justify-end">
                              <Button onClick={() => handleBulkAction(onBulkGenerateImages)} disabled={isPerformingBulkAction} variant="secondary" className="bg-white text-sm py-1.5 px-3 flex items-center gap-1.5"><PhotographIcon className="h-4 w-4" /> {currentTexts.selection_gen_images}</Button>
                              <Button onClick={() => handleBulkAction(onBulkSuggestPromotions)} disabled={isPerformingBulkAction} variant="secondary" className="bg-white text-sm py-1.5 px-3 flex items-center gap-1.5"><KhongMinhIcon className="h-4 w-4" /> {currentTexts.selection_sug_promo}</Button>
                              <Button onClick={() => handleBulkAction(onBulkGenerateComments)} disabled={isPerformingBulkAction} variant="secondary" className="bg-white text-sm py-1.5 px-3 flex items-center gap-1.5"><ChatBubbleLeftIcon className="h-4 w-4" /> {currentTexts.selection_gen_comment}</Button>
                              <Button onClick={onOpenBulkScheduleModal} disabled={isPerformingBulkAction} className="text-sm py-1.5 px-3 flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {currentTexts.selection_schedule}</Button>
                              <Button variant="secondary" className="bg-white text-red-600 border-red-200 hover:bg-red-50 text-sm py-1.5 px-3 flex items-center gap-1.5" disabled={isPerformingBulkAction}><TrashIcon className="h-4 w-4" /> {currentTexts.selection_delete}</Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <Input placeholder={currentTexts.filter_search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 flex-shrink-0">{currentTexts.filter_sort_by}:</label>
                          <Select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full">
                            <option value="date-desc">{currentTexts.filter_sort_date_desc}</option>
                            <option value="date-asc">{currentTexts.filter_sort_date_asc}</option>
                            <option value="title-asc">{currentTexts.filter_sort_title_asc}</option>
                            <option value="title-desc">{currentTexts.filter_sort_title_desc}</option>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">{currentTexts.filter_platforms}</span>
                        {platformOptions.map(({ id, Icon }) => (
                          <FilterToggleButton key={id} onClick={() => handlePlatformToggle(id)} isActive={selectedPlatforms.includes(id)}>
                            <Icon className="h-5 w-5" />
                          </FilterToggleButton>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">{currentTexts.filter_status}</span>
                        {statusOptions.map(({ id, text, Icon }) => (
                          <FilterToggleButton key={id} onClick={() => handleStatusToggle(id)} isActive={selectedStatuses.includes(id)}>
                            <Icon className={`h-4 w-4 ${selectedStatuses.includes(id) ? 'text-brand-green' : 'text-gray-500'}`} />
                            <span>{text}</span>
                          </FilterToggleButton>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`${props.selectedPostIds.size > 0 ? 'pb-24 md:pb-0' : ''}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold font-sans text-gray-900">{currentTexts.listViewTitle}</h2>
                    </div>
                    {displayedPosts.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {displayedPosts.map(postInfo => {
                            const promotedProductsCount = postInfo.post.promotedProductIds?.length || 0;
                            return (
                              <PostCard
                                key={postInfo.post.id}
                                postInfo={postInfo}
                                language={language}
                                imageUrl={postInfo.post.imageKey ? props.generatedImages[postInfo.post.imageKey] : undefined}
                                videoUrl={postInfo.post.videoKey ? props.generatedVideos[postInfo.post.videoKey] : undefined}
                                promotedProductsCount={promotedProductsCount}
                                isDraft={postInfo.post.status === 'draft' || (!postInfo.post.status && !postInfo.post.scheduledAt)}
                                isSelected={props.selectedPostIds.has(postInfo.post.id)}
                                onToggleSelection={() => props.onTogglePostSelection(postInfo.post.id)}
                                onViewDetails={handleViewDetails}
                                scheduledAt={postInfo.post.scheduledAt}
                                publishedAt={postInfo.post.publishedAt}
                                publishedUrl={postInfo.post.publishedUrl}
                              />
                            )
                          })}
                        </div>
                        
                        {/* Infinite Scroll Trigger */}
                        {hasMore && (
                          <div className="mt-8 flex justify-center">
                            <Button
                              onClick={loadMorePosts}
                              disabled={isLoadingMorePosts}
                              variant="secondary"
                              className="flex items-center gap-2"
                            >
                              {isLoadingMorePosts ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div>
                                  {language === 'Việt Nam' ? 'Đang tải...' : 'Loading...'}
                                </>
                              ) : (
                                <>
                                  <ChevronDownIcon className="h-5 w-5" />
                                  {language === 'Việt Nam' ? 'Tải thêm bài đăng' : 'Load more posts'}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {/* Manual Pagination Controls (fallback) */}
                        {totalPages > 1 && (
                          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-700">
                                {language === 'Việt Nam' 
                                  ? `Trang ${currentPage} trên ${totalPages}` 
                                  : `Page ${currentPage} of ${totalPages}`}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                variant="tertiary"
                                className="flex items-center gap-1"
                              >
                                <ChevronLeftIcon className="h-4 w-4" />
                                {language === 'Việt Nam' ? 'Trước' : 'Previous'}
                              </Button>
                              
                              {/* Page numbers */}
                              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                const pageNum = 
                                  totalPages <= 5 
                                    ? i + 1 
                                    : currentPage <= 3 
                                      ? i + 1 
                                      : currentPage >= totalPages - 2 
                                        ? totalPages - 4 + i 
                                        : currentPage - 2 + i;
                                        
                                return (
                                  <Button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    variant={currentPage === pageNum ? 'primary' : 'tertiary'}
                                    className={`w-10 h-10 ${currentPage === pageNum ? '' : 'text-gray-700'}`}
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              })}
                              
                              <Button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                variant="tertiary"
                                className="flex items-center gap-1"
                              >
                                {language === 'Việt Nam' ? 'Tiếp' : 'Next'}
                                <ChevronRightIcon className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-700">
                                {language === 'Việt Nam' 
                                  ? `${displayedPosts.length} bài đăng` 
                                  : `${displayedPosts.length} posts`}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed">
                        <SearchIcon className="mx-auto h-12 w-12 text-gray-400"/>
                        <h3 className="mt-2 text-xl font-semibold text-gray-900">{currentTexts.filter_no_results}</h3>
                        <p className="mt-1 text-sm text-gray-500">{currentTexts.filter_no_results_desc}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showCalendar && (
               <CalendarView
                 plan={selectedPlan.plan}
                 planId={selectedPlan.id}
                 language={language}
                 onPostDrop={onPostDrop}
                 onViewDetails={handleViewDetails}
               />
              )}
            </div>
           ) : (
             <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
               <h3 className="text-3xl font-bold font-sans text-gray-900">
                 {unifiedSidebarItems.length > 0 ? currentTexts.select_plan_title : currentTexts.generate_plan_title}
               </h3>
               <p className="text-lg text-gray-500 mt-2 font-serif max-w-md mx-auto">
                 {unifiedSidebarItems.length > 0 ? currentTexts.select_plan_subtitle : currentTexts.generate_plan_subtitle}
               </p>
               <div className="mt-6 xl:hidden">
                 <Button onClick={() => setIsPlanSidebarOpen(true)}>{currentTexts.select_plan_mobile}</Button>
               </div>
             </div>
           )}
         </main>

         {viewingPost && (
           <PostDetailModal
             isOpen={!!viewingPost}
             onClose={() => setViewingPost(null)}
             postInfo={viewingPost}
             language={language}
             weekTheme={selectedPlan?.plan[viewingPost.weekIndex]?.theme}
             onUpdatePost={(updatedInfo) => {
               onUpdatePost(updatedInfo);
               setViewingPost(updatedInfo);
             }}
             onAcceptSuggestion={(productId) => {
               if(viewingPost) {
                 const updatedPost = {
                   ...viewingPost.post,
                   promotedProductIds: [...(viewingPost.post.promotedProductIds || []), productId],
                 };
                 const updatedInfo = { ...viewingPost, post: updatedPost };
                 setViewingPost(updatedInfo);
                 props.onUpdatePost(updatedInfo);
               }
             }}
             onRunKhongMinhForPost={() => {
               if(viewingPost) props.onRunKhongMinhForPost(viewingPost);
             }}
             affiliateLinks={props.affiliateLinks}
             generatedImages={props.generatedImages}
             generatedVideos={props.generatedVideos}
             onSetVideo={props.onSetVideo}
             isAnyAnalysisRunning={props.isAnyAnalysisRunning}
             isGeneratingImage={props.isGeneratingImage}
             isGeneratingPrompt={props.generatingPromptKeys.has(`${viewingPost.planId}_${viewingPost.weekIndex}_${viewingPost.postIndex}`)}
             isAnalyzing={props.analyzingPostIds.has(viewingPost.post.id)}
             khongMinhSuggestions={props.khongMinhSuggestions}
             onGenerateImage={props.onGenerateImage}
             onGeneratePrompt={async (postInfo) => {
               const updatedPost = await props.onGeneratePrompt(postInfo);
               if (updatedPost) {
                 setViewingPost({ ...postInfo, post: updatedPost });
               }
             }}
             onRefinePost={props.onRefinePost}
             onSetImage={props.onSetImage}
             isGeneratingComment={props.generatingCommentPostIds.has(viewingPost.post.id)}
             onGenerateComment={async (postInfo) => {
               const updatedPost = await props.onGenerateAffiliateComment(postInfo);
               if (updatedPost) {
                 setViewingPost({ ...postInfo, post: updatedPost });
               }
             }}
             onOpenScheduleModal={() => {
               onOpenScheduleModal(viewingPost as SchedulingPost)
             }}
             onPublishPost={async (postInfo) => {
               await props.onPublishPost(postInfo);
             }}
             publishedUrl={viewingPost.post.publishedUrl}
             publishedAt={viewingPost.post.publishedAt}
           />
         )}
       </div>
     );
   };

   export default MediaPlanDisplay;