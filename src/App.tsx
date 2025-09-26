import React, { useState, useCallback, useEffect, useRef, useReducer, Suspense, lazy, useMemo } from 'react';
import { isAdminAuthenticated as checkAdminAuthenticated, authenticateAdmin, logoutAdmin } from './services/adminAuthService';

// Task Management
import { TaskProvider, useTaskManager } from './contexts/TaskContext';
import TaskStatusIndicator from './components/TaskStatusIndicator';
import TaskNotification from './components/TaskNotification';

// Lazy load components
const IdeaProfiler = lazy(() => import('./components/IdeaProfiler'));
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
import { BackgroundTask } from './types/task.types';


// Services
import { initializeApp, createOrUpdateBrandRecordInDatabase, saveSettingsToDatabase } from './services/databaseService';
import { configService, AiModelConfig } from './services/configService';
import { taskService } from './services/taskService';

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

// AppContent component to use hooks inside TaskProvider
const AppContent: React.FC = () => {
    const initRef = useRef(false);
    // Core App State
    const [currentStep, setCurrentStep] = useState<'idea' | 'profile' | 'assets'>('idea');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loaderContent, setLoaderContent] = useState<{ title: string; steps: string[]; } | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('brandKit');
    const [productTrendToSelect, setProductTrendToSelect] = useState<string | null>(null);

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
    const settings = useMemo(() => {
        return generatedAssets?.settings || initialGeneratedAssets.settings;
    }, [generatedAssets?.settings]);

    // Asset State
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
    const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
    const [generatingImageKeys, setGeneratingImageKeys] = useState<Set<string>>(new Set());
    const [khongMinhSuggestions, setKhongMinhSuggestions] = useState<Record<string, AffiliateLink[]>>({});

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

    // *** TASK MANAGEMENT (from context) ***
    const { notifications, removeNotification, taskList, isLoadingTasks, loadTasks } = useTaskManager();

    // This callback is passed to manager hooks. They call it after creating a task.
    const onTaskCreated = useCallback(() => {
        if (mongoBrandId) {
            loadTasks(mongoBrandId);
        }
    }, [mongoBrandId, loadTasks]);


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
        mongoBrandId,
        settings,
        aiModelConfig,
        dispatchAssets,
        updateAutoSaveStatus,
        setGeneratedImages,
        setError,
        setLoaderContent,
        ensureMongoProject,
        generatedAssets,
        setSuccessMessage,
        onTaskCreated
    });

    const mediaPlanManager = useMediaPlanManagement({
        generatedAssets,
        settings,
        adminSettings,
        aiModelConfig,
        generatedImages,
        mongoBrandId,
        ensureMongoProject,
        dispatchAssets,
        setLoaderContent,
        setError,
        updateAutoSaveStatus,
        setMediaPlanGroupsList,
        setActivePlanId,
        setKhongMinhSuggestions,
        setGeneratedImages,
        setSuccessMessage,
        setActiveTab,
        onTaskCreated,
    });

    const strategyManager = useStrategyManagement({
        mongoBrandId,
        dispatchAssets,
        setError,
        updateAutoSaveStatus,
        settings,
        aiModelConfig,
        generatedAssets,
        setActiveTab,
        setProductTrendToSelect,
        setSuccessMessage,
        onTaskCreated
    });

    const schedulingManager = useSchedulingManagement({
        generatedAssets, mongoBrandId, settings, dispatchAssets, updateAutoSaveStatus, setError, setSuccessMessage
    });

    const assetManager = useAssetManagement({
        mongoBrandId,
        generatedAssets,
        settings,
        aiModelConfig,
        dispatchAssets,
        setGeneratedImages,
        setGeneratedVideos,
        setGeneratingImageKeys,
        updateAutoSaveStatus,
        setError,
        setViewingPost,
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

    const handleCreateBrandFromIdea = useCallback(async (idea: string) => {
        if (!aiModelConfig || !adminSettings) {
            setError("Configuration not loaded. Please try again.");
            return;
        }

        try {
            setLoaderContent({
                title: "Starting Brand Creation...",
                steps: ["Sending task to background processor..."]
            });

            await taskService.createBackgroundTask(
                'CREATE_BRAND_FROM_IDEA',
                { idea, language: settings.language, brandSettings: settings, adminSettings },
                'new-brand-creation' // Placeholder brandId
            );
            
            onTaskCreated(); // Manually trigger task list refresh

            setSuccessMessage("Brand creation has started in the background! You can monitor its progress in the Task Manager.");
            // The UI no longer needs to wait or change steps here.

        } catch (error: any) {
            setError(`Failed to start brand creation task: ${error.message}`);
        } finally {
            setLoaderContent(null);
        }
    }, [aiModelConfig, settings, adminSettings, setError, setSuccessMessage, setLoaderContent, onTaskCreated]);

    const handleBackToIdea = useCallback(() => {
        setCurrentStep('idea');
        setActiveTab('brandKit');
        setBrandInfo(null);
    }, [setCurrentStep, setActiveTab, setBrandInfo]);

    const handleSaveSettings = useCallback(async (newSettings: Settings) => {
        try {
            dispatchAssets({ type: 'UPDATE_SETTINGS', payload: newSettings });
            
            if (mongoBrandId) {
                await saveSettingsToDatabase(newSettings, mongoBrandId);
                setSuccessMessage(settings.language === 'Việt Nam' 
                    ? "Cài đặt đã được lưu thành công!" 
                    : "Settings saved successfully!");
            } else {
                setSuccessMessage(settings.language === 'Việt Nam' 
                    ? "Cài đặt đã được cập nhật trong phiên làm việc này!" 
                    : "Settings updated for this session!");
            }
        } catch (error) {
            setError(settings.language === 'Việt Nam' 
                ? "Lỗi khi lưu cài đặt!" 
                : "Error saving settings!");
        } finally {
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    }, [dispatchAssets, mongoBrandId, settings.language, setError, setSuccessMessage]);

    const setLanguage = useCallback(async (language: string) => {
        handleSaveSettings({ ...settings, language });
    }, [handleSaveSettings, settings]);

    const handleReloadAllData = useCallback(async (brandId: string) => {
        if (brandId) {
            console.log('[App.tsx] Reloading all data for brand:', brandId);
            personaManager.handleLoadPersonasData();
            mediaPlanManager.onLoadMediaPlanData();
            strategyManager.handleLoadStrategyHubData();
            strategyManager.handleLoadAffiliateVaultData();
            loadTasks(brandId);
        }
    }, [personaManager.handleLoadPersonasData, mediaPlanManager.onLoadMediaPlanData, strategyManager.handleLoadStrategyHubData, strategyManager.handleLoadAffiliateVaultData, loadTasks]);

    // Track the previous brand ID to ensure loading only happens on actual changes
    const prevBrandIdRef = useRef<string | null>(null);
    
    useEffect(() => {
        // Only proceed if the brand ID has actually changed
        if (mongoBrandId && mongoBrandId !== prevBrandIdRef.current) {
            prevBrandIdRef.current = mongoBrandId;
            console.log('[App.tsx] mongoBrandId changed, loading all data for brand:', mongoBrandId);
            personaManager.handleLoadPersonasData();
            mediaPlanManager.onLoadMediaPlanData();
            strategyManager.handleLoadStrategyHubData();
            strategyManager.handleLoadAffiliateVaultData();
            loadTasks(mongoBrandId);
        }
    }, [mongoBrandId, personaManager.handleLoadPersonasData, mediaPlanManager.onLoadMediaPlanData, strategyManager.handleLoadStrategyHubData, strategyManager.handleLoadAffiliateVaultData, loadTasks]);

    // Task notification handlers
    const handleViewTaskResult = useCallback((taskId: string) => {
        const task = notifications[taskId];
        if (task) {
            console.log('[App] Viewing result for task:', taskId, 'Type:', task.type);
            // Refresh data based on the type of task that completed
            switch (task.type) {
                case 'GENERATE_MEDIA_PLAN':
                    mediaPlanManager.onLoadMediaPlanData();
                    break;
                case 'CREATE_BRAND_FROM_IDEA':
                case 'AUTO_GENERATE_PERSONAS':
                    personaManager.handleLoadPersonasData();
                    break;
                case 'GENERATE_VIRAL_IDEAS':
                case 'GENERATE_IDEAS_FROM_PRODUCT':
                case 'GENERATE_TRENDS':
                case 'GENERATE_GLOBAL_TRENDS':
                    strategyManager.handleLoadStrategyHubData();
                    break;
            }
        }
        removeNotification(taskId);
    }, [notifications, removeNotification, mediaPlanManager, personaManager, strategyManager]);

    const handleCloseNotification = useCallback((taskId: string) => {
        console.log('[App] Closing notification for task:', taskId);
        removeNotification(taskId);
    }, [removeNotification]);

    // Main render function
    const renderContent = () => {
        if (!isConfigLoaded) {
            return <Loader title="Loading configuration..." steps={[]} />;
        }

        if (isAdminAuthenticated) {
            return (
                <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                    <AdminPage onLogout={handleAdminLogout} />
                </Suspense>
            );
        }

        if (error) return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <Button onClick={() => setError(null)}>Try Again</Button>
                </div>
            </div>
        );

        switch (currentStep) {
            case 'idea':
                return (
                    <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                        <IdeaProfiler
                            onGenerateProfile={handleCreateBrandFromIdea}
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

            case 'assets':
                if (!generatedAssets) return <div>Loading assets...</div>;
                return (
                    <>
                        <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                            <MainDisplay
                                settings={settings}
                                assets={generatedAssets}
                                mongoBrandId={mongoBrandId}
                                generatedImages={generatedImages}
                                generatedVideos={generatedVideos}
                                isGeneratingImage={(key: string) => generatingImageKeys.has(key)}
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
                                onGenerateImage={assetManager.handleGenerateImage}
                                onSetImage={assetManager.handleSetImage}
                                onSetVideo={assetManager.handleSetVideo}
                                onGenerateAllCarouselImages={assetManager.handleGenerateAllCarouselImages}
                                onSavePersona={personaManager.handleSavePersona}
                                onDeletePersona={personaManager.handleDeletePersona}
                                onUpdatePersona={personaManager.handleUpdatePersona}
                                onSetPersonaImage={personaManager.handleSetPersonaImage}
                                onAutoGeneratePersona={personaManager.handleAutoGeneratePersona}
                                onLoadPersonasData={personaManager.handleRefreshPersonasData}
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
                                onLoadStrategyHubData={strategyManager.handleRefreshStrategyHubData}
                                onLoadAffiliateVaultData={strategyManager.handleRefreshAffiliateVaultData}
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
                                onSuggestTrends={strategyManager.handleSuggestTrends}
                                isSuggestingTrends={strategyManager.isSuggestingTrends}
                                isGeneratingIdeas={strategyManager.isGeneratingIdeas}
                                isSelectingTrend={strategyManager.isSelectingTrend}
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
                                onLoadMediaPlanData={mediaPlanManager.handleRefreshMediaPlanData}
                                viewingPost={viewingPost}
                                setViewingPost={setViewingPost}
                                isAnyAnalysisRunning={false}
                                analyzingPostIds={new Set<string>()}
                                khongMinhSuggestions={khongMinhSuggestions}
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
                                tasks={taskList}
                                isLoadingTasks={isLoadingTasks}
                                onLoadTasks={(brandId) => loadTasks(brandId)}
                                onLoadBrandKitData={handleReloadAllData}
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

    return (
        <div className="App">
            {/* Error handling */}
            {error && !error.includes("MongoDB credentials not configured") && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
                        <p className="text-gray-700 mb-4">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Loader */}
            {loaderContent && (
                <Loader
                    title={loaderContent.title}
                    steps={loaderContent.steps}
                />
            )}

            {/* Main content */}
            {renderContent()}

            {/* Success Toast */}
            {successMessage && (
                <Toast
                    message={successMessage}
                    type="success"
                    onClose={() => setSuccessMessage(null)}
                />
            )}

            {/* Task Notifications */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {Object.values(notifications).map((task: BackgroundTask) => (
                    <TaskNotification
                        key={task.taskId}
                        task={task}
                        onClose={() => handleCloseNotification(task.taskId)}
                        onViewResult={() => handleViewTaskResult(task.taskId)}
                    />
                ))}
            </div>

            {/* Task Status Indicator */}
            <TaskStatusIndicator tasks={Object.values(notifications)} />
        </div>
    );
};

// Main App component wrapped with TaskProvider
const App: React.FC = () => {
    return (
        <TaskProvider>
            <AppContent />
        </TaskProvider>
    );
};

export default App;