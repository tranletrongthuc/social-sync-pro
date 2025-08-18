import React, { useState, useEffect } from 'react';
import type { Idea, Persona, AffiliateLink } from '../types';
import { Button, Select, Switch } from './ui';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, UsersIcon, CheckCircleIcon, SparklesIcon } from './icons';
import ProductSelector from './ProductSelector';

interface GenerationOptions {
    tone: string;
    style: string;
    length: string;
    includeEmojis: boolean;
}

interface ContentPackageWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onGenerate: (idea: Idea, personaId: string | null, selectedProductId: string | null, options: GenerationOptions) => void;
  language: string;
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  generatedImages: Record<string, string>;
  isGenerating: boolean;
}

const ContentPackageWizardModal: React.FC<ContentPackageWizardModalProps> = ({ 
    isOpen, 
    onClose, 
    idea, 
    onGenerate, 
    language, 
    personas, 
    affiliateLinks,
    generatedImages,
    isGenerating
}) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Generation options state
  const [tone, setTone] = useState('Friendly & Casual');
  const [writingStyle, setWritingStyle] = useState('Storytelling');
  const [postLength, setPostLength] = useState('Medium (e.g. for Facebook)');
  const [includeEmojis, setIncludeEmojis] = useState(true);

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        setSelectedPersonaId(null);
        setSelectedProductId(idea?.productId || null);
        setTone('Friendly & Casual');
        setWritingStyle('Storytelling');
        setPostLength('Medium (e.g. for Facebook)');
        setIncludeEmojis(true);
    }
  }, [isOpen, idea]);

  if (!isOpen || !idea) return null;

  const T = {
    'Việt Nam': {
        title: "Tạo Gói Nội dung",
        idea: "Từ ý tưởng:",
        step: "Bước",
        of: "trên",
        // Step 1
        step1Title: "Chọn một KOL/KOC (Tùy chọn)",
        step1Subtitle: "Chọn một nhân vật để làm gương mặt đại diện cho gói nội dung này. Nội dung sẽ được tạo từ góc nhìn của họ.",
        noPersona: "Không có KOL/KOC",
        noPersonasAvailable: "Chưa có KOL/KOC nào được định nghĩa. Bạn có thể thêm họ trong tab 'KOL/KOC'.",
        // Step 2
        step2Title: "Chọn Sản phẩm để Quảng bá (Tùy chọn)",
        step2Subtitle: "Chọn một sản phẩm từ Kho Affiliate của bạn để tự động liên kết với các bài đăng trong gói này.",
        // Step 3
        step3Title: "Tinh chỉnh & Tạo",
        step3Subtitle: "Điều chỉnh các cài đặt cuối cùng trước khi AI của chúng tôi bắt đầu làm việc.",
        toneOfVoice: "Giọng điệu",
        writingStyle: "Phong cách viết",
        postLength: "Độ dài bài đăng",
        includeEmojis: "Bao gồm Emojis",
        includeEmojisDesc: "Tự động thêm emojis vào bài đăng.",
        // Buttons
        back: "Quay lại",
        next: "Tiếp theo",
        skip: "Bỏ qua",
        generate: "Tạo Gói",
        generating: "Đang tạo...",
        cancel: "Hủy",
    },
    'English': {
        title: "Generate Content Package",
        idea: "From idea:",
        step: "Step",
        of: "of",
        // Step 1
        step1Title: "Select a KOL/KOC (Optional)",
        step1Subtitle: "Choose a persona to be the face of this content package. Content will be generated from their perspective.",
        noPersona: "No KOL/KOC",
        noPersonasAvailable: "No KOLs/KOCs have been defined yet. You can add them in the 'KOL/KOC' tab.",
        // Step 2
        step2Title: "Select Product to Promote (Optional)",
        step2Subtitle: "Choose a product from your Affiliate Vault to automatically link to posts in this package.",
        // Step 3
        step3Title: "Refine & Generate",
        step3Subtitle: "Adjust the final settings before our AI gets to work.",
        toneOfVoice: "Tone of Voice",
        writingStyle: "Writing Style",
        postLength: "Post Length",
        includeEmojis: "Include Emojis",
        includeEmojisDesc: "Automatically add emojis to posts.",
        // Buttons
        back: "Back",
        next: "Next",
        skip: "Skip for now",
        generate: "Generate Package",
        generating: "Generating...",
        cancel: "Cancel",
    }
  };
  const texts = (T as any)[language] || T['English'];

  const handleGenerate = () => {
    
    onGenerate(idea, selectedPersonaId, selectedProductId, { tone, style: writingStyle, length: postLength, includeEmojis });
    console.log('Generating content package with options:', {
        ideaId: idea.id,
        personaId: selectedPersonaId,
        productId: selectedProductId,
        options: { tone, style: writingStyle, length: postLength, includeEmojis }}
    )};

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 m-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <SparklesIcon className="h-7 w-7 text-brand-green" />
                    {texts.title}
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
            </div>
            <p className="text-gray-500 font-serif mt-1">{texts.idea} <span className="font-semibold text-gray-700">"{idea.title}"</span></p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                <div className="bg-brand-green h-1.5 rounded-full" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
            </div>
        </header>
        
        <main className="p-8 flex-grow overflow-y-auto">
            {step === 1 && (
                <div>
                     <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step1Title}</h3>
                    <p className="text-gray-500 font-serif text-center mt-1">{texts.step1Subtitle}</p>
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => setSelectedPersonaId(null)} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedPersonaId === null ? 'bg-green-50 border-brand-green shadow-sm -translate-y-1' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-2"><UsersIcon className="h-10 w-10 text-gray-500"/></div>
                            <span className="font-semibold text-gray-800">{texts.noPersona}</span>
                        </button>
                        {personas.map(p => {
                            const imageUrl = p.avatarImageKey ? generatedImages[p.avatarImageKey] : undefined;
                            return (
                                <button key={p.id} onClick={() => setSelectedPersonaId(p.id)} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedPersonaId === p.id ? 'bg-green-50 border-brand-green shadow-sm -translate-y-1' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
                                    <div className="w-20 h-20 rounded-full bg-gray-200 mb-2 overflow-hidden">
                                        {imageUrl ? <img src={imageUrl} alt={p.nickName} className="w-full h-full object-cover" /> : <UsersIcon className="h-10 w-10 text-gray-500 m-auto"/>}
                                    </div>
                                    <span className="font-semibold text-gray-800">{p.nickName}</span>
                                </button>
                            )
                        })}
                    </div>
                     {personas.length === 0 && <p className="text-center mt-8 text-gray-500">{texts.noPersonasAvailable}</p>}
                </div>
            )}
            {step === 2 && (
                <div>
                    <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step2Title}</h3>
                    <p className="text-gray-500 font-serif text-center mt-1">{texts.step2Subtitle}</p>
                   
                    <ProductSelector
                        affiliateLinks={affiliateLinks}
                        onSelectProduct={setSelectedProductId}
                        selectedProductId={selectedProductId || undefined}
                        language={language}
                        autoSelectedProductId={idea?.productId || undefined}
                    />
                </div>
            )}
            {step === 3 && (
                <div>
                    <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step3Title}</h3>
                    <p className="text-gray-500 font-serif text-center mt-1">{texts.step3Subtitle}</p>
                     <div className="mt-8 space-y-6 max-w-xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                         <div className="p-4 bg-gray-50 rounded-lg border">
                            <Switch
                                id="include-emojis"
                                label={texts.includeEmojis}
                                checked={includeEmojis}
                                onChange={setIncludeEmojis}
                            />
                            <p className="text-sm text-gray-500 mt-1">{texts.includeEmojisDesc}</p>
                        </div>
                    </div>
                </div>
            )}
        </main>

        <footer className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <Button variant="tertiary" onClick={() => setStep(prev => prev - 1)} disabled={step === 1 || isGenerating}>{texts.back}</Button>
            <div>
                {step < totalSteps ? (
                    <>
                        {(step === 1 || step === 2) && <Button variant="secondary" onClick={() => setStep(prev => prev + 1)} disabled={isGenerating} className="mr-2">{texts.skip}</Button>}
                        <Button onClick={() => setStep(prev => prev + 1)} disabled={isGenerating}>{texts.next}</Button>
                    </>
                ) : (
                    <Button onClick={handleGenerate} disabled={isGenerating} className="w-48 flex justify-center">
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                <span className="ml-2">{texts.generating}</span>
                            </>
                        ) : (
                            <>{texts.generate}</>
                        )}
                    </Button>
                )}
            </div>
        </footer>
      </div>
    </div>
  );
};

export default ContentPackageWizardModal;
