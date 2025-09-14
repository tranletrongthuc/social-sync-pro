import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Trend, Idea, Settings, Persona, AffiliateLink } from '../../types';
import { Button, Input, TextArea, Switch, HoverCopyWrapper } from './ui';
import { PlusIcon, LightBulbIcon, TrashIcon, PencilIcon, SparklesIcon, SearchIcon, TagIcon, ChevronLeftIcon, MenuIcon } from './icons';
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

// --- IDEA LIST COMPONENT ---

const IdeaCard: React.FC<{ 
    idea: Idea;
    onCreatePlanFromIdea: (prompt: string, productId?: string) => void;
    onOpenContentPackageWizard: (idea: Idea) => void;
    language: string;
}> = ({ idea, onCreatePlanFromIdea, onOpenContentPackageWizard, language }) => {
    const T = {
        'Việt Nam': {
            createPlan: "Tạo Kế hoạch",
            createPackage: "Tạo Gói Nội dung",
            target: "Đối tượng:",
            imagePrompt: "Prompt hình ảnh:",
            cta: "CTA:"
        },
        'English': {
            createPlan: "Create Plan",
            createPackage: "Create Content Package",
            target: "Target:",
            imagePrompt: "Image Prompt:",
            cta: "CTA:"
        }
    };
    const texts = (T as any)[language] || T['English'];

    return (
        <div key={idea.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-900">{idea.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
            {idea.targetAudience && <p className="text-xs text-gray-400 mt-2">{texts.target} {idea.targetAudience}</p>}
            {idea.mediaPrompt && <HoverCopyWrapper textToCopy={idea.mediaPrompt}><p className="text-xs text-gray-400 mt-1">{texts.imagePrompt} {idea.mediaPrompt}</p></HoverCopyWrapper>}
            {idea.cta && <p className="text-xs text-gray-400 mt-1">{texts.cta} {idea.cta}</p>}
            <div className="flex justify-end gap-2 mt-3">
                <Button variant="secondary" onClick={() => onCreatePlanFromIdea(idea.description, idea.productId)} className="text-xs py-1 px-2">{texts.createPlan}</Button>
                <Button variant="primary" onClick={() => onOpenContentPackageWizard(idea)} className="text-xs py-1 px-2">{texts.createPackage}</Button>
            </div>
        </div>
    );
};

// --- MAIN DISPLAY COMPONENT ---

interface StrategyDisplayProps {
    language: string;
    trends: Trend[];
    personas: Persona[];
    affiliateLinks: AffiliateLink[];
    generatedImages: Record<string, string>;
    settings: Settings;
    onSaveTrend: (trend: Trend) => void;
    onDeleteTrend: (trendId: string) => void;
    onGenerateIdeas: (trend: Trend, useSearch: boolean) => void;
    onCreatePlanFromIdea: (prompt: string, productId?: string) => void;
    onGenerateContentPackage: (idea: Idea, personaId: string | null, selectedProductId: string | null, options: { tone: string; style: string; length: string; includeEmojis: boolean; }) => void;
    isGeneratingIdeas: boolean;
    onGenerateFacebookTrends: (industry: string) => void;
    isGeneratingTrendsFromSearch: boolean;
    productTrendToSelect?: string | null;
    // New and updated props
    selectedTrend: Trend | null;
    ideasForSelectedTrend: Idea[];
    onSelectTrend: (trend: Trend) => void;
    // New prop for trend suggestion
    onSuggestTrends: (trendType: 'industry' | 'global', timePeriod: string) => void;
    isSuggestingTrends: boolean;
    // Lazy loading props
    isDataLoaded?: boolean;
    onLoadData?: () => void;
    isLoading?: boolean;
}

const StrategyDisplay: React.FC<StrategyDisplayProps> = (props) => {
    const { 
        language, trends, personas, affiliateLinks, generatedImages, settings, 
        onSaveTrend, onDeleteTrend, onGenerateIdeas, onCreatePlanFromIdea, onGenerateContentPackage, 
        isGeneratingIdeas, onGenerateFacebookTrends, isGeneratingTrendsFromSearch, productTrendToSelect, 
        selectedTrend, ideasForSelectedTrend, onSelectTrend,
        onSuggestTrends, isSuggestingTrends, // New props
        isDataLoaded, onLoadData, isLoading 
    } = props;
    
    const [editingTrend, setEditingTrend] = useState<Partial<Trend> | null>(null);
    const [useSearchForIdeas, setUseSearchForIdeas] = useState(false);
    const isGeminiModel = (settings.textGenerationModel || '').startsWith('gemini-');
    const [wizardIdea, setWizardIdea] = useState<Idea | null>(null);
    const [industryForSearch, setIndustryForSearch] = useState('');
    // New state for trend suggestion
    const [trendType, setTrendType] = useState<'industry' | 'global'>('industry');
    const [timePeriod, setTimePeriod] = useState('Last Month');
    const initRef = useRef(false);
    
    // New state for mobile sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (onLoadData && !isDataLoaded && !initRef.current) {
            initRef.current = true;
            onLoadData();
        }
    }, [isDataLoaded, onLoadData]);

    useEffect(() => {
        if (isDataLoaded && productTrendToSelect && trends.length > 0) {
            const trendToSelect = trends.find(t => t.id === productTrendToSelect);
            if (trendToSelect) {
                onSelectTrend(trendToSelect);
            }
        } else if (isDataLoaded && !selectedTrend && trends.length > 0) {
            onSelectTrend(trends[0]);
        }
    }, [trends, productTrendToSelect, selectedTrend, onSelectTrend, isDataLoaded]);
    
    const T = {
        'Việt Nam': {
            contentStrategy: "Chiến lược Nội dung",
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
            analyzeTrends: "Tìm",
            analyzing: "Đang tìm kiếm...",
            // New trend suggestion texts
            autoSuggestTitle: "Gợi ý Xu hướng Tự động",
            autoSuggestSubtitle: "Tự động phát hiện các xu hướng phù hợp với thương hiệu hoặc xu hướng toàn cầu.",
            trendType: "Loại Xu hướng",
            industrySpecific: "Theo Ngành",
            globalHot: "Xu hướng Toàn cầu",
            timePeriod: "Thời gian",
            lastWeek: "Tuần trước",
            lastMonth: "Tháng trước",
            last3Months: "3 Tháng trước",
            suggestTrends: "Gợi ý Xu hướng",
            suggesting: "Đang gợi ý...",
            // Mobile texts
            showTrends: "Hiển thị Xu hướng",
            hideTrends: "Ẩn Xu hướng"
        },
        'English': {
            contentStrategy: "Content Strategy",
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
            analyzeTrends: "Search",
            analyzing: "Searching...",
            // New trend suggestion texts
            autoSuggestTitle: "AI-Powered Trend Suggestion",
            autoSuggestSubtitle: "Automatically discover relevant industry trends or global hot trends.",
            trendType: "Trend Type",
            industrySpecific: "Industry Specific",
            globalHot: "Global Hot Trends",
            timePeriod: "Time Period",
            lastWeek: "Last Week",
            lastMonth: "Last Month",
            last3Months: "Last 3 Months",
            suggestTrends: "Suggest Trends",
            suggesting: "Suggesting...",
            // Mobile texts
            showTrends: "Show Trends",
            hideTrends: "Hide Trends"
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

        const trendToSave: Omit<Trend, 'id' | 'brandId'> & { id?: string } = {
            id: trendData.id,
            industry: trendData.industry || '',
            topic: trendData.topic || 'New Trend',
            keywords: parsedKeywords,
            links: parsedLinks,
            notes: trendData.notes || '',
            analysis: trendData.analysis || '',
            createdAt: trendData.createdAt || new Date().toISOString(),
        };
        onSaveTrend(trendToSave as Trend);
        setEditingTrend(null);
        // Close sidebar on mobile after saving
        setIsSidebarOpen(false);
    };

    const handleDeleteTrend = (trendId: string) => {
        if(window.confirm(texts.confirmDelete)) {
            onDeleteTrend(trendId);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 bg-gray-50/50 relative">
            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
                    <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 w-full">
                    {/* Mobile menu button */}
                    <button 
                        className="md:hidden p-2 rounded-md hover:bg-gray-200"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <MenuIcon className="h-5 w-5 text-gray-700" />
                    </button>
                    <h2 className="text-2xl sm:text-3xl font-bold font-sans text-gray-900 flex items-center gap-2 sm:gap-3">
                        <LightBulbIcon className="h-6 w-6 sm:h-8 sm:w-8 text-brand-green" /> 
                        {texts.contentStrategy}
                    </h2>
                </div>
            </header>

            <div className="h-full flex flex-col md:flex-row pt-0 sm:pt-6 gap-0 sm:gap-6">
                {/* Mobile header for trends list */}
                {isSidebarOpen && (
                    <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800">{texts.trends}</h3>
                        <button 
                            className="p-2 rounded-md hover:bg-gray-100"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
                        </button>
                    </div>
                )}

                {/* Sidebar - Contains only trends list */}
                <aside className={`
                    md:static md:translate-x-0 md:opacity-100 md:visible
                    fixed inset-y-0 left-0 z-30 w-80 bg-white transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0 opacity-100 visible' : '-translate-x-full opacity-0 invisible'}
                    md:flex md:flex-col md:border md:border-gray-200 md:rounded-lg md:shadow-sm
                `}>
                    <div className="flex justify-between items-center p-4 md:p-6 md:pt-0 border-b border-gray-200 md:border-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{texts.trends}</h3>
                        <Button variant="secondary" onClick={() => { setEditingTrend({}); setIsSidebarOpen(false); }} className="flex items-center gap-1.5 !px-2 !py-1">
                            <PlusIcon className="h-4 w-4" /> {texts.addTrend}
                        </Button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
                        {/* Auto Suggest Trends Section */}
                        <div className="space-y-4">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">{texts.autoSuggestTitle}</h3>
                            <p className="text-gray-500 font-serif text-xs sm:text-sm">
                                AI-powered research using internet search to find real, data-backed trends with search volumes and source links.
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{texts.trendType}</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTrendType('industry')}
                                            className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded-md transition-colors ${
                                                trendType === 'industry' 
                                                    ? 'bg-brand-green text-white' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {texts.industrySpecific}
                                        </button>
                                        <button
                                            onClick={() => setTrendType('global')}
                                            className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded-md transition-colors ${
                                                trendType === 'global' 
                                                    ? 'bg-brand-green text-white' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {texts.globalHot}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{texts.timePeriod}</label>
                                    <select
                                        value={timePeriod}
                                        onChange={(e) => setTimePeriod(e.target.value)}
                                        className="w-full py-2 px-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green"
                                    >
                                        <option value="Last Week">{texts.lastWeek}</option>
                                        <option value="Last Month">{texts.lastMonth}</option>
                                        <option value="Last 3 Months">{texts.last3Months}</option>
                                    </select>
                                </div>
                                <Button 
                                    onClick={() => { onSuggestTrends(trendType, timePeriod); setIsSidebarOpen(false); }} 
                                    disabled={isSuggestingTrends}
                                    className="w-full flex items-center justify-center"
                                >
                                    {isSuggestingTrends ? (
                                        <>
                                            <span className="mr-2 text-xs sm:text-sm">{texts.suggesting}</span>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </>
                                    ) : (
                                        <span className="text-xs sm:text-sm">{texts.suggestTrends}</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                        
                        {/* Facebook Strategy Automation Section */}
                        <div className="space-y-4">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">{texts.trendSearchTitle}</h3>
                            <p className="text-gray-500 font-serif text-xs sm:text-sm">
                                AI-powered search to discover trending topics on Facebook with real-time data and source links.
                            </p>
                            <div className="space-y-3">
                                <Input 
                                    value={industryForSearch} 
                                    onChange={e => setIndustryForSearch(e.target.value)} 
                                    placeholder={texts.industryPlaceholder} 
                                    className="text-xs sm:text-sm"
                                />
                                <Button 
                                    onClick={() => { onGenerateFacebookTrends(industryForSearch); setIsSidebarOpen(false); }} 
                                    disabled={!industryForSearch || isGeneratingTrendsFromSearch}
                                    className="w-full flex items-center justify-center"
                                >
                                    {isGeneratingTrendsFromSearch ? (
                                        <span className="text-xs sm:text-sm">{texts.analyzing}</span>
                                    ) : (
                                        <div className="flex items-center">
                                            <SearchIcon className="h-4 w-4 mr-2" />
                                            <span className="text-xs sm:text-sm">{texts.analyzeTrends}</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                        
                        {/* Trends List */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="text-base font-semibold text-gray-700">{texts.trends}</h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {trends.length}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                                {trends.map(trend => {
                                    const isProductTrend = trend.id.startsWith('product-');
                                    return (
                                        <button 
                                            key={trend.id}
                                            onClick={() => {
                                                onSelectTrend(trend);
                                                setEditingTrend(null);
                                                setIsSidebarOpen(false); // Close sidebar on mobile after selection
                                            }}
                                            className={`w-full text-left p-3 rounded-md transition-colors text-xs sm:text-sm ${
                                                selectedTrend?.id === trend.id && !editingTrend 
                                                    ? 'bg-green-100 border border-green-200' 
                                                    : 'hover:bg-gray-100 border border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {isProductTrend && (
                                                    <TagIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900 truncate">{trend.topic}</p>
                                                        {/* Industry vs Global indicator */}
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                            trend.industry === 'Global' 
                                                                ? 'bg-blue-100 text-blue-800' 
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {trend.industry === 'Global' ? 'Global' : 'Industry'}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 text-xs truncate">
                                                        {trend.keywords ? trend.keywords.join(', ') : ''}
                                                    </p>
                                                    {/* Enhanced trend metadata display */}
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {trend.searchVolume && (
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                                                Vol: {trend.searchVolume}
                                                            </span>
                                                        )}
                                                        {trend.competitionLevel && (
                                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                                trend.competitionLevel === 'Low' ? 'bg-green-100 text-green-800' :
                                                                trend.competitionLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {trend.competitionLevel}
                                                            </span>
                                                        )}
                                                        {trend.category && (
                                                            <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                                                {trend.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div 
                        className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-h-0">
                    {/* Mobile trend selection bar */}
                    <div className="md:hidden mb-4">
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsSidebarOpen(true)}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <MenuIcon className="h-4 w-4" />
                            {texts.showTrends}
                        </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                        {editingTrend ? (
                            <TrendForm trend={editingTrend} onSave={handleSaveTrend} onCancel={() => setEditingTrend(null)} language={language} />
                        ) : selectedTrend ? (
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                                            {selectedTrend.id.startsWith('product-') ? 'Product Ideas for:' : texts.ideasFor}
                                        </h3>
                                        <p className="text-xl sm:text-2xl font-bold text-brand-green">{selectedTrend.topic}</p>
                                        
                                        {/* Industry vs Global indicator */}
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                selectedTrend.industry === 'Global' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {selectedTrend.industry === 'Global' ? 'Global Trend' : `Industry Trend (${selectedTrend.industry})`}
                                            </span>
                                        </div>
                                        
                                        {/* Enhanced trend metadata display */}
                                        <div className="mt-4 space-y-3">
                                            {selectedTrend.searchVolume && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Search Volume</p>
                                                    <p className="text-lg font-semibold text-gray-900">{selectedTrend.searchVolume.toLocaleString()} monthly searches</p>
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedTrend.competitionLevel && (
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <p className="text-sm font-medium text-gray-500">Competition</p>
                                                        <p className={`text-lg font-semibold ${
                                                            selectedTrend.competitionLevel === 'Low' ? 'text-green-600' :
                                                            selectedTrend.competitionLevel === 'Medium' ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                            {selectedTrend.competitionLevel}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {selectedTrend.category && (
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <p className="text-sm font-medium text-gray-500">Category</p>
                                                        <p className="text-lg font-semibold text-gray-900">{selectedTrend.category}</p>
                                                    </div>
                                                )}
                                                
                                                {selectedTrend.sentiment && (
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <p className="text-sm font-medium text-gray-500">Sentiment</p>
                                                        <p className={`text-lg font-semibold ${
                                                            selectedTrend.sentiment === 'Positive' ? 'text-green-600' :
                                                            selectedTrend.sentiment === 'Negative' ? 'text-red-600' :
                                                            'text-gray-600'
                                                        }`}>
                                                            {selectedTrend.sentiment}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {selectedTrend.peakTimeFrame && (
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <p className="text-sm font-medium text-gray-500">Peak Time</p>
                                                        <p className="text-lg font-semibold text-gray-900">{selectedTrend.peakTimeFrame}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {selectedTrend.predictedLifespan && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Predicted Lifespan</p>
                                                    <p className="text-lg font-semibold text-gray-900">{selectedTrend.predictedLifespan}</p>
                                                </div>
                                            )}
                                            
                                            {selectedTrend.trendingScore && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Trending Score</p>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                                        <div 
                                                            className="bg-blue-600 h-2.5 rounded-full" 
                                                            style={{ width: `${selectedTrend.trendingScore}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">{selectedTrend.trendingScore}/100</p>
                                                </div>
                                            )}
                                            
                                            {selectedTrend.relatedQueries && selectedTrend.relatedQueries.length > 0 && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Related Queries</p>
                                                    <p className="text-sm text-gray-700 mt-1">{selectedTrend.relatedQueries.join(', ')}</p>
                                                </div>
                                            )}
                                            
                                            {selectedTrend.sourceUrls && selectedTrend.sourceUrls.length > 0 && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Sources</p>
                                                    <div className="mt-2 space-y-1">
                                                        {selectedTrend.sourceUrls.slice(0, 3).map((url, idx) => (
                                                            <a 
                                                                key={idx} 
                                                                href={url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 underline text-xs block truncate"
                                                            >
                                                                {url}
                                                            </a>
                                                        ))}
                                                        {selectedTrend.sourceUrls.length > 3 && (
                                                            <span className="text-gray-500 text-xs">
                                                                + {selectedTrend.sourceUrls.length - 3} more sources
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!selectedTrend.id.startsWith('product-') && (
                                            <>
                                                <Button variant="tertiary" onClick={() => setEditingTrend(selectedTrend)}><PencilIcon className="h-4 w-4" /></Button>
                                                <Button variant="tertiary" onClick={() => handleDeleteTrend(selectedTrend.id)} className="text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4" /></Button>
                                            </>
                                        )}
                                        <Button 
                                            onClick={() => onGenerateIdeas(selectedTrend, useSearchForIdeas)} 
                                            disabled={isGeneratingIdeas || selectedTrend.id.startsWith('product-')} 
                                            className="flex items-center justify-center gap-1.5 w-40"
                                            title={selectedTrend.id.startsWith('product-') ? "Cannot generate new ideas for product-based trends" : ""}
                                        >
                                            {isGeneratingIdeas ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <SparklesIcon className="h-4 w-4" /> 
                                                    <span className="hidden sm:inline">{selectedTrend.id.startsWith('product-') ? "Product Ideas" : texts.generateIdeas}</span>
                                                    <span className="sm:hidden">{selectedTrend.id.startsWith('product-') ? "Ideas" : "Generate"}</span>
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
                                    {ideasForSelectedTrend.length > 0 ? (
                                        ideasForSelectedTrend.map(idea => (
                                            <IdeaCard 
                                                key={idea.id} 
                                                idea={idea} 
                                                onCreatePlanFromIdea={onCreatePlanFromIdea} 
                                                onOpenContentPackageWizard={setWizardIdea} 
                                                language={language} 
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">
                                            <LightBulbIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p className="font-medium">No ideas generated yet</p>
                                            <p className="text-sm mt-1">Click "Generate Ideas" to create content ideas for this trend</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400 h-full flex flex-col items-center justify-center">
                                <LightBulbIcon className="h-16 w-16 text-gray-300 mb-4" />
                                <p className="text-lg font-semibold">{texts.noTrendSelected}</p>
                                <p className="text-sm mt-2 hidden sm:block">Select a trend from the sidebar to get started</p>
                                <Button 
                                    variant="primary" 
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="mt-4 sm:hidden"
                                >
                                    {texts.showTrends}
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            
            <ContentPackageWizardModal
                isOpen={!!wizardIdea}
                onClose={() => setWizardIdea(null)}
                idea={wizardIdea}
                onGenerate={(idea, personaId, selectedProductId, options) => {
                    onGenerateContentPackage(idea, personaId, selectedProductId, options);
                    setWizardIdea(null);
                }}
                language={language}
                personas={personas}
                affiliateLinks={affiliateLinks}
                generatedImages={generatedImages}
                isGenerating={isGeneratingIdeas}
            />
        </div>
    );
};

export default StrategyDisplay;