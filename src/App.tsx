import React, { useState, useCallback, useEffect, useRef, useReducer, Suspense, lazy } from 'react';
import { isAdminAuthenticated as checkAdminAuthenticated, authenticateAdmin, logoutAdmin } from './services/adminAuthService';

// Lazy load components
const IdeaProfiler = lazy(() => import('./components/IdeaProfiler'));
const BrandProfiler = lazy(() => import('./components/BrandProfiler'));
const MainDisplay = lazy(() => import('./components/MainDisplay'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const AutoPersonaResultModal = lazy(() => import('./components/AutoPersonaResultModal'));

// UI Components
import { Button } from './components/ui';
import Loader from './components/Loader';
import Toast from './components/Toast';

// Types
import type { BrandInfo, GeneratedAssets, Settings, PostInfo, MediaPlanGroup, AffiliateLink } from '../types';
import { ActiveTab } from './components/Header';

// Services
import { initializeApp } from './services/databaseService';
import { configService, AiModelConfig } from './services/configService';

// Hooks
import { usePersonaManagement } from './hooks/usePersonaManagement';
import { useMediaPlanManagement } from './hooks/useMediaPlanManagement';
import { useAssetManagement } from './hooks/useAssetManagement';
import { useStrategyManagement } from './hooks/useStrategyManagement';
import { useSchedulingManagement } from './hooks/useSchedulingManagement';
import { useProjectIO } from './hooks/useProjectIO';

// Reducer
import { assetsReducer, initialGeneratedAssets } from './reducers/assetsReducer';

const App: React.FC = () => {
    const initRef = useRef(false);
    // Core App State
    const [currentStep, setCurrentStep] = useState<'idea' | 'profile' | 'assets'>('idea');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loaderContent, setLoaderContent] = useState<{ title: string; steps: string[]; } | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('brandKit');

    // Brand & Project State
    const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
    const [generatedAssets, dispatchAssets] = useReducer(assetsReducer, null);
    const [mongoBrandId, setMongoBrandId] = useState<string | null>(null);
    const [brands, setBrands] = useState<{ id: string, name: string }[]>([]);

    // Settings & Config State
    const [settings, setSettings] = useState<Settings>(configService.getAppSettings());
    const [adminSettings, setAdminSettings] = useState<Settings | null>(null);
    const [aiModelConfig, setAiModelConfig] = useState<AiModelConfig | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

    // Asset State
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
    const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
    const [generatingImageKeys, setGeneratingImageKeys] = useState<Set<string>>(new Set());

    // UI & Loading State
    const [isConfigLoaded, setIsConfigLoaded] = useState(false);
    const [isFetchingBrands, setIsFetchingBrands] = useState(true);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const autoSaveTimeoutRef = useRef<number | null>(null);
    const [viewingPost, setViewingPost] = useState<PostInfo | null>(null);
    const [areCredentialsSet, setAreCredentialsSet] = useState(false);
    const [integrationsVersion, setIntegrationsVersion] = useState(0);

    // Admin Auth State
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => checkAdminAuthenticated());
    const [adminPassword, setAdminPassword] = useState<string>('');

    // Media Plan State
    const [mediaPlanGroupsList, setMediaPlanGroupsList] = useState<{id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]>([]);
    const [activePlanId, setActivePlanId] = useState<string | null>(null);

    // Refactored Logic via Custom Hooks
    const updateAutoSaveStatus = useCallback((status: 'saving' | 'saved' | 'error') => {
        setAutoSaveStatus(status);
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        if (status === 'saved' || status === 'error') {
            autoSaveTimeoutRef.current = window.setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
    }, []);

    const ensureMongoProject = useCallback(async (assetsToSave?: GeneratedAssets): Promise<string | null> => {
        return null; // Placeholder
    }, []);

    const personaManager = usePersonaManagement({
        mongoBrandId, settings, aiModelConfig, dispatchAssets, updateAutoSaveStatus,
        setGeneratedImages, setError, setLoaderContent, ensureMongoProject, generatedAssets, setSuccessMessage
    });

    const assetManager = useAssetManagement({
        mongoBrandId, generatedAssets, settings, aiModelConfig, dispatchAssets, setGeneratedImages, setGeneratedVideos,
        setGeneratingImageKeys, updateAutoSaveStatus, setError, setViewingPost
    });

    const mediaPlanManager = useMediaPlanManagement({
        generatedAssets, settings, aiModelConfig, generatedImages, mongoBrandId, ensureMongoProject, dispatchAssets,
        setLoaderContent, setError, updateAutoSaveStatus, setMediaPlanGroupsList, setActivePlanId,
        setKhongMinhSuggestions: () => {}, setGeneratedImages, setSuccessMessage, setActiveTab
    });

    const strategyManager = useStrategyManagement({
        mongoBrandId, dispatchAssets, setError, setLoaderContent, updateAutoSaveStatus, settings, aiModelConfig,
        generatedAssets, setActiveTab, setProductTrendToSelect: () => {}, setSuccessMessage
    });

    const schedulingManager = useSchedulingManagement({
        generatedAssets, mongoBrandId, settings, dispatchAssets, updateAutoSaveStatus, setError, setSuccessMessage
    });

    const projectIO = useProjectIO({
        dispatchAssets, setSettings, setGeneratedImages, setGeneratedVideos, setMongoBrandId, setCurrentStep, setActiveTab,
        setLoaderContent, setError, setSuccessMessage, setMediaPlanGroupsList, setActivePlanId,
        setBrandInfo, generatedAssets, settings, generatedImages, generatedVideos, mongoBrandId, adminSettings,
        mediaPlanGroupsList
    });

    // LOGGING EFFECT
    useEffect(() => {
        console.log('[App.tsx] mediaPlanGroupsList state changed:', mediaPlanGroupsList);
    }, [mediaPlanGroupsList]);

    // App Initialization
    useEffect(() => {
        if (initRef.current) {
            return;
        }
        initRef.current = true;

        const loadInitialData = async () => {
            try {
                setIsFetchingBrands(true);
                const { credentialsSet, brands, adminDefaults } = await initializeApp();
                await configService.initializeConfig(adminDefaults);
                setAdminSettings(configService.getAdminDefaults());
                setSettings(configService.getAppSettings());
                setAiModelConfig(configService.getAiModelConfig());
                setIsAdminAuthenticated(checkAdminAuthenticated());
                setAreCredentialsSet(credentialsSet);
                setBrands(brands);
            } catch (error) {
                setError("Failed to load initial configuration.");
            } finally {
                setIsConfigLoaded(true);
                setIsFetchingBrands(false);
            }
        };
        loadInitialData();
    }, []);

    // Other Callbacks
    const handleAdminLogout = useCallback(() => {
        logoutAdmin();
        setIsAdminAuthenticated(false);
    }, []);

    const handleGenerateProfile = useCallback(async (idea: string) => {
    }, []);

    const handleGenerateKit = useCallback(async (info: BrandInfo) => {
    }, []);

    const handleBackToIdea = useCallback(() => {
        setCurrentStep('idea');
        setActiveTab('brandKit');
        setBrandInfo(null);
        dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: initialGeneratedAssets });
        setGeneratedImages({});
        setMongoBrandId(null);
        setError(null);
        setSuccessMessage(null);
    }, []);

    const handleSaveSettings = useCallback(async (newSettings: Settings) => {
    }, [mongoBrandId]);

    const setLanguage = useCallback(async (lang: string) => {
        await configService.updateAppSettings({ ...settings, language: lang });
        setSettings(configService.getAppSettings());
    }, [settings]);

    // Render Logic
    if (!isConfigLoaded) return <Loader title="Loading application configuration..." steps={[]} />;

    const isAdminRoute = window.location.pathname === '/admin';
    if (isAdminRoute) {
        if (isAdminAuthenticated) return <AdminPage onLogout={handleAdminLogout} />;
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
                    <input type="password" placeholder="Enter admin password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <Button onClick={() => { if (authenticateAdmin(adminPassword)) { setIsAdminAuthenticated(true); } else { setError('Invalid password'); } }} className="w-full mt-4">Login</Button>
                    {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                </div>
            </div>
        );
    }

    if (loaderContent) return <Loader title={loaderContent.title} steps={loaderContent.steps} />;
    if (error) return (
        <div className="fixed inset-0 bg-red-50 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl border border-red-200 text-center max-w-lg">
                <h2 className="text-2xl font-bold text-red-700">An Error Occurred</h2>
                <p className="mt-2 text-gray-600 font-serif">{error}</p>
                <Button onClick={() => setError(null)} className="mt-6">Close</Button>
            </div>
        </div>
    );

    switch (currentStep) {
        case 'idea':
            return (
                <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                    <IdeaProfiler
                        onGenerateProfile={handleGenerateProfile}
                        isLoading={!!loaderContent}
                        onLoadProject={projectIO.handleLoadProjectFile}
                        onLoadProjectFromDatabase={projectIO.handleLoadFromDatabase}
                        language={settings.language}
                        setLanguage={setLanguage}
                        brands={brands}
                        isFetchingBrands={isFetchingBrands}
                        areCredentialsSet={areCredentialsSet}
                        integrationsVersion={integrationsVersion}
                        onOpenIntegrations={() => { /* Placeholder */ }}
                    />
                </Suspense>
            );
        case 'profile':
            return (
                <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                    <BrandProfiler
                        initialBrandInfo={brandInfo!}
                        onGenerate={handleGenerateKit}
                        isLoading={!!loaderContent}
                        onBack={handleBackToIdea}
                        language={settings.language}
                    />
                </Suspense>
            );
        case 'assets':
            if (!generatedAssets) return <div>Loading assets...</div>;
            return (
                <>
                    <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                        <MainDisplay
                            settings={settings}
                            assets={generatedAssets}
                            generatedImages={generatedImages}
                            generatedVideos={generatedVideos}
                            isGeneratingImage={(key) => generatingImageKeys.has(key)}
                            isUploadingImage={() => false}
                            autoSaveStatus={autoSaveStatus}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onStartOver={handleBackToIdea}
                            onOpenSettings={() => setIsSettingsModalOpen(true)}
                            onOpenIntegrations={() => {}}
                            mediaPlanGroupsList={mediaPlanGroupsList}
                            activePlanId={activePlanId}
                            // Project I/O
                            onSaveProject={projectIO.handleSaveProjectToFile}
                            isSavingProject={false}
                            onSelectPlan={projectIO.handleSelectPlan}
                            // Asset Management
                            onGenerateImage={assetManager.handleGenerateImage}
                            onSetImage={assetManager.handleSetImage}
                            onSetVideo={assetManager.handleSetVideo}
                            // Persona Management
                            onSavePersona={personaManager.handleSavePersona}
                            onDeletePersona={personaManager.handleDeletePersona}
                            onUpdatePersona={personaManager.handleUpdatePersona}
                            onSetPersonaImage={personaManager.handleSetPersonaImage}
                            onAutoGeneratePersona={personaManager.handleAutoGeneratePersona}
                            onLoadPersonasData={personaManager.handleLoadPersonasData}
                            // Media Plan Management
                            onGeneratePlan={mediaPlanManager.handleGenerateMediaPlanGroup}
                            onCreateFunnelCampaignPlan={mediaPlanManager.handleCreateFunnelCampaignPlan}
                            onGenerateContentPackage={mediaPlanManager.handleGenerateContentPackage}
                            isGeneratingPlan={false}
                            onRegenerateWeekImages={() => {}}
                            productImages={[]}
                            onSetProductImages={() => {}}
                            onExportBrandKit={() => {}}
                            isExportingBrandKit={false}
                            onExportPlan={() => {}}
                            isExportingPlan={false}
                            // Strategy Management
                            onLoadStrategyHubData={strategyManager.handleLoadStrategyHubData}
                            onLoadAffiliateVaultData={strategyManager.handleLoadAffiliateVaultData}
                            onSaveTrend={strategyManager.handleSaveTrend}
                            onDeleteTrend={strategyManager.handleDeleteTrend}
                            onGenerateIdeas={strategyManager.handleGenerateIdeas}
                            onGenerateIdeasFromProduct={strategyManager.handleGenerateIdeasFromProduct}
                            onSaveAffiliateLink={(link) => strategyManager.handleSaveAffiliateLink([link])}
                            onDeleteAffiliateLink={(linkId) => strategyManager.handleDeleteAffiliateLink(linkId)}
                            onImportAffiliateLinks={(links) => strategyManager.handleImportAffiliateLinks(links as AffiliateLink[])}
                            onReloadLinks={() => {}}
                            onGenerateTrendsFromSearch={() => {}}
                            isGeneratingTrendsFromSearch={false}
                            productTrendToSelect={null}
                            onAddFacebookPostIdeaToPlan={() => {}}
                            isGeneratingFacebookPostIdeas={false}
                            onGenerateFacebookPostIdeas={() => {}}
                            // Scheduling Management
                            selectedPostIds={schedulingManager.selectedPostIds}
                            schedulingPost={schedulingManager.schedulingPost ? { 
                              id: schedulingManager.schedulingPost.post.id,
                              title: schedulingManager.schedulingPost.post.title,
                              platform: schedulingManager.schedulingPost.post.platform,
                              scheduledAt: schedulingManager.schedulingPost.post.scheduledAt || null,
                              status: schedulingManager.schedulingPost.post.status,
                              post: schedulingManager.schedulingPost.post
                            } : null}
                            isBulkScheduleModalOpen={schedulingManager.isBulkScheduleModalOpen}
                            isScheduling={schedulingManager.isScheduling}
                            onTogglePostSelection={schedulingManager.handleTogglePostSelection}
                            onSelectAllPosts={schedulingManager.handleSelectAllPosts}
                            onClearSelection={() => schedulingManager.setSelectedPostIds(new Set())}
                            onOpenScheduleModal={(post) => {
                              if (post === null) {
                                schedulingManager.setSchedulingPost(null);
                              } else {
                                // Convert SchedulingPost to PostInfo if needed
                                // This is a placeholder - you'll need to implement the proper conversion
                                console.warn("onOpenScheduleModal received SchedulingPost, but schedulingManager expects PostInfo");
                                schedulingManager.setSchedulingPost(null);
                              }
                            }}
                            onPublishPost={(postInfo) => schedulingManager.handlePublishPost(postInfo)}
                            onSchedulePost={(schedulingPost, scheduledAt) => {
                              // Convert SchedulingPost to PostInfo if needed
                              // For now, we'll just log a warning as this needs proper implementation
                              console.warn("onSchedulePost received SchedulingPost, but schedulingManager expects PostInfo");
                            }}
                            onPostDrop={schedulingManager.handlePostDrop}
                            onOpenBulkScheduleModal={() => schedulingManager.setIsBulkScheduleModalOpen(true)}
                            onCloseBulkScheduleModal={() => schedulingManager.setIsBulkScheduleModalOpen(false)}
                            onBulkSchedule={(startDate, intervalDays, intervalHours, intervalMinutes) => {
                              // Convert string to Date and call with correct parameters
                              const date = new Date(startDate);
                              schedulingManager.handleBulkSchedule(date, intervalDays);
                            }}
                            isPerformingBulkAction={false}
                            onBulkGenerateImages={() => {}}
                            onBulkSuggestPromotions={() => {}}
                            onBulkGenerateComments={() => {}}
                            // Other Props
                            viewingPost={viewingPost}
                            setViewingPost={setViewingPost}
                            // Additional required props that were missing
                            isAnyAnalysisRunning={false}
                            analyzingPostIds={new Set<string>()}
                            khongMinhSuggestions={{}}
                            generatingPromptKeys={new Set<string>()}
                            generatingCommentPostIds={new Set<string>()}
                            onRunKhongMinhForPost={() => {}}
                            onAcceptSuggestion={() => {}}
                            onGeneratePrompt={async () => null}
                            onGenerateAffiliateComment={async () => null}
                            onRefinePost={async () => ''}
                            onGenerateInCharacterPost={async () => {}}
                            onUpdatePost={() => {}}
                            onAssignPersonaToPlan={() => {}}
                            brandFoundation={generatedAssets?.brandFoundation || initialGeneratedAssets.brandFoundation}
                            onOpenFunnelWizard={() => {}}
                        />
                    </Suspense>
                    <Suspense fallback={null}>
                        <SettingsModal
                            isOpen={isSettingsModalOpen}
                            onClose={() => setIsSettingsModalOpen(false)}
                            settings={settings}
                            adminSettings={adminSettings}
                            onSave={handleSaveSettings}
                        />
                    </Suspense>
                    <Suspense fallback={null}>
                        <AutoPersonaResultModal
                            isOpen={personaManager.isAutoPersonasModalOpen}
                            onClose={() => personaManager.setIsAutoPersonasModalOpen(false)}
                            onSave={personaManager.handleSaveSelectedPersonas}
                            personaData={personaManager.autoGeneratedPersonas}
                            language={settings.language}
                        />
                    </Suspense>
                    {successMessage && <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />}
                </>
            );
        default:
            return <div>Invalid state</div>;
    }
};

export default App;