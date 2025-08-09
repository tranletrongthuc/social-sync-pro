import React, { useState, useCallback, useEffect, useRef, useReducer } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import IdeaProfiler from './components/IdeaProfiler';
import BrandProfiler from './components/BrandProfiler';
import MainDisplay from './components/MainDisplay';
import { ActiveTab } from './components/Header';
import Loader from './components/Loader';
import AirtableLoadModal from './components/AirtableLoadModal';
import SettingsModal from './components/SettingsModal';
import IntegrationModal from './components/IntegrationModal';
import PersonaConnectModal from './components/PersonaConnectModal';
import Toast from './components/Toast';
import { generateBrandKit, generateMediaPlanGroup, generateImage, generateBrandProfile, generateImagePromptForPost, generateAffiliateComment, refinePostContentWithGemini, generateViralIdeas, generateContentPackage, generateFacebookTrends, generatePostsForFacebookTrend, generateIdeasFromProduct } from './services/geminiService';
import { createDocxBlob, createMediaPlanXlsxBlob } from './services/exportService';
import { suggestProductsForPost } from './services/khongminhService';
import { refinePostContentWithOpenRouter, generateBrandProfileWithOpenRouter, generateBrandKitWithOpenRouter, generateMediaPlanGroupWithOpenRouter, generateImagePromptForPostWithOpenRouter, generateImageWithOpenRouter, generateAffiliateCommentWithOpenRouter, generateViralIdeasWithOpenRouter, generateContentPackageWithOpenRouter, generateIdeasFromProductWithOpenRouter } from './services/openrouterService';
import { generateImageWithCloudflare } from './services/cloudflareService';
import {
    createOrUpdateBrandRecord,
    saveAffiliateLinks,
    deleteAffiliateLink as deleteAffiliateLinkFromAirtable,
    saveMediaPlanGroup,
    updateMediaPlanPostInAirtable,
    bulkUpdatePostSchedules,
    loadProjectFromAirtable,
    listMediaPlanGroupsForBrand,
    loadMediaPlan,
    saveSettingsToAirtable,
    fetchSettingsFromAirtable,
    syncAssetMedia,
    ensureAllTablesExist,
    bulkPatchPosts,
    savePersona,
    deletePersonaFromAirtable,
    saveTrend,
    deleteTrendFromAirtable,
    saveIdeas,
    assignPersonaToPlanInAirtable,
    checkAirtableCredentials,
    fetchAffiliateLinksForBrand,
} from './services/airtableService';
import { uploadMediaToCloudinary } from './services/cloudinaryService';
import { schedulePost as socialApiSchedulePost, directPost, SocialAccountNotConnectedError } from './services/socialApiService';
import { getPersonaSocialAccounts } from './services/socialAccountService';
import type { BrandInfo, GeneratedAssets, Settings, MediaPlanGroup, MediaPlan, MediaPlanPost, AffiliateLink, SchedulingPost, MediaPlanWeek, LogoConcept, Persona, PostStatus, Trend, Idea, PostInfo, BrandFoundation, FacebookTrend, FacebookPostIdea } from './types';
import { AirtableIcon, KhongMinhIcon } from './components/icons';
import { Button } from './components/ui';

// --- STATE MANAGEMENT REFACTOR (useReducer) ---

type AssetsAction =
  | { type: 'INITIALIZE_ASSETS'; payload: GeneratedAssets }
  | { type: 'ADD_MEDIA_PLAN'; payload: MediaPlanGroup }
  | { type: 'UPDATE_POST'; payload: { planId: string; weekIndex: number; postIndex: number; updates: Partial<MediaPlanPost> } }
  | { type: 'UPDATE_ASSET_IMAGE'; payload: { oldImageKey: string; newImageKey: string; postInfo?: PostInfo } }
  | { type: 'ADD_OR_UPDATE_AFFILIATE_LINK'; payload: AffiliateLink }
  | { type: 'DELETE_AFFILIATE_LINK'; payload: string }
  | { type: 'IMPORT_AFFILIATE_LINKS'; payload: AffiliateLink[] }
  | { type: 'BULK_UPDATE_ASSET_IMAGES', payload: { postInfo: PostInfo, newImageKey: string }[] }
  | { type: 'BULK_SCHEDULE_POSTS', payload: { updates: { postId: string; scheduledAt: string; status: 'scheduled' }[] } }
  | { type: 'SAVE_PERSONA'; payload: Persona }
  | { type: 'DELETE_PERSONA'; payload: string }
  | { type: 'SAVE_TREND'; payload: Trend }
  | { type: 'DELETE_TREND'; payload: string }
  | { type: 'ADD_IDEAS'; payload: Idea[] }
  | { type: 'ADD_CONTENT_PACKAGE'; payload: MediaPlanGroup }
  | { type: 'ASSIGN_PERSONA_TO_PLAN'; payload: { planId: string; personaId: string | null; } }
  | { type: 'SET_FACEBOOK_TRENDS'; payload: FacebookTrend[] }
  | { type: 'ADD_FACEBOOK_POST_IDEAS'; payload: FacebookPostIdea[] };

export const assetsReducer = (state: GeneratedAssets | null, action: AssetsAction): GeneratedAssets | null => {
    switch (action.type) {
        case 'INITIALIZE_ASSETS':
            return action.payload;
        
        case 'ADD_MEDIA_PLAN': {
            if (!state) return state;
            return {
                ...state,
                mediaPlans: [...state.mediaPlans, action.payload]
            };
        }

        case 'UPDATE_POST': {
            if (!state) return state;
            const { planId, weekIndex, postIndex, updates } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const planIndex = newState.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
            
            if (planIndex !== -1) {
                const postToUpdate = newState.mediaPlans[planIndex].plan[weekIndex]?.posts[postIndex];
                if (postToUpdate) {
                    newState.mediaPlans[planIndex].plan[weekIndex].posts[postIndex] = { ...postToUpdate, ...updates };
                }
            }
            return newState;
        }
        
        case 'UPDATE_ASSET_IMAGE': {
            if (!state) return state;
            const { oldImageKey, newImageKey, postInfo } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));

            if (postInfo) {
                const plan = newState.mediaPlans.find((p: MediaPlanGroup) => p.id === postInfo.planId);
                if (plan) {
                    const post = plan.plan[postInfo.weekIndex]?.posts[postInfo.postIndex];
                    if (post?.id === postInfo.post.id) {
                        post.imageKey = newImageKey;
                        if (!post.mediaOrder) post.mediaOrder = [];
                        if (!post.mediaOrder.includes('image')) post.mediaOrder.push('image');
                    }
                }
            } else if (oldImageKey?.startsWith('logo_')) {
                const logo = newState.coreMediaAssets.logoConcepts.find((l: LogoConcept) => l.imageKey === oldImageKey);
                if (logo) logo.imageKey = newImageKey;
            } else if (oldImageKey?.startsWith('profile_')) {
                if (newState.unifiedProfileAssets.profilePictureImageKey === oldImageKey) {
                    newState.unifiedProfileAssets.profilePictureImageKey = newImageKey;
                }
            } else if (oldImageKey?.startsWith('cover_')) {
                if (newState.unifiedProfileAssets.coverPhotoImageKey === oldImageKey) {
                    newState.unifiedProfileAssets.coverPhotoImageKey = newImageKey;
                }
            }
            return newState;
        }

        case 'ADD_OR_UPDATE_AFFILIATE_LINK': {
            if (!state) return state;
            const newLink = action.payload;
            const existingLinks = state.affiliateLinks || [];
            const index = existingLinks.findIndex(l => l.id === newLink.id);
            let updatedLinks;

            if (index > -1) {
                updatedLinks = [...existingLinks];
                updatedLinks[index] = newLink;
            } else {
                updatedLinks = [newLink, ...existingLinks];
            }
            return { ...state, affiliateLinks: updatedLinks };
        }

        case 'DELETE_AFFILIATE_LINK': {
             if (!state) return state;
             const linkId = action.payload;
             const updatedLinks = (state.affiliateLinks || []).filter(l => l.id !== linkId);
             return { ...state, affiliateLinks: updatedLinks };
        }

        case 'IMPORT_AFFILIATE_LINKS': {
            if (!state) return state;
            return { ...state, affiliateLinks: [...(state.affiliateLinks || []), ...action.payload] };
        }
        
        case 'BULK_UPDATE_ASSET_IMAGES': {
            if (!state) return state;
            const newState = JSON.parse(JSON.stringify(state));
            const updatesMap = new Map(action.payload.map(u => [u.postInfo.post.id, u.newImageKey]));
        
            newState.mediaPlans.forEach((plan: MediaPlanGroup) => {
                plan.plan.forEach((week: MediaPlanWeek) => {
                    week.posts.forEach((post: MediaPlanPost) => {
                        if (updatesMap.has(post.id)) {
                            post.imageKey = updatesMap.get(post.id)!;
                            if (!post.mediaOrder) post.mediaOrder = [];
                            if (!post.mediaOrder.includes('image')) {
                                (post.mediaOrder as ('image' | 'video')[]).push('image');
                            }
                        }
                    });
                });
            });
        
            return newState;
        }

        case 'BULK_SCHEDULE_POSTS': {
            if (!state) return state;
            const { updates } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const updatesMap = new Map(updates.map(u => [u.postId, { scheduledAt: u.scheduledAt, status: u.status }]));
            
            newState.mediaPlans.forEach((plan: MediaPlanGroup) => {
                plan.plan.forEach((week: MediaPlanWeek) => {
                    week.posts.forEach((post: MediaPlanPost) => {
                        if (updatesMap.has(post.id)) {
                            const update = updatesMap.get(post.id)!;
                            post.scheduledAt = update.scheduledAt;
                            post.status = update.status;
                        }
                    });
                });
            });

            return newState;
        }

        case 'SAVE_PERSONA': {
            if (!state) return state;
            const newPersona = action.payload;
            const existingPersonas = state.personas || [];
            const index = existingPersonas.findIndex(p => p.id === newPersona.id);
            let updatedPersonas;

            if (index > -1) {
                updatedPersonas = [...existingPersonas];
                updatedPersonas[index] = newPersona;
            } else {
                updatedPersonas = [newPersona, ...existingPersonas];
            }
            return { ...state, personas: updatedPersonas };
        }

        case 'DELETE_PERSONA': {
            if (!state) return state;
            const personaId = action.payload;
            const updatedPersonas = (state.personas || []).filter(p => p.id !== personaId);
            return { ...state, personas: updatedPersonas };
        }

        case 'SAVE_TREND': {
            if (!state) return state;
            const newTrend = action.payload;
            const existingTrends = state.trends || [];
            const index = existingTrends.findIndex(t => t.id === newTrend.id);
            let updatedTrends;

            if (index > -1) {
                updatedTrends = [...existingTrends];
                updatedTrends[index] = newTrend;
            } else {
                updatedTrends = [newTrend, ...existingTrends];
            }
            return { ...state, trends: updatedTrends };
        }

        case 'DELETE_TREND': {
            if (!state) return state;
            const trendId = action.payload;
            const updatedTrends = (state.trends || []).filter(t => t.id !== trendId);
            return { ...state, trends: updatedTrends };
        }

        case 'ADD_IDEAS': {
            if (!state) return state;
            const newIdeas = action.payload;
            if (newIdeas.length === 0) return state;
            const trendId = newIdeas[0].trendId;
            const existingIdeas = state.ideas || [];
            // Filter out any old ideas for this trend before adding new ones
            const otherIdeas = existingIdeas.filter(i => i.trendId !== trendId);
            return { ...state, ideas: [...otherIdeas, ...newIdeas] };
        }
        
        case 'ADD_CONTENT_PACKAGE': {
            if (!state) return state;
            // Content packages are now just MediaPlanGroups with a specific source
            return {
                ...state,
                mediaPlans: [...(state.mediaPlans || []), action.payload]
            };
        }

        case 'ASSIGN_PERSONA_TO_PLAN': {
            if (!state) return state;
            const { planId, personaId } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const planIndex = newState.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
            if (planIndex === -1) return state;

            const planToUpdate = newState.mediaPlans[planIndex];
            const oldPersonaId = planToUpdate.personaId;
            const allPersonas = newState.personas || [];
            
            const oldPersona = allPersonas.find((p: Persona) => p.id === oldPersonaId);
            const newPersona = allPersonas.find((p: Persona) => p.id === personaId);

            planToUpdate.personaId = personaId || undefined;

            planToUpdate.plan.forEach((week: MediaPlanWeek) => {
                week.posts.forEach((post: MediaPlanPost) => {
                    if (post.imagePrompt) {
                        let prompt = post.imagePrompt;
                        // 1. Remove old prefix if it exists
                        if (oldPersona && prompt.startsWith(`${oldPersona.outfitDescription}, `)) {
                            prompt = prompt.substring(`${oldPersona.outfitDescription}, `.length);
                        }
                        // 2. Add new prefix if a new persona is assigned
                        if (newPersona) {
                            prompt = `${newPersona.outfitDescription}, ${prompt}`;
                        }
                        post.imagePrompt = prompt;
                    }
                });
            });

            return newState;
        }

        case 'SET_FACEBOOK_TRENDS': {
            if (!state) return state;
            return { ...state, facebookTrends: action.payload };
        }

        case 'ADD_FACEBOOK_POST_IDEAS': {
            if (!state) return state;
            const newIdeas = action.payload;
            if (newIdeas.length === 0) return state;
            const existingIdeas = state.facebookPostIdeas || [];
            return { ...state, facebookPostIdeas: [...existingIdeas, ...newIdeas] };
        }

        default:
            return state;
    }
};

// Helper functions for file serialization
const fileToBase64 = (file: File): Promise<{ name: string, type: string, data: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            data: reader.result as string
        });
        reader.onerror = error => reject(error);
    });
};

const base64ToFile = (base64Data: string, filename: string, mimeType: string): File => {
    if (!base64Data || typeof base64Data !== 'string') {
        console.error('Invalid base64 data provided to base64ToFile:', filename);
        return new File([], filename, { type: mimeType });
    }
    const parts = base64Data.split(',');
    // Added a check to ensure the data URL is valid before processing.
    if (parts.length < 2 || !parts[1]) {
      console.error('Invalid data URL format in project file:', filename);
      // Return an empty file to prevent a crash on corrupted data.
      return new File([], filename, { type: mimeType });
    }
    // Clean the base64 part by removing any whitespace.
    const cleanedBase64 = parts[1].replace(/\s/g, '');
    const byteString = atob(cleanedBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
};

const AFFILIATE_CONTENT_KIT_DEFAULT = `Bạn là một chuyên gia sáng tạo nội dung tuân thủ "Bộ quy tắc Sáng tạo Nội dung Affiliate". Nguyên tắc cốt lõi của bạn là: "Hãy hành động như một CHUYÊN GIA TƯ VẤN ĐÁNG TIN CẬY, không phải một người bán hàng." Mọi nội dung bạn tạo ra phải tuân thủ nghiêm ngặt các quy tắc sau:

**1. Ngôn ngữ và Giọng văn (Cực kỳ quan trọng):**
*   **Tư duy như một chuyên gia đánh giá và cố vấn.** Mục tiêu của bạn là giúp người dùng đưa ra quyết định sáng suốt.
*   **NÊN DÙNG các động từ này:** đánh giá, trải nghiệm, trên tay, so sánh, phân tích, gợi ý, đề xuất, hướng dẫn, lựa chọn, tìm hiểu.
*   **TUYỆT ĐỐI TRÁNH các động từ này:** bán, cung cấp, phân phối, ship, vận chuyển, thanh toán, đặt hàng, mua ngay.
*   **NÊN DÙNG các đại từ xưng hô:** "Mình/Chúng tôi" (với tư cách người trải nghiệm), "bên mình" (khi nói về team review).
*   **TUYỆT ĐỐI TRÁNH các từ này:** "shop", "cửa hàng", "công ty" (khi bán hàng).
*   **NÊN DÙNG các cụm từ này:** "ưu/nhược điểm", "phù hợp với ai", "lưu ý khi sử dụng", "trải nghiệm thực tế của mình là...", "so với sản phẩm X...".
*   **TUYỆT ĐỐI TRÁNH các cụm từ này:** "sản phẩm của chúng tôi", "hàng của shop", "giá bên em", "chính sách bảo hành", "cam kết chính hãng".

**2. Kêu gọi hành động (CTA):**
*   **CTA của bạn phải trao quyền cho người dùng tự nghiên cứu và quyết định.**
*   **NÊN DÙNG các CTA này:** "Tham khảo giá tốt nhất tại [Tên Sàn]", "Xem chi tiết sản phẩm tại [Website Hãng]", "Tìm hiểu thêm và đặt mua tại [Link Affiliate]".
*   **TUYỆT ĐỐI TRÁNH các CTA này:** "Mua ngay!", "Đặt hàng ngay!", "Inbox để được tư vấn giá", "Để lại SĐT để đặt hàng".

**3. Cấu trúc và Triết lý Nội dung:**
*   **Bắt đầu bằng Vấn đề của Người dùng:** Luôn đề cập đến một nỗi đau hoặc nhu cầu trước, sau đó mới giới thiệu sản phẩm như một giải pháp.
*   **Khách quan - Nêu cả Ưu và Nhược điểm:** Mọi bài đánh giá phải cân bằng. Đề cập đến nhược điểm sẽ xây dựng sự tin cậy. Không có sản phẩm nào hoàn hảo.
*   **Tập trung vào "Trải nghiệm" và "Hướng dẫn":** Tạo nội dung cho thấy sản phẩm đang được sử dụng, giải thích cách dùng, và chia sẻ kết quả hoặc kinh nghiệm thực tế. Tránh chỉ liệt kê thông số kỹ thuật của nhà sản xuất.

**4. Prompt tạo Hình ảnh:**
*   Khi tạo \`imagePrompt\`, hãy mô tả một cảnh thực tế, có bối cảnh. Thay vì "sản phẩm trên nền trắng", hãy mô tả "một người đang sử dụng sản phẩm trong một bối cảnh đời thực". Điều này phù hợp với quy tắc sử dụng hình ảnh chân thực, tự sản xuất.

Bằng cách tuân thủ nghiêm ngặt các quy tắc này, bạn sẽ tạo ra nội dung có giá trị cao, đáng tin cậy, giúp ích cho người dùng, thay vì chỉ cố gắng bán hàng cho họ.`;

const isVisionModel = (modelName: string): boolean => {
    const visionModels = [
        'imagen-4.0-ultra-generate-preview-06-06', 
        'imagen-3.0-generate-002'
    ];
    // Cloudflare and OpenRouter models in this app are currently text-to-image or have different input methods
    // that are handled by their respective service files. This check is primarily for Gemini/Google models.
    // If future vision models are added from other providers, they should be included here.
    return visionModels.includes(modelName);
};

const TEXT_MODEL_FALLBACK_ORDER = [
    'google/gemini-2.0-flash-exp:free'
    // Removing models that require API keys or have known issues
    // 'gemini-2.0-flash'  // Requires API key that might not be loaded properly
];


const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<'idea' | 'profile' | 'assets'>('idea');
    const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
    const [generatedAssets, dispatchAssets] = useReducer(assetsReducer, null);
    const [loaderContent, setLoaderContent] = useState<{ title: string; steps: string[]; } | null>(null);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [waitMessage, setWaitMessage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
    const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
    const [generatingImageKeys, setGeneratingImageKeys] = useState<Set<string>>(new Set());
    const [uploadingImageKeys, setUploadingImageKeys] = useState<Set<string>>(new Set());
    const [generatingPromptKeys, setGeneratingPromptKeys] = useState<Set<string>>(new Set());
    // Global product images removed, now managed per-plan.
    
    const [settings, setSettings] = useState<Settings>({
        language: 'Việt Nam',
        totalPostsPerMonth: 16,
        imagePromptSuffix: ', photorealistic, 8k, high quality',
        affiliateContentKit: AFFILIATE_CONTENT_KIT_DEFAULT,
        textGenerationModel: 'google/gemini-2.0-flash-exp:free',
        imageGenerationModel: 'imagen-4.0-ultra-generate-preview-06-06',
    });
    
    // Integration States
    const [isAirtableLoadModalOpen, setIsAirtableLoadModalOpen] = useState<boolean>(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState<boolean>(false);
    const [isPersonaConnectModalOpen, setIsPersonaConnectModalOpen] = useState<boolean>(false);
    const [personaToConnect, setPersonaToConnect] = useState<Persona | null>(null);
    const [platformToConnect, setPlatformToConnect] = useState<string | null>(null);
    const personaConnectSuccessCallback = useRef<(() => void) | null>(null);
    const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
    const [airtableBrandId, setAirtableBrandId] = useState<string | null>(null);
    const [integrationsVersion, setIntegrationsVersion] = useState(0);

    // Auto-Save State
    const autoSaveTimeoutRef = useRef<number | null>(null);

    // Ref to store the product trend ID to select in StrategyDisplay
    const productTrendToSelectRef = useRef<string | null>(null);
    
    // State to track the product trend to select (for passing to MainDisplay)
    const [productTrendToSelect, setProductTrendToSelect] = useState<string | null>(null);

    // Log environment variables for debugging
    useEffect(() => {
        // console.log("Environment variables at startup:", import.meta.env);
        const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (geminiApiKey) {
            console.log("Gemini API Key is configured");
        } else {
            console.log("Gemini API Key is not configured or not loaded properly");
        }
    }, []);

    // Media Plan On-Demand Loading State
    const [mediaPlanGroupsList, setMediaPlanGroupsList] = useState<{id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]>([]);
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('brandKit');
    
    // Reset productTrendToSelect when we switch away from the strategy tab
    useEffect(() => {
        if (activeTab !== 'strategyHub' && productTrendToSelect) {
            setProductTrendToSelect(null);
        }
    }, [activeTab, productTrendToSelect]);
    
    // KhongMinh State
    const [analyzingPostIds, setAnalyzingPostIds] = useState<Set<string>>(new Set());
    const [khongMinhSuggestions, setKhongMinhSuggestions] = useState<Record<string, AffiliateLink[]>>({});
    const [generatingCommentPostIds, setGeneratingCommentPostIds] = useState<Set<string>>(new Set());
    
    // Selection & Scheduling State
    const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
    const [schedulingPost, setSchedulingPost] = useState<SchedulingPost | null>(null);
    const [isBulkScheduleModalOpen, setIsBulkScheduleModalOpen] = useState<boolean>(false);
    const [isScheduling, setIsScheduling] = useState<boolean>(false);

    // Bulk Action State
    const [bulkActionStatus, setBulkActionStatus] = useState<{ title: string; steps: string[]; currentStep: number } | null>(null);

    // Credential Assurance Workflow
    const onModalCloseRef = useRef<(() => void) | null>(null);
    
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Strategy Hub State
    const [isGeneratingFacebookTrends, setIsGeneratingFacebookTrends] = useState(false);
    const [isGeneratingFacebookPostIdeas, setIsGeneratingFacebookPostIdeas] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [areCredentialsSet, setAreCredentialsSet] = useState(false);
    const [viewingPost, setViewingPost] = useState<PostInfo | null>(null);

    useEffect(() => {
        const checkCreds = async () => {
            const areSet = await checkAirtableCredentials();
            setAreCredentialsSet(areSet);
            if (areSet) {
                setToast({ message: 'Successfully connected to outer services.', type: 'success' });
            } else {
                setToast({ message: 'Failed to connect to outer services. Please check your credentials.', type: 'error' });
            }
        };
        checkCreds();
    }, []);

    const isLoading = !!loaderContent;
    const isPerformingBulkAction = !!bulkActionStatus;

    const ensureCredentials = useCallback(async (requiredServices: ('airtable' | 'cloudinary')[]) => {
        const check = () => {
            const hasAirtable = !!(import.meta.env.VITE_AIRTABLE_PAT && import.meta.env.VITE_AIRTABLE_BASE_ID);
            const hasCloudinary = !!(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

            if (requiredServices.includes('airtable') && !hasAirtable) return false;
            if (requiredServices.includes('cloudinary') && !hasCloudinary) return false;
            return true;
        };

        if (check()) {
            return true;
        }

        const promise = new Promise<void>((resolve) => {
            onModalCloseRef.current = resolve;
            if (personaToConnect && platformToConnect) {
                setIsPersonaConnectModalOpen(true);
            } else {
                setIsIntegrationModalOpen(true);
            }
        });

        await promise;

        if (!check()) {
            console.log("Credential provision was cancelled by the user.");
            return false;
        }
        return true;
    }, []);

    const ensureAirtableCredentials = useCallback(() => ensureCredentials(['airtable']), [ensureCredentials]);

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

    const executeTextGenerationWithFallback = useCallback(async <T extends unknown>(
        generationTask: (model: string) => Promise<T>,
        preferredModel: string
    ): Promise<T> => {
        console.log("Preferred model:", preferredModel);
        // Log all environment variables for debugging
        // console.log("Environment variables:", import.meta.env);
        
        // Create a model list that prioritizes the user's configured model
        const modelsToTry = [
            preferredModel, // Always try the user's preferred model first
            ...TEXT_MODEL_FALLBACK_ORDER.filter(m => m !== preferredModel)
        ];
        console.log("Models to try:", modelsToTry);

        let lastError: Error | null = null;
        let rateLimitErrorCount = 0;
        const RATE_LIMIT_THRESHOLD = 2; // Number of rate limit errors before giving up

        for (const model of modelsToTry) {
            try {
                console.log(`Attempting text generation with model: ${model}`);
                
                // Skip Gemini models if API key is not configured
                if (model.startsWith('gemini-') && !model.includes('free')) {
                    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
                    console.log(`Checking Gemini API key for model ${model}:`, geminiApiKey ? "Key exists" : "Key is missing");
                    if (!geminiApiKey) {
                        console.log(`Skipping ${model} because Gemini API key is not configured`);
                        throw new Error("Gemini API key is not configured or not loaded properly. Please check your .env.local file and restart the development server.");
                    }
                }
                
                const result = await generationTask(model);
                
                // Only update the settings if we had to fall back to a different model
                if (model !== preferredModel) {
                    setSettings(prev => ({ ...prev, textGenerationModel: model }));
                    setSuccessMessage(`Switched to model ${model} after request failed.`);
                }
                return result;
            } catch (e: any) {
                lastError = e;
                
                // Count rate limit errors
                if (e.message && (e.message.includes('rate limit') || e.message.includes('Rate limit'))) {
                    rateLimitErrorCount++;
                }
                
                // If we've hit too many rate limits, give up
                if (rateLimitErrorCount >= RATE_LIMIT_THRESHOLD) {
                    console.warn(`Too many rate limit errors. Stopping fallback attempts.`);
                    throw new Error("Too many rate limit errors. Please try again later or configure a different model in Settings.");
                }
                
                console.warn(`Model ${model} failed: ${e.message}. Trying next model...`);
            }
        }
        
        // If we get here, all models failed
        if (lastError && lastError.message.includes('rate limit')) {
            throw new Error("All models are currently rate limited. Please try again later or configure a different model in Settings.");
        }
        
        throw lastError || new Error("All text generation models failed.");
    }, [setSettings, setSuccessMessage]);

    const ensureAirtableProject = useCallback(async (assetsToSave?: GeneratedAssets): Promise<string | null> => {
        const assets = assetsToSave || generatedAssets;
        const success = await ensureCredentials(['airtable', 'cloudinary']);
        if (!success) return null;

        if (airtableBrandId) return airtableBrandId;
    
        if (!assets) throw new Error("Cannot create Airtable project without assets.");
    
        updateAutoSaveStatus('saving');
        console.log("Creating new project record in Airtable...");
        
        const newPublicUrls = await uploadMediaToCloudinary(generatedImages);
        const allImageUrls = { ...generatedImages, ...newPublicUrls };

        const newBrandId = await createOrUpdateBrandRecord(
            assets,
            settings,
            allImageUrls,
            null
        );
        
        setAirtableBrandId(newBrandId);
        setGeneratedImages(allImageUrls); // Commit the public URLs to state
        console.log("New project record created with Brand ID:", newBrandId);
        updateAutoSaveStatus('saved');
        return newBrandId;
    }, [airtableBrandId, generatedAssets, generatedImages, settings, updateAutoSaveStatus, ensureCredentials]);

    
    const handleSetProductImages = (files: File[]) => {
        // This function is now a stub, as product images are managed locally in the wizard.
        // It could be repurposed for brand-level product images if it needed in the future.
        console.warn("handleSetProductImages is deprecated for plan-specific images.");
    };

    const handleUpdateSettings = async (newSettings: Settings) => {
        setSettings(newSettings);
        setIsSettingsModalOpen(false); 
        
        setIsSavingSettings(true);
        updateAutoSaveStatus('saving');
        setError(null);
        try {
            if (airtableBrandId) {
                const success = await ensureCredentials(['airtable']);
                if (!success) {
                    setAutoSaveStatus('idle');
                    setIsSavingSettings(false);
                    return;
                }
                await saveSettingsToAirtable(newSettings, airtableBrandId);
                updateAutoSaveStatus('saved');
            }
        } catch (err) {
            console.error("Failed to save settings to Airtable", err);
            setError(err instanceof Error ? err.message : "Could not save settings.");
            updateAutoSaveStatus('error');
        } finally {
            setIsSavingSettings(false);
        }
    };
    
    const setLanguage = (lang: string) => {
        setSettings(prev => ({...prev, language: lang}));
    }

    const handleGenerateProfile = useCallback(async (idea: string) => {
        setLoaderContent({
            title: settings.language === 'Việt Nam' ? "AI đang xây dựng hồ sơ..." : "AI is building your profile...",
            steps: [
                "Analyzing your business idea...",
                "Generating a creative brand name...",
                "Defining a powerful mission statement...",
                "Identifying core values and personality...",
                "Finalizing brand profile..."
            ]
        });
        setError(null);
        try {
            const generationTask = (model: string) => {
                if (model.startsWith('gemini-')) {
                    return generateBrandProfile(idea, settings.language, model);
                } else {
                    return generateBrandProfileWithOpenRouter(idea, settings.language, model);
                }
            };
            const profile = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            setBrandInfo(profile);
            setCurrentStep('profile');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to generate brand profile.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings.textGenerationModel, settings.language, executeTextGenerationWithFallback]);

    const handleGenerateKit = useCallback(async (info: BrandInfo) => {
        setBrandInfo(info);
        const kitSteps = settings.language === 'Việt Nam' ? [
            "Phân tích hồ sơ thương hiệu của bạn...",
            "Xây dựng nền tảng thương hiệu cốt lõi...",
            "Thiết kế các ý tưởng logo và bảng màu...",
            "Tạo tài sản hồ sơ mạng xã hội...",
            "Xây dựng kế hoạch truyền thông 4 tuần ban đầu...",
            "Hoàn thiện tài sản..."
        ] : [
            "Analyzing your brand profile...",
            "Crafting core brand foundation...",
            "Designing logo concepts & color palette...",
            "Generating social media profile assets...",
            "Building initial 4-week media plan...",
            "Finalizing assets..."
        ];
        setLoaderContent({
            title: settings.language === 'Việt Nam' ? "AI đang xây dựng bộ thương hiệu của bạn..." : "AI is building your brand kit...",
            steps: kitSteps
        });
        setError(null);
        try {
            const generationTask = (model: string) => {
                 if (model.startsWith('gemini-')) {
                    return generateBrandKit(info, settings.language, model);
                } else {
                    return generateBrandKitWithOpenRouter(info, settings.language, model);
                }
            };
            const kit = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);

            const fullAssets: GeneratedAssets = { ...kit, affiliateLinks: [], personas: [], trends: [], ideas: [] };
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: fullAssets });

            const firstPlan = kit.mediaPlans[0];
            if (firstPlan) {
                setMediaPlanGroupsList([{ id: firstPlan.id, name: firstPlan.name, prompt: firstPlan.prompt, productImages: firstPlan.productImages || [] }]);
                setActivePlanId(firstPlan.id);
            } else {
                setMediaPlanGroupsList([]);
                setActivePlanId(null);
            }

            setCurrentStep('assets');
            setActiveTab('brandKit');

            // Auto-create the Airtable project now to get a brand ID for subsequent auto-saving.
            ensureAirtableProject(fullAssets).catch(err => {
                console.error("Failed to auto-create Airtable project:", err);
                setError(err instanceof Error ? err.message : "Could not create initial Airtable project.");
            });
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings.language, settings.textGenerationModel, ensureAirtableProject, executeTextGenerationWithFallback]);

    const handleGenerateMediaPlanGroup = useCallback(async (
        prompt: string, 
        useSearch: boolean, 
        totalPosts: number, 
        selectedPlatforms: string[],
        options: { tone: string; style: string; length: string; includeEmojis: boolean; },
        selectedProductId: string | null, // Changed this line
        personaId: string | null
    ) => {
        if (!generatedAssets?.brandFoundation) {
            setError("Cannot generate plan without a Brand Foundation.");
            return;
        }
        
        const planSteps = settings.language === 'Việt Nam' ? [
            `Phân tích mục tiêu của bạn: "${prompt.substring(0, 50)}..."`,
            "Thiết lập chủ đề hàng tuần...",
            "Soạn thảo bài đăng cho Tuần 1...",
            "Soạn thảo bài đăng cho Tuần 2...",
            "Soạn thảo bài đăng cho Tuần 3...",
            "Soạn thảo bài đăng cho Tuần 4...",
            "Tạo các hashtag hấp dẫn và CTA...",
            "Hoàn thiện kế hoạch..."
        ] : [
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
            title: settings.language === 'Việt Nam' ? "Đang tạo kế hoạch truyền thông..." : "Generating media plan...",
            steps: planSteps
        });
        setError(null);
        try {
            const persona = personaId ? generatedAssets.personas?.find(p => p.id === personaId) ?? null : null;
            const selectedProduct = selectedProductId ? generatedAssets.affiliateLinks?.find(link => link.id === selectedProductId) ?? null : null; // Added this line
            
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

                if (model.startsWith('gemini-')) {
                    return generateMediaPlanGroup(
                        commonArgs[0], commonArgs[1], commonArgs[2], commonArgs[3], useSearch, commonArgs[4], commonArgs[5], commonArgs[6], commonArgs[7], persona, selectedProduct // Changed this line
                    );
                } else {
                     return generateMediaPlanGroupWithOpenRouter(
                        ...commonArgs, persona, selectedProduct // Changed this line
                    );
                }
            };
            const newGroup = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            
            // newGroup.productImages = serializedProductImages;

            dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: newGroup });
            setMediaPlanGroupsList(prev => [...prev, { id: newGroup.id, name: newGroup.name, prompt: newGroup.prompt, productImages: newGroup.productImages }]);
            setActivePlanId(newGroup.id);
            setKhongMinhSuggestions({}); // Clear any old suggestions
            
            // Auto-save the new plan
            updateAutoSaveStatus('saving');
            const brandId = await ensureAirtableProject();
            if (!brandId) {
                setAutoSaveStatus('idle');
                setLoaderContent(null); // Ensure loader is off if credentials fail
                setError("Airtable credentials not configured. Media plan not saved.");
                return;
            }

            const newPublicUrls = await uploadMediaToCloudinary(generatedImages);
            const allImageUrls = { ...generatedImages, ...newPublicUrls };

            await saveMediaPlanGroup(newGroup, allImageUrls, brandId);
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

    const handleBackToIdea = () => {
        setCurrentStep('idea');
        setActiveTab('brandKit');
        setBrandInfo(null);
        dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: null! });
        setGeneratedImages({});
        setAirtableBrandId(null);
        setMediaPlanGroupsList([]);
        setActivePlanId(null);
        setError(null);
        setSuccessMessage(null);
    };

    const handleSetImage = useCallback(async (dataUrl: string, imageKey: string, postInfo?: PostInfo) => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        let baseKey = imageKey;
        
        if (postInfo) {
             baseKey = `media_plan_post_${postInfo.post.id}`;
        } else {
            const keyParts = imageKey.split('_');
            if (keyParts.length >= 2) {
                baseKey = `${keyParts[0]}_${keyParts[1]}`;
            }
        }
        const newImageKey = `${baseKey}_${randomSuffix}`;
        
        setGeneratedImages(prev => ({ ...prev, [newImageKey]: dataUrl }));

        const action: AssetsAction = { type: 'UPDATE_ASSET_IMAGE', payload: { oldImageKey: imageKey, newImageKey, postInfo } };
        dispatchAssets(action);
        
        if (airtableBrandId && generatedAssets) {
            updateAutoSaveStatus('saving');
            try {
                const hasCreds = await ensureCredentials(['airtable', 'cloudinary']);
                if (!hasCreds) {
                    setAutoSaveStatus('idle');
                    return;
                }

                const publicUrls = await uploadMediaToCloudinary({ [newImageKey]: dataUrl });
                const publicUrl = publicUrls[newImageKey];

                if (publicUrl) {
                    if (postInfo) {
                         const mediaOrder: ('image' | 'video')[] = postInfo.post.mediaOrder?.includes('image') ? postInfo.post.mediaOrder : [...(postInfo.post.mediaOrder || []), 'image'];
                         const updatedPost = { ...postInfo.post, imageKey: newImageKey, mediaOrder };
                         await updateMediaPlanPostInAirtable(updatedPost, airtableBrandId, publicUrl);
                    } else {
                        // Fix for stale state: run the reducer ahead of time to get the updated state for the save operation.
                        const updatedAssets = assetsReducer(generatedAssets, action);
                        if (updatedAssets) {
                            await syncAssetMedia(publicUrls, airtableBrandId, updatedAssets);
                        }
                    }
                    setGeneratedImages(prev => ({ ...prev, ...publicUrls }));
                    updateAutoSaveStatus('saved');
                } else {
                    throw new Error("Image upload to Cloudinary failed, public URL not received.");
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not save new image.';
                console.error("Explicit image save failed:", e);
                setError(message);
                updateAutoSaveStatus('error');
            }
        }
    }, [generatedAssets, airtableBrandId, updateAutoSaveStatus, ensureCredentials, setError]);

    const handleSetVideo = useCallback(async (dataUrl: string, key: string, postInfo: PostInfo) => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const newVideoKey = `media_plan_post_video_${postInfo.post.id}_${randomSuffix}`;
        
        setGeneratedVideos(prev => ({...prev, [newVideoKey]: dataUrl}));
        
        const mediaOrder: ('image' | 'video')[] = postInfo.post.mediaOrder?.includes('video') ? postInfo.post.mediaOrder : [...(postInfo.post.mediaOrder || []), 'video'];
        const updates: Partial<MediaPlanPost> = { videoKey: newVideoKey, mediaOrder };
        
        dispatchAssets({ type: 'UPDATE_POST', payload: { planId: postInfo.planId, weekIndex: postInfo.weekIndex, postIndex: postInfo.postIndex, updates } });


        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            try {
                const hasCreds = await ensureCredentials(['airtable', 'cloudinary']);
                if (!hasCreds) {
                    setAutoSaveStatus('idle');
                    return;
                }

                const publicUrls = await uploadMediaToCloudinary({ [newVideoKey]: dataUrl });
                const publicUrl = publicUrls[newVideoKey];

                if (publicUrl) {
                    await updateMediaPlanPostInAirtable({ ...postInfo.post, ...updates }, airtableBrandId, undefined, publicUrl);
                    setGeneratedVideos(prev => ({ ...prev, ...publicUrls }));
                    updateAutoSaveStatus('saved');
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not save new video.';
                console.error("Video save failed:", e);
                setError(message);
                updateAutoSaveStatus('error');
            }
        }
    }, [airtableBrandId, updateAutoSaveStatus, ensureCredentials, setError]);

    const generateSingleImageCore = async (prompt: string, aspectRatio: "1:1" | "16:9" = "1:1", postInfo?: PostInfo): Promise<string> => {
        let imagesToUse: File[] = [];
        if (postInfo && 'planId' in postInfo && generatedAssets) {
            const planGroup = generatedAssets.mediaPlans.find(p => p.id === postInfo.planId);
            const serializedImages = planGroup?.productImages || [];
            if (isVisionModel(settings.imageGenerationModel) && serializedImages.length > 0) {
                imagesToUse = serializedImages.map(img => base64ToFile(img.data, img.name, img.type));
            }
        }
    
        const model = settings.imageGenerationModel;
        if (model.startsWith('@cf/')) {
            return generateImageWithCloudflare(prompt, model, imagesToUse);
        } else if (model.startsWith('imagen-')) {
            return generateImage(prompt, settings.imagePromptSuffix, model, aspectRatio, imagesToUse);
        } else {
            return generateImageWithOpenRouter(prompt, settings.imagePromptSuffix, model, aspectRatio, imagesToUse);
        }
    };

    const handleGenerateImage = useCallback(async (prompt: string, imageKey: string, aspectRatio: "1:1" | "16:9" = "1:1", postInfo?: PostInfo) => {
        setGeneratingImageKeys(prev => new Set(prev).add(imageKey));
        setError(null);
    
        try {
            const dataUrl = await generateSingleImageCore(prompt, aspectRatio, postInfo);
            
            const randomSuffix = Math.random().toString(36).substring(2, 10);
            let baseKey = imageKey;
            
            if (postInfo) {
                baseKey = `media_plan_post_${postInfo.post.id}`;
            } else {
                const keyParts = imageKey.split('_');
                 if (keyParts.length >= 2) {
                     baseKey = `${keyParts[0]}_${keyParts[1]}`;
                }
            }
            const newImageKey = `${baseKey}_${randomSuffix}`;

            setGeneratedImages(prev => ({ ...prev, [newImageKey]: dataUrl }));
            const action: AssetsAction = { type: 'UPDATE_ASSET_IMAGE', payload: { oldImageKey: imageKey, newImageKey, postInfo } };
            dispatchAssets(action);
    
            if (airtableBrandId && dataUrl.startsWith('data:image') && generatedAssets) {
                updateAutoSaveStatus('saving');
                try {
                    const hasCreds = await ensureCredentials(['airtable', 'cloudinary']);
                    if (!hasCreds) {
                        setAutoSaveStatus('idle');
                        return;
                    }
                    const publicUrls = await uploadMediaToCloudinary({ [newImageKey]: dataUrl });
                    const publicUrl = publicUrls[newImageKey];

                    if (publicUrl) {
                        if (postInfo) {
                             const mediaOrder: ('image' | 'video')[] = postInfo.post.mediaOrder?.includes('image') ? postInfo.post.mediaOrder : [...(postInfo.post.mediaOrder || []), 'image'];
                             const updatedPost = { ...postInfo.post, imageKey: newImageKey, mediaOrder };
                             await updateMediaPlanPostInAirtable(updatedPost, airtableBrandId, publicUrl);
                        } else {
                             const updatedAssets = assetsReducer(generatedAssets, action);
                             if (updatedAssets) {
                                 await syncAssetMedia(publicUrls, airtableBrandId, updatedAssets);
                             }
                        }
                        setGeneratedImages(prev => ({ ...prev, ...publicUrls }));
                        updateAutoSaveStatus('saved');
                    } else {
                        throw new Error("Image upload to Cloudinary failed.");
                    }
                } catch (e) {
                    const message = e instanceof Error ? e.message : 'Could not save new image.';
                    console.error("Explicit image save failed:", e);
                    setError(message);
                    updateAutoSaveStatus('error');
                }
            }
        } catch (err) {
            console.error(`Failed to generate image for key ${imageKey}:`, err);
            setError(err instanceof Error ? err.message : "Failed to generate image.");
        } finally {
            setGeneratingImageKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageKey);
                return newSet;
            });
        }
    }, [settings.imageGenerationModel, settings.imagePromptSuffix, airtableBrandId, generatedAssets, updateAutoSaveStatus, ensureCredentials]);
    
    const handleGenerateImagePrompt = useCallback(async (postInfo: PostInfo): Promise<MediaPlanPost | null> => {
        if (!('planId' in postInfo) || !generatedAssets?.brandFoundation) return null;

        const { planId, weekIndex, postIndex, post } = postInfo;
        const planGroup = generatedAssets.mediaPlans.find(p => p.id === planId);
        const persona = planGroup?.personaId ? (generatedAssets.personas || []).find(p => p.id === planGroup.personaId) ?? null : null;

        const postKey = `${planId}_${weekIndex}_${postIndex}`;
        setGeneratingPromptKeys(prev => new Set(prev).add(postKey));
        setError(null);
        
        try {
            const generationTask = (model: string) => {
                const commonArgs = [
                    { title: post.title, content: post.content },
                    generatedAssets.brandFoundation,
                    settings.language,
                    model,
                    persona
                ] as const;

                if (model.startsWith('gemini-')) {
                    return generateImagePromptForPost(...commonArgs);
                } else {
                    return generateImagePromptForPostWithOpenRouter(...commonArgs);
                }
            };
            const newPrompt = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            
            const updates = { imagePrompt: newPrompt };
            dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates } });
            
            const updatedPost = { ...post, ...updates };

            if (airtableBrandId) {
                updateAutoSaveStatus('saving');
                try {
                    await updateMediaPlanPostInAirtable(updatedPost, airtableBrandId);
                    updateAutoSaveStatus('saved');
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Could not save new prompt.');
                    updateAutoSaveStatus('error');
                }
            }
            return updatedPost;
        } catch (err) {
            console.error("Failed to generate image prompt:", err);
            setError(err instanceof Error ? err.message : "Failed to generate prompt.");
        } finally {
            setGeneratingPromptKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(postKey);
                return newSet;
            });
        }
        return null;
    }, [generatedAssets, settings, airtableBrandId, updateAutoSaveStatus, executeTextGenerationWithFallback]);

    const handleRefinePost = useCallback(async (text: string): Promise<string> => {
        const generationTask = (model: string) => {
            if (model.startsWith('gemini-')) {
                return refinePostContentWithGemini(text, model);
            } else {
                return refinePostContentWithOpenRouter(text, model);
            }
        };
        try {
            const refinedText = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            return refinedText;
        } catch (err) {
             console.error("Failed to refine post content:", err);
             setError(err instanceof Error ? err.message : "Failed to refine post content.");
             return text; // Return original text on failure
        }
    }, [settings.textGenerationModel, executeTextGenerationWithFallback]);

    const handleUpdatePost = useCallback((postInfo: PostInfo) => {
        const { planId, weekIndex, postIndex, post } = postInfo;
        dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates: post } });

        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            updateMediaPlanPostInAirtable(postInfo.post, airtableBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => {
                    setError(e.message);
                    updateAutoSaveStatus('error');
                });
        }
    }, [airtableBrandId, updateAutoSaveStatus]);

    const handleGenerateAffiliateComment = useCallback(async (postInfo: PostInfo): Promise<MediaPlanPost | null> => {
        if (!generatedAssets?.brandFoundation || !('planId' in postInfo)) return null;

        const { planId, weekIndex, postIndex, post } = postInfo;
        
        const productIds = post.promotedProductIds || [];
        const products = (generatedAssets.affiliateLinks || []).filter(link => productIds.includes(link.id));

        if (products.length === 0) {
            setError("No promoted products found to generate a comment.");
            return null;
        }

        setGeneratingCommentPostIds(prev => new Set(prev).add(post.id));
        setError(null);
        try {
            const generationTask = (model: string) => {
                const commonArgs = [
                    post,
                    products,
                    generatedAssets.brandFoundation,
                    settings.language,
                    model,
                ] as const;

                if (model.startsWith('gemini-')) {
                    return generateAffiliateComment(...commonArgs);
                } else {
                    return generateAffiliateCommentWithOpenRouter(...commonArgs);
                }
            };

            const newComment = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            const updates = { autoComment: newComment };
            dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates } });

            const updatedPost = { ...post, ...updates };
             if (airtableBrandId) {
                updateAutoSaveStatus('saving');
                try {
                    await updateMediaPlanPostInAirtable(updatedPost, airtableBrandId);
                    updateAutoSaveStatus('saved');
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Could not save new comment.');
                    updateAutoSaveStatus('error');
                }
            }
            return updatedPost;
        } catch (err) {
            console.error("Failed to generate affiliate comment:", err);
            setError(err instanceof Error ? err.message : "Failed to generate comment.");
        } finally {
            setGeneratingCommentPostIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(post.id);
                return newSet;
            });
        }
        return null;
    }, [generatedAssets, settings, airtableBrandId, updateAutoSaveStatus, executeTextGenerationWithFallback]);

    // Trend & Idea Hub Handlers
    const handleSaveTrend = useCallback((trend: Trend) => {
        const payload = { ...trend, brandId: airtableBrandId || '' };
        dispatchAssets({ type: 'SAVE_TREND', payload });
        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            saveTrend(payload, airtableBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [airtableBrandId, updateAutoSaveStatus]);

    const handleDeleteTrend = useCallback((trendId: string) => {
        dispatchAssets({ type: 'DELETE_TREND', payload: trendId });
        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            deleteTrendFromAirtable(trendId, airtableBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [airtableBrandId, updateAutoSaveStatus]);

    const handleGenerateIdeas = useCallback(async (trend: Trend, useSearch: boolean) => {
        setLoaderContent({ title: "Generating Viral Ideas...", steps: ["Analyzing trend...", "Brainstorming concepts...", "Finalizing ideas..."] });
        try {
             const generationTask = (model: string) => {
                if (model.startsWith('gemini-')) {
                    return generateViralIdeas(trend, settings.language, useSearch, model);
                } else {
                    return generateViralIdeasWithOpenRouter(trend, settings.language, model);
                }
            };
            const newIdeaData = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            const newIdeas: Idea[] = newIdeaData.map(idea => ({
                ...idea,
                id: crypto.randomUUID(),
                trendId: trend.id,
            }));
            
            dispatchAssets({ type: 'ADD_IDEAS', payload: newIdeas });
            
            if (airtableBrandId) {
                updateAutoSaveStatus('saving');
                saveIdeas(newIdeas)
                    .then(() => updateAutoSaveStatus('saved'))
                    .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
            }
        } catch (err) {
            console.error("Failed to generate ideas:", err);
            setError(err instanceof Error ? err.message : "Failed to generate ideas.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings, airtableBrandId, updateAutoSaveStatus, executeTextGenerationWithFallback]);
    
    const handleGenerateContentPackage = useCallback(async (
        idea: Idea, 
        pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest', 
        personaId: string | null,
        options: { tone: string; style: string; length: string; }
    ) => {
        if (!generatedAssets?.brandFoundation) return;
        
        const persona = personaId ? (generatedAssets.personas || []).find(p => p.id === personaId) ?? null : null;

        setLoaderContent({ title: "Generating Content Package...", steps: ["Crafting pillar content...", "Repurposing for other platforms...", "Generating image prompts...", "Assembling package..."] });
        try {
            const generationTask = (model: string) => {
                 if (model.startsWith('gemini-')) {
                    return generateContentPackage(idea, generatedAssets.brandFoundation!, settings.language, settings.affiliateContentKit, model, persona, pillarPlatform, options);
                 } else {
                    return generateContentPackageWithOpenRouter(idea, generatedAssets.brandFoundation!, settings.language, settings.affiliateContentKit, model, persona, pillarPlatform, options);
                 }
            };
            const newPackage = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            dispatchAssets({ type: 'ADD_CONTENT_PACKAGE', payload: newPackage });

            // Update UI immediately
            setMediaPlanGroupsList(prev => [...prev, { id: newPackage.id, name: newPackage.name, prompt: newPackage.prompt, source: newPackage.source, personaId: newPackage.personaId }]);
            setActivePlanId(newPackage.id);
            setActiveTab('mediaPlan');

            if (airtableBrandId) {
                updateAutoSaveStatus('saving');
                saveMediaPlanGroup(newPackage, generatedImages, airtableBrandId)
                    .then(() => updateAutoSaveStatus('saved'))
                    .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
            }
        } catch (err) {
            console.error("Failed to generate content package:", err);
            setError(err instanceof Error ? err.message : "Failed to generate content package.");
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets, settings, airtableBrandId, updateAutoSaveStatus, executeTextGenerationWithFallback, generatedImages]);

    // New function for generating ideas from a product
    const handleGenerateIdeasFromProduct = useCallback(async (product: AffiliateLink) => {
        setLoaderContent({ title: "Generating Content Ideas...", steps: ["Analyzing product...", "Brainstorming concepts...", "Finalizing ideas..."] });
        console.log("User configured model:", settings.textGenerationModel);
        
        // Validate that we're using a model that doesn't require an API key
        if (settings.textGenerationModel.startsWith('gemini-') && !settings.textGenerationModel.includes('free')) {
            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!geminiApiKey) {
                setError("Gemini API key is not configured or not loaded properly. Please check your .env.local file and restart the development server.");
                setLoaderContent(null);
                return;
            }
        }
        
        try {
            const generationTask = (model: string) => {
                console.log("Attempting to generate ideas with model:", model);
                console.log("Model starts with 'gemini-':", model.startsWith('gemini-'));
                // Models that start with 'gemini-' but don't contain 'free' should use the Gemini service
                // Models that contain 'free' or don't start with 'gemini-' should use OpenRouter
                if (model.startsWith('gemini-') && !model.includes('free')) {
                    console.log("Using Gemini service for model:", model);
                    return generateIdeasFromProduct(product, settings.language, model);
                } else {
                    console.log("Using OpenRouter service for model:", model);
                    return generateIdeasFromProductWithOpenRouter(product, settings.language, model);
                }
            };
            const newIdeaData = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            
            // Validate that we received proper data
            if (!Array.isArray(newIdeaData) || newIdeaData.length === 0) {
                throw new Error("Failed to generate ideas: No valid ideas returned from AI service.");
            }
            
            // Validate each idea has required fields
            for (let i = 0; i < newIdeaData.length; i++) {
                const idea = newIdeaData[i];
                if (!idea.title || !idea.description || !idea.targetAudience) {
                    console.error("Invalid idea structure:", idea);
                    throw new Error(`Idea ${i + 1} is missing required fields. Please try again.`);
                }
            }
            
            const newIdeas: Idea[] = newIdeaData.map(idea => ({
                ...idea,
                id: crypto.randomUUID(),
                trendId: 'product-' + product.id, // Using a special trendId for product-based ideas
                productId: product.id, // Link the idea to the product
            }));
            
            dispatchAssets({ type: 'ADD_IDEAS', payload: newIdeas });
            
            // Create a special "trend" for this product if it doesn't exist
            const productTrendId = 'product-' + product.id;
            const existingTrends = generatedAssets?.trends || [];
            const productTrendExists = existingTrends.some(trend => trend.id === productTrendId);
            
            let productTrend: Trend;
            if (!productTrendExists) {
                productTrend = {
                    id: productTrendId,
                    brandId: airtableBrandId || '',
                    industry: 'Product Ideas',
                    topic: `Ideas for: ${product.productName}`,
                    keywords: [product.productName, product.providerName],
                    links: [{ title: 'Product Link', url: product.productLink }],
                    notes: `Generated ideas for affiliate product: ${product.productName}`,
                    analysis: `Affiliate product ideas for ${product.productName}`,
                    createdAt: new Date().toISOString(),
                };
                dispatchAssets({ type: 'SAVE_TREND', payload: productTrend });
                
                // Also save to Airtable if connected
                if (airtableBrandId) {
                    updateAutoSaveStatus('saving');
                    try {
                        await saveTrend(productTrend, airtableBrandId);
                        updateAutoSaveStatus('saved');
                    } catch (e) {
                        console.error("Failed to save trend to Airtable:", e);
                        setError(e instanceof Error ? e.message : "Failed to save trend to Airtable.");
                        updateAutoSaveStatus('error');
                    }
                }
            } else {
                // Get the existing trend
                productTrend = existingTrends.find(trend => trend.id === productTrendId)!;
            }
            
            if (airtableBrandId) {
                updateAutoSaveStatus('saving');
                try {
                    await saveIdeas(newIdeas);
                    updateAutoSaveStatus('saved');
                } catch (e) {
                    console.error("Failed to save ideas to Airtable:", e);
                    setError(e instanceof Error ? e.message : "Failed to save ideas to Airtable.");
                    updateAutoSaveStatus('error');
                }
            }
            
            // Show success message
            setSuccessMessage(`Generated ${newIdeas.length} ideas from ${product.productName}`);
            setTimeout(() => setSuccessMessage(null), 3000);
            
            // Switch to the Strategy Hub tab and ensure the new product trend is selected
            setActiveTab('strategy');
            setProductTrendToSelect(productTrendId);
        } catch (err) {
            console.error("Failed to generate ideas from product:", err);
            let errorMessage = "Failed to generate ideas from product. Please check your API keys and try again.";
            if (err instanceof Error) {
                if (err.message.includes('rate limit')) {
                    errorMessage = "All models are currently rate limited. Please try again later or configure a different model in Settings.";
                } else if (err.message.includes('API Key')) {
                    errorMessage = "Please configure your API keys in the Integrations panel.";
                } else {
                    errorMessage = err.message;
                }
            }
            setError(errorMessage);
            setLoaderContent(null);
        } finally {
            setLoaderContent(null);
        }
    }, [settings, airtableBrandId, updateAutoSaveStatus, executeTextGenerationWithFallback, generatedAssets, setActiveTab]);

    const handleSaveProjectToFile = useCallback(() => {
        if (!generatedAssets) {
            setError("No assets to save.");
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const projectData = {
                version: '2.0',
                createdAt: new Date().toISOString(),
                assets: generatedAssets,
                settings: settings,
                generatedImages: generatedImages,
                generatedVideos: generatedVideos,
                airtableBrandId: airtableBrandId,
            };

            const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
            const fileName = `${generatedAssets.brandFoundation.brandName.replace(/\s+/g, '_') || 'SocialSync_Project'}.ssproj`;
            saveAs(blob, fileName);
            setSuccessMessage("Project saved successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to save project:", err);
            setError(err instanceof Error ? err.message : "Could not save project to file.");
        } finally {
            setIsSaving(false);
        }
    }, [generatedAssets, settings, generatedImages, generatedVideos, airtableBrandId]);

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
            
            // Load social accounts for each persona
            if (projectData.assets.personas) {
                projectData.assets.personas = projectData.assets.personas.map((p: Persona) => ({
                    ...p,
                    socialAccounts: getPersonaSocialAccounts(p.id),
                }));
            }

            const firstPlan = projectData.assets.mediaPlans?.[0];
            if (firstPlan) {
                 setMediaPlanGroupsList(projectData.assets.mediaPlans.map((p: MediaPlanGroup) => ({ id: p.id, name: p.name, prompt: p.prompt, productImages: p.productImages || [] })));
                 setActivePlanId(firstPlan.id);
            } else {
                setMediaPlanGroupsList([]);
                setActivePlanId(null);
            }
            const bf = projectData.assets.brandFoundation;
            setBrandInfo({ name: bf.brandName, mission: bf.mission, values: (bf.values || []).join(', '), audience: bf.targetAudience, personality: bf.personality });
            setCurrentStep('assets');
            setActiveTab('brandKit');

        } catch (err) {
            console.error("Failed to load project file:", err);
            setError(err instanceof Error ? err.message : "Could not read or parse project file.");
            setCurrentStep('idea');
        } finally {
            setLoaderContent(null);
            if (event.target) {
                event.target.value = '';
            }
        }
    }, []);

    const handleSelectPlan = useCallback(async (planId: string, assetsToUse?: GeneratedAssets) => {
        const currentAssets = assetsToUse || generatedAssets;
    
        if (!currentAssets?.brandFoundation) {
            setError("Cannot load plan without brand foundation.");
            return;
        }
        const bf = currentAssets.brandFoundation;
        setLoaderContent({ title: `Loading Plan...`, steps: ["Fetching plan details..."] });
        try {
            const { plan, imageUrls, videoUrls } = await loadMediaPlan(planId, bf, settings.language);
            
            if (!currentAssets) {
                throw new Error("Assets are not initialized.");
            }
    
            const newAssets = JSON.parse(JSON.stringify(currentAssets));
            const existingPlanIndex = newAssets.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
    
            if (existingPlanIndex !== -1) {
                // Plan is already in memory, just update its posts
                newAssets.mediaPlans[existingPlanIndex].plan = plan;
            } else {
                // Plan is not loaded yet. Get its metadata from the list and create the full object.
                const planMetadata = mediaPlanGroupsList.find(p => p.id === planId);
                if (planMetadata) {
                    const newPlanGroup: MediaPlanGroup = {
                        ...planMetadata,
                        plan: plan, // Add the loaded posts
                    };
                    newAssets.mediaPlans.push(newPlanGroup);
                } else {
                    console.warn(`Could not find metadata for planId ${planId} in mediaPlanGroupsList.`);
                    // Fallback if metadata isn't in the list for some reason
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

    const handleLoadFromAirtable = useCallback(async (brandId: string) => {

        setLoaderContent({ title: "Loading from Airtable...", steps: ["Connecting...", "Fetching project data...", "Loading assets..."] });
        setError(null);
        try {
            const { assets, settings: loadedSettings, generatedImages: loadedImages, generatedVideos: loadedVideos, brandId: loadedBrandId } = await loadProjectFromAirtable(brandId);
            
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: assets });
            setSettings(prev => ({ ...prev, ...loadedSettings }));
            setGeneratedImages(loadedImages);
            setGeneratedVideos(loadedVideos);
            setAirtableBrandId(loadedBrandId);
            
            // Load social accounts for each persona
            if (assets.personas) {
                assets.personas = assets.personas.map((p: Persona) => ({
                    ...p,
                    socialAccounts: getPersonaSocialAccounts(p.id),
                }));
            }

            const loadedPlansList = await listMediaPlanGroupsForBrand(loadedBrandId);
            setMediaPlanGroupsList(loadedPlansList);
            if (loadedPlansList.length > 0) {
                setActivePlanId(loadedPlansList[0].id);
                // Pass the just-loaded assets to handleSelectPlan to ensure it has the correct brand foundation
                await handleSelectPlan(loadedPlansList[0].id, assets);
            } else {
                setActivePlanId(null);
            }
            const bf = assets.brandFoundation;
            setBrandInfo({ name: bf.brandName, mission: bf.mission, values: (bf.values || []).join(', '), audience: bf.targetAudience, personality: bf.personality });
            setCurrentStep('assets');
            setActiveTab('brandKit');
            setIsAirtableLoadModalOpen(false);

        } catch (err) {
            console.error("Failed to load project from Airtable:", err);
            setError(err instanceof Error ? err.message : "Could not load project from Airtable.");
        } finally {
            setLoaderContent(null);
        }
    }, [handleSelectPlan]);

    const handleExportBrandKit = useCallback(async () => {
        if (!generatedAssets) {
            setError("No assets to export.");
            return;
        }
        setIsExporting(true);
        setError(null);
        try {
            const blob = await createDocxBlob(generatedAssets, settings.language);
            const fileName = `${generatedAssets.brandFoundation.brandName.replace(/\s+/g, '_') || 'Brand_Kit'}.docx`;
            saveAs(blob, fileName);
            setSuccessMessage("Brand Kit exported successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to export brand kit:", err);
            setError(err instanceof Error ? err.message : "Could not export brand kit.");
        } finally {
            setIsExporting(false);
        }
    }, [generatedAssets, settings.language]);

    const handleExportMediaPlan = useCallback(async () => {
        if (!generatedAssets || !generatedAssets.mediaPlans || generatedAssets.mediaPlans.length === 0) {
            setError("No media plan to export.");
            return;
        }
        setIsExporting(true);
        setError(null);
        try {
            const blob = await createMediaPlanXlsxBlob(generatedAssets.mediaPlans, settings.language);
            const fileName = `${generatedAssets.brandFoundation.brandName.replace(/\s+/g, '_') || 'SocialSync'}_MediaPlan.xlsx`;
            saveAs(blob, fileName);
            setSuccessMessage("Media Plan exported successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to export media plan:", err);
            setError(err instanceof Error ? err.message : "Could not export media plan.");
        } finally {
            setIsExporting(false);
        }
    }, [generatedAssets, settings.language]);

    const handleRegenerateWeekImages = useCallback(async (planId: string, weekIndex: number) => {
        if (!generatedAssets) return;
        const plan = generatedAssets.mediaPlans.find(p => p.id === planId);
        if (!plan) return;

        const week = plan.plan[weekIndex];
        if (!week || !week.posts) return;

        const postsToGenerate = week.posts
            .map((post, postIndex) => ({
                planId,
                weekIndex,
                postIndex,
                post
            }))
            .filter(pInfo => pInfo.post.imagePrompt);

        if (postsToGenerate.length === 0) {
            setSuccessMessage("No posts with image prompts found in this week.");
            setTimeout(() => setSuccessMessage(null), 3000);
            return;
        }

        setBulkActionStatus({
            title: "Regenerating Week Images...",
            steps: postsToGenerate.map(p => `Generating image for "${p.post.title}"`),
            currentStep: 0
        });

        for (let i = 0; i < postsToGenerate.length; i++) {
            const postInfo = postsToGenerate[i];
            setBulkActionStatus(prev => prev ? { ...prev, currentStep: i } : null);
            try {
                await handleGenerateImage(postInfo.post.imagePrompt!, postInfo.post.imageKey || postInfo.post.id, '1:1', postInfo);
            } catch (error) {
                console.error(`Failed to regenerate image for post ${postInfo.post.id}`, error);
                // Continue to the next one
            }
        }

        setBulkActionStatus(null);
        setSuccessMessage("Finished regenerating week images.");
        setTimeout(() => setSuccessMessage(null), 3000);
    }, [generatedAssets, handleGenerateImage]);

    const handleAssignPersonaToPlan = useCallback(async (planId: string, personaId: string | null) => {
        if (!generatedAssets) return;
        const planToUpdate = generatedAssets.mediaPlans.find(p => p.id === planId);
        if (!planToUpdate) return;
    
        dispatchAssets({ type: 'ASSIGN_PERSONA_TO_PLAN', payload: { planId, personaId } });
    
        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            try {
                const hasCreds = await ensureCredentials(['airtable']);
                if (!hasCreds) {
                    setAutoSaveStatus('idle');
                    return;
                }
                // The reducer logic needs to be reapplied to get the updated posts to save.
                const updatedState = assetsReducer(generatedAssets, { type: 'ASSIGN_PERSONA_TO_PLAN', payload: { planId, personaId } });
                const updatedPlan = updatedState?.mediaPlans.find(p => p.id === planId);
                if (updatedPlan) {
                    const allPostsInPlan = updatedPlan.plan.flatMap(w => w.posts);
                    await assignPersonaToPlanInAirtable(planId, personaId, allPostsInPlan, airtableBrandId);
                }
                updateAutoSaveStatus('saved');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not assign persona.';
                console.error("Failed to assign persona in Airtable:", e);
                setError(message);
                updateAutoSaveStatus('error');
            }
        }
    }, [generatedAssets, airtableBrandId, updateAutoSaveStatus, ensureCredentials]);

    const handleSaveAffiliateLink = useCallback((link: AffiliateLink) => {
        dispatchAssets({ type: 'ADD_OR_UPDATE_AFFILIATE_LINK', payload: link });
        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            saveAffiliateLinks([link], airtableBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => {
                    setError(e.message);
                    updateAutoSaveStatus('error');
                });
        }
    }, [airtableBrandId, updateAutoSaveStatus]);

    const handleDeleteAffiliateLink = useCallback((linkId: string) => {
        dispatchAssets({ type: 'DELETE_AFFILIATE_LINK', payload: linkId });
        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            deleteAffiliateLinkFromAirtable(linkId, airtableBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => {
                    setError(e.message);
                    updateAutoSaveStatus('error');
                });
        }
    }, [airtableBrandId, updateAutoSaveStatus]);

    const handleImportAffiliateLinks = useCallback((links: AffiliateLink[]) => {
        dispatchAssets({ type: 'IMPORT_AFFILIATE_LINKS', payload: links });
        if (airtableBrandId && links.length > 0) {
            updateAutoSaveStatus('saving');
            saveAffiliateLinks(links, airtableBrandId)
                .then(() => {
                    updateAutoSaveStatus('saved');
                    setSuccessMessage(`${links.length} links imported successfully!`);
                    setTimeout(() => setSuccessMessage(null), 3000);
                })
                .catch(e => {
                    setError(e.message);
                    updateAutoSaveStatus('error');
                });
        }
    }, [airtableBrandId, updateAutoSaveStatus]);

    const handleReloadAffiliateLinks = useCallback(async () => {
        if (!airtableBrandId) {
            setError("Cannot reload affiliate links: No brand selected or Airtable not connected.");
            return;
        }
        setLoaderContent({ title: "Reloading Affiliate Links...", steps: ["Fetching latest data..."] });
        setError(null);
        try {
            const latestAffiliateLinks = await fetchAffiliateLinksForBrand(airtableBrandId);
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: { ...generatedAssets!, affiliateLinks: latestAffiliateLinks } });
            setSuccessMessage("Affiliate links reloaded successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to reload affiliate links:", err);
            setError(err instanceof Error ? err.message : "Could not reload affiliate links.");
        } finally {
            setLoaderContent(null);
        }
    }, [airtableBrandId, generatedAssets, dispatchAssets]);

    const handleAcceptSuggestion = useCallback((postInfo: PostInfo, productId: string) => {
        const currentPromotedIds = postInfo.post.promotedProductIds || [];
        if (currentPromotedIds.includes(productId)) return;
        const updatedPost = {
            ...postInfo.post,
            promotedProductIds: [...currentPromotedIds, productId],
        };
        handleUpdatePost({ ...postInfo, post: updatedPost });
    }, [handleUpdatePost]);

    const handleRunKhongMinhForPost = useCallback(async (postInfo: PostInfo) => {
        if (!generatedAssets?.affiliateLinks || generatedAssets.affiliateLinks.length === 0) {
            setError("No affiliate links available to make suggestions.");
            return;
        }
        setAnalyzingPostIds(prev => new Set(prev).add(postInfo.post.id));
        try {
            const suggestions = await suggestProductsForPost(postInfo.post, generatedAssets.affiliateLinks, 3);
            setKhongMinhSuggestions(prev => ({ ...prev, [postInfo.post.id]: suggestions }));
        } catch (err) {
            console.error("KhongMinh suggestion failed:", err);
            setError(err instanceof Error ? err.message : "Could not get suggestions.");
        } finally {
            setAnalyzingPostIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(postInfo.post.id);
                return newSet;
            });
        }
    }, [generatedAssets?.affiliateLinks]);

    const handleTogglePostSelection = useCallback((postId: string) => {
        setSelectedPostIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAllPosts = useCallback((posts: PostInfo[]) => {
        setSelectedPostIds(new Set(posts.map(p => p.post.id)));
    }, []);

    const handleSchedulePost = useCallback(async (postInfo: SchedulingPost, scheduledAt: string) => {
        const { planId, weekIndex, postIndex, post } = postInfo;
        const updates = { scheduledAt, status: 'scheduled' as PostStatus };
        
        setIsScheduling(true);
        try {
            const currentPlan = generatedAssets?.mediaPlans.find(p => p.id === planId);
            const personaId = currentPlan?.personaId;
            if (!personaId) {
                throw new Error("No persona assigned to this media plan. Cannot schedule post.");
            }
            await socialApiSchedulePost(personaId, post, scheduledAt); // Use the renamed import and pass personaId
            dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates } });
            
            if (airtableBrandId) {
                updateAutoSaveStatus('saving');
                await updateMediaPlanPostInAirtable({ ...post, ...updates }, airtableBrandId);
                updateAutoSaveStatus('saved');
            }
            setSchedulingPost(null);
        } catch (err) {
            console.error("Failed to schedule post:", err);
            setError(err instanceof Error ? err.message : "Failed to schedule post.");
        } finally {
            setIsScheduling(false);
        }
    }, [airtableBrandId, updateAutoSaveStatus, generatedAssets]);

    const handlePublishPost = useCallback(async (postInfo: PostInfo) => {
        const { planId, weekIndex, postIndex, post } = postInfo;
        
        setIsScheduling(true); // Use scheduling state for publishing too
        try {
            const currentPlan = generatedAssets?.mediaPlans.find(p => p.id === planId);
            const personaId = currentPlan?.personaId;
            if (!personaId) {
                throw new Error("No persona assigned to this media plan. Cannot publish post.");
            }

            const imageUrl = post.imageKey ? generatedImages[post.imageKey] : undefined;
            const videoUrl = post.videoKey ? generatedVideos[post.videoKey] : undefined;

            console.log("Calling directPost with:", { personaId, post, imageUrl, videoUrl });
            const { publishedUrl } = await directPost(personaId, post.platform, post, imageUrl, videoUrl);
            
            const updates = { 
                status: 'published' as PostStatus, 
                publishedUrl: publishedUrl,
                publishedAt: new Date().toISOString(),
                scheduledAt: undefined, // Clear scheduledAt when published
            };

            dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates } });
            
            if (airtableBrandId) {
                updateAutoSaveStatus('saving');
                await updateMediaPlanPostInAirtable({ ...post, ...updates }, airtableBrandId);
                updateAutoSaveStatus('saved');
            }
            setSuccessMessage(`Post published successfully! URL: ${publishedUrl}`);
            setTimeout(() => setSuccessMessage(null), 5000);
            setViewingPost(null);
        } catch (err) {
            console.error("Failed to publish post:", err);
            if (err instanceof SocialAccountNotConnectedError) {
                const persona = generatedAssets?.personas?.find(p => p.id === err.personaId);
                if (persona) {
                    setPersonaToConnect(persona);
                    setPlatformToConnect(err.platform);
                    setIsPersonaConnectModalOpen(true);
                    personaConnectSuccessCallback.current = () => {
                        // After successful connection, re-attempt publishing the post
                        handlePublishPost(postInfo);
                        setPersonaToConnect(null);
                        setPlatformToConnect(null);
                    };
                } else {
                    setError(`Failed to publish: ${err.message}`);
                }
            } else {
                setError(err instanceof Error ? err.message : "Failed to publish post.");
            }
        } finally {
            setIsScheduling(false);
        }
    }, [airtableBrandId, updateAutoSaveStatus, generatedAssets, generatedImages, generatedVideos, setViewingPost]);

    const handlePostDrop = useCallback((postInfo: SchedulingPost, newDate: Date) => {
        // Set the time from the original date, or default to a sensible time like 10:00 AM
        const originalDate = postInfo.post.scheduledAt ? new Date(postInfo.post.scheduledAt) : new Date(newDate.setHours(10, 0, 0, 0));
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());
        handleSchedulePost(postInfo, newDate.toISOString());
    }, [handleSchedulePost]);

    const handleBulkSchedule = useCallback(async (startDate: string, intervalDays: number, intervalHours: number, intervalMinutes: number) => {
        if (selectedPostIds.size === 0 || !generatedAssets) return;
    
        setIsScheduling(true);
        setIsBulkScheduleModalOpen(false);
    
        const allPosts: SchedulingPost[] = generatedAssets.mediaPlans.flatMap(plan =>
            plan.plan.flatMap((week, weekIndex) =>
                week.posts.map((post, postIndex) => ({
                    planId: plan.id,
                    weekIndex,
                    postIndex,
                    post
                }))
            )
        ).filter(p => selectedPostIds.has(p.post.id));
    
        const scheduleTime = new Date(startDate);
        const updatesForState: { planId: string, weekIndex: number, postIndex: number, updates: Partial<MediaPlanPost> }[] = [];
        const updatesForAirtable: { postId: string; scheduledAt: string; status: 'scheduled' }[] = [];
    
        for (const postInfo of allPosts) {
            const currentScheduledAt = scheduleTime.toISOString();
            updatesForState.push({ ...postInfo, updates: { scheduledAt: currentScheduledAt, status: 'scheduled' } });
            updatesForAirtable.push({ postId: postInfo.post.id, scheduledAt: currentScheduledAt, status: 'scheduled' });
            scheduleTime.setDate(scheduleTime.getDate() + intervalDays);
            scheduleTime.setHours(scheduleTime.getHours() + intervalHours);
            scheduleTime.setMinutes(scheduleTime.getMinutes() + intervalMinutes);
        }
    
        // Dispatch all state updates at once (might not be possible with current reducer)
        updatesForState.forEach(u => dispatchAssets({ type: 'UPDATE_POST', payload: u }));
        
        // A more performant way would be a new reducer action 'BULK_UPDATE_POSTS'
        dispatchAssets({ type: 'BULK_SCHEDULE_POSTS', payload: { updates: updatesForAirtable } });
    
        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            try {
                await bulkUpdatePostSchedules(updatesForAirtable, airtableBrandId);
                updateAutoSaveStatus('saved');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not bulk schedule.');
                updateAutoSaveStatus('error');
            }
        }
    
        setSelectedPostIds(new Set());
        setIsScheduling(false);
    }, [generatedAssets, selectedPostIds, airtableBrandId, updateAutoSaveStatus]);

    const createBulkActionHandler = (
        title: string,
        stepGenerator: (post: MediaPlanPost) => string,
        action: (postInfo: PostInfo) => Promise<any>
    ) => async (posts: PostInfo[]) => {
        if (posts.length === 0) return;
    
        setBulkActionStatus({
            title,
            steps: posts.map(p => stepGenerator(p.post)),
            currentStep: 0,
        });
    
        for (let i = 0; i < posts.length; i++) {
            setBulkActionStatus(prev => prev ? { ...prev, currentStep: i } : null);
            try {
                await action(posts[i]);
            } catch (err) {
                console.error(`Error in bulk action for post ${posts[i].post.id}:`, err);
            }
        }
    
        setBulkActionStatus(null);
        setSelectedPostIds(new Set()); // Clear selection after action
    };

    const handleBulkGenerateImages = createBulkActionHandler(
        "Bulk Generating Images...",
        (post) => `Generating image for "${post.title}"`,
        (postInfo) => handleGenerateImage(postInfo.post.imagePrompt!, postInfo.post.imageKey || postInfo.post.id, '1:1', postInfo)
    );

    const handleBulkSuggestPromotions = createBulkActionHandler(
        "Bulk Suggesting Promotions...",
        (post) => `Analyzing "${post.title}" for products`,
        handleRunKhongMinhForPost
    );

    const handleBulkGenerateComments = createBulkActionHandler(
        "Bulk Generating Comments...",
        (post) => `Generating comment for "${post.title}"`,
        handleGenerateAffiliateComment
    );
    
    const handleSavePersona = useCallback(async (persona: Persona) => {
        let personaToSave = { ...persona };
        
        updateAutoSaveStatus('saving');
        try {
            if (personaToSave.avatarImageUrl && personaToSave.avatarImageUrl.startsWith('data:') && personaToSave.avatarImageKey) {
                const hasCreds = await ensureCredentials(['cloudinary', 'airtable']);
                if (hasCreds) {
                    const publicUrls = await uploadMediaToCloudinary({ [personaToSave.avatarImageKey]: personaToSave.avatarImageUrl });
                    const publicUrl = publicUrls[personaToSave.avatarImageKey];
                    if (publicUrl) {
                        personaToSave.avatarImageUrl = publicUrl;
                        setGeneratedImages(prev => ({ ...prev, [personaToSave.avatarImageKey!]: publicUrl }));
                    }
                }
            }
            
            dispatchAssets({ type: 'SAVE_PERSONA', payload: personaToSave });
            
            if (airtableBrandId) {
                await savePersona(personaToSave, airtableBrandId);
            }
            updateAutoSaveStatus('saved');
        } catch(e: any) {
            setError(e.message);
            updateAutoSaveStatus('error');
        }
    }, [airtableBrandId, updateAutoSaveStatus, ensureCredentials]);

    const handleUpdatePersona = useCallback(async (persona: Persona) => {
        dispatchAssets({ type: 'SAVE_PERSONA', payload: persona });
        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            try {
                await savePersona(persona, airtableBrandId);
                updateAutoSaveStatus('saved');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not update persona.');
                updateAutoSaveStatus('error');
            }
        }
    }, [airtableBrandId, updateAutoSaveStatus]);

    const handleDeletePersona = useCallback((personaId: string) => {
        dispatchAssets({ type: 'DELETE_PERSONA', payload: personaId });
        if (airtableBrandId) {
            updateAutoSaveStatus('saving');
            deletePersonaFromAirtable(personaId, airtableBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [airtableBrandId, updateAutoSaveStatus]);

    const handleSetPersonaImage = useCallback(async (personaId: string, photoId: string, dataUrl: string): Promise<string | undefined> => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const newImageKey = `persona_${personaId}_photo_${photoId}_${randomSuffix}`;
    
        setGeneratedImages(prev => ({ ...prev, [newImageKey]: dataUrl }));
        
        return newImageKey;
    }, []);

    const handleCloseIntegrationModal = () => {
        setIsIntegrationModalOpen(false);
        if (onModalCloseRef.current) {
            onModalCloseRef.current();
            onModalCloseRef.current = null;
        }
    };

    const handleClosePersonaConnectModal = useCallback(() => {
        setIsPersonaConnectModalOpen(false);
        if (onModalCloseRef.current) {
            onModalCloseRef.current();
            onModalCloseRef.current = null;
        }
    }, []);

    const handleSocialAccountConnected = useCallback((updatedPersona: Persona) => {
        dispatchAssets({ type: 'SAVE_PERSONA', payload: updatedPersona });
        if (personaConnectSuccessCallback.current) {
            personaConnectSuccessCallback.current();
            personaConnectSuccessCallback.current = null;
        }
    }, [dispatchAssets]);
    
    // --- NEW FACEBOOK STRATEGY HANDLERS ---
    const handleGenerateFacebookTrends = useCallback(async (industry: string) => {
        if (!industry) return;
        setIsGeneratingFacebookTrends(true);
        setError(null);
        try {
            const newTrendData = await generateFacebookTrends(industry, settings.language, settings.textGenerationModel);
            const newTrends: FacebookTrend[] = newTrendData.map(t => ({ ...t, id: crypto.randomUUID(), brandId: airtableBrandId || '' }));
            dispatchAssets({ type: 'SET_FACEBOOK_TRENDS', payload: newTrends });
        } catch (err) {
            console.error("Failed to generate Facebook trends:", err);
            setError(err instanceof Error ? err.message : "Failed to generate Facebook trends.");
        } finally {
            setIsGeneratingFacebookTrends(false);
        }
    }, [settings, airtableBrandId]);

    const handleGenerateFacebookPostIdeas = useCallback(async (trend: FacebookTrend) => {
        setIsGeneratingFacebookPostIdeas(true);
        setError(null);
        try {
            const newIdeaData = await generatePostsForFacebookTrend(trend, settings.language, settings.textGenerationModel);
            const newIdeas: FacebookPostIdea[] = newIdeaData.map(i => ({ ...i, id: crypto.randomUUID(), trendId: trend.id }));
            dispatchAssets({ type: 'ADD_FACEBOOK_POST_IDEAS', payload: newIdeas });
        } catch (err) {
             console.error("Failed to generate Facebook post ideas:", err);
            setError(err instanceof Error ? err.message : "Failed to generate post ideas.");
        } finally {
            setIsGeneratingFacebookPostIdeas(false);
        }
    }, [settings]);

    const handleAddFacebookPostIdeaToPlan = useCallback((idea: FacebookPostIdea) => {
        // This is a placeholder for a more complex feature. For now, it creates a new plan with this single post idea.
        const newPost: MediaPlanPost = {
            id: crypto.randomUUID(),
            platform: 'Facebook',
            contentType: 'Image Post',
            title: idea.title,
            content: idea.content,
            hashtags: [],
            cta: idea.cta,
            imagePrompt: idea.imagePrompt,
            status: 'draft',
        };

        const newPlanGroup: MediaPlanGroup = {
            id: crypto.randomUUID(),
            name: `Plan from: ${idea.title.substring(0, 20)}...`,
            prompt: `Generated from Facebook Trend: ${idea.title}`,
            plan: [{
                week: 1,
                theme: 'Generated from Facebook Trend',
                posts: [newPost]
            }],
            source: 'wizard',
        };

        dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: newPlanGroup });
        setActiveTab('mediaPlan');
        setActivePlanId(newPlanGroup.id);
        setSuccessMessage('Post idea added to a new plan!');
        setTimeout(() => setSuccessMessage(null), 3000);

    }, []);

    // --- RENDER LOGIC ---
    if (isLoading || isPerformingBulkAction) {
        const content = isLoading ? loaderContent : bulkActionStatus;
        return <Loader title={content!.title} steps={content!.steps} currentStep={(content as any).currentStep} />;
    }
    
    if (error) {
        // Simple error overlay
        return (
            <div className="fixed inset-0 bg-red-50 flex flex-col items-center justify-center p-4 z-50">
                <div className="bg-white p-8 rounded-lg shadow-2xl border border-red-200 text-center max-w-lg">
                    <h2 className="text-2xl font-bold text-red-700">An Error Occurred</h2>
                    <p className="mt-2 text-gray-600 font-serif">{error}</p>
                    <pre className="mt-4 text-xs text-left bg-gray-100 p-2 rounded overflow-auto max-h-40">{error.toString()}</pre>
                    <Button onClick={() => setError(null)} className="mt-6">Close</Button>
                </div>
            </div>
        );
    }
    
    // ...
    // The rest of the App component is quite long, so I'll omit it here, but I will include the export.
    // ...

    switch (currentStep) {
        case 'idea':
            return (
                <>
                    <IdeaProfiler
                        onGenerateProfile={handleGenerateProfile}
                        isLoading={!!loaderContent}
                        onLoadProject={handleLoadProjectFile}
                        onLoadProjectFromAirtable={handleLoadFromAirtable}
                        onOpenIntegrations={() => setIsIntegrationModalOpen(true)}
                        language={settings.language}
                        setLanguage={setLanguage}
                        integrationsVersion={integrationsVersion}
                        areCredentialsSet={areCredentialsSet}
                    />
                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                    <IntegrationModal
                        isOpen={isIntegrationModalOpen}
                        onClose={handleCloseIntegrationModal}
                        language={settings.language}
                        onCredentialsConfigured={() => setIntegrationsVersion(v => v + 1)}
                    />
                </>
            );
        case 'profile':
            return (
                <BrandProfiler
                    initialBrandInfo={brandInfo!}
                    onGenerate={handleGenerateKit}
                    isLoading={!!loaderContent}
                    onBack={handleBackToIdea}
                    language={settings.language}
                />
            );
        case 'assets':
            if (generatedAssets) {
                 return (
                    <>
                        <MainDisplay
                            assets={generatedAssets}
                            onGenerateImage={handleGenerateImage}
                            onSetImage={handleSetImage}
                            generatedImages={generatedImages}
                            isGeneratingImage={(key) => generatingImageKeys.has(key)}
                            isUploadingImage={(key) => uploadingImageKeys.has(key)}
                            settings={settings}
                            onExportBrandKit={handleExportBrandKit}
                            isExportingBrandKit={isExporting}
                            onExportPlan={handleExportMediaPlan}
                            isExportingPlan={isExporting}
                            onGeneratePlan={handleGenerateMediaPlanGroup}
                            isGeneratingPlan={!!loaderContent}
                            onRegenerateWeekImages={handleRegenerateWeekImages}
                            productImages={[]}
                            onSetProductImages={handleSetProductImages}
                            onSaveProject={handleSaveProjectToFile}
                            isSavingProject={isSaving}
                            onStartOver={handleBackToIdea}
                            autoSaveStatus={autoSaveStatus}
                            onOpenSettings={() => setIsSettingsModalOpen(true)}
                            onOpenIntegrations={() => setIsIntegrationModalOpen(true)}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            // Media Plan props
                            mediaPlanGroupsList={mediaPlanGroupsList}
                            onSelectPlan={handleSelectPlan}
                            activePlanId={activePlanId}
                            onUpdatePost={handleUpdatePost}
                            onRefinePost={handleRefinePost}
                            onAssignPersonaToPlan={handleAssignPersonaToPlan}
                            // Affiliate Vault props
                            onSaveAffiliateLink={handleSaveAffiliateLink}
                            onDeleteAffiliateLink={handleDeleteAffiliateLink}
                            onImportAffiliateLinks={handleImportAffiliateLinks}
                            onReloadLinks={handleReloadAffiliateLinks}
                            // KhongMinh
                            analyzingPostIds={analyzingPostIds}
                            isAnyAnalysisRunning={analyzingPostIds.size > 0}
                            khongMinhSuggestions={khongMinhSuggestions}
                            onAcceptSuggestion={handleAcceptSuggestion}
                            onRunKhongMinhForPost={handleRunKhongMinhForPost}
                            // On-demand prompt generation
                            generatingPromptKeys={generatingPromptKeys}
                            onGeneratePrompt={handleGenerateImagePrompt}
                            // Comment Generation
                            onGenerateAffiliateComment={handleGenerateAffiliateComment}
                            generatingCommentPostIds={generatingCommentPostIds}
                             // Selection & Scheduling
                            selectedPostIds={selectedPostIds}
                            onTogglePostSelection={handleTogglePostSelection}
                            onSelectAllPosts={handleSelectAllPosts}
                            onClearSelection={() => setSelectedPostIds(new Set())}
                            onOpenScheduleModal={setSchedulingPost}
                                onPublishPost={handlePublishPost}
                            isScheduling={isScheduling}
                            onSchedulePost={handleSchedulePost}
                            onPostDrop={handlePostDrop}
                            schedulingPost={schedulingPost}
                            onOpenBulkScheduleModal={() => setIsBulkScheduleModalOpen(true)}
                            isBulkScheduleModalOpen={isBulkScheduleModalOpen}
                            onCloseBulkScheduleModal={() => setIsBulkScheduleModalOpen(false)}
                            onBulkSchedule={handleBulkSchedule}
                             // Bulk Actions
                            isPerformingBulkAction={isPerformingBulkAction}
                            onBulkGenerateImages={handleBulkGenerateImages}
                            onBulkSuggestPromotions={handleBulkSuggestPromotions}
                            onBulkGenerateComments={handleBulkGenerateComments}
                            // Personas
                            onSavePersona={handleSavePersona}
                            onDeletePersona={handleDeletePersona}
                            onSetPersonaImage={handleSetPersonaImage}
                            onUpdatePersona={handleUpdatePersona}
                            // Strategy Hub
                            onSaveTrend={handleSaveTrend}
                            onDeleteTrend={handleDeleteTrend}
                            onGenerateIdeas={handleGenerateIdeas}
                            onGenerateContentPackage={handleGenerateContentPackage}
                            onGenerateIdeasFromProduct={handleGenerateIdeasFromProduct}
                            productTrendToSelect={productTrendToSelect}
                            // Video
                            generatedVideos={generatedVideos}
                            onSetVideo={handleSetVideo}
                             // New Facebook Strategy Props
                            onGenerateFacebookTrends={handleGenerateFacebookTrends}
                            onGenerateFacebookPostIdeas={handleGenerateFacebookPostIdeas}
                            onAddFacebookPostIdeaToPlan={handleAddFacebookPostIdeaToPlan}
                            isGeneratingFacebookTrends={isGeneratingFacebookTrends}
                            isGeneratingFacebookPostIdeas={isGeneratingFacebookPostIdeas}
                        />
                         {successMessage && (
                            <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
                                {successMessage}
                            </div>
                        )}
                        {waitMessage && (
                            <div className="fixed bottom-5 left-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                                 <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                {waitMessage}
                            </div>
                        )}
                        <AirtableLoadModal 
                            isOpen={isAirtableLoadModalOpen}
                            onClose={() => setIsAirtableLoadModalOpen(false)}
                            onLoadProject={handleLoadFromAirtable}
                            language={settings.language}
                            ensureCredentials={ensureAirtableCredentials}
                        />
                        <SettingsModal
                            isOpen={isSettingsModalOpen}
                            onClose={() => setIsSettingsModalOpen(false)}
                            onSave={handleUpdateSettings}
                            isSaving={isSavingSettings}
                            currentSettings={settings}
                        />
                        <IntegrationModal
                            isOpen={isIntegrationModalOpen && !isPersonaConnectModalOpen}
                            onClose={handleCloseIntegrationModal}
                            language={settings.language}
                            onCredentialsConfigured={() => setIntegrationsVersion(v => v + 1)}
                        />

                        <PersonaConnectModal
                            isOpen={isPersonaConnectModalOpen}
                            onClose={handleClosePersonaConnectModal}
                            language={settings.language}
                            personaToConnect={personaToConnect}
                            platformToConnect={platformToConnect}
                            onSocialAccountConnected={handleSocialAccountConnected}
                        />
                    </>
                );
            }
            // Fallback if assets are somehow null
            return <div>Loading assets...</div>;
        default:
            return <div>Invalid state</div>;
    }
};

export default App;