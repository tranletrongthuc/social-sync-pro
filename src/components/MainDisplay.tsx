import React, { useState, Suspense, useCallback, useEffect, useRef, lazy } from 'react';
import type { 
  GeneratedAssets, 
  MediaPlanGroup, 
  Settings, 
  AffiliateLink, 
  MediaPlanPost, 
  SchedulingPost, 
  Persona, 
  Trend, 
  Idea, 
  PostInfo,
  FacebookPostIdea,
  GenerationOptions
} from '../../types';
import { Header, ActiveTab } from './Header';

// Lazy load modals and wizards
const ScheduleModal = lazy(() => import('./ScheduleModal'));
const BulkScheduleModal = lazy(() => import('./BulkScheduleModal'));
const MediaPlanWizardModal = lazy(() => import('./MediaPlanWizardModal').then(module => ({ default: module.MediaPlanWizardModal })));
const FunnelCampaignWizard = lazy(() => import('./FunnelCampaignWizard'));

const AssetDisplay = React.lazy(() => import('./AssetDisplay'));
const MediaPlanDisplay = React.lazy(() => import('./MediaPlanDisplay'));
const AffiliateVaultDisplay = React.lazy(() => import('./AffiliateVaultDisplay'));
const PersonasDisplay = React.lazy(() => import('./PersonasDisplay'));
const ContentStrategyPage = React.lazy(() => import('./ContentStrategyPage'));

interface MainDisplayProps {
  assets: GeneratedAssets;
  onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9", postInfo?: PostInfo) => void;
  onSetImage: (dataUrl: string, key: string, postInfo?: PostInfo) => void;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  onSetVideo: (dataUrl: string, key: string, postInfo: PostInfo) => void;
  isGeneratingImage: (key: string) => boolean;
  isUploadingImage: (key: string) => boolean;
  settings: Settings;
  onExportBrandKit: () => void;
  isExportingBrandKit: boolean;
  onExportPlan: () => void;
  isExportingPlan: boolean;
  onGeneratePlan: (objective: string, keywords: string[], useSearch: boolean, selectedPlatforms: string[], options: GenerationOptions, selectedProductId: string | null, personaId: string | null, pillar: string) => void;
  isGeneratingPlan: boolean;
  onRegenerateWeekImages: (planId: string, weekIndex: number) => void;
  productImages: File[]; // This prop is deprecated but kept for avoiding breaking changes in unrelated components.
  onSetProductImages: (files: File[]) => void;
  onSaveProject: () => void;
  isSavingProject: boolean;
  onStartOver: () => void;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onOpenSettings: () => void;
  onOpenIntegrations: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Media Plan props
  mediaPlanGroupsList: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[], personaId?: string;}[];
  onSelectPlan: (planId: string, assetsToUse?: GeneratedAssets, plansList?: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]) => void;
  activePlanId: string | null;
  plans: MediaPlanGroup[];
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  onUpdatePost: (postInfo: PostInfo) => void;
  onRefinePost: (text: string) => Promise<string>;
  onGenerateInCharacterPost: (objective: string, platform: string, keywords: string[], pillar: string, postInfo: PostInfo) => Promise<void>;
  onAssignPersonaToPlan: (planId: string, personaId: string | null) => void;
  // Affiliate Vault Props
  onSaveAffiliateLink: (link: AffiliateLink) => void;
  onDeleteAffiliateLink: (linkId: string) => void;
  onImportAffiliateLinks: (links: AffiliateLink[]) => void;
  onReloadLinks: () => void;
  onGenerateIdeasFromProduct: (product: AffiliateLink) => void;
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
  isScheduling: boolean;
  onSchedulePost: (postInfo: SchedulingPost, scheduledAt: string) => void;
  onPostDrop: (postInfo: PostInfo, newDate: Date) => void;
  schedulingPost: SchedulingPost | null;
  onOpenBulkScheduleModal: () => void;
  isBulkScheduleModalOpen: boolean;
  onCloseBulkScheduleModal: () => void;
  onBulkSchedule: (startDate: string, intervalDays: number, intervalHours: number, intervalMinutes: number) => void;
  isPerformingBulkAction: boolean;
  onBulkGenerateImages: (posts: PostInfo[]) => void;
  onBulkSuggestPromotions: (posts: PostInfo[]) => void;
  onBulkGenerateComments: (posts: PostInfo[]) => void;
  onPublishPost: (postInfo: PostInfo) => void; // New prop for direct publishing
  brandFoundation: GeneratedAssets['brandFoundation'];
  // New prop for opening funnel wizard
  onOpenFunnelWizard: () => void;
  // Personas
  onSavePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
  onSetPersonaImage: (dataUrl: string, imageKey: string, personaId: string) => void;
  onUpdatePersona: (persona: Persona) => void;
  onAutoGeneratePersona: () => void;
  // Strategy Hub
  onSaveTrend: (trend: Trend) => void;
  onDeleteTrend: (trendId: string) => void;
  onGenerateIdeas: (trend: Trend, useSearch: boolean) => void;
  onGenerateContentPackage: (idea: Idea, personaId: string | null, selectedProductId: string | null, options: { tone: string; style: string; length: string; includeEmojis: boolean; }) => void;
  onGenerateTrendsFromSearch: (industry: string) => void;
  isGeneratingTrendsFromSearch: boolean;
  // New props for AI-powered trend suggestion
  onSuggestTrends: (trendType: 'industry' | 'global', timePeriod: string) => void;
  isSuggestingTrends: boolean;
  onSelectTrend: (trend: Trend) => void;
  selectedTrend: Trend | null;
  ideasForSelectedTrend: Idea[];
  productTrendToSelect: string | null;
  // New Facebook Strategy Props
  onGenerateFacebookPostIdeas: (postInfo: PostInfo) => void;
  onAddFacebookPostIdeaToPlan: (idea: FacebookPostIdea) => void;
  isGeneratingFacebookPostIdeas: boolean;
  // Post Detail Modal State
  viewingPost: PostInfo | null;
  setViewingPost: (postInfo: PostInfo | null) => void;
  // Funnel Campaign Props
  onCreateFunnelCampaignPlan: (plan: MediaPlanGroup) => void;
  // Lazy loading props
  isStrategyHubDataLoaded?: boolean;
  onLoadStrategyHubData?: () => Promise<void>;
  isLoadingStrategyHubData?: boolean;
  isAffiliateVaultDataLoaded?: boolean;
  onLoadAffiliateVaultData?: () => Promise<void>;
  isLoadingAffiliateVaultData?: boolean;
  isPersonasDataLoaded?: boolean;
  onLoadPersonasData?: () => Promise<void>;
  isLoadingPersonasData?: boolean;
}

const MainDisplay: React.FC<MainDisplayProps> = (props) => {
  const {
    assets,
    onGenerateImage,
    onSetImage,
    generatedImages,
    generatedVideos,
    onSetVideo,
    isGeneratingImage,
    isUploadingImage,
    settings,
    onExportBrandKit,
    isExportingBrandKit,
    onExportPlan,
    isExportingPlan,
    onGeneratePlan,
    isGeneratingPlan,
    onRegenerateWeekImages,
    productImages,
    onSetProductImages,
    onSaveProject,
    isSavingProject,
    onStartOver,
    autoSaveStatus,
    onOpenSettings,
    onOpenIntegrations,
    activeTab,
    setActiveTab,
    mediaPlanGroupsList,
    onSelectPlan,
    activePlanId,
    onUpdatePost,
    onRefinePost,
    onGenerateInCharacterPost,
    onAssignPersonaToPlan,
    onSaveAffiliateLink,
    onDeleteAffiliateLink,
    onImportAffiliateLinks,
    onReloadLinks,
    onGenerateIdeasFromProduct,
    productTrendToSelect,
    brandFoundation,
    analyzingPostIds,
    isAnyAnalysisRunning,
    khongMinhSuggestions,
    onAcceptSuggestion,
    onRunKhongMinhForPost,
    generatingPromptKeys,
    onGeneratePrompt,
    onGenerateAffiliateComment,
    generatingCommentPostIds,
    selectedPostIds,
    onTogglePostSelection,
    onSelectAllPosts,
    onClearSelection,
    onOpenScheduleModal,
    isScheduling,
    onSchedulePost,
    onPostDrop,
    schedulingPost,
    onOpenBulkScheduleModal,
    isBulkScheduleModalOpen,
    onCloseBulkScheduleModal,
    onBulkSchedule,
    isPerformingBulkAction,
    onBulkGenerateImages,
    onBulkSuggestPromotions,
    onBulkGenerateComments,
    onSavePersona,
    onDeletePersona,
    onSetPersonaImage,
    onAutoGeneratePersona,
    onSaveTrend,
    onDeleteTrend,
    onGenerateIdeas,
    onGenerateContentPackage,
    onGenerateTrendsFromSearch,
    isGeneratingTrendsFromSearch,
    onSuggestTrends, // Add this line
    isSuggestingTrends, // Add this line
    onSelectTrend,
    selectedTrend,
    ideasForSelectedTrend,
    onPublishPost,
    onUpdatePersona,
    onCreateFunnelCampaignPlan, // New prop
    viewingPost,
    setViewingPost,
  } = props;
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [initialWizardPrompt, setInitialWizardPrompt] = useState('');
  const [initialWizardProductId, setInitialWizardProductId] = useState<string | undefined>(undefined);
  
  const [isFunnelWizardOpen, setIsFunnelWizardOpen] = useState(false);
  
  const [loadedTabs, setLoadedTabs] = useState<Set<ActiveTab>>(new Set(['brandKit']));
  const [loadingTabs, setLoadingTabs] = useState<Set<ActiveTab>>(new Set());

  const handleOpenWizard = (prompt = '', productId?: string) => {
    setInitialWizardPrompt(prompt);
    setInitialWizardProductId(productId);
    if (activeTab !== 'mediaPlan') {
      setActiveTab('mediaPlan');
    }
    setIsWizardOpen(true);
  };
  
  const handleSetActiveTab = (tab: ActiveTab) => {
    setActiveTab(tab);

    if (loadedTabs.has(tab) || loadingTabs.has(tab)) {
      return;
    }

    let loadFn: (() => Promise<void>) | undefined;
    switch (tab) {
      case 'strategy':
        loadFn = props.onLoadStrategyHubData;
        break;
      case 'affiliateVault':
        loadFn = props.onLoadAffiliateVaultData;
        break;
      case 'personas':
        loadFn = props.onLoadPersonasData;
        break;
    }

    if (loadFn) {
      setLoadingTabs(prev => new Set(prev).add(tab));
      loadFn().then(() => {
        setLoadedTabs(prev => new Set(prev).add(tab));
      }).catch((error) => {
        console.error(`Failed to load data for tab ${tab}:`, error);
      }).finally(() => {
        setLoadingTabs(prev => {
          const newSet = new Set(prev);
          newSet.delete(tab);
          return newSet;
        });
      });
    }
  };
  
  const handleOpenFunnelWizard = () => {
    setIsFunnelWizardOpen(true);
  };

  return (
    <div className="w-full bg-white h-screen flex flex-col max-w-screen-2xl mx-auto shadow-lg border-x border-gray-200">
      <Header 
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        onSaveProject={onSaveProject}
        isSavingProject={isSavingProject}
        autoSaveStatus={autoSaveStatus}
        onOpenSettings={onOpenSettings}
        onOpenIntegrations={onOpenIntegrations}
        onStartOver={onStartOver}
        language={settings.language}
      />

      <main className="flex-grow overflow-hidden">
        <Suspense fallback={<div>Loading...</div>}>
          {activeTab === 'brandKit' && (
            <AssetDisplay 
              assets={assets}
              onGenerateImage={(prompt, key, aspectRatio) => onGenerateImage(prompt, key, aspectRatio, undefined)}
              onSetImage={(dataUrl, key) => onSetImage(dataUrl, key, undefined)}
              generatedImages={generatedImages}
              isGeneratingImage={isGeneratingImage}
              language={settings.language}
              onExport={onExportBrandKit}
              isExporting={isExportingBrandKit}
            />
          )}
          {activeTab === 'mediaPlan' && (
            <MediaPlanDisplay 
              plans={assets.mediaPlans}
              personas={assets.personas || []}
              affiliateLinks={assets.affiliateLinks || []}
              onOpenWizard={handleOpenWizard}
              onGenerateImage={onGenerateImage}
              onSetImage={onSetImage}
              generatedImages={generatedImages}
              generatedVideos={generatedVideos}
              onSetVideo={onSetVideo}
              isGeneratingImage={isGeneratingImage}
              settings={settings}
              onExport={onExportPlan}
              isExporting={isExportingPlan}
              onRegenerateWeekImages={onRegenerateWeekImages}
              planGroupsList={mediaPlanGroupsList}
              onSelectPlan={onSelectPlan}
              activePlanId={activePlanId}
              onUpdatePost={onUpdatePost}
              onRefinePost={onRefinePost}
              onGenerateInCharacterPost={onGenerateInCharacterPost}
              onAssignPersonaToPlan={onAssignPersonaToPlan}
              analyzingPostIds={analyzingPostIds}
              isAnyAnalysisRunning={isAnyAnalysisRunning}
              khongMinhSuggestions={khongMinhSuggestions}
              onAcceptSuggestion={onAcceptSuggestion}
              onRunKhongMinhForPost={onRunKhongMinhForPost}
              generatingPromptKeys={generatingPromptKeys}
              onGeneratePrompt={onGeneratePrompt}
              onGenerateAffiliateComment={onGenerateAffiliateComment}
              generatingCommentPostIds={generatingCommentPostIds}
              selectedPostIds={selectedPostIds}
              onTogglePostSelection={onTogglePostSelection}
              onSelectAllPosts={onSelectAllPosts}
              onClearSelection={onClearSelection}
              onOpenScheduleModal={onOpenScheduleModal}
              onOpenBulkScheduleModal={onOpenBulkScheduleModal}
              onPostDrop={onPostDrop}
              onPublishPost={onPublishPost}
              isPerformingBulkAction={isPerformingBulkAction}
              onBulkGenerateImages={onBulkGenerateImages}
              onBulkSuggestPromotions={onBulkSuggestPromotions}
              onBulkGenerateComments={onBulkGenerateComments}
              brandFoundation={brandFoundation}
              onOpenFunnelWizard={handleOpenFunnelWizard}
              viewingPost={viewingPost}
              setViewingPost={setViewingPost}
            />
          )}
          {activeTab === 'strategy' && (
            <div className="h-full overflow-hidden">
              <ContentStrategyPage
                language={settings.language}
                trends={assets.trends || []}
                personas={assets.personas || []}
                affiliateLinks={assets.affiliateLinks || []}
                generatedImages={generatedImages}
                settings={settings}
                onSaveTrend={onSaveTrend}
                onDeleteTrend={onDeleteTrend}
                onGenerateIdeas={onGenerateIdeas}
                onCreatePlanFromIdea={handleOpenWizard}
                onGenerateContentPackage={onGenerateContentPackage}
                isGeneratingIdeas={isGeneratingPlan}
                onGenerateFacebookTrends={onGenerateTrendsFromSearch}
                isGeneratingTrendsFromSearch={isGeneratingTrendsFromSearch}
                productTrendToSelect={productTrendToSelect}
                selectedTrend={selectedTrend}
                ideasForSelectedTrend={ideasForSelectedTrend}
                onSelectTrend={onSelectTrend}
                onSuggestTrends={onSuggestTrends}
                isSuggestingTrends={isSuggestingTrends}
                isDataLoaded={loadedTabs.has('strategy')}
                onLoadData={props.onLoadStrategyHubData}
                isLoading={loadingTabs.has('strategy')}
              />
            </div>
          )}
          {activeTab === 'affiliateVault' && (
            <AffiliateVaultDisplay 
              affiliateLinks={assets.affiliateLinks || []}
              onSaveLink={onSaveAffiliateLink}
              onDeleteLink={onDeleteAffiliateLink}
              onImportLinks={onImportAffiliateLinks}
              onReloadLinks={onReloadLinks}
              onGenerateIdeasFromProduct={onGenerateIdeasFromProduct}
              language={settings.language}
              isDataLoaded={loadedTabs.has('affiliateVault')}
              onLoadData={props.onLoadAffiliateVaultData}
              isLoading={loadingTabs.has('affiliateVault')}
            />
          )}
          {activeTab === 'personas' && (
            <PersonasDisplay
              personas={assets.personas || []}
              generatedImages={generatedImages}
              onSavePersona={onSavePersona}
              onDeletePersona={onDeletePersona}
              language={settings.language}
              brandFoundation={brandFoundation}
              onAutoGeneratePersona={onAutoGeneratePersona}
            />
          )}
        </Suspense>
      </main>
      
      <Suspense fallback={null}>
        <ScheduleModal
          isOpen={!!schedulingPost}
          onClose={() => onOpenScheduleModal(null)}
          schedulingPost={schedulingPost}
          onSchedule={onSchedulePost}
          isScheduling={isScheduling}
          language={settings.language}
        />
      </Suspense>

      <Suspense fallback={null}>
        <BulkScheduleModal
          isOpen={isBulkScheduleModalOpen}
          onClose={onCloseBulkScheduleModal}
          onSchedule={onBulkSchedule}
          isScheduling={isScheduling}
          language={settings.language}
          selectedCount={selectedPostIds.size}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MediaPlanWizardModal
          isOpen={isWizardOpen}
          onClose={() => { setIsWizardOpen(false); setInitialWizardPrompt(''); setInitialWizardProductId(undefined); }}
          settings={settings}
          onGenerate={onGeneratePlan}
          isGenerating={isGeneratingPlan}
          personas={assets.personas || []}
          generatedImages={generatedImages}
          initialPrompt={initialWizardPrompt}
          affiliateLinks={assets.affiliateLinks || []}
          initialProductId={initialWizardProductId}
        />
      </Suspense>
      
      <Suspense fallback={null}>
        {/* Funnel Campaign Wizard Modal */}
        <FunnelCampaignWizard
          isOpen={isFunnelWizardOpen}
          onClose={() => setIsFunnelWizardOpen(false)}
          personas={assets.personas || []}
          affiliateLinks={assets.affiliateLinks || []}
          language={settings.language}
          onCreatePlan={onCreateFunnelCampaignPlan}
          generatedImages={generatedImages}
        />
      </Suspense>
    </div>
  );
};

export default MainDisplay;