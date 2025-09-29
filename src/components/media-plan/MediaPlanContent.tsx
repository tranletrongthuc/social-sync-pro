import React from 'react';
import type { 
  MediaPlanGroup, 
  Persona, 
  AffiliateLink, 
  PostInfo, 
  Settings, 
  MediaPlanPost, 
  SchedulingPost 
} from '../../../types';
import { BackgroundTask } from '../../types/task.types';
import MediaPlanDisplay from '../MediaPlanDisplay';
import StandardPageView from '../StandardPageView';
import { RefreshIcon, SparklesIcon, FunnelIcon } from '../icons';

interface MediaPlanContentProps {
  plans: MediaPlanGroup[];
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  onOpenWizard: (prompt?: string, productId?: string) => void;
  onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9", postInfo?: PostInfo) => void;
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
  onTaskCreated: () => void;
  tasks: BackgroundTask[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

const MediaPlanContent: React.FC<MediaPlanContentProps> = (props) => {
  const T = {
    'Việt Nam': {
      title: "Kế hoạch Truyền thông",
      description: "Lên kế hoạch nội dung truyền thông xã hội",
      refresh: "Làm mới",
      loading: "Đang tải...",
      newPlan: "Kế hoạch mới",
      createFunnel: "Tạo chiến dịch Funnel"
    },
    'English': {
      title: "Media Plan",
      description: "Plan your social media content",
      refresh: "Refresh",
      loading: "Loading...",
      newPlan: "New Media Plan",
      createFunnel: "Create Funnel Campaign"
    }
  };
  const texts = (T as any)[props.settings.language] || T['English'];

  return (
    <StandardPageView
      title={texts.title}
      subtitle={texts.description}
      actions={
        <div className="flex flex-row gap-2">
          <button 
            onClick={props.onOpenFunnelWizard}
            className="px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed bg-white text-brand-green border border-brand-green hover:bg-green-50 flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            {texts.createFunnel}
          </button>
          <button 
            onClick={() => props.onOpenWizard()}
            className="px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed bg-brand-green text-white hover:bg-brand-green-dark flex items-center gap-2"
          >
            <SparklesIcon className="h-5 w-5" />
            {texts.newPlan}
          </button>
          <button 
            onClick={props.onExport}
            disabled={props.isExporting}
            className="px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed bg-white text-brand-green border border-brand-green hover:bg-green-50"
          >
            {props.isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button 
            onClick={props.onRefresh}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Refresh data"
            disabled={props.isLoading}
          >
            <RefreshIcon className={`h-5 w-5 text-gray-600 ${props.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <MediaPlanDisplay 
        plans={props.plans}
        personas={props.personas}
        affiliateLinks={props.affiliateLinks}
        onOpenWizard={props.onOpenWizard}
        onGenerateImage={props.onGenerateImage}
        onGenerateAllCarouselImages={props.onGenerateAllCarouselImages}
        onSetImage={props.onSetImage}
        generatedImages={props.generatedImages}
        generatedVideos={props.generatedVideos}
        onSetVideo={props.onSetVideo}
        isGeneratingImage={props.isGeneratingImage}
        settings={props.settings}
        onExport={props.onExport}
        isExporting={props.isExporting}
        onRegenerateWeekImages={props.onRegenerateWeekImages}
        planGroupsList={props.planGroupsList}
        onSelectPlan={props.onSelectPlan}
        activePlanId={props.activePlanId}
        onUpdatePost={props.onUpdatePost}
        onRefinePost={props.onRefinePost}
        onGenerateInCharacterPost={props.onGenerateInCharacterPost}
        onAssignPersonaToPlan={props.onAssignPersonaToPlan}
        analyzingPostIds={props.analyzingPostIds}
        isAnyAnalysisRunning={props.isAnyAnalysisRunning}
        khongMinhSuggestions={props.khongMinhSuggestions}
        onAcceptSuggestion={props.onAcceptSuggestion}
        onRunKhongMinhForPost={props.onRunKhongMinhForPost}
        generatingPromptKeys={props.generatingPromptKeys}
        onGeneratePrompt={props.onGeneratePrompt}
        onGenerateAffiliateComment={props.onGenerateAffiliateComment}
        generatingCommentPostIds={props.generatingCommentPostIds}
        selectedPostIds={props.selectedPostIds}
        onTogglePostSelection={props.onTogglePostSelection}
        onTogglePostApproval={props.onTogglePostApproval}
        onSelectAllPosts={props.onSelectAllPosts}
        onClearSelection={props.onClearSelection}
        onOpenScheduleModal={props.onOpenScheduleModal}
        onPostDrop={props.onPostDrop}
        onOpenBulkScheduleModal={props.onOpenBulkScheduleModal}
        onPublishPost={props.onPublishPost}
        isPerformingBulkAction={props.isPerformingBulkAction}
        onBulkGenerateImages={props.onBulkGenerateImages}
        onBulkSuggestPromotions={props.onBulkSuggestPromotions}
        onBulkGenerateComments={props.onBulkGenerateComments}
        brandFoundation={props.brandFoundation}
        onOpenFunnelWizard={props.onOpenFunnelWizard}
        viewingPost={props.viewingPost}
        setViewingPost={props.setViewingPost}
        mongoBrandId={props.mongoBrandId}
        onLoadData={props.onLoadData}
        onTaskCreated={props.onTaskCreated}
        isLoading={props.isLoading}
      />
    </StandardPageView>
  );
};

export default MediaPlanContent;