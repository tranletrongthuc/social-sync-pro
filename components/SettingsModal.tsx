
import React, { useState, useEffect } from 'react';
import type { Settings } from '../types';
import { Button, Input, TextArea, Select } from './ui';
import { SettingsIcon } from './icons';
import { loadAIServices } from '../services/airtableService';

// Helper function to get text generation models from AI services
const getTextGenerationModels = (aiServices: any[]) => {
  // Default models
  const defaultModels = [
    { value: 'gemini-2.5-pro', label: 'Google: gemini-2.5-pro (Recommended)' },
    { value: 'deepseek/deepseek-r1-0528:free', label: 'OpenRouter: DeepSeek R1 (Free)' },
    { value: 'google/gemini-2.0-flash-exp:free', label: 'OpenRouter: Gemini 2.0 Flash (Free)' },
    { value: 'qwen/qwen3-235b-a22b:free', label: 'OpenRouter: Qwen3 235B A22B (Free)' }
  ];

  // Get text generation models from AI services
  const textModels = aiServices
    .flatMap((service: any) => service.models)
    .filter((model: any) => model.capabilities.includes('text'))
    .map((model: any) => ({
      value: model.name,
      label: `${model.provider}: ${model.name}`
    }));
  
  // Combine default models with custom models, ensuring no duplicates
  const allModels = [...defaultModels];
  textModels.forEach(model => {
    if (!allModels.some(m => m.value === model.value)) {
      allModels.push(model);
    }
  });
  
  return allModels;
};

// Helper function to get image generation models from AI services
const getImageGenerationModels = (aiServices: any[]) => {
  // Default models
  const defaultModels = [
    { value: 'imagen-4.0-ultra-generate-preview-06-06', label: 'Google: imagen-4.0-ultra (Recommended)' },
    { value: 'imagen-3.0-generate-002', label: 'Google: imagen-3.0-generate-002' },
    { value: '@cf/stabilityai/stable-diffusion-xl-base-1.0', label: 'Cloudflare: Stable Diffusion XL (Txt2Img)' },
    { value: '@cf/lykon/dreamshaper-8-lcm', label: 'Cloudflare: DreamShaper 8 LCM' }
  ];

  // Get image generation models from AI services
  const imageModels = aiServices
    .flatMap((service: any) => service.models)
    .filter((model: any) => model.capabilities.includes('image'))
    .map((model: any) => ({
      value: model.name,
      label: `${model.provider}: ${model.name}`
    }));
  
  // Combine default models with custom models, ensuring no duplicates
  const allModels = [...defaultModels];
  imageModels.forEach(model => {
    if (!allModels.some(m => m.value === model.value)) {
      allModels.push(model);
    }
  });
  
  return allModels;
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: Settings) => void;
  isSaving: boolean;
  currentSettings: Settings;
}

type ActiveTab = 'general' | 'generation' | 'affiliate';

const TabButton: React.FC<{
    tabId: ActiveTab;
    text: string;
    activeTab: ActiveTab;
    onClick: (tabId: ActiveTab) => void;
}> = ({tabId, text, activeTab, onClick}) => (
    <button
        onClick={() => onClick(tabId)}
        className={`px-4 py-2 text-md font-semibold rounded-t-lg transition-colors focus:outline-none ${
            activeTab === tabId
            ? 'border-b-2 border-brand-green text-gray-900'
            : 'text-gray-500 hover:text-gray-900'
        }`}
    >
        {text}
    </button>
);

const styleTemplates = [
    {
        name: 'Photorealistic',
        suffix: ', photorealistic, 8k, high quality, cinematic lighting, sharp focus',
        previewUrl: 'https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    {
        name: 'Minimalist',
        suffix: ', minimalist, clean background, simple, elegant, studio lighting, flat design style',
        previewUrl: 'https://images.pexels.com/photos/262391/pexels-photo-262391.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    {
        name: 'Vintage',
        suffix: ', vintage style, retro, 1970s film photography, faded colors, film grain, nostalgic',
        previewUrl: 'https://images.pexels.com/photos/725255/pexels-photo-725255.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    {
        name: 'Vibrant & Abstract',
        suffix: ', vibrant abstract illustration, colorful, geometric shapes, energetic, modern art',
        previewUrl: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    }
];


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, isSaving, currentSettings }) => {
  const [settings, setSettings] = useState<Settings>(currentSettings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [aiServices, setAiServices] = useState<any[]>([]);
  
  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);
  
  // Load AI services from Airtable
  useEffect(() => {
    const loadServices = async () => {
      try {
        // In a real app, you would get the brandId from context or props
        // For now, we'll use a placeholder
        const brandId = 'placeholder-brand-id';
        const loadedServices = await loadAIServices(brandId);
        setAiServices(loadedServices);
      } catch (err) {
        console.error('Failed to load AI services:', err);
        // Use empty array if loading fails
        setAiServices([]);
      }
    };
    
    if (isOpen) {
      loadServices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  const T = {
    'Việt Nam': {
      title: 'Cài đặt',
      subtitle: 'Tùy chỉnh hành vi của ứng dụng.',
      tab_general: 'Chung',
      tab_generation: 'Tạo nội dung',
      tab_affiliate: 'Affiliate',
      save: 'Lưu thay đổi',
      saving: 'Đang lưu...',
      cancel: 'Hủy',
      language: 'Ngôn ngữ mặc định',
      language_desc: 'Ngôn ngữ cho tất cả nội dung do AI tạo ra.',
      total_posts_per_month: 'Tổng số bài đăng mỗi kế hoạch',
      total_posts_per_month_desc: 'Tổng số bài đăng AI sẽ tạo cho một kế hoạch truyền thông mới.',
      image_prompt_suffix: 'Hậu tố Prompt ảnh',
      image_prompt_suffix_desc: 'Văn bản này sẽ được thêm vào cuối mỗi prompt tạo ảnh để đảm bảo phong cách nhất quán.',
      visual_style_templates: 'Mẫu Phong cách Trực quan',
      affiliate_kit_rules: 'Quy tắc Affiliate Content-Kit',
      affiliate_kit_rules_desc: 'Các quy tắc này (dưới dạng system instruction) sẽ được cung cấp cho AI khi tạo kế hoạch truyền thông để đảm bảo tuân thủ.',
      textGenerationModel: 'Mô hình Tạo văn bản',
      textGenerationModel_desc: 'Mô hình AI được sử dụng cho tất cả các tính năng tạo văn bản.',
      imageGenerationModel: 'Mô hình Tạo ảnh',
      imageGenerationModel_desc: 'Mô hình AI được sử dụng cho tất cả các tính năng tạo ảnh.',
    },
    'English': {
      title: 'Settings',
      subtitle: 'Customize the behavior of the application.',
      tab_general: 'General',
      tab_generation: 'Generation',
      tab_affiliate: 'Affiliate',
      save: 'Save Changes',
      saving: 'Saving...',
      cancel: 'Cancel',
      language: 'Default Language',
      language_desc: 'The language for all AI-generated content.',
      total_posts_per_month: 'Total Posts per Plan',
      total_posts_per_month_desc: 'The total number of posts the AI will generate for a new media plan.',
      image_prompt_suffix: 'Image Prompt Suffix',
      image_prompt_suffix_desc: 'This text will be added to the end of every image generation prompt to ensure consistent styling.',
      visual_style_templates: 'Visual Style Templates',
      affiliate_kit_rules: 'Affiliate Content-Kit Rules',
      affiliate_kit_rules_desc: 'These rules (as a system instruction) are fed to the AI when generating media plans to ensure compliance.',
      textGenerationModel: 'Text Generation Model',
      textGenerationModel_desc: 'The AI model to use for all text generation features.',
      imageGenerationModel: 'Image Generation Model',
      imageGenerationModel_desc: 'The AI model to use for all image generation features.',
    }
  };
  const texts = (T as any)[currentSettings.language] || T['English'];


  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 border border-gray-200 m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-brand-green" />
              {texts.title}
            </h2>
            <p className="text-gray-500 mt-1 font-serif">{texts.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
        </div>
        
        <div className="border-b border-gray-200 mt-6">
            <div className="flex space-x-4">
                <TabButton tabId="general" text={texts.tab_general} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tabId="generation" text={texts.tab_generation} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tabId="affiliate" text={texts.tab_affiliate} activeTab={activeTab} onClick={setActiveTab} />
            </div>
        </div>

        <div className="mt-6 space-y-6 flex-grow overflow-y-auto pr-2">
            {activeTab === 'general' && (
                 <div className="space-y-4">
                    <label htmlFor="language" className="block text-lg font-medium text-gray-800">{texts.language}</label>
                     <select
                        id="language"
                        name="language"
                        value={settings.language}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-colors"
                    >
                        <option value="Việt Nam">Việt Nam</option>
                        <option value="English">English</option>
                    </select>
                    <p className="text-sm text-gray-500 font-serif">{texts.language_desc}</p>
                </div>
            )}
            {activeTab === 'generation' && (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="textGenerationModel" className="block text-lg font-medium text-gray-800">{texts.textGenerationModel}</label>
                        <Select
                            id="textGenerationModel"
                            name="textGenerationModel"
                            value={settings.textGenerationModel}
                            onChange={handleInputChange}
                            className="mt-1"
                        >
                            {/* Dynamically load text generation models from AI services */}
                            {getTextGenerationModels(aiServices).map(model => (
                                <option key={model.value} value={model.value}>{model.label}</option>
                            ))}
                        </Select>
                        <p className="text-sm text-gray-500 mt-1 font-serif">{texts.textGenerationModel_desc}</p>
                    </div>
                     <div>
                        <label htmlFor="imageGenerationModel" className="block text-lg font-medium text-gray-800">{texts.imageGenerationModel}</label>
                        <Select
                            id="imageGenerationModel"
                            name="imageGenerationModel"
                            value={settings.imageGenerationModel}
                            onChange={handleInputChange}
                            className="mt-1"
                        >
                            {/* Dynamically load image generation models from AI services */}
                            {getImageGenerationModels(aiServices).map(model => (
                                <option key={model.value} value={model.value}>{model.label}</option>
                            ))}
                        </Select>
                        <p className="text-sm text-gray-500 mt-1 font-serif">{texts.imageGenerationModel_desc}</p>
                    </div>
                    <div>
                        <label htmlFor="totalPostsPerMonth" className="block text-lg font-medium text-gray-800">{texts.total_posts_per_month}</label>
                        <Input
                            id="totalPostsPerMonth"
                            name="totalPostsPerMonth"
                            type="number"
                            value={settings.totalPostsPerMonth}
                            onChange={handleInputChange}
                            min="4"
                            max="40"
                            className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1 font-serif">{texts.total_posts_per_month_desc}</p>
                    </div>
                     <div>
                        <label className="block text-lg font-medium text-gray-800">{texts.visual_style_templates}</label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {styleTemplates.map((template) => (
                                <button
                                    key={template.name}
                                    onClick={() => setSettings(prev => ({...prev, imagePromptSuffix: template.suffix}))}
                                    className={`relative rounded-lg overflow-hidden border-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all ${
                                        settings.imagePromptSuffix === template.suffix ? 'border-brand-green' : 'border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <img src={template.previewUrl} alt={template.name} className="h-24 w-full object-cover"/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                    <p className="absolute bottom-2 left-2 text-white font-bold text-sm">{template.name}</p>
                                </button>
                            ))}
                         </div>
                    </div>
                     <div>
                        <label htmlFor="imagePromptSuffix" className="block text-lg font-medium text-gray-800">{texts.image_prompt_suffix}</label>
                        <TextArea
                            id="imagePromptSuffix"
                            name="imagePromptSuffix"
                            value={settings.imagePromptSuffix}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 font-mono text-sm"
                        />
                        <p className="text-sm text-gray-500 mt-1 font-serif">{texts.image_prompt_suffix_desc}</p>
                    </div>
                </div>
            )}
             {activeTab === 'affiliate' && (
                <div>
                    <label htmlFor="affiliateContentKit" className="block text-lg font-medium text-gray-800">{texts.affiliate_kit_rules}</label>
                    <TextArea
                        id="affiliateContentKit"
                        name="affiliateContentKit"
                        value={settings.affiliateContentKit}
                        onChange={handleInputChange}
                        rows={15}
                        className="mt-1 font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 mt-1 font-serif">{texts.affiliate_kit_rules_desc}</p>
                </div>
            )}
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-auto border-t border-gray-200">
            <Button type="button" onClick={onClose} variant="tertiary">
                {texts.cancel}
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving} className="w-36 flex justify-center">
                 {isSaving ? (
                    <>
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        <span className="ml-2">{texts.saving}</span>
                    </>
                ) : (
                    texts.save
                )}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;