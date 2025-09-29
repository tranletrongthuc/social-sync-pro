import React, { useState, useMemo, useEffect } from 'react';
import type { MediaPlanGroup, Persona, AffiliateLink, PostInfo, Settings, MediaPlanPost, SchedulingPost } from '../../types';
import { Button } from './ui';
import { SparklesIcon, DownloadIcon, FunnelIcon, RefreshIcon, MenuIcon } from './icons';
import RefreshButton from './RefreshButton';
import PostDetailModal from './PostDetailModal';
import MediaPlanSidebar from './media-plan/MediaPlanSidebar';
import MediaPlanMainContent from './media-plan/MainContentArea';
import GenericTabTemplate from './GenericTabTemplate';

interface MediaPlanDisplayProps {
  plans: MediaPlanGroup[];
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  onOpenWizard: (prompt?: string, productId?: string) => void;
  onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9", postInfo?: PostInfo, carouselImageIndex?: number) => void;
  onGenerateAllCarouselImages: (postInfo: PostInfo) => Promise<void>;
  onSetImage: (dataUrl: string, key: string, postInfo?: PostInfo, carouselImageIndex?: number) => void;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  onSetVideo: (dataUrl: string, key: string, postInfo: PostInfo) => void;
  isGeneratingImage: (key: string) => boolean;
  settings: Settings;
  onExport: () => void;
  isExporting: boolean;
  onRegenerateWeekImages: (planId: string, weekIndex: number) => void;
  planGroupsList: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[], personaId?: string;}[];
  onSelectPlan: (planId: string) => void;
  activePlanId: string | null;
  onUpdatePost: (postInfo: PostInfo) => void;
  onRefinePost: (text: string) => Promise<string>;
  onGenerateInCharacterPost: (objective: string, platform: string, keywords: string[], pillar: string, postInfo: PostInfo) => Promise<void>;
  onAssignPersonaToPlan: (planId: string, personaId: string | null) => void;
  analyzingPostIds: Set<string>;
  isAnyAnalysisRunning: boolean;
  khongMinhSuggestions: Record<string, AffiliateLink[]>;
  onAcceptSuggestion: (postInfo: PostInfo, productId: string) => void;
  onRunKhongMinhForPost: (postInfo: PostInfo) => void;
  generatingPromptKeys: Set<string>;
  onGeneratePrompt: (postInfo: PostInfo) => Promise<MediaPlanPost | null>;
  onGenerateAffiliateComment: (postInfo: PostInfo) => Promise<MediaPlanPost | null>;
  generatingCommentPostIds: Set<string>;
  selectedPostIds: Set<string>;
  onTogglePostSelection: (postId: string) => void;
  onSelectAllPosts: (posts: PostInfo[]) => void;
  onClearSelection: () => void;
  onTogglePostApproval: (postInfo: PostInfo) => void;
  onOpenScheduleModal: (post: SchedulingPost | null) => void;
  onPostDrop: (postInfo: PostInfo, newDate: Date) => void;
  onOpenBulkScheduleModal: () => void;
  onPublishPost: (postInfo: PostInfo) => Promise<void>;
  isPerformingBulkAction: boolean;
  onBulkGenerateImages: (posts: PostInfo[]) => void;
  onBulkSuggestPromotions: (posts: PostInfo[]) => void;
  onBulkGenerateComments: (posts: PostInfo[]) => void;
  brandFoundation: any;
  onOpenFunnelWizard: () => void;
  viewingPost: PostInfo | null;
  setViewingPost: (postInfo: PostInfo | null) => void;
  mongoBrandId: string | null;
  onLoadData?: (brandId: string) => Promise<void>;
  isLoading?: boolean;
  onTaskCreated: () => void;
}

const MediaPlanDisplay: React.FC<MediaPlanDisplayProps> = (props) => {
  const {
    plans, personas, affiliateLinks, onOpenWizard, onGenerateImage, onGenerateAllCarouselImages, onSetImage, generatedImages, generatedVideos, onSetVideo, isGeneratingImage, settings, onExport, isExporting, planGroupsList, onSelectPlan, activePlanId, onUpdatePost, onRefinePost, onGenerateInCharacterPost, onAssignPersonaToPlan, onGenerateAffiliateComment, onOpenScheduleModal, onOpenFunnelWizard, viewingPost, setViewingPost, mongoBrandId, onLoadData, isLoading, onTaskCreated, onTogglePostApproval
  } = props;

  const activePlan = useMemo(() => plans.find(p => p.id === activePlanId), [plans, activePlanId]);
  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleRefinePost = async (text: string): Promise<string> => {
    setIsRefining(true);
    try {
      return await onRefinePost(text);
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateComment = async (postInfo: PostInfo) => {
    setIsGeneratingComment(true);
    try {
      const updatedPost = await onGenerateAffiliateComment(postInfo);
      if (updatedPost) {
        onUpdatePost({ ...postInfo, post: updatedPost });
      }
    } finally {
      setIsGeneratingComment(false);
    }
  };

  const handleUpdateAndClose = (postInfo: PostInfo) => {
    onUpdatePost(postInfo);
    setViewingPost(null);
  };

  const handleRefresh = () => {
    if (mongoBrandId && onLoadData) {
      onLoadData(mongoBrandId);
    }
  };

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
            <Button variant="secondary" size="sm" onClick={onOpenFunnelWizard} className="whitespace-nowrap">
              <FunnelIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Funnel Campaign</span>
            </Button>
            <Button size="sm" onClick={() => onOpenWizard()} className="whitespace-nowrap">
              <SparklesIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Media Plan</span>
            </Button>
            <Button variant="tertiary" size="sm" onClick={onExport} disabled={isExporting} className="whitespace-nowrap">
              {isExporting ? 'Exporting...' : <><DownloadIcon className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Export</span></>}
            </Button>
            <RefreshButton onClick={handleRefresh} isLoading={isLoading} language={settings.language} />
    </div>
  );

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <GenericTabTemplate
      title="Media Plan"
      subtitle="Your generated content schedule"
      actionButtons={actionButtons}
      isLoading={isLoading}
    >
      <div className="h-full grid grid-cols-1 md:grid-cols-2 md:gap-6">
        <MediaPlanSidebar
          planGroups={planGroupsList}
          activePlanId={activePlanId}
          onSelectPlan={onSelectPlan}
          language={settings.language}
          onCreatePlan={onOpenWizard}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

          <MediaPlanMainContent
            activePlan={activePlan}
            language={settings.language}
            onOpenWizard={onOpenWizard}
            onOpenFunnelWizard={onOpenFunnelWizard}
            onAssignPersonaToPlan={onAssignPersonaToPlan}
            personas={personas}
            selectedPlanId={activePlanId}
            generatedImages={generatedImages}
            generatedVideos={generatedVideos}
            onSetImage={onSetImage}
            onSetVideo={onSetVideo}
            isGeneratingImage={isGeneratingImage}
            onOpenScheduleModal={onOpenScheduleModal}
            selectedPostIds={props.selectedPostIds}
            onTogglePostSelection={props.onTogglePostSelection}
            onTogglePostApproval={onTogglePostApproval}
            onPublishPost={props.onPublishPost}
            settings={settings}
            affiliateLinks={affiliateLinks}
            onUpdatePost={onUpdatePost}
            setViewingPost={setViewingPost}
            viewingPost={viewingPost}
            onGenerateImage={onGenerateImage}
            onGenerateAllCarouselImages={onGenerateAllCarouselImages}
            onGenerateInCharacterPost={onGenerateInCharacterPost}
            onRefinePost={handleRefinePost}
            isRefining={isRefining}
            onRunKhongMinhForPost={() => {}}
            onAcceptSuggestion={() => {}}
            khongMinhSuggestions={{}}
            isGenerating={isGeneratingImage('')}
            onGenerateComment={handleGenerateComment}
            isGeneratingComment={isGeneratingComment}
            publishedAt={viewingPost?.post.publishedAt || undefined}
            publishedUrl={viewingPost?.post.publishedUrl}
            mongoBrandId={mongoBrandId}
            onTaskCreated={onTaskCreated}
            onSelectAllPosts={props.onSelectAllPosts}
            onClearSelection={props.onClearSelection}
            onOpenBulkScheduleModal={props.onOpenBulkScheduleModal}
            onBulkGenerateImages={props.onBulkGenerateImages}
            onBulkSuggestPromotions={props.onBulkSuggestPromotions}
            onBulkGenerateComments={props.onBulkGenerateComments}
            isPerformingBulkAction={props.isPerformingBulkAction}
          />
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {viewingPost && (
        <PostDetailModal
          isOpen={!!viewingPost}
          onClose={() => setViewingPost(null)}
          postInfo={viewingPost}
          language={settings.language}
          onUpdatePost={handleUpdateAndClose}
          onGenerateImage={onGenerateImage}
          onGenerateAllCarouselImages={onGenerateAllCarouselImages}
          onSetImage={onSetImage}
          onSetVideo={onSetVideo}
          onGeneratePrompt={() => {}} // Placeholder for now, will be implemented if needed
          onGenerateInCharacterPost={onGenerateInCharacterPost}
          onRefinePost={handleRefinePost}
          isRefining={isRefining}
          onRunKhongMinhForPost={() => props.onRunKhongMinhForPost(viewingPost!)}
          onAcceptSuggestion={(productId) => props.onAcceptSuggestion(viewingPost!, productId)}
          generatedImages={generatedImages}
          generatedVideos={generatedVideos}
          isGeneratingImage={isGeneratingImage}
          isGeneratingPrompt={props.generatingPromptKeys.size > 0} // Assuming this is the correct prop
          isAnyAnalysisRunning={props.isAnyAnalysisRunning}
          isAnalyzing={props.analyzingPostIds.size > 0} // Assuming this is the correct prop
          khongMinhSuggestions={props.khongMinhSuggestions}
          affiliateLinks={affiliateLinks}
          isGenerating={isGeneratingImage('')} // Assuming this is the correct prop
          onGenerateComment={handleGenerateComment}
          isGeneratingComment={isGeneratingComment}
          onOpenScheduleModal={onOpenScheduleModal}
          onPublishPost={() => Promise.resolve() }
          publishedAt={viewingPost.post.publishedAt}
          publishedUrl={viewingPost.post.publishedUrl}
          settings={settings}
          mongoBrandId={mongoBrandId}
          onTaskCreated={onTaskCreated}
        />
      )}
    </GenericTabTemplate>
  );
};

export default MediaPlanDisplay;
