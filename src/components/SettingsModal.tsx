import React, { useState, useEffect } from 'react';
import type { Settings, AIService } from '../../types';
import { Button, Input, TextArea, Select } from './ui';
import { SettingsIcon, TrashIcon, PlusIcon } from './icons';
import { loadAIServices } from '../services/databaseService';

// Helper function to get models by capability from AI services
const getModelsByCapability = (aiServices: AIService[], capability: 'text' | 'image') => {
  return aiServices
    .flatMap(service => service.models)
    .filter(model => model.capabilities.includes(capability))
    .map(model => ({
      value: model.name,
      label: `${model.provider}: ${model.name}`
    }));
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => Promise<void>;
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


// Define texts before using it
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
    media_prompt_suffix: 'Hậu tố Prompt ảnh',
    media_prompt_suffix_desc: 'Văn bản này sẽ được thêm vào cuối mỗi prompt tạo ảnh để đảm bảo phong cách nhất quán.',
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
    media_prompt_suffix: 'Image Prompt Suffix',
    media_prompt_suffix_desc: 'This text will be added to the end of every image generation prompt to ensure consistent styling.',
    visual_style_templates: 'Visual Style Templates',
    affiliate_kit_rules: 'Affiliate Content-Kit Rules',
    affiliate_kit_rules_desc: 'These rules (as a system instruction) are fed to the AI when generating media plans to ensure compliance.',
    textGenerationModel: 'Text Generation Model',
    textGenerationModel_desc: 'The AI model to use for all text generation features.',
    imageGenerationModel: 'Image Generation Model',
    imageGenerationModel_desc: 'The AI model to use for all image generation features.',
  }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings: initialSettings, onSave }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [aiServices, setAiServices] = useState<AIService[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
      const fetchAiServices = async () => {
        setLoading(true);
        try {
          const loadedServices = await loadAIServices();
          setAiServices(loadedServices);
        } catch (err) {
          setError('Failed to load AI models configuration.');
        } finally {
          setLoading(false);
        }
      };
      fetchAiServices();
    }
  }, [isOpen, initialSettings]);

  const texts = (T as any)[settings?.language || 'English'] || T['English'];

  if (!isOpen) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(settings);
      onClose();
    } catch (err) {
      setError('Failed to save settings: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  const textGenerationModels = getModelsByCapability(aiServices, 'text');
  const imageGenerationModels = getModelsByCapability(aiServices, 'image');

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
                            {loading && <option>Loading AI models...</option>}
                            {error && <option>Error loading models</option>}
                            {textGenerationModels.map(model => (
                                <option key={model.value} value={model.value}>{model.label}</option>
                            ))}
                            {!loading && !error && !textGenerationModels.some(model => model.value === settings.textGenerationModel) && settings.textGenerationModel && (
                                <option value={settings.textGenerationModel}>{settings.textGenerationModel} (Custom)</option>
                            )}
                            {!loading && !error && textGenerationModels.length === 0 && !settings.textGenerationModel && (
                                <option value="">No models available</option>
                            )}
                        </Select>
                        <p className="text-sm text-gray-500 mt-1 font-serif">{texts.textGenerationModel_desc}</p>
                        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
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
                            {loading && <option>Loading AI models...</option>}
                            {error && <option>Error loading models</option>}
                            {imageGenerationModels.map(model => (
                                <option key={model.value} value={model.value}>{model.label}</option>
                            ))}
                            {!loading && !error && !imageGenerationModels.some(model => model.value === settings.imageGenerationModel) && settings.imageGenerationModel && (
                                <option value={settings.imageGenerationModel}>{settings.imageGenerationModel} (Custom)</option>
                            )}
                            {!loading && !error && imageGenerationModels.length === 0 && !settings.imageGenerationModel && (
                                <option value="">No models available</option>
                            )}
                        </Select>
                        <p className="text-sm text-gray-500 mt-1 font-serif">{texts.imageGenerationModel_desc}</p>
                        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
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
                                    onClick={() => setSettings(prev => ({...prev, mediaPromptSuffix: template.suffix}))}
                                    className={`relative rounded-lg overflow-hidden border-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all ${
                                        settings.mediaPromptSuffix === template.suffix ? 'border-brand-green' : 'border-transparent hover:border-gray-300'
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
                        <label htmlFor="mediaPromptSuffix" className="block text-lg font-medium text-gray-800">{texts.media_prompt_suffix}</label>
                        <TextArea
                            id="mediaPromptSuffix"
                            name="mediaPromptSuffix"
                            value={settings.mediaPromptSuffix}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 font-mono text-sm"
                        />
                        <p className="text-sm text-gray-500 mt-1 font-serif">{texts.media_prompt_suffix_desc}</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-lg font-medium text-gray-800">Text Model Fallback Order</label>
                        <div className="space-y-2">
                            {(settings.textModelFallbackOrder || []).map((model, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={model}
                                        onChange={(e) => {
                                            const newOrder = [...(settings.textModelFallbackOrder || [])];
                                            newOrder[index] = e.target.value;
                                            setSettings({ ...settings, textModelFallbackOrder: newOrder });
                                        }}
                                        className="flex-grow"
                                    />
                                    <Button
                                        variant="tertiary"
                                        onClick={() => {
                                            const newOrder = (settings.textModelFallbackOrder || []).filter((_, i) => i !== index);
                                            setSettings({ ...settings, textModelFallbackOrder: newOrder });
                                        }}
                                    >
                                        <TrashIcon className="h-5 w-5 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            className="mt-3 flex items-center gap-2"
                            onClick={() => setSettings({ ...settings, textModelFallbackOrder: [...(settings.textModelFallbackOrder || []), ''] })}
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add Text Model
                        </Button>
                    </div>

                    <div>
                        <label className="block text-lg font-medium text-gray-800">Vision Models</label>
                        <div className="space-y-2">
                            {(settings.visionModels || []).map((model, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={model}
                                        onChange={(e) => {
                                            const newModels = [...(settings.visionModels || [])];
                                            newModels[index] = e.target.value;
                                            setSettings({ ...settings, visionModels: newModels });
                                        }}
                                        className="flex-grow"
                                    />
                                    <Button
                                        variant="tertiary"
                                        onClick={() => {
                                            const newModels = (settings.visionModels || []).filter((_, i) => i !== index);
                                            setSettings({ ...settings, visionModels: newModels });
                                        }}
                                    >
                                        <TrashIcon className="h-5 w-5 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            className="mt-3 flex items-center gap-2"
                            onClick={() => setSettings({ ...settings, visionModels: [...(settings.visionModels || []), ''] })}
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add Vision Model
                        </Button>
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
