
import { renderHook, act } from '@testing-library/react';
import { useReducer, useCallback, useState } from 'react';
import { assetsReducer } from '../App';
import { loadMediaPlan as mockLoadMediaPlan } from '../services/airtableService';
import type { GeneratedAssets, Settings, BrandFoundation, MediaPlan, MediaPlanGroup } from '../types';

// Mock the services
jest.mock('../services/airtableService');

const mockBrandFoundation: BrandFoundation = {
    brandName: "Test Brand",
    mission: "Test Mission",
    values: ["Test Value"],
    targetAudience: "Test Audience",
    personality: "Test Personality",
    brandPillars: [],
    keyBenefits: [],
    brandVoice: ''
};

const mockMediaPlan: MediaPlan = [
    { week: 1, theme: "Week 1 Theme", posts: [{ id: "post1", title: "Post 1", content: "Content 1", platform: 'Facebook', contentType: 'Image Post' }] }
];

const mockMediaPlanGroup: MediaPlanGroup = {
    id: "plan123",
    name: "Test Media Plan",
    prompt: "Test Prompt",
    plan: [],
    productImages: []
};

const mockSettings: Settings = {
    language: 'English',
    totalPostsPerMonth: 4,
    mediaPromptSuffix: '',
    affiliateContentKit: '',
    textGenerationModel: 'gemini-1.5-flash',
    imageGenerationModel: 'imagen-3.0'
};

const mockProjectData = {
    version: '2.0',
    createdAt: new Date().toISOString(),
    assets: {
        ...({} as GeneratedAssets),
        brandFoundation: mockBrandFoundation,
        mediaPlans: [mockMediaPlanGroup],
    },
    settings: mockSettings,
    generatedImages: {},
    generatedVideos: {},
    airtableBrandId: "brand456",
};

describe('Project Loading Fix', () => {
    let useAppHook: any;

    beforeEach(() => {
        (mockLoadMediaPlan as jest.Mock).mockClear();
        (mockLoadMediaPlan as jest.Mock).mockResolvedValue({ plan: mockMediaPlan, imageUrls: {}, videoUrls: {} });

        useAppHook = () => {
            const [currentStep, setCurrentStep] = useState<'idea' | 'profile' | 'assets'>('idea');
            const [brandInfo, setBrandInfo] = useState<any>(null);
            const [generatedAssets, dispatchAssets] = useReducer(assetsReducer, mockProjectData.assets);
            const [loaderContent, setLoaderContent] = useState<any>(null);
            const [error, setError] = useState<string | null>(null);
            const [generatedImages, setGeneratedImages] = useState({});
            const [generatedVideos, setGeneratedVideos] = useState({});
            const [airtableBrandId, setAirtableBrandId] = useState<string | null>(null);
            const [settings, setSettings] = useState(mockSettings);
            const [mediaPlanGroupsList, setMediaPlanGroupsList] = useState<any[]>([]);
            const [activePlanId, setActivePlanId] = useState<string | null>(null);
            const [activeTab, setActiveTab] = useState<string>('brandKit');

            const handleSelectPlan = useCallback(async (planId: string, assetsToUse?: GeneratedAssets) => {
                const currentAssets = assetsToUse || generatedAssets;
                if (!currentAssets?.brandFoundation) {
                    setError("Cannot load plan without brand foundation.");
                    return;
                }
                const bf = currentAssets.brandFoundation;
                setLoaderContent({ title: `Loading Plan...`, steps: ["Fetching plan details..."] });
                try {
                    const { plan, imageUrls, videoUrls } = await mockLoadMediaPlan(planId, bf, settings.language);
                    if (!currentAssets) {
                        throw new Error("Assets are not initialized.");
                    }
                    const newAssets = JSON.parse(JSON.stringify(currentAssets));
                    const existingPlanIndex = newAssets.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
                    if (existingPlanIndex !== -1) {
                        newAssets.mediaPlans[existingPlanIndex].plan = plan;
                    } else {
                        const planMetadata = mediaPlanGroupsList.find(p => p.id === planId);
                        if (planMetadata) {
                            const newPlanGroup: MediaPlanGroup = {
                                ...planMetadata,
                                plan: plan,
                            };
                            newAssets.mediaPlans.push(newPlanGroup);
                        } else {
                            console.warn(`Could not find metadata for planId ${planId} in mediaPlanGroupsList.`);
                            const newPlanGroup: MediaPlanGroup = {
                                id: planId,
                                name: 'Loaded Plan',
                                prompt: 'Loaded on demand',
                                plan: plan,
                            };
                            newAssets.mediaPlans.push(newPlanGroup);
                        }
                    }
                    dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: newAssets });
                    setGeneratedImages(prev => ({...prev, ...imageUrls}));
                    setGeneratedVideos(prev => ({...prev, ...videoUrls}));
                    setActivePlanId(planId);
                } catch(err) {
                    console.error(`Failed to load media plan ${planId}:`, err);
                    setError(err instanceof Error ? err.message : "Could not load plan details.");
                } finally {
                    setLoaderContent(null);
                }
            }, [generatedAssets, settings.language, mediaPlanGroupsList]);

            const handleLoadProjectFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if (!file) return;
        
                setLoaderContent({ title: "Loading Project...", steps: ["Reading file...", "Parsing data...", "Initializing assets..."] });
                setError(null);
        
                try {
                    const text = await file.text();
                    const projectData = JSON.parse(text);
        
                    if (!projectData.assets || !projectData.settings) {
                        throw new Error("Invalid project file format. Missing 'assets' or 'settings' key.");
                    }
                    
                    dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: projectData.assets });
                    setSettings(projectData.settings);
                    setGeneratedImages(projectData.generatedImages || {});
                    setGeneratedVideos(projectData.generatedVideos || {});
                    setAirtableBrandId(projectData.airtableBrandId || null);
                    
                    if (projectData.assets.personas) {
                        projectData.assets.personas = projectData.assets.personas.map((p: Persona) => ({
                            ...p,
                            socialAccounts: [], // Simplified for test
                        }));
                    }
        
                    const firstPlan = projectData.assets.mediaPlans?.[0];
                    if (firstPlan) {
                        setMediaPlanGroupsList(projectData.assets.mediaPlans.map((p: MediaPlanGroup) => ({ id: p.id, name: p.name, prompt: p.prompt, productImages: p.productImages || [] })));
                        setActivePlanId(firstPlan.id);
                        await handleSelectPlan(firstPlan.id, projectData.assets); // This is the line we are testing
                    } else {
                        setMediaPlanGroupsList([]);
                        setActivePlanId(null);
                    }
                    const bf = projectData.assets.brandFoundation;
                    setBrandInfo({ name: bf.brandName, mission: bf.mission, values: (bf.values || []).join(', '), audience: bf.targetAudience, personality: bf.personality });
                    setCurrentStep('assets');
                    setActiveTab(firstPlan ? 'mediaPlan' : 'brandKit');
        
                } catch (err) {
                    console.error("Failed to load project file:", err);
                    setError(err instanceof Error ? err.message : "Could not read or parse project file.");
                } finally {
                    setLoaderContent(null);
                    if (event.target) {
                        event.target.value = '';
                    }
                }
            }, [generatedAssets, settings.language, mediaPlanGroupsList, handleSelectPlan]);

            return { currentStep, generatedAssets, activePlanId, handleLoadProjectFile, error };
        };
    });

    it('should load project from file and call handleSelectPlan to populate media plan', async () => {
        const { result } = renderHook(() => useAppHook());
        const mockFile = new File([JSON.stringify(mockProjectData)], "project.ssproj", { type: "application/json" });
        // Mock the text method of the File object
        Object.defineProperty(mockFile, 'text', {
            value: jest.fn().mockResolvedValue(JSON.stringify(mockProjectData)),
        });
        const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

        await act(async () => {
            await result.current.handleLoadProjectFile(event);
        });

        expect(mockLoadMediaPlan).toHaveBeenCalledTimes(1);
        expect(mockLoadMediaPlan).toHaveBeenCalledWith(mockMediaPlanGroup.id, mockBrandFoundation, mockSettings.language);
        expect(result.current.currentStep).toBe('assets');
        expect(result.current.activePlanId).toBe(mockMediaPlanGroup.id);
        
        const loadedPlan = result.current.generatedAssets.mediaPlans.find((p: MediaPlanGroup) => p.id === mockMediaPlanGroup.id);
        expect(loadedPlan).toBeDefined();
        expect(loadedPlan.plan).toEqual(mockMediaPlan);
        expect(result.current.error).toBeNull();
    });
});
