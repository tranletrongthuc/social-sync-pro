
import type { Settings } from '../types';
import { saveSettingsToAirtable, fetchSettingsFromAirtable, fetchAdminDefaultsFromAirtable, saveAdminDefaultsToAirtable } from './airtableService';

// Define AiModelConfig as a type that extracts the AI model related fields from Settings
export type AiModelConfig = Pick<Settings, 'textModelFallbackOrder' | 'visionModels'>;

interface AppConfig {
    settings: Settings;
}

// Default values for initial setup
const DEFAULT_AFFILIATE_CONTENT_KIT = `Bạn là một chuyên gia sáng tạo nội dung tuân thủ "Bộ quy tắc Sáng tạo Nội dung Affiliate". Nguyên tắc cốt lõi của bạn là: "Hãy hành động như một CHUYÊN GIA TƯ VẤN ĐÁNG TIN CẬY, không phải một người bán hàng." Mọi nội dung bạn tạo ra phải tuân thủ nghiêm ngặt các quy tắc sau:

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
*   Khi tạo hãy mô tả một cảnh thực tế, có bối cảnh. Thay vì "sản phẩm trên nền trắng", hãy mô tả "một người đang sử dụng sản phẩm trong một bối cảnh đời thực". Điều này phù hợp với quy tắc sử dụng hình ảnh chân thực, tự sản xuất.

Bằng cách tuân thủ nghiêm ngặt các quy tắc này, bạn sẽ tạo ra nội dung có giá trị cao, đáng tin cậy, giúp ích cho người dùng, thay vì chỉ cố gắng bán hàng cho họ.`;

const DEFAULT_APP_SETTINGS: Settings = {
    language: 'Việt Nam',
    totalPostsPerMonth: 16,
    mediaPromptSuffix: ', photorealistic, 8k, high quality, vietnamese style, vietnam',
    affiliateContentKit: DEFAULT_AFFILIATE_CONTENT_KIT,
    textGenerationModel: 'Gemini Pro',
    imageGenerationModel: 'Gemini Ultra',
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
};

class ConfigService {
    private settings: Settings;
    private brandId: string | null = null;

    constructor() {
        this.settings = DEFAULT_APP_SETTINGS;
    }

    async initializeConfig(): Promise<void> {
        // Load admin defaults on initialization
        const adminSettings = await fetchAdminDefaultsFromAirtable();
        if (adminSettings) {
            this.settings = { ...this.settings, ...adminSettings };
        }
    }

    // Set the brand ID to enable database operations
    async setBrandId(brandId: string): Promise<void> {
        this.brandId = brandId;
        // Load config from database
        await this.loadConfigFromDatabase();
    }

    private async loadConfigFromDatabase(): Promise<void> {
        if (!this.brandId) return;

        try {
            // Load settings from database
            const dbSettings = await fetchSettingsFromAirtable(this.brandId);
            if (dbSettings) {
                this.settings = { ...this.settings, ...dbSettings };
            }
        } catch (e) {
            console.error("Failed to load config from database:", e);
        }
    }

    getAppSettings(): Settings {
        return this.settings;
    }

    async updateAppSettings(newSettings: Partial<Settings>): Promise<void> {
        this.settings = { ...this.settings, ...newSettings };
        
        // Save to database if brandId is set
        if (this.brandId) {
            try {
                await saveSettingsToAirtable(this.settings, this.brandId);
            } catch (e) {
                console.error("Failed to save settings to database:", e);
                throw e;
            }
        }
    }

    async getAdminDefaults(): Promise<Settings> {
        const settings = await fetchAdminDefaultsFromAirtable();
        return settings || DEFAULT_APP_SETTINGS;
    }

    async saveAdminDefaults(settings: Settings): Promise<void> {
        try {
            await saveAdminDefaultsToAirtable(settings);
        } catch (e) {
            console.error("Failed to save admin defaults to database:", e);
            throw e;
        }
    }

    async cloneDefaultConfig(): Promise<Settings> {
        return await this.getAdminDefaults();
    }
    
    // New method to get brand-specific settings without affecting the global config
    async getBrandSettings(brandId: string): Promise<Settings | null> {
        return await fetchSettingsFromAirtable(brandId);
    }
    
    // New method to save brand-specific settings
    async saveBrandSettings(brandId: string, settings: Settings): Promise<void> {
        await saveSettingsToAirtable(settings, brandId);
    }
    
    // Method to get AI model configuration (merged with Settings)
    getAiModelConfig(): AiModelConfig {
        return {
            textModelFallbackOrder: this.settings.textModelFallbackOrder,
            visionModels: this.settings.visionModels
        };
    }
}

export const configService = new ConfigService();