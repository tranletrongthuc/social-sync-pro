export type BrandInfo = {
    name: string;
    mission: string;
    values: string;
    audience: string;
    personality: string;
};

export type BrandFoundation = {
    brandName: string;
    mission: string;
    usp: string;
    targetAudience: string;
    values: string[];
    personality: string;
    keyMessaging?: string[];
};

export type LogoConcept = {
    id: string;
    prompt: string;
    imageKey: string;
    imageUrl?: string;
};

export type CoreMediaAssets = {
    logoConcepts: LogoConcept[];
    colorPalette: { name: string; hex: string; }[];
    fontRecommendations: { name: string; type: 'heading' | 'body'; }[];
};

export type CoverPhotoAsset = {
    designConcept: string;
    prompt: string;
};

export type UnifiedProfileAssets = {
    accountName: string;
    username: string;
    profilePicturePrompt: string;
    profilePictureId: string;
    profilePictureImageKey: string | null;
    profilePictureImageUrl?: string;
    coverPhotoPrompt: string;
    coverPhotoId: string;
    coverPhotoImageKey: string | null;
    coverPhotoImageUrl?: string;
    coverPhoto?: CoverPhotoAsset;
};

export type PostStatus = 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published';

export type MediaPlanPost = {
    id: string;
    title: string;
    content: string | string[];
    platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest';
    contentType: 'Image' | 'Video' | 'Carousel' | 'Story' | 'Shorts' | 'Reel';
    status: PostStatus;
    scheduledAt?: string;
    hashtags: string[];
    cta: string;
    mediaPrompt?: string | string[];
    imageKey?: string;
    imageUrl?: string;
    videoKey?: string;
    videoUrl?: string;
    mediaOrder?: ('image' | 'video')[];
    promotedProductIds?: string[];
    autoComment?: string;
    sources?: { title: string; uri: string; }[];
    isPillar?: boolean;
    repurposedFrom?: string; // Post ID of the pillar content
    description?: string | string[]; // For YouTube
    script?: string; // For video content
    pillar?: string; // Content Pillar name
    publishedAt?: string;
    publishedUrl?: string;
};

export type MediaPlanWeek = {
    theme: string;
    posts: MediaPlanPost[];
};

export type MediaPlan = MediaPlanWeek[];

export type MediaPlanGroup = {
    id: string;
    name:string;
    prompt: string;
    plan: MediaPlan;
    productImages?: { name: string; type: string; data: string }[];
    source?: 'wizard' | 'content-package' | 'brand-launch' | 'funnel-campaign';
    personaId?: string;
};

export type GeneratedAssets = {
    brandFoundation: BrandFoundation;
    coreMediaAssets: CoreMediaAssets;
    unifiedProfileAssets: UnifiedProfileAssets;
    mediaPlans: MediaPlanGroup[];
    personas: Persona[];
    trends: Trend[];
    ideas: Idea[];
    affiliateLinks: AffiliateLink[];
    facebookPostIdeas?: FacebookPostIdea[];
    facebookTrends?: FacebookTrend[];
    selectedPlatforms?: string[];
};

export type SchedulingPost = {
    id: string;
    title: string;
    platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest';
    scheduledAt: string | null;
    status: 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published';
    post?: MediaPlanPost;
};

export type AffiliateLink = {
    id: string;
    productName: string;
    productLink: string;
    providerName: string;
    commissionRate: number;
    notes?: string;
    brandId: string;
    productId?: string;
    price?: number;
    salesVolume?: number;
    promotionLink?: string;
    product_description?: string;
    features?: string[];
    use_cases?: string[];
    customer_reviews?: string;
    product_rating?: number;
    product_avatar?: string;
    product_image_links?: string[];
};

export type Persona = {
    id: string;
    nickName: string;
    fullName: string;
    background: string;
    outfitDescription: string;
    brandId: string;
    imageKey?: string;
    imageUrl?: string;
    avatarImageKey?: string;
    avatarImageUrl?: string;
    photos?: PersonaPhoto[];
    mainStyle?: string;
    activityField?: string;
    voice?: any;
    // New detailed fields
    demographics?: {
        age: number;
        gender: 'Male' | 'Female' | 'Non-binary';
        location: string;
        occupation: string;
        incomeLevel: string;
    };
    backstory?: string;
    personalityTraits?: string[];
    goalsAndMotivations?: string[];
    painPoints?: string[];
    communicationStyle?: {
        tone: string;
        voice: string;
        preferredChannels: string[];
    };
    interestsAndHobbies?: string[];
    knowledgeBase?: string[];
    brandRelationship?: {
        awareness: string;
        perception: string;
        engagement: string;
        originStory?: string;
        coreAffinity?: string;
        productUsage?: string;
    };
    contentTone?: string;
    visualCharacteristics?: string;
    coreCharacteristics?: string;
    keyMessages?: string;
    gender?: 'Male' | 'Female' | 'Non-binary';
};

export type Trend = {
    id: string;
    brandId: string;
    industry: string;
    topic: string;
    keywords: string[];
    links: { title: string; url: string; }[];
    notes: string;
    analysis: string;
    createdAt: string;
};

export type Idea = {
    id: string;
    trendId: string;
    productId?: string;
    title: string;
    mediaPrompt?: string;
    description: string;
    cta?: string;
    targetAudience?: string;
};

export type PostInfo = {
    planId: string;
    weekIndex: number;
    postIndex: number;
    post: MediaPlanPost;
};

export type ContentPillar = {
    name: string;
    description: string;
    targetPercentage?: number;
};

export type AutoGeneratePersonaPrompts = {
    systemInstruction: string;
    mainPrompt: string;
};

export type GenerateInCharacterPostPrompts = {
    rolePlayInstruction: string;
    personalityInstruction: string;
    writingStyleInstruction: string;
    backstoryInstruction: string;
    interestsInstruction: string;
    contextPreamble: string;
    taskInstruction: string;
    objectiveInstruction: string;
    pillarInstruction: string;
    keywordsInstruction: string;
    perspectiveInstruction: string;
    negativeConstraints: string;
};

export type MediaPlanGenerationPrompts = {
    systemInstruction: string;
    personaEmbodimentInstruction: string;
    campaignGoalInstruction: string;
    contentGenerationRules: string;
    hyperDetailedImagePromptGuide: string;
    jsonOutputInstruction: string;
};

export type SimplePrompts = {
    refinePost: string;
    generateBrandProfile: string;
    generateBrandKit: string;
    generateMediaPrompt: string;
    generateAffiliateComment: string;
    generateViralIdeas: string;
    generateFacebookTrends: string;
    generateFacebookPostsForTrend: string;
    generateIdeasFromProduct: string;
};

export type ContentPackagePrompts = {
    taskInstruction: string;
    pillarContentInstruction: string;
    repurposedContentInstruction: string;
    mediaPromptInstruction: string;
    jsonOutputInstruction: string;
};

export type Prompts = {
    autoGeneratePersona: AutoGeneratePersonaPrompts;
    generateInCharacterPost: GenerateInCharacterPostPrompts;
    mediaPlanGeneration: MediaPlanGenerationPrompts;
    simple: SimplePrompts;
    contentPackage: ContentPackagePrompts;
};

export type Settings = {
    language: string;
    totalPostsPerMonth: number;
    mediaPromptSuffix: string;
    affiliateContentKit: string;
    textGenerationModel: string;
    imageGenerationModel: string;
    textModelFallbackOrder?: string[];
    visionModels?: string[];
    contentPillars?: ContentPillar[];
    prompts?: Prompts;
    cloudinaryCloudName?: string;
    cloudinaryUploadPreset?: string;
    visualStyleTemplates?: any;
};

export type FacebookTrend = {
    topic: string;
    keywords: string[];
    analysis: string;
};

export type FacebookPostIdea = {
    trendTopic: string;
    title: string;
    content: string;
    cta: string;
};

export type AIModel = {
    id: string;
    name: string;
    provider: string;
    capabilities: ('text' | 'image' | 'vision')[];
    service: string;
};

export type AiModelConfig = {
    allModels: AIModel[];
    textModels: string[];
    imageModels: string[];
    visionModels: string[];
    getModel: (modelName: string) => AIModel | undefined;
    getServiceForModel: (modelName: string) => 'gemini' | 'openrouter' | 'cloudflare' | 'unknown';
};

// Added missing types
export type ColorInfo = {
    name: string;
    hex: string;
};

export type ColorPalette = ColorInfo[];

export type FontRecommendations = { name: string; type: 'heading' | 'body'; }[];

export type PersonaPhoto = {
    id: string;
    url: string;
    description: string;
    imageKey?: string;
};

export type AIService = {
    id: string;
    name: string;
    models: AIModel[];
};

export type TagInputProps = {
    tags: string[];
    setTags: (tags: string[]) => void;
    placeholder: string;
    label: string;
};

export type GenerationOptions = {
    tone: string;
    style: string;
    length: string;
    includeEmojis: boolean;
};

export type ContentPackageWizardModalProps = {
    isOpen: boolean;
    onClose: () => void;
    idea: Idea;
    onGenerate: (idea: Idea, platform: string, personaId: string | null) => void;
    language: string;
    personas: Persona[];
    generatedImages: Record<string, string>;
    affiliateLinks: AffiliateLink[];
    isGenerating: boolean;
};

export type ButtonProps = {
    variant?: 'primary' | 'secondary' | 'tertiary';
    size?: 'small' | 'medium' | 'large';
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
};