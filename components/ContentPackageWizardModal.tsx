import React, { useState, useEffect } from 'react';
import type { Idea, Persona } from '../types';
import { Button, Select } from './ui';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, UsersIcon } from './icons';

interface GenerationOptions {
    tone: string;
    style: string;
    length: string;
}

interface ContentPackageWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onGenerate: (idea: Idea, pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest', personaId: string | null, options: GenerationOptions) => void;
  language: string;
  personas: Persona[];
  generatedImages: Record<string, string>;
}

const platforms: ('YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest')[] = ['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Pinterest'];

const platformIcons: Record<string, React.FC<any>> = {
    YouTube: YouTubeIcon,
    Facebook: FacebookIcon,
    Instagram: InstagramIcon,
    TikTok: TikTokIcon,
    Pinterest: PinterestIcon
};

const ContentPackageWizardModal: React.FC<ContentPackageWizardModalProps> = ({ isOpen, onClose, idea, onGenerate, language, personas, generatedImages }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const [selectedPlatform, setSelectedPlatform] = useState<'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest' | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  // Generation options state
  const [tone, setTone] = useState('Friendly & Casual');
  const [writingStyle, setWritingStyle] = useState('Storytelling');
  const [postLength, setPostLength] = useState('Medium (e.g. for Facebook)');

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        setSelectedPlatform(null);
        setSelectedPersonaId(null);
        setTone('Friendly & Casual');
        setWritingStyle('Storytelling');
        setPostLength('Medium (e.g. for Facebook)');
    }
  }, [isOpen]);

  if (!isOpen || !idea) return null;

  const T = {
    'Việt Nam': {
      title: "Tạo Gói Nội dung",
      idea: "Ý tưởng:",
      // Step 1
      step1Title: "Chọn Nền tảng & KOL/KOC",
      step1Subtitle: "Chọn nền tảng chính và một KOL/KOC (tùy chọn) để bắt đầu.",
      choose_platform: "1. Chọn nền tảng chính của bạn:",
      choose_persona: "2. Chọn một KOL/KOC (Tùy chọn):",
      noPersona: "Không có KOL/KOC",
      // Step 2
      step2Title: "Tinh chỉnh & Tạo",
      step2Subtitle: "Điều chỉnh các cài đặt cuối cùng trước khi AI của chúng tôi bắt đầu làm việc.",
      toneOfVoice: "Giọng điệu",
      writingStyle: "Phong cách viết",
      postLength: "Độ dài bài đăng",
      // Buttons
      back: "Quay lại",
      next: "Tiếp theo",
      generate: "Tạo Gói",
    },
    'English': {
      title: "Generate Content Package",
      idea: "Idea:",
       // Step 1
      step1Title: "Select Platform & Persona",
      step1Subtitle: "Choose the pillar platform and a persona (optional) to get started.",
      choose_platform: "1. Choose your pillar platform:",
      choose_persona: "2. Choose a KOL/KOC (Optional):",
      noPersona: "No KOL/KOC",
       // Step 2
      step2Title: "Refine & Generate",
      step2Subtitle: "Adjust the final settings before our AI gets to work.",
      toneOfVoice: "Tone of Voice",
      writingStyle: "Writing Style",
      postLength: "Post Length",
      // Buttons
      back: "Back",
      next: "Next",
      generate: "Generate Package",
    }
  };
  const texts = (T as any)[language] || T['English'];

  const handleGenerate = () => {
    if (selectedPlatform) {
        onGenerate(idea, selectedPlatform, selectedPersonaId, { tone, style: writingStyle, length: postLength });
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && !selectedPlatform) return true;
    return false;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-8 border border-gray-200 m-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{texts.title}</h2>
                 <p className="text-gray-500 font-serif mt-1">{texts.idea} <span className="font-semibold text-gray-700">"{idea.title}"</span></p>
            </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
            <div className="bg-brand-green h-1.5 rounded-full" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>

        <div className="mt-6 space-y-6 flex-grow overflow-y-auto pr-4 -mr-4">
            {step === 1 && (
                <div>
                     <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step1Title}</h3>
                    <p className="text-gray-500 font-serif text-center mt-1">{texts.step1Subtitle}</p>
                    <div className="mt-8">
                        <p className="font-semibold text-gray-700">{texts.choose_platform}</p>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {platforms.map(platform => {
                                const Icon = platformIcons[platform];
                                const isSelected = selectedPlatform === platform;
                                return (
                                    <button
                                        key={platform}
                                        onClick={() => setSelectedPlatform(platform)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-1 ${isSelected ? 'bg-green-50 border-brand-green' : 'bg-white border-gray-200'}`}
                                    >
                                        <Icon className="h-10 w-10 mb-2"/>
                                        <span className="font-semibold text-gray-800">{platform}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                     <div className="mt-8">
                        <p className="font-semibold text-gray-700">{texts.choose_persona}</p>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            <button onClick={() => setSelectedPersonaId(null)} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedPersonaId === null ? 'bg-green-50 border-brand-green shadow-sm -translate-y-1' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-2"><UsersIcon className="h-10 w-10 text-gray-500"/></div>
                                <span className="font-semibold text-gray-800">{texts.noPersona}</span>
                            </button>
                            {personas.map(p => {
                                const imageUrl = p.avatarImageKey ? generatedImages[p.avatarImageKey] : undefined;
                                const isSelected = selectedPersonaId === p.id;
                                return (
                                    <button key={p.id} onClick={() => setSelectedPersonaId(p.id)} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${isSelected ? 'bg-green-50 border-brand-green shadow-sm -translate-y-1' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
                                        <div className="w-20 h-20 rounded-full bg-gray-200 mb-2 overflow-hidden">
                                            {imageUrl ? <img src={imageUrl} alt={p.nickName} className="w-full h-full object-cover" /> : <UsersIcon className="h-10 w-10 text-gray-500 m-auto"/>}
                                        </div>
                                        <span className="font-semibold text-gray-800 text-center">{p.nickName}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
            {step === 2 && (
                 <div>
                    <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step2Title}</h3>
                    <p className="text-gray-500 font-serif text-center mt-1">{texts.step2Subtitle}</p>
                    <div className="mt-8 space-y-6 max-w-xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
                             <div>
                                <label htmlFor="tone" className="font-medium text-gray-700">{texts.toneOfVoice}</label>
                                <Select id="tone" value={tone} onChange={e => setTone(e.target.value)} className="mt-1">
                                    <option>Friendly & Casual</option>
                                    <option>Professional & Authoritative</option>
                                    <option>Witty & Humorous</option>
                                    <option>Inspirational & Uplifting</option>
                                    <option>Minimal & Direct</option>
                                </Select>
                             </div>
                             <div>
                                <label htmlFor="style" className="font-medium text-gray-700">{texts.writingStyle}</label>
                                <Select id="style" value={writingStyle} onChange={e => setWritingStyle(e.target.value)} className="mt-1">
                                    <option>Storytelling</option>
                                    <option>Educational / How-to</option>
                                    <option>Question-based</option>
                                    <option>Data-driven & Factual</option>
                                    <option>Conversational</option>
                                </Select>
                             </div>
                             <div>
                                <label htmlFor="length" className="font-medium text-gray-700">{texts.postLength}</label>
                                <Select id="length" value={postLength} onChange={e => setPostLength(e.target.value)} className="mt-1">
                                    <option>Short (e.g. for Instagram)</option>
                                    <option>Medium (e.g. for Facebook)</option>
                                    <option>Long (e.g. for a script)</option>
                                </Select>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <footer className="mt-6 pt-4 border-t flex justify-between items-center">
            <Button variant="tertiary" onClick={() => setStep(s => s - 1)} disabled={step === 1}>{texts.back}</Button>
            {step < totalSteps ? (
                 <Button onClick={() => setStep(s => s + 1)} disabled={isNextDisabled()}>{texts.next}</Button>
            ) : (
                 <Button onClick={handleGenerate} disabled={!selectedPlatform}>{texts.generate}</Button>
            )}
        </footer>
      </div>
    </div>
  );
};

export default ContentPackageWizardModal;