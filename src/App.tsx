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
import { initializeApp, createOrUpdateBrandRecordInDatabase, saveSettingsToDatabase } from './services/databaseService';
import { configService, AiModelConfig } from './services/configService';
import { textGenerationService } from './services/textGenerationService';

// Hooks
import { usePersonaManagement } from './hooks/usePersonaManagement';
import { useMediaPlanManagement } from './hooks/useMediaPlanManagement';
import { useAssetManagement } from './hooks/useAssetManagement';
import { useStrategyManagement } from './hooks/useStrategyManagement';
import { useSchedulingManagement } from './hooks/useSchedulingManagement';
import { useProjectIO } from './hooks/useProjectIO';
import { useAutoSave } from './hooks/useAutoSave';

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
    const [productTrendToSelect, setProductTrendToSelect] = useState<string | null>(null); // Add this line

    // Brand & Project State
    const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
    const [generatedAssets, dispatchAssets] = useReducer(assetsReducer, initialGeneratedAssets);
    const [mongoBrandId, setMongoBrandId] = useState<string | null>(null);
    const [brands, setBrands] = useState<{ id: string, name: string }[]>([]);

    // Settings & Config State
    const [adminSettings, setAdminSettings] = useState<Settings | null>(null);
    const [aiModelConfig, setAiModelConfig] = useState<AiModelConfig | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

    // DERIVED STATE: Get settings from the main assets reducer
    const settings = generatedAssets?.settings || initialGeneratedAssets.settings;

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
        if (mongoBrandId) {
            return mongoBrandId;
        }

        if (!areCredentialsSet) {
            console.warn('[ensureMongoProject] MongoDB credentials not configured.');
            return null;
        }

        const assetsForCreation = assetsToSave || generatedAssets;
        if (!assetsForCreation) {
             setError("Cannot create a new brand without assets.");
             return null;
        }
        
        setLoaderContent({ title: "Creating new brand...", steps: ["Saving initial data to database..."] });
        setError(null);
        try {
            const newBrandId = await createOrUpdateBrandRecordInDatabase(assetsForCreation, null);
            if (!newBrandId) {
                throw new Error("Database did not return a new brand ID.");
            }
            setMongoBrandId(newBrandId);
            setSuccessMessage("Successfully created and saved new brand!");
            return newBrandId;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Could not create new brand in database.";
            setError(errorMessage);
            console.error('[ensureMongoProject] failed:', errorMessage);
            return null;
        } finally {
            setLoaderContent(null);
        }
    }, [
        mongoBrandId, 
        areCredentialsSet, 
        generatedAssets, 
        setLoaderContent, 
        setError, 
        setMongoBrandId, 
        setSuccessMessage
    ]);

    // Auto-save hook initialization
    const { forceSave, syncLastSaved } = useAutoSave({
        generatedAssets,
        mongoBrandId,
        updateAutoSaveStatus,
        autoSaveInterval: 2000
    });

    const personaManager = usePersonaManagement({
        mongoBrandId, settings, aiModelConfig, dispatchAssets, updateAutoSaveStatus,
        setGeneratedImages, setError, setLoaderContent, ensureMongoProject, generatedAssets, setSuccessMessage
    });

    const { handleGenerateImage, handleSetImage, handleSetVideo, handleGenerateAllCarouselImages } = useAssetManagement({
        mongoBrandId, generatedAssets, settings, aiModelConfig, dispatchAssets, setGeneratedImages, setGeneratedVideos,
        setGeneratingImageKeys, updateAutoSaveStatus, setError, setViewingPost
    });

    const mediaPlanManager = useMediaPlanManagement({
        generatedAssets, settings, adminSettings, aiModelConfig, generatedImages, mongoBrandId, ensureMongoProject, dispatchAssets,
        setLoaderContent, setError, updateAutoSaveStatus, setMediaPlanGroupsList, setActivePlanId,
        setKhongMinhSuggestions: () => {}, setGeneratedImages, setSuccessMessage, setActiveTab
    });

    const strategyManager = useStrategyManagement({
        mongoBrandId, dispatchAssets, setError, updateAutoSaveStatus, settings, aiModelConfig,
        generatedAssets, setActiveTab, setProductTrendToSelect, setSuccessMessage
    });

    const schedulingManager = useSchedulingManagement({
        generatedAssets, mongoBrandId, settings, dispatchAssets, updateAutoSaveStatus, setError, setSuccessMessage
    });

    const projectIO = useProjectIO({
        dispatchAssets, setGeneratedImages, setGeneratedVideos, setMongoBrandId, setCurrentStep, setActiveTab,
        setLoaderContent, setError, setSuccessMessage, setMediaPlanGroupsList, setActivePlanId,
        setBrandInfo, generatedAssets, settings, generatedImages, generatedVideos, mongoBrandId, adminSettings,
        mediaPlanGroupsList,
        syncLastSaved,
    });

    const [isScheduling, setIsScheduling] = useState<boolean>(false);

    // App Initialization
    useEffect(() => {
        if (initRef.current) {
            return;
        }
        initRef.current = true;

        const loadInitialData = async () => {
            try {
                setIsFetchingBrands(true);
                const { credentialsSet, brands, adminDefaults, aiModels } = await initializeApp();
                await configService.initializeConfig(adminDefaults, aiModels);
                setAdminSettings(configService.getAdminDefaults());
                dispatchAssets({ type: 'UPDATE_SETTINGS', payload: configService.getAppSettings() });
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
        if (!aiModelConfig) {
            setError("AI model configuration not loaded. Please try again.");
            return;
        }

        setLoaderContent({
            title: settings.language === 'Việt Nam' ? "Đang tạo hồ sơ thương hiệu..." : "Generating brand profile...",
            steps: [
                settings.language === 'Việt Nam' ? "Phân tích ý tưởng..." : "Analyzing idea...",
                settings.language === 'Việt Nam' ? "Xác định sứ mệnh & tầm nhìn..." : "Defining mission & vision...",
                settings.language === 'Việt Nam' ? "Tạo giá trị cốt lõi..." : "Creating core values...",
                settings.language === 'Việt Nam' ? "Xác định đối tượng mục tiêu..." : "Identifying target audience...",
            ]
        });

        try {
            const brandProfile = await textGenerationService.generateBrandProfile(
                { idea, language: settings.language, brandSettings: settings, adminSettings: adminSettings! },
                aiModelConfig!
            );
            setBrandInfo(brandProfile);
            setCurrentStep('profile');
        } catch (error: any) {
            setError(settings.language === 'Việt Nam' 
                ? `Lỗi khi tạo hồ sơ thương hiệu: ${error.message || 'Vui lòng thử lại sau.'}` 
                : `Error generating brand profile: ${error.message || 'Please try again later.'}`);
        } finally {
            setLoaderContent(null);
        }
    }, [aiModelConfig, settings, adminSettings, setBrandInfo, setCurrentStep, setError, setLoaderContent]);

    const handleGenerateKit = useCallback(async (info: BrandInfo) => {
        if (!aiModelConfig) {
            setError("AI model configuration not loaded. Please try again.");
            return;
        }
        
        setLoaderContent({
            title: settings.language === 'Việt Nam' ? "Đang tạo tài sản thương hiệu..." : "Generating brand assets...",
            steps: [
                settings.language === 'Việt Nam' ? "Tạo hồ sơ thương hiệu chi tiết..." : "Generating detailed brand profile...",
                settings.language === 'Việt Nam' ? "Tạo khái niệm logo..." : "Generating logo concepts...",
                settings.language === 'Việt Nam' ? "Tạo bảng màu & phông chữ..." : "Generating color palette & fonts...",
            ]
        });

        try {
            const partialAssets = await textGenerationService.generateBrandKit(
                { brandInfo: info, language: settings.language, brandSettings: settings, adminSettings: adminSettings! },
                aiModelConfig!
            );

            const fullAssets: GeneratedAssets = {
                ...initialGeneratedAssets,
                ...partialAssets,
                settings: settings, // Carry over current settings
            };

            const newBrandId = await projectIO.handleCreateNewBrand(fullAssets);

            if (newBrandId) {
                syncLastSaved(fullAssets);
                setMongoBrandId(newBrandId);
                dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: fullAssets });
                setMediaPlanGroupsList([]);
                setActivePlanId(null);
                setBrandInfo(info);
                setCurrentStep('assets');
            } else {
                console.error("Brand creation failed. Not proceeding.");
            }
        } catch (error: any) {
            setError(settings.language === 'Việt Nam' 
                ? `Lỗi khi tạo tài sản thương hiệu: ${error.message || 'Vui lòng thử lại sau.'}` 
                : `Error generating brand assets: ${error.message || 'Please try again later.'}`);
        } finally {
            setLoaderContent(null);
        }
    }, [aiModelConfig, settings, adminSettings, dispatchAssets, setBrandInfo, setCurrentStep, setError, setLoaderContent, projectIO, syncLastSaved]);

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
        if (!mongoBrandId) {
            setError('Cannot save settings: No brand ID is currently loaded.');
            return;
        }
        try {
            dispatchAssets({ type: 'UPDATE_SETTINGS', payload: newSettings });
            await saveSettingsToDatabase(newSettings, mongoBrandId);
            setSuccessMessage('Settings saved successfully!');
        } catch (err) {
            setError(`Failed to save settings: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }, [mongoBrandId, dispatchAssets]);

    const setLanguage = useCallback(async (lang: string) => {
        const newSettings = { ...settings, language: lang };
        dispatchAssets({ type: 'UPDATE_SETTINGS', payload: newSettings });
        await configService.updateAppSettings(newSettings); // For persistence across sessions if needed
    }, [settings, dispatchAssets]);

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
                            plans={generatedAssets?.mediaPlans || []}
                            personas={generatedAssets?.personas || []}
                            affiliateLinks={generatedAssets?.affiliateLinks || []}
                            onSaveProject={projectIO.handleSaveProjectToFile}
                            isSavingProject={false}
                            onSelectPlan={projectIO.handleSelectPlan}
                            onGenerateImage={handleGenerateImage}
                            onSetImage={handleSetImage}
                            onSetVideo={handleSetVideo}
                            onGenerateAllCarouselImages={handleGenerateAllCarouselImages}
                            onSavePersona={personaManager.handleSavePersona}
                            onDeletePersona={personaManager.handleDeletePersona}
                            onUpdatePersona={personaManager.handleUpdatePersona}
                            onSetPersonaImage={personaManager.handleSetPersonaImage}
                            onAutoGeneratePersona={personaManager.handleAutoGeneratePersona}
                            onLoadPersonasData={personaManager.handleLoadPersonasData}
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
                            isSelectingTrend={strategyManager.isSelectingTrend}
                            isGeneratingStrategyIdeas={strategyManager.isGeneratingIdeas}
                            generatingIdeasForProductId={strategyManager.generatingIdeasForProductId}
                            isSuggestingTrends={strategyManager.isSuggestingTrends}
                            onLoadStrategyHubData={strategyManager.handleLoadStrategyHubData}
                            onLoadAffiliateVaultData={strategyManager.handleLoadAffiliateVaultData}
                            onSaveTrend={strategyManager.handleSaveTrend}
                            onDeleteTrend={strategyManager.handleDeleteTrend}
                            onGenerateIdeas={strategyManager.handleGenerateIdeas}
                            onGenerateIdeasFromProduct={strategyManager.handleGenerateIdeasFromProduct}
                            onSaveAffiliateLink={(link) => strategyManager.handleSaveAffiliateLink([link])}
                            onDeleteAffiliateLink={(linkId) => strategyManager.handleDeleteAffiliateLink(linkId)}
                            onImportAffiliateLinks={(links) => strategyManager.handleImportAffiliateLinks(links as AffiliateLink[])}
                            onSelectTrend={strategyManager.handleSelectTrend}
                            selectedTrend={strategyManager.selectedTrend}
                            ideasForSelectedTrend={strategyManager.ideasForSelectedTrend}
                            onReloadLinks={() => {}}
                            onGenerateTrendsFromSearch={() => {}}
                            onSuggestTrends={strategyManager.handleSuggestTrends}
                            productTrendToSelect={null}
                            onAddFacebookPostIdeaToPlan={() => {}}
                            isGeneratingFacebookPostIdeas={false}
                            onGenerateFacebookPostIdeas={() => {}}
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
                                console.warn("onOpenScheduleModal received SchedulingPost, but schedulingManager expects PostInfo");
                                schedulingManager.setSchedulingPost(null);
                              }
                            }}
                            onPublishPost={(postInfo) => schedulingManager.handlePublishPost(postInfo)}
                            onSchedulePost={(schedulingPost, scheduledAt) => {
                              console.warn("onSchedulePost received SchedulingPost, but schedulingManager expects PostInfo");
                            }}
                            onPostDrop={schedulingManager.handlePostDrop}
                            onOpenBulkScheduleModal={() => schedulingManager.setIsBulkScheduleModalOpen(true)}
                            onCloseBulkScheduleModal={() => schedulingManager.setIsBulkScheduleModalOpen(false)}
                            onBulkSchedule={(startDate, intervalDays, intervalHours, intervalMinutes) => {
                              const date = new Date(startDate);
                              schedulingManager.handleBulkSchedule(date, intervalDays);
                            }}
                            isPerformingBulkAction={false}
                            onBulkGenerateImages={() => {}}
                            onBulkSuggestPromotions={() => {}}
                            onBulkGenerateComments={() => {}}
                            viewingPost={viewingPost}
                            setViewingPost={setViewingPost}
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