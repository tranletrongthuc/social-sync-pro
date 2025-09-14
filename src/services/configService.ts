import type { Settings, AiModelConfig, AIModel } from '../../types';
import { defaultPrompts } from '../../server_lib/defaultPrompts.js';

// Quản lý cấu hình ứng dụng
export class ConfigService {
    private static instance: ConfigService;
    private brandId: string | null = null;
    private appSettings: Settings = {
        language: 'English',
        totalPostsPerMonth: 30,
        mediaPromptSuffix: '',
        affiliateContentKit: '',
        textGenerationModel: 'gemini-2.5-pro',
        imageGenerationModel: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        textModelFallbackOrder: ['gemini-2.5-flash', 'gemini-1.5-pro'],
        visionModels: ['gemini-2.5-pro', 'gemini-2.5-flash'],
        contentPillars: [],
        prompts: {
            autoGeneratePersona: {
                systemInstruction: defaultPrompts.autoGeneratePersona.systemInstruction,
                mainPrompt: defaultPrompts.autoGeneratePersona.mainPrompt
            },
            generateInCharacterPost: defaultPrompts.generateInCharacterPost,
            mediaPlanGeneration: defaultPrompts.mediaPlanGeneration,
            simple: defaultPrompts.simple,
            contentPackage: defaultPrompts.contentPackage
        }
    };
    private aiModelConfig: AiModelConfig = {
        allModels: [],
        textModels: [],
        imageModels: [],
        visionModels: [],
        getModel: (modelName: string) => {
            return this.aiModelConfig.allModels.find(m => m.name === modelName);
        },
        getServiceForModel: (modelName: string) => {
            const model = this.aiModelConfig.allModels.find(m => m.name === modelName);
            if (!model) return 'unknown';
            if (model.provider === 'Google') return 'gemini';
            if (model.provider === 'Open Router') return 'openrouter';
            if (model.provider === 'Cloudflare') return 'cloudflare';
            return 'unknown';
        }
    };

    private constructor() {}

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    async initializeConfig(defaults?: Settings, models?: AIModel[]) {
        try {
            if (defaults) {
                this.appSettings = { ...this.appSettings, ...defaults };
            }

            const modelsWithService = (models || []).map(model => {
                if (model.service) {
                    return model; // Service already exists
                }
                // Infer service from provider
                let service = 'google'; // Default
                if (model.provider === 'Open Router') {
                    service = 'openrouter';
                } else if (model.provider === 'Cloudflare') {
                    service = 'cloudflare';
                }
                return { ...model, service };
            });
    
            this.aiModelConfig.allModels = modelsWithService;
            this.aiModelConfig.textModels = this.aiModelConfig.allModels.filter(m => m.capabilities.includes('text')).map(m => m.name);
            this.aiModelConfig.imageModels = this.aiModelConfig.allModels.filter(m => m.capabilities.includes('image')).map(m => m.name);
            this.aiModelConfig.visionModels = this.aiModelConfig.allModels.filter(m => m.capabilities.includes('vision')).map(m => m.name);

        } catch (error) {
            console.error('Config initialization failed:', error);
        }
    }

    getAppSettings(): Settings {
        return this.appSettings;
    }

    getAiModelConfig(): AiModelConfig {
        return this.aiModelConfig;
    }

    getAdminDefaults(): Settings {
        return this.appSettings;
    }

    async saveAdminDefaults(settings: Partial<Settings>) {
        // In a real implementation, this would save to a database
        console.log('Saving admin defaults:', settings);
        this.appSettings = { ...this.appSettings, ...settings };
    }

    async updateAppSettings(settings: Partial<Settings>) {
        this.appSettings = { ...this.appSettings, ...settings };
    }

    setBrandId(brandId: string) {
        this.brandId = brandId;
        // In a real implementation, this might fetch brand-specific settings
        return Promise.resolve();
    }

    getBrandId(): string | null {
        return this.brandId;
    }
}

// Export an instance for backward compatibility
export const configService = ConfigService.getInstance();

// Export the AiModelConfig type
export type { AiModelConfig } from '../../types';