
export interface PersonaPhoto {
    id: string;
    imageKey: string;
}

export interface Persona {
    id: string;
    nickName: string;
    outfitDescription: string;
    mainStyle: string;
    activityField: string;
    avatarImageKey?: string;
    avatarImageUrl?: string;
    photos: PersonaPhoto[];
}

export interface BrandInfo {
  name: string;
  mission: string;
  values: string;
  audience: string;
  personality: string;
}

export interface Settings {
    language: string;
    totalPostsPerMonth: number;
    imagePromptSuffix: string;
    affiliateContentKit: string;
    textGenerationModel: string;
    imageGenerationModel: string;
}

export interface UnifiedProfileAssets {
  accountName: string;
  username:string;
  profilePicturePrompt: string;
  profilePictureId: string;
  profilePictureImageKey: string;
  coverPhoto: {
    prompt: string;
    designConcept: string;
  };
  coverPhotoId: string;
  coverPhotoImageKey: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'error';

export interface MediaPlanPost {
    id: string;
    platform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest';
    contentType: string;
    title: string;
    content: string;
    description?: string; // For YouTube video descriptions
    hashtags: string[];
    cta: string;
    imagePrompt?: string;
    imageKey?: string;
    videoKey?: string;
    mediaOrder?: ('image' | 'video')[];
    sources?: { uri: string; title: string; }[];
    promotedProductIds?: string[];
    scheduledAt?: string;
    autoComment?: string;
    status?: PostStatus;
    // New fields for package context
    isPillar?: boolean;
}

export interface MediaPlanWeek {
    week: number;
    theme: string;
    posts: MediaPlanPost[];
}

export type MediaPlan = MediaPlanWeek[];

export interface MediaPlanGroup {
    id: string;
    name: string;
    prompt: string;
    plan: MediaPlan;
    source?: 'wizard' | 'content-package' | 'brand-launch';
    sources?: { uri: string; title: string; }[];
    productImages?: { name: string, type: string, data: string }[];
    personaId?: string;
}

export interface BrandFoundation {
  brandName: string;
  mission: string;
  values: string[];
  targetAudience: string;
  personality: string;
  keyMessaging: string[];
  usp: string;
}

export interface ColorInfo {
  name: string;
  hex: string;
}

export interface ColorPalette {
  primary: ColorInfo;
  secondary: ColorInfo;
  accent: ColorInfo;
  text: ColorInfo;
}

export interface FontRecommendations {
  headlines: { name: string; weight: string };
  body: { name: string; weight: string };
}

export interface LogoConcept {
  id: string;
  style: string;
  prompt: string;
  imageKey: string;
}

export interface CoreMediaAssets {
  logoConcepts: LogoConcept[];
  colorPalette: ColorPalette;
  fontRecommendations: FontRecommendations;
}

export interface AffiliateLink {
    id: string;
    productId: string;
    productName: string;
    price: number;
    salesVolume: number;
    providerName: string;
    commissionRate: number; // Stored as percentage, e.g., 20 for 20%
    commissionValue: number;
    productLink: string;
    promotionLink?: string;
    product_avatar?: string; // URL to product avatar image
    product_description?: string;
    features?: string[];
    use_cases?: string[];
    product_image_links?: string[]; // URLs to additional product images
    customer_reviews?: string; // Summary or snippet of reviews
    product_rating?: number; // Numeric rating, e.g., 4.5
}

export interface Trend {
  id: string;
  brandId: string;
  industry: string;
  topic: string;
  keywords: string[];
  links: { url: string; title: string }[];
  notes?: string;
  analysis: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  trendId: string;
  title: string;
  description: string;
  targetAudience?: string;
  imagePrompt?: string;
  cta?: string;
}

export interface GeneratedAssets {
  brandFoundation: BrandFoundation;
  coreMediaAssets: CoreMediaAssets;
  unifiedProfileAssets: UnifiedProfileAssets;
  mediaPlans: MediaPlanGroup[];
  affiliateLinks: AffiliateLink[];
  personas?: Persona[];
  trends?: Trend[];
  ideas?: Idea[];
}

export type ConnectedAccounts = Record<string, boolean>;

export type SchedulingPost = {
  planId: string;
  weekIndex: number;
  postIndex: number;
  post: MediaPlanPost;
};

export type PostInfo = { planId: string; weekIndex: number; postIndex: number; post: MediaPlanPost };