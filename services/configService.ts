
import type { Settings } from '../types';
import { saveSettingsToAirtable, fetchSettingsFromAirtable, saveAiModelConfigToAirtable, fetchAiModelConfigFromAirtable, fetchAdminDefaultsFromAirtable, saveAdminDefaultsToAirtable } from './airtableService';

export interface AiModelConfig {
    textModelFallbackOrder: string[];
    visionModels: string[];
    allAvailableModels: { name: string; capabilities: string[]; }[]; // This will store all models loaded from the backend
}

interface AppConfig {
    settings: Settings;
    aiModelConfig: AiModelConfig;
}

// Default values for initial setup
const DEFAULT_AFFILIATE_CONTENT_KIT = `Bạn là một chuyên gia sáng tạo nội dung tuân thủ \"Bộ quy tắc Sáng tạo Nội dung Affiliate\". Nguyên tắc cốt lõi của bạn là: \"Hãy hành động như một CHUYÊN GIA TƯ VẤN ĐÁNG TIN CẬY, không phải một người bán hàng.\" Mọi nội dung bạn tạo ra phải tuân thủ nghiêm ngặt các quy tắc sau:

**1. Ngôn ngữ và Giọng văn (Cực kỳ quan trọng):**
*   **Tư duy như một chuyên gia đánh giá và cố vấn.** Mục tiêu của bạn là giúp người dùng đưa ra quyết định sáng suốt.
*   **NÊN DÙNG các động từ này:** đánh giá, trải nghiệm, trên tay, so sánh, phân tích, gợi ý, đề xuất, hướng dẫn, lựa chọn, tìm hiểu.
*   **TUYỆT ĐỐI TRÁNH các động từ này:** bán, cung cấp, phân phối, ship, vận chuyển, thanh toán, đặt hàng, mua ngay.
*   **NÊN DÙNG các đại từ xưng hô:** \"Mình/Chúng tôi\" (với tư cách người trải nghiệm), \"bên mình\" (khi nói về team review).
*   **TUYỆT ĐỐI TRÁNH các từ này:** \"shop\", \"cửa hàng\", \"công ty\" (khi bán hàng).
*   **NÊN DÙNG các cụm từ này:** \"ưu/nhược điểm\", \"phù hợp với ai\", \"lưu ý khi sử dụng\", \"trải nghiệm thực tế của mình là...\", \"so với sản phẩm X...\".
*   **TUYỆT ĐỐI TRÁNH các cụm từ này:** \"sản phẩm của chúng tôi\", \"hàng của shop\", \"giá bên em\", \"chính sách bảo hành\", \"cam kết chính hãng\".

**2. Kêu gọi hành động (CTA):**
*   **CTA của bạn phải trao quyền cho người dùng tự nghiên cứu và quyết định.**
*   **NÊN DÙNG các CTA này:** \"Tham khảo giá tốt nhất tại [Tên Sàn]\", \"Xem chi tiết sản phẩm tại [Website Hãng]\", \"Tìm hiểu thêm và đặt mua tại [Link Affiliate]\".
*   **TUYỆT ĐỐI TRÁNH các CTA này:** \"Mua ngay!\", \"Đặt hàng ngay!\", \"Inbox để được tư vấn giá\", \"Để lại SĐT để đặt hàng\".

**3. Cấu trúc và Triết lý Nội dung:**
*   **Bắt đầu bằng Vấn đề của Người dùng:** Luôn đề cập đến một nỗi đau hoặc nhu cầu trước, sau đó mới giới thiệu sản phẩm như một giải pháp.
*   **Khách quan - Nêu cả Ưu và Nhược điểm:** Mọi bài đánh giá phải cân bằng. Đề cập đến nhược điểm sẽ xây dựng sự tin cậy. Không có sản phẩm nào hoàn hảo.
*   **Tập trung vào \"Trải nghiệm\" và \"Hướng dẫn\":** Tạo nội dung cho thấy sản phẩm đang được sử dụng, giải thích cách dùng, và chia sẻ kết quả hoặc kinh nghiệm thực tế. Tránh chỉ liệt kê thông số kỹ thuật của nhà sản xuất.

**4. Prompt tạo Hình ảnh:**
*   Khi tạo hãy mô tả một cảnh thực tế, có bối cảnh. Thay vì \"sản phẩm trên nền trắng\", hãy mô tả \"một người đang sử dụng sản phẩm trong một bối cảnh đời thực\". Điều này phù hợp với quy tắc sử dụng hình ảnh chân thực, tự sản xuất.

Bằng cách tuân thủ nghiêm ngặt các quy tắc này, bạn sẽ tạo ra nội dung có giá trị cao, đáng tin cậy, giúp ích cho người dùng, thay vì chỉ cố gắng bán hàng cho họ.`;

const DEFAULT_APP_SETTINGS: Settings = {
    language: 'Việt Nam',
    totalPostsPerMonth: 16,
    mediaPromptSuffix: ', photorealistic, 8k, high quality, vietnamese style, vietnam',
    affiliateContentKit: DEFAULT_AFFILIATE_CONTENT_KIT,
    textGenerationModel: 'google/gemini-2.0-flash-exp:free',
    imageGenerationModel: 'imagen-4.0-ultra-generate-preview-06-06',
};

const DEFAULT_AI_MODEL_CONFIG: AiModelConfig = {
    textModelFallbackOrder: [
        'qwen/qwen3-235b-a22b:free',
        'deepseek/deepseek-r1-0528:free',
        'google/gemini-2.0-flash-exp:free',
        'gemini-2.5-pro'
    ],
    visionModels: [
        'imagen-4.0-ultra-generate-preview-06-06',
        'imagen-3.0-generate-002'
    ],
    allAvailableModels: [
        { name: 'google/gemini-2.0-flash-exp:free', capabilities: ['text', 'image'] },
        { name: 'gemini-2.5-pro', capabilities: ['text', 'image'] },
        { name: 'qwen/qwen3-235b-a22b:free', capabilities: ['text'] },
        { name: 'deepseek/deepseek-r1-0528:free', capabilities: ['text'] },
        { name: 'imagen-4.0-ultra-generate-preview-06-06', capabilities: ['image'] },
        { name: 'imagen-3.0-generate-002', capabilities: ['image'] },
        // Add other models as needed
    ]
};

class ConfigService {
    private config: AppConfig;
    private brandId: string | null = null;

    constructor() {
        this.config = {
            settings: DEFAULT_APP_SETTINGS,
            aiModelConfig: DEFAULT_AI_MODEL_CONFIG
        };
    }

    async initializeConfig(): Promise<void> {
        // Load admin defaults on initialization
        const { settings, aiModelConfig } = await fetchAdminDefaultsFromAirtable();
        this.config.settings = { ...this.config.settings, ...settings };
        this.config.aiModelConfig = { ...this.config.aiModelConfig, ...aiModelConfig };
    }

    // Set the brand ID to enable database operations
    setBrandId(brandId: string): void {
        this.brandId = brandId;
        // Load config from database
        this.loadConfigFromDatabase();
    }

    private async loadConfigFromDatabase(): Promise<void> {
        if (!this.brandId) return;

        try {
            // Load settings from database
            const dbSettings = await fetchSettingsFromAirtable(this.brandId);
            if (dbSettings) {
                this.config.settings = { ...this.config.settings, ...dbSettings };
            }

            // Load AI model config from database
            const dbAiModelConfig = await fetchAiModelConfigFromAirtable(this.brandId);
            if (dbAiModelConfig) {
                this.config.aiModelConfig = { ...this.config.aiModelConfig, ...dbAiModelConfig };
            }
        } catch (e) {
            console.error("Failed to load config from database:", e);
        }
    }

    getAppSettings(): Settings {
        return this.config.settings;
    }

    async updateAppSettings(newSettings: Settings): Promise<void> {
        this.config.settings = { ...this.config.settings, ...newSettings };
        
        // Save to database if brandId is set
        if (this.brandId) {
            try {
                await saveSettingsToAirtable(newSettings, this.brandId);
            } catch (e) {
                console.error("Failed to save settings to database:", e);
                throw e;
            }
        }
    }

    getAiModelConfig(): AiModelConfig {
        return this.config.aiModelConfig;
    }

    async updateAiModelConfig(newAiModelConfig: AiModelConfig): Promise<void> {
        this.config.aiModelConfig = { ...this.config.aiModelConfig, ...newAiModelConfig };
        
        // Save to database if brandId is set
        if (this.brandId) {
            try {
                await saveAiModelConfigToAirtable(newAiModelConfig, this.brandId);
            } catch (e) {
                console.error("Failed to save AI model config to database:", e);
                throw e;
            }
        }
    }

    async getAdminDefaults(): Promise<AppConfig> {
        const { settings, aiModelConfig } = await fetchAdminDefaultsFromAirtable();
        return {
            settings: settings || DEFAULT_APP_SETTINGS,
            aiModelConfig: aiModelConfig || DEFAULT_AI_MODEL_CONFIG
        };
    }

    async saveAdminDefaults(settings: Settings, aiModelConfig: AiModelConfig): Promise<void> {
        try {
            await saveAdminDefaultsToAirtable(settings, aiModelConfig);
        } catch (e) {
            console.error("Failed to save admin defaults to database:", e);
            throw e;
        }
    }

    async cloneDefaultConfig(): Promise<AppConfig> {
        const adminDefaults = await this.getAdminDefaults();
        return {
            settings: { ...adminDefaults.settings },
            aiModelConfig: { ...adminDefaults.aiModelConfig }
        };
    }
}

export const configService = new ConfigService();
