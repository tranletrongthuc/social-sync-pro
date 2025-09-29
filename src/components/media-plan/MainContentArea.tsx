import React, { useMemo, useState } from 'react';
import type { MediaPlanPost, Settings, AffiliateLink, PostInfo, MediaPlanGroup, SchedulingPost, Persona, PostStatus } from '../../../types';
import { Button } from '../ui';
import { SparklesIcon, FunnelIcon, CalendarIcon, PhotographIcon, ChatBubbleLeftIcon, TrashIcon } from '../icons';
import PostCard from '../PostCard';

// Define the props for the new Toolbar component
interface MediaPlanToolbarProps {
  language: string;
  platformFilter: string;
  setPlatformFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onToggleSelectAll: () => void;
  areAllSelected: boolean;
  selectedCount: number;
  onBulkSchedule: () => void;
  onBulkGenerateImages: () => void;
  onBulkSuggestPromotions: () => void;
  onBulkGenerateComments: () => void;
  isPerformingBulkAction: boolean;
  allPostsCount: number;
}

const MediaPlanToolbar: React.FC<MediaPlanToolbarProps> = ({
  language,
  platformFilter,
  setPlatformFilter,
  statusFilter,
  setStatusFilter,
  onToggleSelectAll,
  areAllSelected,
  selectedCount,
  onBulkSchedule,
  onBulkGenerateImages,
  onBulkSuggestPromotions,
  onBulkGenerateComments,
  isPerformingBulkAction,
  allPostsCount
}) => {
  const T = {
    'Việt Nam': {
      filterByPlatform: "Lọc theo nền tảng",
      allPlatforms: "Tất cả nền tảng",
      filterByStatus: "Lọc theo trạng thái",
      allStatuses: "Tất cả trạng thái",
      selectAll: "Chọn tất cả",
      deselectAll: "Bỏ chọn tất cả",
      selected: "đã chọn",
      bulkActions: "Hành động hàng loạt",
      schedule: "Lên lịch",
      genImages: "Tạo ảnh",
      genPromos: "Gợi ý SP",
      genComments: "Tạo bình luận",
    },
    'English': {
      filterByPlatform: "Filter by platform",
      allPlatforms: "All Platforms",
      filterByStatus: "Filter by status",
      allStatuses: "All Statuses",
      selectAll: "Select All",
      deselectAll: "Deselect All",
      selected: "selected",
      bulkActions: "Bulk Actions",
      schedule: "Schedule",
      genImages: "Gen. Images",
      genPromos: "Suggest Promos",
      genComments: "Gen. Comments",
    }
  };
  const texts = (T as any)[language] || T['English'];

  const platforms = ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'Pinterest'];
  const statuses: PostStatus[] = ['draft', 'needs_review', 'approved', 'scheduled', 'published'];

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">{texts.filterByPlatform}:</label>
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="rounded-md border-gray-300 shadow-sm text-sm">
            <option value="">{texts.allPlatforms}</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">{texts.filterByStatus}:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-md border-gray-300 shadow-sm text-sm">
            <option value="">{texts.allStatuses}</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-grow" />
        {/* Selection Controls */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onToggleSelectAll}>
            {areAllSelected ? texts.deselectAll : `${texts.selectAll} (${allPostsCount})`}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-blue-800">{selectedCount} {texts.selected}</p>
            <div className="h-6 border-l border-blue-200" />
            <p className="text-sm font-medium text-blue-700">{texts.bulkActions}:</p>
            <Button size="sm" onClick={onBulkSchedule} disabled={isPerformingBulkAction}>
              <CalendarIcon className="h-4 w-4 mr-1.5" /> {texts.schedule}
            </Button>
            <Button size="sm" onClick={onBulkGenerateImages} disabled={isPerformingBulkAction}>
              <PhotographIcon className="h-4 w-4 mr-1.5" /> {texts.genImages}
            </Button>
            <Button size="sm" onClick={onBulkSuggestPromotions} disabled={isPerformingBulkAction}>
              <SparklesIcon className="h-4 w-4 mr-1.5" /> {texts.genPromos}
            </Button>
            <Button size="sm" onClick={onBulkGenerateComments} disabled={isPerformingBulkAction}>
              <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5" /> {texts.genComments}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};


interface MainContentAreaProps {
  activePlan: MediaPlanGroup | null;
  language: string;
  onOpenWizard: (prompt?: string, productId?: string) => void;
  onOpenFunnelWizard: () => void;
  onAssignPersonaToPlan: (planId: string, personaId: string | null) => void;
  personas: Persona[];
  selectedPlanId: string | null;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  onSetImage: (dataUrl: string, key: string, postInfo?: PostInfo, carouselImageIndex?: number) => void;
  onSetVideo: (dataUrl: string, key: string, postInfo: PostInfo) => void;
  isGeneratingImage: (key: string) => boolean;
  onOpenScheduleModal: (post: SchedulingPost | null) => void;
  selectedPostIds: Set<string>;
  onTogglePostSelection: (postId: string) => void;
  onTogglePostApproval: (postInfo: PostInfo) => void;
  onPublishPost: (postInfo: PostInfo) => Promise<void>;
  settings: Settings;
  affiliateLinks: AffiliateLink[];
  onUpdatePost: (postInfo: PostInfo) => void;
  setViewingPost: (postInfo: PostInfo | null) => void;
  viewingPost: PostInfo | null;
  onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9", postInfo?: PostInfo, carouselImageIndex?: number) => void;
  onGenerateAllCarouselImages: (postInfo: PostInfo) => Promise<void>;
  onGenerateInCharacterPost: (objective: string, platform: string, keywords: string[], pillar: string, postInfo: PostInfo) => Promise<void>;
  onRefinePost: (text: string) => Promise<string>;
  isRefining: boolean;
  onRunKhongMinhForPost: (postInfo: PostInfo) => void;
  onAcceptSuggestion: (postInfo: PostInfo, productId: string) => void;
  khongMinhSuggestions: Record<string, AffiliateLink[]>;
  isGenerating: boolean;
  onGenerateComment: (postInfo: PostInfo) => void;
  isGeneratingComment: boolean;
  publishedAt?: string | undefined;
  publishedUrl?: string | null;
  mongoBrandId: string | null;
  onTaskCreated: () => void;
  // New props for bulk actions
  onSelectAllPosts: (posts: PostInfo[]) => void;
  onClearSelection: () => void;
  onOpenBulkScheduleModal: () => void;
  onBulkGenerateImages: (posts: PostInfo[]) => void;
  onBulkSuggestPromotions: (posts: PostInfo[]) => void;
  onBulkGenerateComments: (posts: PostInfo[]) => void;
  isPerformingBulkAction: boolean;
}

const MainContentArea: React.FC<MainContentAreaProps> = (props) => {
  const {
    activePlan, language, onOpenWizard, onAssignPersonaToPlan, personas, selectedPlanId,
    generatedImages, generatedVideos, onSetImage, onSetVideo, isGeneratingImage, onOpenScheduleModal,
    selectedPostIds, onTogglePostSelection, onPublishPost, settings, affiliateLinks, onUpdatePost,
    setViewingPost, onGenerateImage, onGenerateAllCarouselImages, onGenerateInCharacterPost,
    onRefinePost, isRefining, onGenerateComment, isGeneratingComment,
    // New props
    onSelectAllPosts, onClearSelection, onOpenBulkScheduleModal, onBulkGenerateImages,
    onBulkSuggestPromotions, onBulkGenerateComments, isPerformingBulkAction, onTogglePostApproval
  } = props;

  const [isAssigningPersona, setIsAssigningPersona] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const allPosts = useMemo(() => {
    if (!activePlan) return [];
    return activePlan.plan.flatMap((week, weekIndex) => 
      week.posts.map((post, postIndex) => ({
        post,
        planId: activePlan.id,
        weekIndex,
        postIndex
      } as PostInfo))
    );
  }, [activePlan]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter(postInfo => {
      const platformMatch = !platformFilter || postInfo.post.platform === platformFilter;
      const statusMatch = !statusFilter || postInfo.post.status === statusFilter;
      return platformMatch && statusMatch;
    });
  }, [allPosts, platformFilter, statusFilter]);

  const areAllFilteredPostsSelected = useMemo(() => {
    if (filteredPosts.length === 0) return false;
    return filteredPosts.every(p => selectedPostIds.has(p.post.id));
  }, [filteredPosts, selectedPostIds]);

  const handleToggleSelectAll = () => {
    if (areAllFilteredPostsSelected) {
      onClearSelection();
    } else {
      onSelectAllPosts(filteredPosts);
    }
  };

  const handleAssignPersona = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsAssigningPersona(true);
    const personaId = e.target.value;
    if (selectedPlanId) {
      onAssignPersonaToPlan(selectedPlanId, personaId === '' ? null : personaId);
    }
    setIsAssigningPersona(false);
  };

  const T = {
    'Việt Nam': {
      noPlan: "Chưa chọn kế hoạch nào",
      noPlanDescription: "Chọn một kế hoạch truyền thông từ danh sách hoặc tạo kế hoạch mới",
      newPlan: "Tạo kế hoạch mới",
      assignPersona: "Gán người đại diện",
      noPersona: "Không có người đại diện",
      noPosts: "Chưa có bài đăng nào",
      noPostsDescription: "Kế hoạch này chưa có bài đăng nào. Hãy tạo một số bài đăng để bắt đầu.",
      posts: "Bài đăng",
    },
    'English': {
      noPlan: "No plan selected",
      noPlanDescription: "Select a media plan from the list or create a new plan",
      newPlan: "Create new plan",
      assignPersona: "Assign persona",
      noPersona: "No persona",
      noPosts: "No posts yet",
      noPostsDescription: "This plan doesn't have any posts yet. Create some posts to get started.",
      posts: "Posts",
    }
  };
  const texts = (T as any)[language] || T['English'];

  if (!activePlan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-gray-200">
        <div className="max-w-md space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">{texts.noPlan}</h3>
          <p className="text-gray-600">{texts.noPlanDescription}</p>
          <Button onClick={() => onOpenWizard()} className="mt-4">
            <SparklesIcon className="h-5 w-5 mr-2" /> {texts.newPlan}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{activePlan.name}</h3>
          <p className="text-sm text-gray-500">{allPosts.length} {texts.posts}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="personaSelect" className="text-sm font-medium text-gray-700">{texts.assignPersona}:</label>
            <select
              id="personaSelect"
              value={activePlan.personaId || ''}
              onChange={handleAssignPersona}
              disabled={isAssigningPersona}
              className="min-w-[150px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">{texts.noPersona}</option>
              {personas.map(persona => <option key={persona.id} value={persona.id}>{persona.nickName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <MediaPlanToolbar
        language={language}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onToggleSelectAll={handleToggleSelectAll}
        areAllSelected={areAllFilteredPostsSelected}
        selectedCount={selectedPostIds.size}
        onBulkSchedule={onOpenBulkScheduleModal}
        onBulkGenerateImages={() => onBulkGenerateImages(allPosts.filter(p => selectedPostIds.has(p.post.id)))}
        onBulkSuggestPromotions={() => onBulkSuggestPromotions(allPosts.filter(p => selectedPostIds.has(p.post.id)))}
        onBulkGenerateComments={() => onBulkGenerateComments(allPosts.filter(p => selectedPostIds.has(p.post.id)))}
        isPerformingBulkAction={isPerformingBulkAction}
        allPostsCount={filteredPosts.length}
      />
      
      {/* Post List */}
      <div className="flex-grow overflow-y-auto p-4">
        {filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {filteredPosts.map((postInfo) => {
              const { post } = postInfo;
              const imageUrl = post.imageKey ? generatedImages[post.imageKey] : undefined;
              const imageUrls = post.imageKeys?.map(key => generatedImages[key]).filter(Boolean) as string[] | undefined;
              const videoUrl = post.videoKey ? generatedVideos[post.videoKey] : undefined;

              return (
                <PostCard 
                  key={post.id}
                  postInfo={postInfo}
                  onViewDetails={() => setViewingPost(postInfo)}
                  onToggleSelection={onTogglePostSelection}
                  onTogglePostApproval={onTogglePostApproval}
                  isSelected={selectedPostIds.has(post.id)}
                  language={settings.language}
                  imageUrl={imageUrl}
                  imageUrls={imageUrls}
                  videoUrl={videoUrl}
                  scheduledAt={post.scheduledAt}
                  publishedAt={post.publishedAt}
                  publishedUrl={post.publishedUrl}
                />
              )
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{texts.noPosts}</h3>
            <p className="text-gray-500 mb-4">{texts.noPostsDescription}</p>
            <Button onClick={() => onOpenWizard()}>
              <SparklesIcon className="h-5 w-5 mr-2" /> {texts.newPlan}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContentArea;
