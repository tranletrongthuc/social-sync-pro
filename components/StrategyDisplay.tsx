import React, { useState, useMemo, useEffect } from 'react';
import type { Trend, Idea, Settings, Persona } from '../types';
import { Button, Input, TextArea, Switch } from './ui';
import { PlusIcon, LightBulbIcon, TrashIcon, PencilIcon, SparklesIcon, SearchIcon, TagIcon } from './icons';
import ContentPackageWizardModal from './ContentPackageWizardModal';

// --- SUB-COMPONENTS ---

const TrendForm: React.FC<{
    trend: Partial<Trend>;
    onSave: (trendData: Omit<Partial<Trend>, 'keywords' | 'links'> & { keywords?: string; links?: string }) => void;
    onCancel: () => void;
    language: string;
}> = ({ trend, onSave, onCancel, language }) => {
    const [formData, setFormData] = useState({
        topic: trend.topic || '',
        industry: trend.industry || '',
        keywords: (trend.keywords || []).join(', '),
        links: (trend.links || []).map(l => `${l.title}: ${l.url}`).join('\n'),
        notes: trend.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave({ ...trend, ...formData });
    };

    const T = {
        'Việt Nam': { topic: 'Chủ đề', industry: 'Ngành', keywords: 'Từ khóa (phân tách bằng dấu phẩy)', links: 'Liên kết (Mỗi dòng một link, định dạng: Tiêu đề: URL)', notes: 'Ghi chú', save: 'Lưu', cancel: 'Hủy' },
        'English': { topic: 'Topic', industry: 'Industry', keywords: 'Keywords (comma-separated)', links: 'Links (One per line, format: Title: URL)', notes: 'Notes', save: 'Save', cancel: 'Cancel' }
    };
    const texts = (T as any)[language] || T['English'];

    return (
        <div className="space-y-4">
            <Input name="topic" placeholder={texts.topic} value={formData.topic} onChange={handleChange} />
            <Input name="industry" placeholder={texts.industry} value={formData.industry} onChange={handleChange} />
            <TextArea name="keywords" placeholder={texts.keywords} value={formData.keywords} onChange={handleChange} rows={2} />
            <TextArea name="links" placeholder={texts.links} value={formData.links} onChange={handleChange} rows={3} />
            <TextArea name="notes" placeholder={texts.notes} value={formData.notes} onChange={handleChange} rows={3} />
            <div className="flex justify-end gap-2">
                <Button variant="tertiary" onClick={onCancel}>{texts.cancel}</Button>
                <Button onClick={handleSave}>{texts.save}</Button>
            </div>
        </div>
    );
};

// --- MAIN DISPLAY COMPONENT ---

interface StrategyDisplayProps {
    language: string;
    trends: Trend[];
    ideas: Idea[];
    personas: Persona[];
    generatedImages: Record<string, string>;
    settings: Settings;
    onSaveTrend: (trend: Trend) => void;
    onDeleteTrend: (trendId: string) => void;
    onGenerateIdeas: (trend: Trend, useSearch: boolean) => void;
    onCreatePlanFromIdea: (prompt: string, productId?: string) => void;
    onGenerateContentPackage: (idea: Idea, pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest', personaId: string | null, options: { tone: string; style: string; length: string; }) => void;
    isGeneratingIdeas: boolean;
    onGenerateFacebookTrends: (industry: string) => void;
    isGeneratingTrendsFromSearch: boolean;
    productTrendToSelect?: string | null; // New prop to specify which product trend to select
}

const StrategyDisplay: React.FC<StrategyDisplayProps> = (props) => {
    const { language, trends, ideas, personas, generatedImages, settings, onSaveTrend, onDeleteTrend, onGenerateIdeas, onCreatePlanFromIdea, onGenerateContentPackage, isGeneratingIdeas, onGenerateFacebookTrends, isGeneratingTrendsFromSearch, productTrendToSelect } = props;
    
    const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
    const [editingTrend, setEditingTrend] = useState<Partial<Trend> | null>(null);
    const [useSearchForIdeas, setUseSearchForIdeas] = useState(false);
    const isGeminiModel = settings.textGenerationModel.startsWith('gemini-');
    const [wizardIdea, setWizardIdea] = useState<Idea | null>(null);

    const [industryForSearch, setIndustryForSearch] = useState('');

    useEffect(() => {
        // If a product trend to select was specified, select it
        if (productTrendToSelect && trends.length > 0) {
            const trendToSelect = trends.find(t => t.id === productTrendToSelect);
            if (trendToSelect) {
                setSelectedTrend(trendToSelect);
            }
        } else if (!selectedTrend && trends.length > 0) {
            // Default behavior: select the first trend if none is selected
            setSelectedTrend(trends[0]);
        }
    }, [trends, selectedTrend, productTrendToSelect]);
    
    const T = {
        'Việt Nam': {
            trends: "Xu hướng",
            addTrend: "Thêm Xu hướng",
            ideasFor: "Ý tưởng cho:",
            noTrendSelected: "Chọn một xu hướng để xem ý tưởng.",
            generateIdeas: "Tạo Ý tưởng",
            generating: "Đang tạo...",
            useSearch: "Dùng Google Search",
            useSearchDesc: "Sử dụng Google Tìm kiếm để có nội dung thực tế, cập nhật.",
            geminiOnly: "Chỉ dành cho Gemini",
            createPlan: "Tạo Kế hoạch",
            createPackage: "Tạo Gói Nội dung",
            confirmDelete: "Bạn có chắc muốn xóa xu hướng này và tất cả các ý tưởng liên quan không?",
            trendSearchTitle: "Tự động hóa Chiến lược Facebook",
            trendSearchSubtitle: "Tự động tìm kiếm và lưu lại các Xu hướng từ Facebook bằng công cụ tìm kiếm của Google.",
            industryPlaceholder: "Nhập ngành của bạn (ví dụ: Thời trang, Công nghệ, Ẩm thực)",
            analyzeTrends: "Tìm kiếm Xu hướng",
            analyzing: "Đang tìm kiếm...",
        },
        'English': {
            trends: "Trends",
            addTrend: "Add Trend",
            ideasFor: "Ideas for:",
            noTrendSelected: "Select a trend to see ideas.",
            generateIdeas: "Generate Ideas",
            generating: "Generating...",
            useSearch: "Use Google Search",
            useSearchDesc: "Uses Google Search for factual, up-to-date content.",
            geminiOnly: "Gemini only",
            createPlan: "Create Plan",
            createPackage: "Generate Content Package",
            confirmDelete: "Are you sure you want to delete this trend and all its associated ideas?",
            trendSearchTitle: "Facebook Strategy Automation",
            trendSearchSubtitle: "Automatically search and save Trends from Facebook using Google Search engine.",
            industryPlaceholder: "Enter your industry (e.g., Fashion, Tech, Food)",
            analyzeTrends: "Search Trends",
            analyzing: "Searching...",
        }
    };
    const texts = (T as any)[language] || T['English'];

    const handleSaveTrend = (trendData: Omit<Partial<Trend>, 'keywords' | 'links'> & { keywords?: string; links?: string }) => {
        const parsedKeywords = (trendData.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
        const parsedLinks = (trendData.links || '').split('\n').map(line => {
            const parts = line.split(':');
            if (parts.length < 2) return null;
            const title = parts[0].trim();
            const url = parts.slice(1).join(':').trim();
            return (title && url) ? { title, url } : null;
        }).filter((l): l is { title: string, url: string } => l !== null);

        const trendToSave: Trend = {
            id: trendData.id || crypto.randomUUID(),
            brandId: '', // App.tsx will fill this
            industry: trendData.industry || '',
            topic: trendData.topic || 'New Trend',
            keywords: parsedKeywords,
            links: parsedLinks,
            notes: trendData.notes || '',
            analysis: trendData.analysis || '',
            createdAt: trendData.createdAt || new Date().toISOString(),
        };
        onSaveTrend(trendToSave);
        setEditingTrend(null);
        setSelectedTrend(trendToSave);
    };

    const handleDeleteTrend = (trendId: string) => {
        if(window.confirm(texts.confirmDelete)) {
            onDeleteTrend(trendId);
            if (selectedTrend?.id === trendId) {
                setSelectedTrend(trends.length > 1 ? trends.find(t => t.id !== trendId) || null : null);
            }
        }
    };

    const ideasForSelectedTrend = useMemo(() => {
        return selectedTrend ? ideas.filter(i => i.trendId === selectedTrend.id) : [];
    }, [ideas, selectedTrend]);

    return (
        <div className="h-full flex flex-col p-6 lg:p-10 bg-gray-50/50">
             <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900 flex items-center gap-3"><LightBulbIcon className="h-8 w-8 text-brand-green"/> Content Strategy</h2>
                </div>
            </header>

            <div className="h-full flex flex-col xl:flex-row pt-6">
                <aside className="w-full xl:w-1/3 border-b xl:border-b-0 xl:border-r border-gray-200 bg-white p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{texts.trends}</h3>
                        <Button variant="secondary" onClick={() => setEditingTrend({})} className="flex items-center gap-1.5 !px-2 !py-1">
                            <PlusIcon className="h-4 w-4"/> {texts.addTrend}
                        </Button>
                    </div>
                    <div className="mt-4 mb-6">
                        <h3 className="text-lg font-bold text-gray-800">{texts.trendSearchTitle}</h3>
                        <p className="text-gray-500 font-serif mt-1 text-sm">{texts.trendSearchSubtitle}</p>
                        <div className="mt-3 flex gap-2">
                            <Input value={industryForSearch} onChange={e => setIndustryForSearch(e.target.value)} placeholder={texts.industryPlaceholder} />
                            <Button onClick={() => onGenerateFacebookTrends(industryForSearch)} disabled={!industryForSearch || isGeneratingTrendsFromSearch} className="w-48">
                               {isGeneratingTrendsFromSearch ? texts.analyzing : <><SearchIcon className="h-4 w-4 mr-2" />{texts.analyzeTrends}</>}
                            </Button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 -mr-2 pr-2">
                        {trends.map(trend => {
                            const isProductTrend = trend.id.startsWith('product-');
                            return (
                                <button 
                                    key={trend.id} 
                                    onClick={() => { setSelectedTrend(trend); setEditingTrend(null); }} 
                                    className={`w-full text-left p-3 rounded-md transition-colors ${selectedTrend?.id === trend.id && !editingTrend ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                                >
                                    <div className="flex items-start gap-2">
                                        {isProductTrend && (
                                            <TagIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{trend.topic}</p>
                                            <p className="text-xs text-gray-500 truncate">{trend.keywords ? trend.keywords.join(', ') : ''}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                    {editingTrend ? (
                        <TrendForm trend={editingTrend} onSave={handleSaveTrend} onCancel={() => setEditingTrend(null)} language={language} />
                    ) : selectedTrend ? (
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">
                                        {selectedTrend.id.startsWith('product-') ? 'Product Ideas for:' : texts.ideasFor}
                                    </h3>
                                    <p className="text-2xl font-bold text-brand-green">{selectedTrend.topic}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!selectedTrend.id.startsWith('product-') && (
                                        <>
                                            <Button variant="tertiary" onClick={() => setEditingTrend(selectedTrend)}><PencilIcon className="h-4 w-4"/></Button>
                                            <Button variant="tertiary" onClick={() => handleDeleteTrend(selectedTrend.id)} className="text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4"/></Button>
                                        </>
                                    )}
                                    <Button 
                                        onClick={() => onGenerateIdeas(selectedTrend, useSearchForIdeas)} 
                                        disabled={isGeneratingIdeas || selectedTrend.id.startsWith('product-')} 
                                        className="flex items-center justify-center gap-1.5 w-40"
                                        title={selectedTrend.id.startsWith('product-') ? "Cannot generate new ideas for product-based trends" : ""}
                                    >
                                        {isGeneratingIdeas ? '...' : (
                                            <>
                                                <SparklesIcon className="h-4 w-4"/> 
                                                {selectedTrend.id.startsWith('product-') ? "Product Ideas" : texts.generateIdeas}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                            {!selectedTrend.id.startsWith('product-') && selectedTrend.analysis && (
                                <p className="text-sm text-gray-600 italic border-l-4 border-gray-200 pl-4 my-4">{selectedTrend.analysis}</p>
                            )}
                            {!selectedTrend.id.startsWith('product-') && (
                                <div className="p-4 bg-gray-100 rounded-lg border mb-4">
                                    <Switch id="idea-hub-use-search" label={texts.useSearch} checked={useSearchForIdeas} onChange={setUseSearchForIdeas} disabled={!isGeminiModel}/>
                                    <p className="text-sm text-gray-500 mt-1">{texts.useSearchDesc} <span className="font-bold text-gray-600">{texts.geminiOnly}</span></p>
                                </div>
                            )}
                            <div className="space-y-4">
                                {ideasForSelectedTrend.map(idea => (
                                    <div key={idea.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-bold text-gray-900">{idea.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
                                        {idea.targetAudience && <p className="text-xs text-gray-400 mt-2">Target: {idea.targetAudience}</p>}
                                        {idea.imagePrompt && <p className="text-xs text-gray-400 mt-1">Image Prompt: {idea.imagePrompt}</p>}
                                        {idea.cta && <p className="text-xs text-gray-400 mt-1">CTA: {idea.cta}</p>}
                                        <div className="flex justify-end gap-2 mt-3">
                                            <Button variant="secondary" onClick={() => onCreatePlanFromIdea(idea.description, idea.productId)} className="text-xs py-1 px-2">{texts.createPlan}</Button>
                                            <Button variant="primary" onClick={() => setWizardIdea(idea)} className="text-xs py-1 px-2">{texts.createPackage}</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-400 h-full flex flex-col items-center justify-center">
                            <LightBulbIcon className="h-16 w-16 text-gray-300 mb-4" />
                            <p className="text-lg font-semibold">{texts.noTrendSelected}</p>
                        </div>
                    )}
                </main>
            </div>
            
            <ContentPackageWizardModal
                isOpen={!!wizardIdea}
                onClose={() => setWizardIdea(null)}
                idea={wizardIdea}
                onGenerate={(idea, platform, personaId, options) => {
                    onGenerateContentPackage(idea, platform, personaId, options);
                    setWizardIdea(null);
                }}
                language={language}
                personas={personas}
                generatedImages={generatedImages}
            />
        </div>
    );
};

export default StrategyDisplay;