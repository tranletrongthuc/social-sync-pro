import React, { useState, Suspense, useCallback, useEffect } from 'react';
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
  PostInfo 
} from '../../types';
import ScheduleModal from './ScheduleModal';
import BulkScheduleModal from './BulkScheduleModal';
import { Header, ActiveTab } from './Header';
import { MediaPlanWizardModal } from './MediaPlanWizardModal';
import FunnelCampaignWizard from './FunnelCampaignWizard'; // Import the new component

const AssetDisplay = React.lazy(() => import('./AssetDisplay'));
const MediaPlanDisplay = React.lazy(() => import('./MediaPlanDisplay'));
const AffiliateVaultDisplay = React.lazy(() => import('./AffiliateVaultDisplay'));
const PersonasDisplay = React.lazy(() => import('./PersonasDisplay'));
const StrategyDisplay = React.lazy(() => import('./StrategyDisplay'));

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
  onGeneratePlan: (prompt: string, useSearch: boolean, totalPosts: number, selectedPlatforms: string[], options: { tone: string; style: string; length: string; includeEmojis: boolean; }, selectedProductId: string | null, personaId: string | null) => void;
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
  onUpdatePost: (postInfo: PostInfo) => void;
  onRefinePost: (text: string) => Promise<string>;
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
  onPostDrop: (postInfo: SchedulingPost, newDate: Date) => void;
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
  onLoadIdeasForTrend?: (trendId: string) => void; // New prop
  productTrendToSelect: string | null; // New prop to specify which product trend to select
  // Video
  onSetVideo: (dataUrl: string, key: string, postInfo: PostInfo) => void;
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
  onLoadStrategyHubData?: () => void;
  isLoadingStrategyHubData?: boolean;
  isAffiliateVaultDataLoaded?: boolean;
  onLoadAffiliateVaultData?: () => void;
  isLoadingAffiliateVaultData?: boolean;
  isPersonasDataLoaded?: boolean;
  onLoadPersonasData?: () => void;
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
    onPublishPost,
    onUpdatePersona,
    onLoadIdeasForTrend,
    onCreateFunnelCampaignPlan, // New prop
    viewingPost,
    setViewingPost,
  } = props;
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [initialWizardPrompt, setInitialWizardPrompt] = useState('');
  const [initialWizardProductId, setInitialWizardProductId] = useState<string | undefined>(undefined);
  
  // State for Funnel Campaign Wizard
  const [isFunnelWizardOpen, setIsFunnelWizardOpen] = useState(false);
  
  // State for tracking which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<ActiveTab>>(new Set(['brandKit']));
  
  // State for tracking loading status of tabs
  const [loadingTabs, setLoadingTabs] = useState<Set<ActiveTab>>(new Set());
  
  // Load data on demand when switching tabs
  useEffect(() => {
    console.log("Tab switching useEffect triggered", { activeTab, loadedTabs, loadingTabs });
    
    // Load strategy hub data when switching to strategy tab
    if (activeTab === 'strategy' && !loadedTabs.has('strategy') && props.onLoadStrategyHubData && !loadingTabs.has('strategy')) {
      console.log("Loading strategy hub data...");
      setLoadingTabs(prev => new Set(prev).add('strategy'));
      props.onLoadStrategyHubData().then(() => {
        // Success - mark tab as loaded
        console.log("Strategy hub data loaded successfully");
        setLoadedTabs(prev => new Set(prev).add('strategy'));
      }).catch((error) => {
        // Error - don't mark tab as loaded so it can retry
        console.error("Failed to load strategy hub data:", error);
      }).finally(() => {
        // Always clean up loading state
        setLoadingTabs(prev => {
          const newSet = new Set(prev);
          newSet.delete('strategy');
          return newSet;
        });
      });
    }
    
    // Load affiliate vault data when switching to affiliate vault tab
    if (activeTab === 'affiliateVault' && !loadedTabs.has('affiliateVault') && props.onLoadAffiliateVaultData && !loadingTabs.has('affiliateVault')) {
      console.log("Loading affiliate vault data...");
      setLoadingTabs(prev => new Set(prev).add('affiliateVault'));
      props.onLoadAffiliateVaultData().then(() => {
        // Success - mark tab as loaded
        console.log("Affiliate vault data loaded successfully");
        setLoadedTabs(prev => new Set(prev).add('affiliateVault'));
      }).catch((error) => {
        // Error - don't mark tab as loaded so it can retry
        console.error("Failed to load affiliate vault data:", error);
      }).finally(() => {
        // Always clean up loading state
        setLoadingTabs(prev => {
          const newSet = new Set(prev);
          newSet.delete('affiliateVault');
          return newSet;
        });
      });
    }
    
    // Load personas data when switching to personas tab
    if (activeTab === 'personas' && !loadedTabs.has('personas') && props.onLoadPersonasData && !loadingTabs.has('personas')) {
      console.log("Loading personas data...");
      setLoadingTabs(prev => new Set(prev).add('personas'));
      props.onLoadPersonasData().then(() => {
        // Success - mark tab as loaded
        console.log("Personas data loaded successfully");
        setLoadedTabs(prev => new Set(prev).add('personas'));
      }).catch((error) => {
        // Error - don't mark tab as loaded so it can retry
        console.error("Failed to load personas data:", error);
      }).finally(() => {
        // Always clean up loading state
        setLoadingTabs(prev => {
          const newSet = new Set(prev);
          newSet.delete('personas');
          return newSet;
        });
      });
    }
  }, [activeTab, loadedTabs, loadingTabs, props.onLoadStrategyHubData, props.onLoadAffiliateVaultData, props.onLoadPersonasData]);
  
  // Also load data when the component mounts if we're on a tab that needs data
  useEffect(() => {
    console.log("Mount useEffect triggered", { activeTab, loadedTabs, loadingTabs });
    
    // Only run this once when the component mounts
    if (loadedTabs.size === 1 && loadedTabs.has('brandKit')) {
      // Load strategy hub data if we start on the strategy tab
      if (activeTab === 'strategy' && !loadedTabs.has('strategy') && props.onLoadStrategyHubData && !loadingTabs.has('strategy')) {
        console.log("Loading strategy hub data on mount...");
        setLoadingTabs(prev => new Set(prev).add('strategy'));
        props.onLoadStrategyHubData().then(() => {
          console.log("Strategy hub data loaded successfully on mount");
          setLoadedTabs(prev => new Set(prev).add('strategy'));
        }).catch((error) => {
          console.error("Failed to load strategy hub data on mount:", error);
        }).finally(() => {
          setLoadingTabs(prev => {
            const newSet = new Set(prev);
            newSet.delete('strategy');
            return newSet;
          });
        });
      }
      
      // Load affiliate vault data if we start on the affiliate vault tab
      if (activeTab === 'affiliateVault' && !loadedTabs.has('affiliateVault') && props.onLoadAffiliateVaultData && !loadingTabs.has('affiliateVault')) {
        console.log("Loading affiliate vault data on mount...");
        setLoadingTabs(prev => new Set(prev).add('affiliateVault'));
        props.onLoadAffiliateVaultData().then(() => {
          console.log("Affiliate vault data loaded successfully on mount");
          setLoadedTabs(prev => new Set(prev).add('affiliateVault'));
        }).catch((error) => {
          console.error("Failed to load affiliate vault data on mount:", error);
        }).finally(() => {
          setLoadingTabs(prev => {
            const newSet = new Set(prev);
            newSet.delete('affiliateVault');
            return newSet;
          });
        });
      }
      
      // Load personas data if we start on the personas tab
      if (activeTab === 'personas' && !loadedTabs.has('personas') && props.onLoadPersonasData && !loadingTabs.has('personas')) {
        console.log("Loading personas data on mount...");
        setLoadingTabs(prev => new Set(prev).add('personas'));
        props.onLoadPersonasData().then(() => {
          console.log("Personas data loaded successfully on mount");
          setLoadedTabs(prev => new Set(prev).add('personas'));
        }).catch((error) => {
          console.error("Failed to load personas data on mount:", error);
        }).finally(() => {
          setLoadingTabs(prev => {
            const newSet = new Set(prev);
            newSet.delete('personas');
            return newSet;
          });
        });
      }
    }
  }, []); // Empty dependency array to run only once on mount
  
  // Function to mark a tab as loaded
  const markTabAsLoaded = (tab: ActiveTab) => {
    setLoadedTabs(prev => new Set(prev).add(tab));
  };
  
  // Function to mark a tab as loading
  const markTabAsLoading = (tab: ActiveTab) => {
    setLoadingTabs(prev => new Set(prev).add(tab));
  };
  
  // Function to mark a tab as finished loading
  const markTabAsFinishedLoading = (tab: ActiveTab) => {
    setLoadingTabs(prev => {
      const newSet = new Set(prev);
      newSet.delete(tab);
      return newSet;
    });
  };

  const handleOpenWizard = (prompt = '', productId?: string) => {
    setInitialWizardPrompt(prompt);
    setInitialWizardProductId(productId);
    // If we're opening from another tab, switch to the media plan tab
    if (activeTab !== 'mediaPlan') {
      setActiveTab('mediaPlan');
    }
    setIsWizardOpen(true);
  };
  
  // Override setActiveTab to implement lazy loading
  const handleSetActiveTab = (tab: ActiveTab) => {
    // Call the original setActiveTab
    setActiveTab(tab);
  };
  
  // Handler for opening the Funnel Campaign Wizard
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
              // New props for on-demand loading
              planGroupsList={mediaPlanGroupsList}
              onSelectPlan={onSelectPlan}
              activePlanId={activePlanId}
              onUpdatePost={onUpdatePost}
              onRefinePost={onRefinePost}
              onAssignPersonaToPlan={onAssignPersonaToPlan}
              // KhongMinh Props
              analyzingPostIds={analyzingPostIds}
              isAnyAnalysisRunning={isAnyAnalysisRunning}
              khongMinhSuggestions={khongMinhSuggestions}
              onAcceptSuggestion={onAcceptSuggestion}
              onRunKhongMinhForPost={onRunKhongMinhForPost}
              // On-demand prompt generation
              generatingPromptKeys={generatingPromptKeys}
              onGeneratePrompt={onGeneratePrompt}
              // Comment Generation
              onGenerateAffiliateComment={onGenerateAffiliateComment}
              generatingCommentPostIds={generatingCommentPostIds}
              // Selection and Scheduling
              selectedPostIds={selectedPostIds}
              onTogglePostSelection={onTogglePostSelection}
              onSelectAllPosts={onSelectAllPosts}
              onClearSelection={onClearSelection}
              onOpenScheduleModal={onOpenScheduleModal}
              onOpenBulkScheduleModal={onOpenBulkScheduleModal}
              onPostDrop={onPostDrop}
              onPublishPost={onPublishPost} // Pass the new prop
              // Bulk Actions
              isPerformingBulkAction={isPerformingBulkAction}
              onBulkGenerateImages={onBulkGenerateImages}
              onBulkSuggestPromotions={onBulkSuggestPromotions}
              onBulkGenerateComments={onBulkGenerateComments}
              brandFoundation={brandFoundation}
              // New prop for opening funnel wizard
              onOpenFunnelWizard={handleOpenFunnelWizard}
              viewingPost={viewingPost}
              setViewingPost={setViewingPost}
            />
          )}
          {activeTab === 'strategy' && (
            <StrategyDisplay
              language={settings.language}
              trends={assets.trends || []}
              ideas={assets.ideas || []}
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
              onLoadIdeasForTrend={onLoadIdeasForTrend}
              // Lazy loading props
              isDataLoaded={loadedTabs.has('strategy')}
              onLoadData={props.onLoadStrategyHubData}
              isLoading={loadingTabs.has('strategy')}
            />
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
              // Lazy loading props
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
              onSetPersonaImage={onSetPersonaImage}
              isUploadingImage={isUploadingImage}
              language={settings.language}
              onUpdatePersona={onUpdatePersona}
              brandFoundation={brandFoundation}
              onAutoGeneratePersona={onAutoGeneratePersona}
              // Lazy loading props
              isDataLoaded={loadedTabs.has('personas')}
              onLoadData={props.onLoadPersonasData}
              isLoading={loadingTabs.has('personas')}
            />
          )}
        </Suspense>
      </main>
      
      <ScheduleModal
        isOpen={!!schedulingPost}
        onClose={() => onOpenScheduleModal(null)}
        schedulingPost={schedulingPost}
        onSchedule={onSchedulePost}
        isScheduling={isScheduling}
        language={settings.language}
      />

      <BulkScheduleModal
        isOpen={isBulkScheduleModalOpen}
        onClose={onCloseBulkScheduleModal}
        onSchedule={onBulkSchedule}
        isScheduling={isScheduling}
        language={settings.language}
        selectedCount={selectedPostIds.size}
      />

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
    </div>
  );
};

export default MainDisplay;