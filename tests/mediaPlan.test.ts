import { renderHook, act } from '@testing-library/react-hooks';
import { useCallback, useState, useRef, useReducer } from 'react';
import { assetsReducer } from '../App'; // Import assetsReducer from App.tsx
import { generateMediaPlanGroup as mockGenerateMediaPlanGroup } from '../services/geminiService';
import { uploadMediaToCloudinary as mockUploadMediaToCloudinary } from '../services/cloudinaryService';
import { createOrUpdateBrandRecord as mockCreateOrUpdateBrandRecord, saveMediaPlanGroup as mockSaveMediaPlanGroup, checkAirtableCredentials as mockCheckAirtableCredentials } from '../services/airtableService';

// Mock the services
jest.mock('../services/geminiService');
jest.mock('../services/cloudinaryService');
jest.mock('../services/airtableService');

const mockBrandFoundation = {
    brandName: "Test Brand",
    mission: "Test Mission",
    values: ["Test Value"],
    targetAudience: "Test Audience",
    personality: "Test Personality"
};

const mockGeneratedMediaPlanGroup = {
    id: "plan123",
    name: "Test Media Plan",
    prompt: "Test Prompt",
    plan: [
        { week: 1, theme: "Week 1 Theme", posts: [{ id: "post1", title: "Post 1", content: "Content 1" }] }
    ],
    productImages: []
};

const mockSettings = {
    language: 'English',
    totalPostsPerMonth: 16,
    imagePromptSuffix: ', photorealistic, 8k, high quality',
    affiliateContentKit: 'Default Kit',
    textGenerationModel: 'gemini-2.5-flash',
    imageGenerationModel: 'imagen-4.0-ultra-generate-preview-06-06',
};

const mockGeneratedImages = {};

describe('handleGenerateMediaPlanGroup', () => {
    let useAppHook: any;

    beforeEach(() => {
        // Reset mocks before each test
        (mockGenerateMediaPlanGroup as jest.Mock).mockClear();
        (mockUploadMediaToCloudinary as jest.Mock).mockClear();
        (mockCreateOrUpdateBrandRecord as jest.Mock).mockClear();
        (mockSaveMediaPlanGroup as jest.Mock).mockClear();
        (mockCheckAirtableCredentials as jest.Mock).mockClear();

        // Default mock implementations
        (mockGenerateMediaPlanGroup as jest.Mock).mockResolvedValue(mockGeneratedMediaPlanGroup);
        (mockUploadMediaToCloudinary as jest.Mock).mockResolvedValue({});
        (mockCreateOrUpdateBrandRecord as jest.Mock).mockResolvedValue("brand123");
        (mockSaveMediaPlanGroup as jest.Mock).mockResolvedValue(undefined);
        (mockCheckAirtableCredentials as jest.Mock).mockResolvedValue(true);

        // Define a minimal App-like hook for testing handleGenerateMediaPlanGroup
        useAppHook = () => {
            const [loaderContent, setLoaderContent] = useState<any>(null);
            const [error, setError] = useState<string | null>(null);
            const [airtableBrandId, setAirtableBrandId] = useState<string | null>(null);
            const [generatedAssets, dispatchAssets] = useReducer(assetsReducer, { brandFoundation: mockBrandFoundation, mediaPlans: [], affiliateLinks: [], personas: [], trends: [], ideas: [] });
            const [settings, setSettings] = useState(mockSettings);
            const [generatedImages, setGeneratedImages] = useState(mockGeneratedImages);
            const [mediaPlanGroupsList, setMediaPlanGroupsList] = useState<any[]>([]);
            const [activePlanId, setActivePlanId] = useState<string | null>(null);
            const autoSaveTimeoutRef = useRef<number | null>(null);
            const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
            const onIntegrationModalClose = useRef<(() => void) | null>(null);
            const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState<boolean>(false);

            const updateAutoSaveStatus = useCallback((status: 'saving' | 'saved' | 'error') => {
                setAutoSaveStatus(status);
                if (autoSaveTimeoutRef.current) {
                    clearTimeout(autoSaveTimeoutRef.current);
                }
                if (status === 'saved' || status === 'error') {
                    autoSaveTimeoutRef.current = window.setTimeout(() => {
                        setAutoSaveStatus('idle');
                    }, 3000);
                }
            }, []);

            const ensureCredentials = useCallback(async (requiredServices: ('airtable' | 'cloudinary')[]) => {
                const check = () => {
                    const hasAirtable = !!((window as any).process.env.AIRTABLE_PAT && (window as any).process.env.AIRTABLE_BASE_ID);
                    const hasCloudinary = !!((window as any).process.env.CLOUDINARY_CLOUD_NAME && (window as any).process.env.CLOUDINARY_UPLOAD_PRESET);
        
                    if (requiredServices.includes('airtable') && !hasAirtable) return false;
                    if (requiredServices.includes('cloudinary') && !hasCloudinary) return false;
                    return true;
                };
        
                if (check()) {
                    return true;
                }
        
                const promise = new Promise<void>((resolve) => {
                    onIntegrationModalClose.current = resolve;
                    setIsIntegrationModalOpen(true);
                });
        
                await promise;
        
                if (!check()) {
                    console.log("Credential provision was cancelled by the user.");
                    return false;
                }
                return true;
            }, []);

            const executeTextGenerationWithFallback = useCallback(async <T extends unknown>(
                generationTask: (model: string) => Promise<T>,
                preferredModel: string
            ): Promise<T> => {
                // Simplified for testing, always use preferredModel
                return generationTask(preferredModel);
            }, []);

            const ensureAirtableProject = useCallback(async (assetsToSave?: any): Promise<string | null> => {
                const assets = assetsToSave || generatedAssets;
                const success = await ensureCredentials(['airtable', 'cloudinary']);
                if (!success) return null;
        
                if (airtableBrandId) return airtableBrandId;
            
                if (!assets) throw new Error("Cannot create Airtable project without assets.");
            
                updateAutoSaveStatus('saving');
                const newPublicUrls = await mockUploadMediaToCloudinary(generatedImages);
                const allImageUrls = { ...generatedImages, ...newPublicUrls };
        
                const newBrandId = await mockCreateOrUpdateBrandRecord(
                    assets,
                    settings,
                    allImageUrls,
                    null
                );
                
                setAirtableBrandId(newBrandId);
                setGeneratedImages(allImageUrls); // Commit the public URLs to state
                updateAutoSaveStatus('saved');
                return newBrandId;
            }, [airtableBrandId, generatedAssets, generatedImages, settings, updateAutoSaveStatus, ensureCredentials]);

            const handleGenerateMediaPlanGroup = useCallback(async (
                prompt: string, 
                useSearch: boolean, 
                totalPosts: number, 
                selectedPlatforms: string[],
                options: { tone: string; style: string; length: string; includeEmojis: boolean; },
                serializedProductImages: { name: string, type: string, data: string }[],
                personaId: string | null
            ) => {
                if (!generatedAssets?.brandFoundation) {
                    setError("Cannot generate plan without a Brand Foundation.");
                    return;
                }
                
                const planSteps = [
                    `Analyzing your goal: "${prompt.substring(0, 50)}..."`,
                    "Establishing weekly themes...",
                    "Drafting posts for Week 1...",
                    "Drafting posts for Week 2...",
                    "Drafting posts for Week 3...",
                    "Drafting posts for Week 4...",
                    "Generating engaging hashtags and CTAs...",
                    "Finalizing plan..."
                ];
        
                setLoaderContent({
                    title: "Generating media plan...",
                    steps: planSteps
                });
                setError(null);
                try {
                    const persona = personaId ? generatedAssets.personas?.find(p => p.id === personaId) ?? null : null;
                    
                    const generationTask = (model: string) => {
                        const commonArgs = [
                            generatedAssets.brandFoundation, 
                            prompt, 
                            settings.language, 
                            totalPosts,
                            selectedPlatforms,
                            options,
                            settings.affiliateContentKit,
                            model
                        ] as const;
        
                        return mockGenerateMediaPlanGroup(
                            commonArgs[0], commonArgs[1], commonArgs[2], commonArgs[3], useSearch, commonArgs[4], commonArgs[5], commonArgs[6], commonArgs[7], persona
                        );
                    };
                    const newGroup = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
                    
                    newGroup.productImages = serializedProductImages;
        
                    dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: newGroup });
                    setMediaPlanGroupsList(prev => [...prev, { id: newGroup.id, name: newGroup.name, prompt: newGroup.prompt, productImages: newGroup.productImages }]);
                    setActivePlanId(newGroup.id);
                    
                    updateAutoSaveStatus('saving');
                    const brandId = await ensureAirtableProject();
                    if (!brandId) {
                        setAutoSaveStatus('idle');
                        setLoaderContent(null); // Ensure loader is off if credentials fail
                        setError("Airtable credentials not configured. Media plan not saved.");
                        return;
                    }
        
                    const newPublicUrls = await mockUploadMediaToCloudinary(generatedImages);
                    const allImageUrls = { ...generatedImages, ...newPublicUrls };
        
                    await mockSaveMediaPlanGroup(newGroup, allImageUrls, brandId);
                    setGeneratedImages(allImageUrls); // Commit any new image URLs
                    updateAutoSaveStatus('saved');
                    setLoaderContent(null); // Turn off loader after successful save
        
                } catch (err) {
                    console.error(err);
                    setError(err instanceof Error ? err.message : "Failed to generate media plan.");
                    updateAutoSaveStatus('error');
                    setLoaderContent(null); // Ensure loader is off on error
                }
            }, [generatedAssets, settings, ensureAirtableProject, generatedImages, updateAutoSaveStatus, executeTextGenerationWithFallback]);

            return {
                loaderContent, setLoaderContent, error, setError, airtableBrandId, setAirtableBrandId,
                generatedAssets, dispatchAssets, settings, setSettings, generatedImages, setGeneratedImages,
                mediaPlanGroupsList, setMediaPlanGroupsList, activePlanId, setActivePlanId,
                autoSaveStatus, setAutoSaveStatus, updateAutoSaveStatus, ensureCredentials,
                handleGenerateMediaPlanGroup, onIntegrationModalClose, isIntegrationModalOpen, setIsIntegrationModalOpen
            };
        };
    });

    // Test Case 1: Successful Media Plan Generation and Save
    it('should successfully generate and save a media plan', async () => {
        const { result } = renderHook(() => useAppHook());

        await act(async () => {
            await result.current.handleGenerateMediaPlanGroup(
                "Test Prompt", false, 4, ["Facebook"], { tone: "", style: "", length: "", includeEmojis: false }, [], null
            );
        });

        expect(result.current.loaderContent).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.autoSaveStatus).toBe('saved');
        expect(result.current.mediaPlanGroupsList).toHaveLength(1);
        expect(result.current.activePlanId).toBe(mockGeneratedMediaPlanGroup.id);
        expect(mockGenerateMediaPlanGroup).toHaveBeenCalledTimes(1);
        expect(mockUploadMediaToCloudinary).toHaveBeenCalledTimes(2); // Once for ensureAirtableProject, once for saveMediaPlanGroup
        expect(mockCreateOrUpdateBrandRecord).toHaveBeenCalledTimes(1);
        expect(mockSaveMediaPlanGroup).toHaveBeenCalledTimes(1);
        expect(mockSaveMediaPlanGroup).toHaveBeenCalledWith(
            mockGeneratedMediaPlanGroup, expect.any(Object), "brand123"
        );
    });

    // Test Case 2: Media Plan Generation Failure (API Error)
    it('should handle media plan generation API error', async () => {
        (mockGenerateMediaPlanGroup as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
        const { result } = renderHook(() => useAppHook());

        await act(async () => {
            await result.current.handleGenerateMediaPlanGroup(
                "Test Prompt", false, 4, ["Facebook"], { tone: "", style: "", length: "", includeEmojis: false }, [], null
            );
        });

        expect(result.current.loaderContent).toBeNull();
        expect(result.current.error).toBe("Failed to generate media plan.");
        expect(result.current.autoSaveStatus).toBe('error');
        expect(mockGenerateMediaPlanGroup).toHaveBeenCalledTimes(1);
        expect(mockSaveMediaPlanGroup).not.toHaveBeenCalled();
    });

    // Test Case 3: Media Plan Save Failure (Airtable/Cloudinary Error)
    it('should handle media plan save error', async () => {
        (mockSaveMediaPlanGroup as jest.Mock).mockRejectedValueOnce(new Error("Save Error"));
        const { result } = renderHook(() => useAppHook());

        await act(async () => {
            await result.current.handleGenerateMediaPlanGroup(
                "Test Prompt", false, 4, ["Facebook"], { tone: "", style: "", length: "", includeEmojis: false }, [], null
            );
        });

        expect(result.current.loaderContent).toBeNull();
        expect(result.current.error).toBe("Failed to generate media plan."); // The catch block sets this generic error
        expect(result.current.autoSaveStatus).toBe('error');
        expect(mockGenerateMediaPlanGroup).toHaveBeenCalledTimes(1);
        expect(mockSaveMediaPlanGroup).toHaveBeenCalledTimes(1);
    });

    // Test Case 4: Missing Brand Foundation
    it('should not generate plan if brand foundation is missing', async () => {
        const { result } = renderHook(() => useAppHook());
        // Manually set generatedAssets to not have brandFoundation
        act(() => {
            result.current.dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: { mediaPlans: [], affiliateLinks: [], personas: [], trends: [], ideas: [] } });
        });

        await act(async () => {
            await result.current.handleGenerateMediaPlanGroup(
                "Test Prompt", false, 4, ["Facebook"], { tone: "", style: "", length: "", includeEmojis: false }, [], null
            );
        });

        expect(result.current.loaderContent).toBeNull();
        expect(result.current.error).toBe("Cannot generate plan without a Brand Foundation.");
        expect(mockGenerateMediaPlanGroup).not.toHaveBeenCalled();
        expect(mockSaveMediaPlanGroup).not.toHaveBeenCalled();
    });

    // Test Case 5: Airtable Credentials Not Configured
    it('should not save plan if Airtable credentials are not configured', async () => {
        (mockCheckAirtableCredentials as jest.Mock).mockResolvedValue(false);
        // Mock ensureCredentials to simulate user cancelling or credentials not being set
        const { result } = renderHook(() => useAppHook());
        act(() => {
            result.current.setIsIntegrationModalOpen(true); // Simulate modal opening
            result.current.onIntegrationModalClose.current(); // Simulate user closing modal without configuring
        });

        await act(async () => {
            await result.current.handleGenerateMediaPlanGroup(
                "Test Prompt", false, 4, ["Facebook"], { tone: "", style: "", length: "", includeEmojis: false }, [], null
            );
        });

        expect(result.current.loaderContent).toBeNull();
        expect(result.current.error).toBe("Airtable credentials not configured. Media plan not saved.");
        expect(result.current.autoSaveStatus).toBe('idle');
        expect(mockGenerateMediaPlanGroup).toHaveBeenCalledTimes(1);
        expect(mockSaveMediaPlanGroup).not.toHaveBeenCalled();
    });
});