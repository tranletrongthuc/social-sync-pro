import React, { useState, useEffect } from 'react';
import type { BrandInfo } from '../../types';
import { Button, Input, TextArea } from './ui';
import { SparklesIcon } from './icons';

interface BrandProfilerProps {
  initialBrandInfo: BrandInfo;
  onGenerate: (brandInfo: BrandInfo) => void;
  isLoading: boolean;
  onBack: () => void;
  language: string;
}

const BrandProfiler: React.FC<BrandProfilerProps> = ({ initialBrandInfo, onGenerate, isLoading, onBack, language }) => {
  const [brandInfo, setBrandInfo] = useState<BrandInfo>(initialBrandInfo);

  useEffect(() => {
    setBrandInfo(initialBrandInfo);
  }, [initialBrandInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBrandInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(brandInfo);
  };

  const texts = {
      'Việt Nam': {
          title: 'Xem lại Hồ sơ Thương hiệu của bạn',
          subtitle: 'Tinh chỉnh các chi tiết do AI tạo ra bên dưới để đảm bảo chúng hoàn toàn phù hợp với tầm nhìn của bạn.',
          nameLabel: 'Tên thương hiệu',
          missionLabel: 'Sứ mệnh thương hiệu',
          valuesLabel: 'Giá trị cốt lõi (phân tách bằng dấu phẩy)',
          audienceLabel: 'Đối tượng mục tiêu',
          personalityLabel: 'Tính cách thương hiệu',
          backButton: 'Quay lại',
          generateButton: 'Tạo tài sản thương hiệu',
          generateButtonLoading: 'Đang tạo...'
      },
      'English': {
          title: 'Review Your Brand Profile',
          subtitle: 'Tweak the AI-generated details below to ensure they perfectly match your vision.',
          nameLabel: 'Brand Name',
          missionLabel: 'Brand Mission',
          valuesLabel: 'Core Values (comma-separated)',
          audienceLabel: 'Target Audience',
          personalityLabel: 'Brand Personality',
          backButton: 'Go Back',
          generateButton: 'Generate Brand Assets',
          generateButtonLoading: 'Generating...'
      }
  }

  const currentTexts = (texts as any)[language] || texts['English'];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-left mb-10">
            <h1 className="text-4xl font-bold font-sans text-gray-900">{currentTexts.title}</h1>
            <p className="text-gray-500 mt-2 text-lg font-serif">{currentTexts.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">{currentTexts.nameLabel}</label>
              <Input id="name" name="name" value={brandInfo.name} onChange={handleChange} required placeholder="e.g., Nova Sneakers" />
            </div>
            <div>
              <label htmlFor="mission" className="block text-sm font-semibold text-gray-700 mb-1">{currentTexts.missionLabel}</label>
              <TextArea id="mission" name="mission" value={brandInfo.mission} onChange={handleChange} required placeholder="What is your brand's purpose?" />
            </div>
            <div>
              <label htmlFor="values" className="block text-sm font-semibold text-gray-700 mb-1">{currentTexts.valuesLabel}</label>
              <Input id="values" name="values" value={brandInfo.values} onChange={handleChange} required placeholder="e.g., Innovation, Quality, Community" />
            </div>
            <div>
              <label htmlFor="audience" className="block text-sm font-semibold text-gray-700 mb-1">{currentTexts.audienceLabel}</label>
              <TextArea id="audience" name="audience" value={brandInfo.audience} onChange={handleChange} required placeholder="Who are you trying to reach?" />
            </div>
            <div>
              <label htmlFor="personality" className="block text-sm font-semibold text-gray-700 mb-1">{currentTexts.personalityLabel}</label>
              <Input id="personality" name="personality" value={brandInfo.personality} onChange={handleChange} required placeholder="e.g., Playful, Professional, Edgy" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                <Button type="button" onClick={onBack} variant="tertiary" className="w-full sm:w-auto">
                    {currentTexts.backButton}
                </Button>
                <Button type="submit" disabled={isLoading} variant="primary" className="w-full flex items-center justify-center gap-2">
                    {isLoading ? (
                        currentTexts.generateButtonLoading
                    ) : (
                        <>
                            <SparklesIcon className="h-5 w-5" />
                            {currentTexts.generateButton}
                        </>
                    )}
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default BrandProfiler;