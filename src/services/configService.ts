import { fetchAdminDefaults } from './databaseService';
import type { Settings, AiModelConfig } from '../../types';

// Quản lý cấu hình ứng dụng
export class ConfigService {
    private static instance: ConfigService;
    private brandId: string | null = null;
    private appSettings: Settings = {
        language: 'English',
        totalPostsPerMonth: 30,
        mediaPromptSuffix: '',
        affiliateContentKit: '',
        textGenerationModel: 'gemini-1.5-flash',
        imageGenerationModel: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        textModelFallbackOrder: ['gemini-1.5-flash', 'gemini-1.0-pro', 'gpt-3.5-turbo'],
        visionModels: ['gemini-1.5-pro', 'gpt-4-vision-preview']
    };
    private aiModelConfig: AiModelConfig = {
        textModelFallbackOrder: ['gemini-1.5-flash', 'gemini-1.0-pro', 'gpt-3.5-turbo'],
        visionModels: ['gemini-1.5-pro', 'gpt-4-vision-preview']
    };

    private constructor() {}

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    static async initializeConfig() {
        try {
            const defaults = await fetchAdminDefaults();
            const instance = ConfigService.getInstance();
            instance.appSettings = { ...instance.appSettings, ...defaults };
            return defaults;
        } catch (error) {
            console.error('Config initialization failed:', error);
            return { brandName: 'Default Brand', industry: 'General', targetAudience: 'All' };
        }
    }

    static getAppSettings(): Settings {
        return ConfigService.getInstance().appSettings;
    }

    static getAiModelConfig(): AiModelConfig {
        return ConfigService.getInstance().aiModelConfig;
    }

    static async getAdminDefaults() {
        try {
            const defaults = await fetchAdminDefaults();
            return defaults;
        } catch (error) {
            console.error('Failed to fetch admin defaults:', error);
            return ConfigService.getInstance().appSettings;
        }
    }

    static async saveAdminDefaults(settings: Partial<Settings>) {
        // In a real implementation, this would save to a database
        console.log('Saving admin defaults:', settings);
        const instance = ConfigService.getInstance();
        instance.appSettings = { ...instance.appSettings, ...settings };
    }

    static async updateAppSettings(settings: Partial<Settings>) {
        const instance = ConfigService.getInstance();
        instance.appSettings = { ...instance.appSettings, ...settings };
    }

    static setBrandId(brandId: string) {
        const instance = ConfigService.getInstance();
        instance.brandId = brandId;
        // In a real implementation, this might fetch brand-specific settings
        return Promise.resolve();
    }

    static getBrandId(): string | null {
        return ConfigService.getInstance().brandId;
    }
    
    // Instance methods
    async initializeConfig() {
        try {
            const defaults = await fetchAdminDefaults();
            this.appSettings = { ...this.appSettings, ...defaults };
            return defaults;
        } catch (error) {
            console.error('Config initialization failed:', error);
            return { brandName: 'Default Brand', industry: 'General', targetAudience: 'All' };
        }
    }

    getAppSettings(): Settings {
        return this.appSettings;
    }

    getAiModelConfig(): AiModelConfig {
        return this.aiModelConfig;
    }

    async getAdminDefaults() {
        try {
            const defaults = await fetchAdminDefaults();
            return defaults;
        } catch (error) {
            console.error('Failed to fetch admin defaults:', error);
            return this.appSettings;
        }
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
