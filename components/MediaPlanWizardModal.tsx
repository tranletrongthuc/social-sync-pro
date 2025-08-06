import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Persona } from '../types';
import { Button, TextArea, Switch, Input, Select } from './ui';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, CheckCircleIcon, SparklesIcon, UploadIcon, UsersIcon } from './icons';

interface GenerationOptions {
    tone: string;
    style: string;
    length: string;
    includeEmojis: boolean;
}

interface MediaPlanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onGenerate: (prompt: string, useSearch: boolean, totalPosts: number, selectedPlatforms: string[], options: GenerationOptions, serializedProductImages: { name: string, type: string, data: string }[], personaId: string | null) => void;
  isGenerating: boolean;
  personas: Persona[];
  generatedImages: Record<string, string>;
  initialPrompt?: string;
}

const fileToBase64 = (file: File): Promise<{ name: string, type: string, data: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            data: reader.result as string
        });
        reader.onerror = error => reject(error);
    });
};

const ProductImageUploader: React.FC<{
    language: string;
    productImages: File[];
    onSetProductImages: (files: File[]) => void;
}> = ({ language, productImages, onSetProductImages }) => {

    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const newImagePreviews = productImages.map(file => URL.createObjectURL(file));
        setImagePreviews(newImagePreviews);

        return () => {
            newImagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [productImages]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onSetProductImages([...productImages, ...Array.from(e.target.files)]);
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...productImages];
        newImages.splice(index, 1);
        onSetProductImages(newImages);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onSetProductImages([...productImages, ...Array.from(e.dataTransfer.files)]);
            e.dataTransfer.clearData();
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData.items;
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    files.push(file);
                }
            }
        }
        if (files.length > 0) {
            onSetProductImages([...productImages, ...files]);
        }
    };

    const texts = {
        'Việt Nam': {
            uploadLabel: "Tải lên Hình ảnh Sản phẩm (Tùy chọn)",
            uploadHint: "Kéo và thả, dán, hoặc nhấp để tải lên hình ảnh sản phẩm để có các bài đăng phù hợp hơn.",
            remove: "Xóa",
            uploadedProducts: "Sản phẩm đã tải lên:",
            dropHere: "Thả tệp vào đây"
        },
        'English': {
            uploadLabel: "Upload Product Images (Optional)",
            uploadHint: "Drag & drop, paste, or click to upload product images for more relevant posts.",
            remove: "Remove",
            uploadedProducts: "Uploaded Products:",
            dropHere: "Drop files here"
        }
    };
    const currentTexts = (texts as any)[language] || texts['English'];

    return (
        <div className="mt-6">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onPaste={handlePaste}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-2 flex flex-col justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors cursor-pointer ${isDragging ? 'bg-green-50 border-brand-green' : 'hover:border-gray-400'}`}
            >
                <div className="space-y-1 text-center">
                   {isDragging ? (
                       <p className="text-lg font-semibold text-brand-green">{currentTexts.dropHere}</p>
                   ) : (
                       <>
                           <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                           <p className="text-sm text-gray-500">{currentTexts.uploadHint}</p>
                       </>
                   )}
                </div>
            </div>
            <input id="product-images-upload" name="product-images-upload" type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
            {imagePreviews.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">{currentTexts.uploadedProducts}</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 mt-2">
                        {imagePreviews.map((previewUrl, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={previewUrl} alt={`Product ${index + 1}`} className="h-full w-full object-cover rounded-md shadow-md" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     <button onClick={() => handleRemoveImage(index)} title={currentTexts.remove} className="text-white bg-red-600/80 rounded-full p-1 leading-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const getStrategyTemplates = (language: string) => {
    const T = {
        'Việt Nam': [
            { name: "Ra mắt Thương hiệu", prompt: "Tạo một kế hoạch truyền thông để ra mắt thương hiệu của tôi. Tuần 1 nên tập trung vào việc giới thiệu thương hiệu, sứ mệnh và các giá trị cốt lõi. Tuần 2 nên làm nổi bật các điểm bán hàng độc nhất (USP) và giới thiệu sản phẩm/dịch vụ cốt lõi. Tuần 3 nên xây dựng sự tương tác của cộng đồng thông qua các câu hỏi và nội dung hậu trường. Tuần 4 nên thúc đẩy việc mua hàng hoặc đăng ký đầu tiên với một lời kêu gọi hành động (CTA) mạnh mẽ.", description: "Tạo một lộ trình 4 tuần để giới thiệu thương hiệu của bạn, từ việc giới thiệu đến thúc đẩy việc mua hàng đầu tiên." },
            { name: "Quảng bá Sản phẩm", prompt: "Tạo một kế hoạch truyền thông tập trung vào việc quảng bá một sản phẩm mới. Tuần 1: nhá hàng về sản phẩm và các tính năng của nó. Tuần 2: chính thức ra mắt sản phẩm với các bài đăng chi tiết. Tuần 3: chia sẻ lời chứng thực của người dùng và các trường hợp sử dụng. Tuần 4: đưa ra một ưu đãi trong thời gian có hạn để thúc đẩy doanh số.", description: "Một kế hoạch tập trung vào việc tạo sự chú ý và thúc đẩy doanh số cho một sản phẩm mới cụ thể." },
            { name: "Tăng tương tác", prompt: "Tạo một kế hoạch truyền thông được thiết kế để tăng cường sự tương tác của cộng đồng. Bao gồm các cuộc thăm dò ý kiến, các cuộc thi, các buổi hỏi đáp, và nội dung do người dùng tạo ra. Mục tiêu là để có được nhiều bình luận, lượt chia sẻ và sự tham gia của người theo dõi.", description: "Thúc đẩy sự tham gia của cộng đồng với các cuộc thi, thăm dò ý kiến và nội dung do người dùng tạo." },
        ],
        'English': [
            { name: "Brand Launch", prompt: "Create a media plan to launch my brand. Week 1 should focus on introducing the brand, its mission, and core values. Week 2 should highlight the unique selling proposition (USP) and introduce the core products/services. Week 3 should build community engagement with questions and behind-the-scenes content. Week 4 should drive first-time purchases or sign-ups with a strong call-to-action.", description: "Create a 4-week roadmap to introduce your brand, from introduction to driving first sales." },
            { name: "Product Promotion", prompt: "Create a media plan focused on promoting a new product. Week 1: Tease the product and its features. Week 2: Announce the official product launch with detailed posts. Week 3: Share user testimonials and use-cases. Week 4: Push a limited-time offer to drive sales.", description: "A focused plan to build hype and drive sales for a specific new product." },
            { name: "Engagement Boost", prompt: "Create a media plan designed to boost community engagement. Include polls, contests, Q&A sessions, and user-generated content features. The goal is to get more comments, shares, and follower participation.", description: "Ignite community participation with contests, polls, and user-generated content." },
        ]
    };
    return (T as any)[language] || T['English'];
};

export const MediaPlanWizardModal: React.FC<MediaPlanWizardModalProps> = ({ isOpen, onClose, settings, onGenerate, isGenerating, personas, generatedImages, initialPrompt }) => {
    const [step, setStep] = useState(1);
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [useSearch, setUseSearch] = useState(false);
    const [totalPosts, setTotalPosts] = useState(settings.totalPostsPerMonth);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Pinterest']);
    
    // New state for advanced options
    const [tone, setTone] = useState('Friendly & Casual');
    const [writingStyle, setWritingStyle] = useState('Storytelling');
    const [postLength, setPostLength] = useState('Medium (e.g. for Facebook)');
    const [includeEmojis, setIncludeEmojis] = useState(true);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

    // Local state for product images, no longer from props
    const [localProductImages, setLocalProductImages] = useState<File[]>([]);

    const { language } = settings;
    const isGeminiModel = settings.textGenerationModel.startsWith('gemini-');
    const strategyTemplates = getStrategyTemplates(language);
    const totalSteps = 5;

    useEffect(() => {
        if (isOpen) {
            setStep(initialPrompt ? 2 : 1);
            setPrompt(initialPrompt || '');
            setUseSearch(false);
            setTotalPosts(settings.totalPostsPerMonth);
            setSelectedPlatforms(['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Pinterest']);
            setTone('Friendly & Casual');
            setWritingStyle('Storytelling');
            setPostLength('Medium (e.g. for Facebook)');
            setIncludeEmojis(true);
            setSelectedPersonaId(null);
            setLocalProductImages([]);
        }
    }, [isOpen, initialPrompt, settings.totalPostsPerMonth]);

    const platforms = [
        { id: 'YouTube', Icon: YouTubeIcon },
        { id: 'Facebook', Icon: FacebookIcon },
        { id: 'Instagram', Icon: InstagramIcon },
        { id: 'TikTok', Icon: TikTokIcon },
        { id: 'Pinterest', Icon: PinterestIcon },
    ];
    
    const handlePlatformToggle = (platformId: string) => {
        setSelectedPlatforms(prev => 
            prev.includes(platformId) 
                ? prev.filter(p => p !== platformId) 
                : [...prev, platformId]
        );
    };

    const T = {
        'Việt Nam': {
            title: "Tạo Kế hoạch Truyền thông Mới",
            step: "Bước",
            of: "trên",
            // Step 1
            step1Title: "Xác định Mục tiêu của bạn",
            step1Subtitle: "Bắt đầu với một mẫu chiến lược đã được chứng minh hoặc viết mục tiêu của riêng bạn.",
            startWithStrategy: "Chọn một mẫu chiến lược",
            orWriteYourOwn: "Hoặc viết/tùy chỉnh mục tiêu của bạn",
            placeholder: "Vd: Tập trung vào việc ra mắt sản phẩm mới của chúng tôi, nhấn mạnh các tính năng thân thiện với môi trường. Bao gồm một cuộc thi vào tuần thứ 3.",
            // Step 2
            step2Title: "Chọn Nền tảng của bạn",
            step2Subtitle: "Chọn nơi bạn muốn nội dung này được đăng. Bạn có thể chọn nhiều nền tảng.",
            // Step 3
            step3Title: "Chọn một KOL/KOC (Tùy chọn)",
            step3Subtitle: "Chọn một nhân vật để làm gương mặt đại diện cho chiến dịch này. Nội dung sẽ được tạo từ góc nhìn của họ.",
            noPersona: "Không có KOL/KOC",
            noPersonasAvailable: "Chưa có KOL/KOC nào được định nghĩa. Bạn có thể thêm họ trong tab 'KOL/KOC'.",
            // Step 4
            step4Title: "Thêm Hình ảnh Sản phẩm (Tùy chọn)",
            step4Subtitle: "Tải lên hình ảnh sản phẩm để AI tạo ra các bài đăng và hình ảnh phù hợp hơn với sản phẩm của bạn.",
            // Step 5
            step5Title: "Tinh chỉnh & Tạo",
            step5Subtitle: "Điều chỉnh các cài đặt cuối cùng trước khi AI của chúng tôi bắt đầu làm việc.",
            useSearchMode: "Sử dụng Chế độ Tìm kiếm (thực tế)",
            useSearchModeDesc: "Sử dụng Google Tìm kiếm để có nội dung thực tế, cập nhật.",
            geminiOnly: "Chỉ dành cho Gemini",
            totalPosts: "Tổng số bài đăng",
            toneOfVoice: "Giọng điệu",
            writingStyle: "Phong cách viết",
            postLength: "Độ dài bài đăng",
            includeEmojis: "Bao gồm Emojis",
            includeEmojisDesc: "Tự động thêm emojis vào bài đăng.",
            // Buttons
            back: "Quay lại",
            next: "Tiếp theo",
            skip: "Bỏ qua",
            generate: "Tạo Kế hoạch",
            generating: "Đang tạo...",
        },
        'English': {
            title: "Create a New Media Plan",
            step: "Step",
            of: "of",
            // Step 1
            step1Title: "Define Your Goal",
            step1Subtitle: "Start with a proven strategy template or write your own objective.",
            startWithStrategy: "Choose a strategy template",
            orWriteYourOwn: "Or write/customize your own goal",
            placeholder: "e.g., Focus on launching our new product, highlighting eco-friendly features. Include a contest in week 3.",
            // Step 2
            step2Title: "Choose Your Platforms",
            step2Subtitle: "Select where you want this content to live. You can pick multiple platforms.",
            // Step 3
            step3Title: "Select a KOL/KOC (Optional)",
            step3Subtitle: "Choose a persona to be the face of this campaign. Content will be generated from their perspective.",
            noPersona: "No KOL/KOC",
            noPersonasAvailable: "No KOLs/KOCs have been defined yet. You can add them in the 'KOL/KOC' tab.",
            // Step 4
            step4Title: "Add Product Images (Optional)",
            step4Subtitle: "Upload product images to have the AI generate more relevant posts and visuals.",
            // Step 5
            step5Title: "Refine & Generate",
            step5Subtitle: "Adjust the final settings before our AI gets to work.",
            useSearchMode: "Use Search Mode (Factual)",
            useSearchModeDesc: "Uses Google Search for factual, up-to-date content.",
            geminiOnly: "Gemini only",
            totalPosts: "Total Posts for Plan",
            toneOfVoice: "Tone of Voice",
            writingStyle: "Writing Style",
            postLength: "Post Length",
            includeEmojis: "Include Emojis",
            includeEmojisDesc: "Automatically add emojis to posts.",
            // Buttons
            back: "Back",
            next: "Next",
            skip: "Skip for now",
            generate: "Generate Plan",
            generating: "Generating...",
        }
    };
    const texts = (T as any)[language] || T['English'];

    const handleGenerate = async () => {
      const serializedImages = await Promise.all(localProductImages.map(fileToBase64));
      onGenerate(prompt, useSearch, totalPosts, selectedPlatforms, { tone, style: writingStyle, length: postLength, includeEmojis }, serializedImages, selectedPersonaId);
      onClose();
    };

    const isNextDisabled = () => {
        if (step === 1 && !prompt.trim()) return true;
        if (step === 2 && selectedPlatforms.length === 0) return true;
        return false;
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onMouseDown={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 m-4 max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
                <header className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <SparklesIcon className="h-7 w-7 text-brand-green" />
                            {texts.title}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                        <div className="bg-brand-green h-1.5 rounded-full" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                    </div>
                </header>
                
                <main className="p-8 flex-grow overflow-y-auto">
                    {step === 1 && (
                        <div>
                            <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step1Title}</h3>
                            <p className="text-gray-500 font-serif text-center mt-1">{texts.step1Subtitle}</p>
                            <div className="mt-8 space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">{texts.startWithStrategy}</label>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {strategyTemplates.map((template: any) => (
                                            <button 
                                                key={template.name} 
                                                onClick={() => setPrompt(template.prompt)}
                                                className={`p-4 rounded-lg border-2 text-left transition-colors ${prompt === template.prompt ? 'bg-green-50 border-brand-green' : 'bg-white hover:bg-gray-100 border-gray-200'}`}
                                            >
                                                <h4 className="font-bold font-sans text-gray-900">{template.name}</h4>
                                                <p className="text-sm text-gray-500 mt-1 font-serif">{template.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                     <label htmlFor="prompt" className="text-sm font-medium text-gray-700">{texts.orWriteYourOwn}</label>
                                    <TextArea
                                        id="prompt"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        rows={4}
                                        placeholder={texts.placeholder}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div>
                            <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step2Title}</h3>
                            <p className="text-gray-500 font-serif text-center mt-1">{texts.step2Subtitle}</p>
                            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {platforms.map(({ id, Icon }) => (
                                    <button 
                                        key={id}
                                        onClick={() => handlePlatformToggle(id)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedPlatforms.includes(id) ? 'bg-green-50 border-brand-green shadow-sm -translate-y-1' : 'bg-white hover:bg-gray-100 border-gray-200'}`}
                                    >
                                        <Icon className="h-10 w-10 mb-2"/>
                                        <span className="font-semibold text-gray-800">{id}</span>
                                        <div className={`mt-2 h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedPlatforms.includes(id) ? 'bg-brand-green border-brand-green-dark' : 'bg-white border-gray-300'}`}>
                                            {selectedPlatforms.includes(id) && <CheckCircleIcon className="h-5 w-5 text-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div>
                             <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step3Title}</h3>
                            <p className="text-gray-500 font-serif text-center mt-1">{texts.step3Subtitle}</p>
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
                    {step === 4 && (
                        <div>
                             <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step4Title}</h3>
                            <p className="text-gray-500 font-serif text-center mt-1">{texts.step4Subtitle}</p>
                            <ProductImageUploader
                                language={language}
                                productImages={localProductImages}
                                onSetProductImages={setLocalProductImages}
                            />
                        </div>
                    )}
                    {step === 5 && (
                        <div>
                            <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step5Title}</h3>
                            <p className="text-gray-500 font-serif text-center mt-1">{texts.step5Subtitle}</p>
                             <div className="mt-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-lg border">
                                        <Switch
                                            id="use-search"
                                            label={texts.useSearchMode}
                                            checked={useSearch}
                                            onChange={setUseSearch}
                                            disabled={!isGeminiModel}
                                        />
                                        <p className="text-sm text-gray-500 mt-1">{texts.useSearchModeDesc} <span className="font-bold text-gray-600">{texts.geminiOnly}</span></p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg border">
                                         <label htmlFor="totalPosts" className="font-medium text-gray-700">{texts.totalPosts}</label>
                                         <Input id="totalPosts" type="number" min="4" max="40" value={totalPosts} onChange={(e) => setTotalPosts(parseInt(e.target.value))} className="mt-1" />
                                    </div>
                                </div>
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
                                {(step === 3 || step === 4) && <Button variant="secondary" onClick={() => setStep(prev => prev + 1)} disabled={isGenerating} className="mr-2">{texts.skip}</Button>}
                                <Button onClick={() => setStep(prev => prev + 1)} disabled={isNextDisabled() || isGenerating}>{texts.next}</Button>
                            </>
                        ) : (
                            <Button onClick={handleGenerate} disabled={isGenerating} className="w-40 flex justify-center">
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