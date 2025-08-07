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
  onGeneratePlan: (prompt: string, useSearch: boolean, totalPosts: number, selectedPlatforms: string[], options: { tone: string; style: string; length: string; includeEmojis: boolean; }, serializedProductImages: { name: string, type: string, data: string }[], personaId: string | null) => void;
  isGeneratingPlan: boolean;
  onRegenerateWeekImages: (planId: string, weekIndex: number) => void;
  productImages: File[]; // This prop is deprecated but kept for avoiding breaking changes in unrelated components.
  onSetProductImages: (files: File[]) => void; // This prop is deprecated.
  onSaveProject: () => void;
  isSavingProject: boolean;
  onStartOver: () => void;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onOpenSettings: () => void;
  onOpenIntegrations: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Media Plan Props
  mediaPlanGroupsList: {id: string; name: string; prompt: string; source?: MediaPlanGroup['source']; productImages?: { name: string, type: string, data: string }[]; personaId?: string;}[];
  onSelectPlan: (planId: string) => void;
  activePlanId: string | null;
  onUpdatePost: (postInfo: PostInfo) => void;
  onRefinePost: (text: string) => Promise<string>;
  onAssignPersonaToPlan: (planId: string, personaId: string | null) => void;
  // Affiliate Vault Props
  onSaveAffiliateLink: (link: AffiliateLink) => void;
  onDeleteAffiliateLink: (linkId: string) => void;
  onImportAffiliateLinks: (links: AffiliateLink[]) => void;
  onReloadLinks: () => void;
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
  // Bulk Actions
  isPerformingBulkAction: boolean;
  onBulkGenerateImages: (posts: PostInfo[]) => void;
  onBulkSuggestPromotions: (posts: PostInfo[]) => void;
  onBulkGenerateComments: (posts: PostInfo[]) => void;
  // Personas
  onSavePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
  onSetPersonaImage: (personaId: string, photoId: string, dataUrl: string) => Promise<string | undefined>;
  // Strategy Hub
  onSaveTrend: (trend: Trend) => void;
  onDeleteTrend: (trendId: string) => void;
  onGenerateIdeas: (trend: Trend, useSearch: boolean) => void;
  onGenerateContentPackage: (idea: Idea, pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest', personaId: string | null, options: { tone: string; style: string; length: string; }) => void;
  onGenerateTrendsFromSearch: (industry: string) => void;
  isGeneratingTrendsFromSearch: boolean;
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
    } = props;
    
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [initialWizardPrompt, setInitialWizardPrompt] = useState('');

    const handleOpenWizard = (prompt = '') => {
        setInitialWizardPrompt(prompt);
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
                        // Bulk Actions
                        isPerformingBulkAction={isPerformingBulkAction}
                        onBulkGenerateImages={onBulkGenerateImages}
                        onBulkSuggestPromotions={onBulkSuggestPromotions}
                        onBulkGenerateComments={onBulkGenerateComments}
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
                        onGenerateTrendsFromSearch={onGenerateTrendsFromSearch}
                        isGeneratingTrendsFromSearch={isGeneratingTrendsFromSearch}
                    />
                )}
                {activeTab === 'affiliateVault' && (
                     <AffiliateVaultDisplay 
                        affiliateLinks={assets.affiliateLinks || []}
                        onSaveLink={onSaveAffiliateLink}
                        onDeleteLink={onDeleteAffiliateLink}
                        onImportLinks={onImportAffiliateLinks}
                        onReloadLinks={props.onReloadLinks}
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
                onClose={() => { setIsWizardOpen(false); setInitialWizardPrompt(''); }}
                settings={settings}
                onGenerate={onGeneratePlan}
                isGenerating={isGeneratingPlan}
                personas={assets.personas || []}
                generatedImages={generatedImages}
                initialPrompt={initialWizardPrompt}
            />
        </div>
    );
};

export default MainDisplay;
