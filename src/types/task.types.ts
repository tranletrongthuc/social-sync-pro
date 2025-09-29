import { MediaPlanGroup, Persona, AffiliateLink } from '../../types';

export type TaskType = 
  | 'GENERATE_MEDIA_PLAN' 
  | 'CREATE_BRAND_FROM_IDEA'
  | 'GENERATE_BRAND_KIT' 
  | 'AUTO_GENERATE_PERSONAS'
  | 'GENERATE_CONTENT_PACKAGE'
  | 'GENERATE_FUNNEL_CAMPAIGN'
  | 'GENERATE_VIRAL_IDEAS'
  | 'GENERATE_FACEBOOK_TRENDS'
  | 'GENERATE_TRENDS'
  | 'GENERATE_GLOBAL_TRENDS'
  | 'GENERATE_IDEAS_FROM_PRODUCT'
  | 'GENERATE_IMAGE'
  | 'GENERATE_IN_CHARACTER_POST';

export type TaskStatus = 
  | 'queued' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'retrying';

export interface TaskStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
  retryCount: number;
}

export interface TaskPayload {
  // GENERATE_MEDIA_PLAN
  objective?: string;
  keywords?: string[];
  useSearch?: boolean;
  selectedPlatforms?: string[];
  options?: {
    tone: string;
    style: string;
    length: string;
    includeEmojis: boolean;
  };
  selectedProductId?: string | null;
  personaId?: string | null;
  pillar?: string;
  
  // Common fields
  brandFoundation?: any;
  language?: string;
  totalPosts?: number;
  brandSettings?: any;
  adminSettings?: any;
  persona?: Persona | null;
  selectedProduct?: AffiliateLink | null;
  
  // For other task types, we can extend this interface
  [key: string]: any;
}

export interface BackgroundTask {
  _id?: string;
  taskId: string;
  userId: string;
  brandId: string;

  type: TaskType;
  payload: TaskPayload;

  // Status & Progress
  status: TaskStatus;
  progress: number;
  currentStep?: string;

  steps?: TaskStep[];
  currentStepIndex?: number;

  // Orchestration & Timing
  priority: 'low' | 'normal' | 'high';
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  actualDuration?: number; // ms

  // Error Handling
  lastError?: string;
  retryCount: number;
  maxRetries: number;

  // Results
  result?: {
    mediaPlanGroupId?: string;
    brandKitId?: string;
    personaSetId?: string;
    contentPackageId?: string;
    funnelCampaignId?: string;
    trendId?: string;
    ideaIds?: string[];
    [key: string]: any;
  };

  // Audit Trail
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}