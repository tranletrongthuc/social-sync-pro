import React, { useState } from 'react';
import type { GeneratedAssets, MediaPlanGroup, Settings, AffiliateLink, MediaPlanPost, SchedulingPost, Persona, Trend, Idea, PostInfo } from '../types';
import AssetDisplay from './AssetDisplay';
import MediaPlanDisplay from './MediaPlanDisplay';
import AffiliateVaultDisplay from './AffiliateVaultDisplay';
import PersonasDisplay from './PersonasDisplay';
import StrategyDisplay from './StrategyDisplay';
import ScheduleModal from './ScheduleModal';
import BulkScheduleModal from './BulkScheduleModal';
import { Header, ActiveTab } from './Header';
import { MediaPlanWizardModal } from './MediaPlanWizardModal';

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
  mediaPlanGroupsList: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[];
      onSelectPlan: (planId: string, assetsToUse?: GeneratedAssets, plansList?: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]) => void;
    // New prop to pass brandFoundation
    brandFoundation: GeneratedAssets['brandFoundation'];
  activePlanId: string | null;
  onUpdatePost: (postInfo: PostInfo, updates: Partial<MediaPlanPost>) => void;
  onRefinePost: (postInfo: PostInfo, refinementPrompt: string) => void;
  onAssignPersonaToPlan: (planId: string, personaId: string | null) => void;
  // Affiliate Vault props
  onSaveAffiliateLink: (link: AffiliateLink) => void;
  onDeleteAffiliateLink: (linkId: string) => void;
  onImportAffiliateLinks: (links: AffiliateLink[]) => void;
  onReloadLinks: () => void; // New prop for reloading links
  onGenerateIdeasFromProduct: (product: AffiliateLink) => void;
  productTrendToSelect: string | null; // New prop to specify which product trend to select
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
  onOpenScheduleModal: (post: SchedulingPost | null) => void;
  onOpenBulkScheduleModal: () => void;
  onPostDrop: (postInfo: SchedulingPost, newDate: Date) => void;
  isPerformingBulkAction: boolean;
  onBulkGenerateImages: (posts: PostInfo[]) => void;
  onBulkSuggestPromotions: (posts: PostInfo[]) => void;
  onBulkGenerateComments: (posts: PostInfo[]) => void;
  onPublishPost: (postInfo: PostInfo) => void;
  onSavePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
  onSetPersonaImage: (dataUrl: string, imageKey: string, personaId: string) => void;
  onSaveTrend: (trend: Trend) => void;
  onDeleteTrend: (trendId: string) => void;
  onGenerateIdeas: (trend: Trend, useSearch: boolean) => void;
  onGenerateContentPackage: (idea: Idea, pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest', personaId: string | null, options: { tone: string; style: string; length: string; }) => void;
  onGenerateTrendsFromSearch: (industry: string) => void;
  isGeneratingTrendsFromSearch: boolean;
  onUpdatePersona: (persona: Persona) => void;
  onLoadIdeasForTrend?: (trendId: string) => void; // New prop
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
        onSaveTrend,
        onDeleteTrend,
        onGenerateIdeas,
        onGenerateContentPackage,
        onGenerateTrendsFromSearch,
        isGeneratingTrendsFromSearch,
        onPublishPost,
        onUpdatePersona,
        onLoadIdeasForTrend,
    } = props;
    
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [initialWizardPrompt, setInitialWizardPrompt] = useState('');
    const [initialWizardProductId, setInitialWizardProductId] = useState<string | undefined>(undefined);

    const handleOpenWizard = (prompt = '', productId?: string) => {
        setInitialWizardPrompt(prompt);
        setInitialWizardProductId(productId);
        // If we're opening from another tab, switch to the media plan tab
        if (activeTab !== 'mediaPlan') {
            setActiveTab('mediaPlan');
        }
        setIsWizardOpen(true);
    };

    return (
        <div className="w-full bg-white h-screen flex flex-col max-w-screen-2xl mx-auto shadow-lg border-x border-gray-200">
            <Header 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSaveProject={onSaveProject}
                isSavingProject={isSavingProject}
                autoSaveStatus={autoSaveStatus}
                onOpenSettings={onOpenSettings}
                onOpenIntegrations={onOpenIntegrations}
                onStartOver={onStartOver}
                language={settings.language}
            />

            <main className="flex-grow overflow-hidden">
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
                        />
                )}
                {activeTab === 'strategy' && (
                    <StrategyDisplay
                        language={settings.language}
                        trends={assets.trends || []}
                        ideas={assets.ideas || []}
                        personas={assets.personas || []}
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
                        productTrendToSelect={productTrendToSelect} // Pass the product trend to select
                        onLoadIdeasForTrend={onLoadIdeasForTrend} // Pass the new prop
                    />
                )}
                {activeTab === 'affiliateVault' && (
                     <AffiliateVaultDisplay 
                        affiliateLinks={assets.affiliateLinks || []}
                        onSaveLink={onSaveAffiliateLink}
                        onDeleteLink={onDeleteAffiliateLink}
                        onImportLinks={onImportAffiliateLinks}
                        onReloadLinks={props.onReloadLinks}
                        onGenerateIdeasFromProduct={props.onGenerateIdeasFromProduct}
                        language={settings.language}
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
                        onUpdatePersona={props.onUpdatePersona}
                    />
                )}
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
        </div>
    );
};

export default MainDisplay;
