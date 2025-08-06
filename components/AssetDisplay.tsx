
import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedAssets, BrandFoundation, CoreMediaAssets, ColorInfo, LogoConcept, ColorPalette, FontRecommendations, UnifiedProfileAssets } from '../types';
import { Section, CopyableText, Button, HoverCopyWrapper } from './ui';
import { DownloadIcon, SparklesIcon, ArchiveIcon, UploadIcon } from './icons';

interface AssetDisplayProps {
  assets: GeneratedAssets;
  onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9") => void;
  onSetImage: (dataUrl: string, key: string) => void;
  generatedImages: Record<string, string>;
  isGeneratingImage: (key: string) => boolean;
  language: string;
  onExport: () => void;
  isExporting: boolean;
}

const getNavItems = (language: string) => {
    const texts = {
        'Việt Nam': [
            { id: 'foundation', label: 'Nền tảng Thương hiệu' },
            { id: 'core', label: 'Tài sản Cốt lõi' },
            { id: 'unified', label: 'Hồ sơ Thống nhất' },
        ],
        'English': [
            { id: 'foundation', label: 'Brand Foundation' },
            { id: 'core', label: 'Core Assets' },
            { id: 'unified', label: 'Unified Profile' },
        ]
    };
    return (texts as any)[language] || texts['English'];
}


const AssetDisplay: React.FC<AssetDisplayProps> = (props) => {
    const { assets, onGenerateImage, onSetImage, generatedImages, isGeneratingImage, language, onExport, isExporting } = props;
    const [activeSection, setActiveSection] = useState('foundation');

    const NAV_ITEMS = getNavItems(language);
    const mainContentRef = useRef<HTMLDivElement>(null);


    const handleNavClick = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        const headerOffset = 120; // Height of sticky header + subnav
        if (element && mainContentRef.current) {
            const elementPosition = element.offsetTop;
            mainContentRef.current.scrollTo({
                top: elementPosition - headerOffset,
                behavior: 'smooth'
            });
        }
    };
    
    // Logic to update activeSection on scroll
    useEffect(() => {
        const mainEl = mainContentRef.current;
        if (!mainEl) return;

        const handleScroll = () => {
            const scrollPosition = mainEl.scrollTop + 150;
            const sections = NAV_ITEMS.map(item => document.getElementById(item.id));
            
            let currentSection = '';
            for (const section of sections) {
                if (section && section.offsetTop <= scrollPosition) {
                    currentSection = section.id;
                }
            }
            if (currentSection) {
                 setActiveSection(currentSection);
            }
        };

        mainEl.addEventListener('scroll', handleScroll);
        return () => mainEl.removeEventListener('scroll', handleScroll);
    }, [NAV_ITEMS]);

    const imageGeneratorTexts = {
        'Việt Nam': { generating: 'Đang tạo...', generate: 'Tạo ảnh', prompt: 'Prompt ảnh:' },
        'English': { generating: 'Generating...', generate: 'Generate Image', prompt: 'Image Prompt:' }
    }
    const currentImgGenTexts = (imageGeneratorTexts as any)[language] || imageGeneratorTexts['English'];

    const exportTexts = {
        'Việt Nam': { export: 'Xuất Bộ Thương hiệu', exporting: 'Đang xuất...' },
        'English': { export: 'Export Brand Kit', exporting: 'Exporting...' }
    };
    const currentExportTexts = (exportTexts as any)[language] || exportTexts['English'];
    
    const sharedImageProps = { onGenerateImage, onSetImage, generatedImages, isGeneratingImage, texts: currentImgGenTexts };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-112px)]">
            <aside className="hidden md:flex w-64 bg-white md:sticky top-0 p-6 border-r border-gray-200 flex-col shrink-0">
                <div className="flex-grow">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Brand Kit Navigation</h2>
                    <nav>
                        <ul>
                            {NAV_ITEMS.map(({id, label}) => (
                                 <li key={id} className="mb-1">
                                    <a
                                        href={`#${id}`}
                                        onClick={(e) => { e.preventDefault(); handleNavClick(id); }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeSection === id ? 'bg-green-50 text-brand-green' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                <div className="mt-auto pt-4">
                    <Button onClick={onExport} disabled={isExporting} variant="secondary" className="w-full flex items-center justify-center gap-2">
                        {isExporting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-t-transparent border-brand-green rounded-full animate-spin"></div>
                                {currentExportTexts.exporting}
                            </>
                        ) : (
                            <>
                                <ArchiveIcon className="h-5 w-5" />
                                {currentExportTexts.export}
                            </>
                        )}
                    </Button>
                </div>
            </aside>
            <main ref={mainContentRef} className="flex-1 overflow-y-auto" style={{ scrollPaddingTop: '80px' }}>
                <div className="md:hidden sticky top-0 bg-white/80 backdrop-blur-lg z-10 border-b border-gray-200 p-3">
                    <select 
                        id="asset-nav-mobile"
                        className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                        value={activeSection} 
                        onChange={e => handleNavClick(e.target.value)}
                    >
                        {NAV_ITEMS.map(({id, label}) => <option key={id} value={id}>{label}</option>)}
                    </select>
                </div>
                <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10">
                    <BrandFoundationSection assets={assets.brandFoundation} language={language} />
                    <CoreAssetsSection assets={assets.coreMediaAssets} language={language} {...sharedImageProps} />
                    <UnifiedProfileAssetsSection assets={assets.unifiedProfileAssets} language={language} {...sharedImageProps}/>
                </div>
            </main>
        </div>
    );
};

interface ImageGeneratorProps {
    prompt: string;
    imageKey: string;
    aspectRatio?: "1:1" | "16:9";
    onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9") => void;
    onSetImage: (dataUrl: string, key: string) => void;
    generatedImages: Record<string, string>;
    isGenerating: boolean;
    texts: { generating: string; generate: string; prompt: string };
    buttonText?: string;
};

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ prompt, imageKey, aspectRatio = "1:1", onGenerateImage, onSetImage, generatedImages, isGenerating, texts, buttonText = "" }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File | null) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                onSetImage(e.target.result as string, imageKey);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files?.[0] || null);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.clipboardData.files.length > 0) {
            handleFile(e.clipboardData.files[0]);
        }
    };

    const generatedImage = generatedImages[imageKey];

    if (isGenerating) {
        return (
            <div className="w-full bg-gray-100 flex flex-col items-center justify-center rounded-lg border border-gray-200" style={{ aspectRatio, minHeight: '150px' }}>
                <div className="w-8 h-8 border-2 border-t-transparent border-brand-green rounded-full animate-spin"></div>
                <span className="text-sm mt-2 text-gray-500">{texts.generating}</span>
            </div>
        );
    }

    if (generatedImage) {
        return (
            <div className="relative group rounded-lg overflow-hidden" onPaste={handlePaste} tabIndex={0}>
                <img src={generatedImage} alt={prompt} className="w-full object-cover" style={{ aspectRatio }}/>
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-2 items-center p-2">
                        <Button onClick={() => onGenerateImage(prompt, imageKey, aspectRatio)} disabled={isGenerating} variant="primary" className="w-full flex items-center justify-center gap-2 text-xs py-1 px-2">
                            <SparklesIcon className="h-4 w-4" /> Regenerate
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full flex items-center justify-center gap-2 text-xs py-1 px-2">
                           <UploadIcon className="h-4 w-4" /> Change Image
                        </Button>
                    </div>
                     <a href={generatedImage} download={`${imageKey}.jpg`} className="absolute bottom-2 right-2 bg-gray-800 text-white p-2 rounded-full hover:bg-black transition-colors">
                       <DownloadIcon className="h-4 w-4"/>
                    </a>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>
        )
    }

    return (
        <HoverCopyWrapper textToCopy={prompt}>
            <div className="bg-white border border-gray-200 p-4 rounded-lg mt-2" onPaste={handlePaste} tabIndex={0}>
                <h5 className="font-semibold font-sans text-gray-700 text-sm">{texts.prompt}</h5>
                <p className="text-gray-500 italic mb-3 text-sm font-serif">"{prompt}"</p>
                <div className="space-y-2">
                    <Button onClick={() => onGenerateImage(prompt, imageKey, aspectRatio)} disabled={isGenerating} className="w-full flex items-center justify-center gap-2">
                        <SparklesIcon /> {buttonText || texts.generate}
                    </Button>
                    <div 
                        className="relative w-full text-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-brand-green transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="text-xs text-gray-500 mt-1">Click to upload or paste image</p>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>
        </HoverCopyWrapper>
    );
};

interface ImageGenSectionProps {
  onGenerateImage: AssetDisplayProps['onGenerateImage'];
  onSetImage: AssetDisplayProps['onSetImage'];
  generatedImages: AssetDisplayProps['generatedImages'];
  isGeneratingImage: AssetDisplayProps['isGeneratingImage'];
  language: string;
  texts: { generating: string; generate: string; prompt: string; };
}

const BrandFoundationSection: React.FC<{ assets: BrandFoundation, language: string }> = ({ assets, language }) => {
    const texts = {
        'Việt Nam': { title: 'Nền tảng Thương hiệu', brandName: 'Tên thương hiệu', mission: 'Sứ mệnh', usp: 'USP', values: 'Giá trị', keyMessaging: 'Thông điệp Chính', targetAudience: 'Đối tượng mục tiêu', personality: 'Tính cách' },
        'English': { title: 'Brand Foundation', brandName: 'Brand Name', mission: 'Mission', usp: 'USP', values: 'Values', keyMessaging: 'Key Messaging', targetAudience: 'Target Audience', personality: 'Personality' }
    };
    const currentTexts = (texts as any)[language] || texts['English'];

    return (
    <Section title={currentTexts.title} id="foundation">
        <HoverCopyWrapper textToCopy={assets.brandName}><p><strong className="font-sans text-gray-800">{currentTexts.brandName}:</strong> {assets.brandName}</p></HoverCopyWrapper>
        <HoverCopyWrapper textToCopy={assets.mission}><p><strong className="font-sans text-gray-800">{currentTexts.mission}:</strong> {assets.mission}</p></HoverCopyWrapper>
        <HoverCopyWrapper textToCopy={assets.usp}><p><strong className="font-sans text-gray-800">{currentTexts.usp}:</strong> {assets.usp}</p></HoverCopyWrapper>
        <HoverCopyWrapper textToCopy={assets.targetAudience}><p><strong className="font-sans text-gray-800">{currentTexts.targetAudience}:</strong> {assets.targetAudience}</p></HoverCopyWrapper>
        <HoverCopyWrapper textToCopy={assets.personality}><p><strong className="font-sans text-gray-800">{currentTexts.personality}:</strong> {assets.personality}</p></HoverCopyWrapper>
        
        <HoverCopyWrapper textToCopy={(assets.values || []).join(', ')}>
            <div className="mt-4"><strong className="font-sans text-gray-800">{currentTexts.values}:</strong><div className="flex flex-wrap gap-2 mt-1">{(assets.values || []).map(v => <span key={v} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-sans">{v}</span>)}</div></div>
        </HoverCopyWrapper>

        <HoverCopyWrapper textToCopy={(assets.keyMessaging || []).join('\n')}>
            <div className="mt-4"><strong className="font-sans text-gray-800">{currentTexts.keyMessaging}:</strong><ul className="list-disc list-inside mt-1 space-y-2">{(assets.keyMessaging || []).map(m => <li key={m}>{m}</li>)}</ul></div>
        </HoverCopyWrapper>
    </Section>
)};

const CoreAssetsSection: React.FC<{ assets: CoreMediaAssets } & ImageGenSectionProps> = ({ assets, language, ...imgProps }) => {
    const texts = {
        'Việt Nam': { title: 'Tài sản Cốt lõi', logoConcepts: 'Ý tưởng Logo', colorPalette: 'Bảng màu', fontRecs: 'Gợi ý Phông chữ', headlines: 'Tiêu đề', body: 'Nội dung' },
        'English': { title: 'Core Assets', logoConcepts: 'Logo Concepts', colorPalette: 'Color Palette', fontRecs: 'Font Recommendations', headlines: 'Headlines', body: 'Body' }
    };
    const currentTexts = (texts as any)[language] || texts['English'];

    return (
    <Section title={currentTexts.title} id="core">
        <h4 className="text-xl font-bold font-sans text-gray-900 mb-2">{currentTexts.logoConcepts}</h4>
        <div className="grid md:grid-cols-2 gap-6">
            {(assets.logoConcepts || []).map((logo) => {
                const imageKey = logo.imageKey;
                return <ImageGenerator key={logo.id} prompt={logo.prompt} imageKey={imageKey} {...imgProps} isGenerating={imgProps.isGeneratingImage(imageKey)} />
            })}
        </div>
        
        <h4 className="text-xl font-bold font-sans text-gray-900 my-6">{currentTexts.colorPalette}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(assets.colorPalette || {}).map(([key, color]) => (
                <div key={key}>
                    <div className="w-full h-20 rounded-lg border border-gray-200" style={{ backgroundColor: (color as ColorInfo).hex }}></div>
                    <p className="text-center mt-2 font-semibold font-sans text-gray-800">{(color as ColorInfo).name}</p>
                    <p className="text-center font-sans text-gray-500 text-sm">{(color as ColorInfo).hex}</p>
                </div>
            ))}
        </div>

        <h4 className="text-xl font-bold font-sans text-gray-900 my-6">{currentTexts.fontRecs}</h4>
        <p><strong className="font-sans text-gray-800">{currentTexts.headlines}:</strong> {assets.fontRecommendations?.headlines?.name} ({assets.fontRecommendations?.headlines?.weight})</p>
        <p><strong className="font-sans text-gray-800">{currentTexts.body}:</strong> {assets.fontRecommendations?.body?.name} ({assets.fontRecommendations?.body?.weight})</p>
    </Section>
)};

const UnifiedProfileAssetsSection: React.FC<{ assets: UnifiedProfileAssets } & ImageGenSectionProps> = ({ assets, language, ...imgProps }) => {
    const texts = {
        'Việt Nam': { title: 'Hồ sơ Thống nhất', accountName: 'Tên tài khoản', username: 'Tên người dùng', profilePic: 'Ảnh đại diện thống nhất', cover: 'Ảnh bìa thống nhất' },
        'English': { title: 'Unified Profile Assets', accountName: 'Account Name', username: 'Username', profilePic: 'Unified Profile Picture', cover: 'Unified Cover Photo' }
    };
    const currentTexts = (texts as any)[language] || texts['English'];
    
    const profileImageKey = assets.profilePictureImageKey;
    const coverImageKey = assets.coverPhotoImageKey;

    return (
        <Section title={currentTexts.title} id="unified">
            <HoverCopyWrapper textToCopy={assets.accountName}><p><strong className="font-sans text-gray-800">{currentTexts.accountName}:</strong> {assets.accountName}</p></HoverCopyWrapper>
            <strong className="font-sans text-gray-800">{currentTexts.username}:</strong> <CopyableText text={assets.username} />
             <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                    <h4 className="text-lg font-bold font-sans text-gray-900 mb-1">{currentTexts.profilePic}</h4>
                    <ImageGenerator prompt={assets.profilePicturePrompt} imageKey={profileImageKey} {...imgProps} isGenerating={imgProps.isGeneratingImage(profileImageKey)} />
                </div>
                <div>
                    <h4 className="text-lg font-bold font-sans text-gray-900 mb-1">{currentTexts.cover}</h4>
                    <HoverCopyWrapper textToCopy={assets.coverPhoto?.designConcept}><p className="font-sans text-sm text-gray-500 mb-2">{assets.coverPhoto?.designConcept}</p></HoverCopyWrapper>
                    <ImageGenerator prompt={assets.coverPhoto?.prompt} imageKey={coverImageKey} aspectRatio="16:9" {...imgProps} isGenerating={imgProps.isGeneratingImage(coverImageKey)} />
                </div>
            </div>
        </Section>
    );
};

export default AssetDisplay;
