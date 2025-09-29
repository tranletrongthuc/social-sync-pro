import React, { useState, useEffect } from 'react';
import type { Settings, AIService } from '../../types';
import { Button, Input, TextArea, Select } from './ui';
import { SettingsIcon, TrashIcon, PlusIcon } from './icons';
import { loadSettingsDataFromDatabase as loadSettingsData } from '../services/databaseService';
import SettingField from './SettingField';

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
  adminSettings: Settings | null;
  onSave: (newSettings: Settings) => Promise<void>;
}

type ActiveTab = 'general' | 'generation' | 'affiliate' | 'rules';

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

// Define texts before using it
const T = {
  'Việt Nam': {
    title: 'Cài đặt',
    subtitle: 'Tùy chỉnh hành vi của ứng dụng.',
    tab_general: 'Chung',
    tab_generation: 'Tạo nội dung',
    tab_affiliate: 'Affiliate',
    tab_rules: 'Prompt Rules',
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
    prompt_rules: 'Quy tắc Prompt',
    prompt_rules_desc: 'Tùy chỉnh quy tắc cho các thành phần prompt khác nhau được sử dụng trong quá trình tạo nội dung.',
    image_prompt_rules: 'Quy tắc Prompt Ảnh',
    image_prompt_rules_desc: 'Các quy tắc được áp dụng khi tạo prompt cho hình ảnh.',
    caption_rules: 'Quy tắc Caption',
    caption_rules_desc: 'Các quy tắc được áp dụng khi tạo caption cho bài đăng.',
    short_video_script_rules: 'Quy tắc Script Video Ngắn',
    short_video_script_rules_desc: 'Các quy tắc được áp dụng khi tạo script cho video ngắn.',
    long_video_script_rules: 'Quy tắc Script Video Dài',
    long_video_script_rules_desc: 'Các quy tắc được áp dụng khi tạo script cho video dài.',
  },
  'English': {
    title: 'Settings',
    subtitle: 'Customize the behavior of the application.',
    tab_general: 'General',
    tab_generation: 'Generation',
    tab_affiliate: 'Affiliate',
    tab_rules: 'Prompt Rules',
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
    prompt_rules: 'Prompt Rules',
    prompt_rules_desc: 'Customize rules for different prompt components used in content generation.',
    image_prompt_rules: 'Image Prompt Rules',
    image_prompt_rules_desc: 'Rules applied when generating prompts for images.',
    caption_rules: 'Caption Rules',
    caption_rules_desc: 'Rules applied when generating captions for posts.',
    short_video_script_rules: 'Short Video Script Rules',
    short_video_script_rules_desc: 'Rules applied when generating scripts for short videos.',
    long_video_script_rules: 'Long Video Script Rules',
    long_video_script_rules_desc: 'Rules applied when generating scripts for long videos.',
  }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings: initialSettings, adminSettings, onSave }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [aiServices, setAiServices] = useState<AIService[]>([]);
  const [dynamicAdminSettings, setDynamicAdminSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newPillar, setNewPillar] = useState({ name: '', targetPercentage: 0 });

  const handleAddPillar = () => {
    if (newPillar.name && newPillar.targetPercentage > 0) {
        const pillarToAdd = { ...newPillar, description: '' };
        setSettings(prev => ({
            ...prev,
            contentPillars: [...(prev.contentPillars || []), pillarToAdd]
        }));
        setNewPillar({ name: '', targetPercentage: 0 }); // Reset form
    }
  };

  const handleRemovePillar = (index: number) => {
      setSettings(prev => ({
          ...prev,
          contentPillars: (prev.contentPillars || []).filter((_, i) => i !== index)
      }));
  };

  const handlePillarChange = (index: number, field: 'name' | 'targetPercentage', value: string | number) => {
    setSettings(prev => {
        const updatedPillars = [...(prev.contentPillars || [])];
        const pillarToUpdate = { ...updatedPillars[index] };

        if (field === 'name') {
            pillarToUpdate.name = value as string;
        } else {
            pillarToUpdate.targetPercentage = Number(value) || 0;
        }
        
        updatedPillars[index] = pillarToUpdate;

        return {
            ...prev,
            contentPillars: updatedPillars
        };
    });
  };

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
      const fetchSettingsData = async () => {
        setLoading(true);
        try {
          const { services, adminSettings: loadedAdminSettings } = await loadSettingsData();
          setAiServices(services);
          setDynamicAdminSettings(loadedAdminSettings);
        } catch (err) {
          setError('Failed to load settings configuration.');
        } finally {
          setLoading(false);
        }
      };
      fetchSettingsData();
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
      <div className="bg-white rounded-lg shadow-xl w-full md:max-w-2xl p-4 md:p-8 border border-gray-200 m-4 md:my-8 transform transition-all max-h-[95vh] md:max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
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
            {/* Mobile Tab Selector */}
            <div className="md:hidden mb-4">
                <Select value={activeTab} onChange={(e) => setActiveTab(e.target.value as ActiveTab)} className="w-full">
                    <option value="general">{texts.tab_general}</option>
                    <option value="generation">{texts.tab_generation}</option>
                    <option value="affiliate">{texts.tab_affiliate}</option>
                    <option value="rules">{texts.tab_rules}</option>
                </Select>
            </div>
            {/* Desktop Horizontal Tabs */}
            <div className="hidden md:flex space-x-4 overflow-x-auto pb-2">
                <TabButton tabId="general" text={texts.tab_general} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tabId="generation" text={texts.tab_generation} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tabId="affiliate" text={texts.tab_affiliate} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tabId="rules" text={texts.tab_rules} activeTab={activeTab} onClick={setActiveTab} />
            </div>
        </div>

        <div className="mt-6 space-y-6 flex-grow overflow-y-auto pr-2">
            {activeTab === 'general' && (
                 <div className="space-y-6">
                    <SettingField
                        id="language"
                        label={texts.language}
                        description={texts.language_desc}
                        brandValue={settings.language}
                        adminValue={adminSettings?.language}
                        onChange={handleInputChange}
                        type="select"
                        options={[
                            { value: "Việt Nam", label: "Việt Nam" },
                            { value: "English", label: "English" }
                        ]}
                    />
                    
                    {/* Content Pillars Section */}
                    <div>
                        <label className="block text-lg font-medium text-gray-800">Content Pillars</label>
                        <p className="text-sm text-gray-500 mt-1 font-serif">Define the core themes of your content strategy.</p>
                        <div className="mt-4 space-y-3">
                            {(settings.contentPillars || []).map((pillar, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                    <Input
                                        type="text"
                                        value={pillar.name}
                                        onChange={(e) => handlePillarChange(index, 'name', e.target.value)}
                                        className="flex-grow"
                                        placeholder="Pillar Name"
                                    />
                                    <Input
                                        type="number"
                                        value={pillar.targetPercentage}
                                        onChange={(e) => handlePillarChange(index, 'targetPercentage', e.target.value)}
                                        className="w-24"
                                        placeholder="%"
                                    />
                                    <span className="text-gray-500">%</span>
                                    <Button onClick={() => handleRemovePillar(index)} variant="tertiary" aria-label="Remove Pillar">
                                        <TrashIcon className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))}
                            
                            {/* Add New Pillar Form */}
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-dashed">
                                <Input
                                    type="text"
                                    value={newPillar.name}
                                    onChange={(e) => setNewPillar(p => ({ ...p, name: e.target.value }))}
                                    className="flex-grow"
                                    placeholder="New Pillar Name"
                                />
                                <Input
                                    type="number"
                                    value={newPillar.targetPercentage || ''}
                                    onChange={(e) => setNewPillar(p => ({ ...p, targetPercentage: Number(e.target.value) }))}
                                    className="w-24"
                                    placeholder="%"
                                />
                                <span className="text-gray-500">%</span>
                                <Button onClick={handleAddPillar} variant="tertiary" aria-label="Add Pillar">
                                    <PlusIcon className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
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
                        <SettingField
                            id="imageGenerationModel"
                            label={texts.imageGenerationModel}
                            description={texts.imageGenerationModel_desc}
                            brandValue={settings.imageGenerationModel}
                            adminValue={adminSettings?.imageGenerationModel}
                            onChange={handleInputChange}
                            type="select"
                            options={imageGenerationModels}
                        />
                        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                    </div>
                    <div>
                        <SettingField
                            id="totalPostsPerMonth"
                            label={texts.total_posts_per_month}
                            description={texts.total_posts_per_month_desc}
                            brandValue={settings.totalPostsPerMonth}
                            adminValue={adminSettings?.totalPostsPerMonth}
                            onChange={handleInputChange}
                            type="number"
                        />
                    </div>
                     <div>
                        <label className="block text-lg font-medium text-gray-800">{texts.visual_style_templates}</label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {(dynamicAdminSettings?.visualStyleTemplates || []).map((template) => (
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
                        <SettingField
                            id="mediaPromptSuffix"
                            label={texts.media_prompt_suffix}
                            description={texts.media_prompt_suffix_desc}
                            brandValue={settings.mediaPromptSuffix}
                            adminValue={adminSettings?.mediaPromptSuffix}
                            onChange={handleInputChange}
                            type="textarea"
                        />
                    </div>

                    

                    
                </div>
            )}
             {activeTab === 'affiliate' && (
                <div>
                    <SettingField
                        id="affiliateContentKit"
                        label={texts.affiliate_kit_rules}
                        description={texts.affiliate_kit_rules_desc}
                        brandValue={settings.affiliateContentKit}
                        adminValue={adminSettings?.affiliateContentKit}
                        onChange={handleInputChange}
                        type="textarea"
                    />
                </div>
            )}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{texts.prompt_rules}</h3>
                  <p className="text-sm text-gray-500 mt-1 font-serif">{texts.prompt_rules_desc}</p>
                </div>
                
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">{texts.image_prompt_rules}</label>
                  <p className="text-sm text-gray-500 mb-2 font-serif">{texts.image_prompt_rules_desc}</p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    value={settings.prompts?.rules?.imagePrompt?.join('\n') || ''}
                    onChange={(e) => {
                      const rules = e.target.value.split('\n').filter(rule => rule.trim() !== '');
                      setSettings(prev => ({
                        ...prev,
                        prompts: {
                          ...prev.prompts,
                          rules: {
                            ...prev.prompts?.rules,
                            imagePrompt: rules
                          }
                        }
                      }));
                    }}
                    placeholder="Enter one rule per line..."
                  />
                </div>
                
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">{texts.caption_rules}</label>
                  <p className="text-sm text-gray-500 mb-2 font-serif">{texts.caption_rules_desc}</p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    value={settings.prompts?.rules?.postCaption?.join('\n') || ''}
                    onChange={(e) => {
                      const rules = e.target.value.split('\n').filter(rule => rule.trim() !== '');
                      setSettings(prev => ({
                        ...prev,
                        prompts: {
                          ...prev.prompts,
                          rules: {
                            ...prev.prompts?.rules,
                            postCaption: rules
                          }
                        }
                      }));
                    }}
                    placeholder="Enter one rule per line..."
                  />
                </div>
                
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">{texts.short_video_script_rules}</label>
                  <p className="text-sm text-gray-500 mb-2 font-serif">{texts.short_video_script_rules_desc}</p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    value={settings.prompts?.rules?.shortVideoScript?.join('\n') || ''}
                    onChange={(e) => {
                      const rules = e.target.value.split('\n').filter(rule => rule.trim() !== '');
                      setSettings(prev => ({
                        ...prev,
                        prompts: {
                          ...prev.prompts,
                          rules: {
                            ...prev.prompts?.rules,
                            shortVideoScript: rules
                          }
                        }
                      }));
                    }}
                    placeholder="Enter one rule per line..."
                  />
                </div>
                
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">{texts.long_video_script_rules}</label>
                  <p className="text-sm text-gray-500 mb-2 font-serif">{texts.long_video_script_rules_desc}</p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    value={settings.prompts?.rules?.longVideoScript?.join('\n') || ''}
                    onChange={(e) => {
                      const rules = e.target.value.split('\n').filter(rule => rule.trim() !== '');
                      setSettings(prev => ({
                        ...prev,
                        prompts: {
                          ...prev.prompts,
                          rules: {
                            ...prev.prompts?.rules,
                            longVideoScript: rules
                          }
                        }
                      }));
                    }}
                    placeholder="Enter one rule per line..."
                  />
                </div>
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
