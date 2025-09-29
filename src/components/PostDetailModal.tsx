import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { MediaPlanPost, AffiliateLink, SchedulingPost, PostInfo, Settings } from '../../types';
import { Button, Input, TextArea, HoverCopyWrapper, Select, Carousel } from './ui';
import TagInput from './TagInput';
import { DownloadIcon, SparklesIcon, YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, UploadIcon, LinkIcon, CheckCircleIcon, CalendarIcon, VideoCameraIcon, DocumentTextIcon, PhotographIcon, KhongMinhIcon, ChatBubbleLeftIcon } from './icons';
import KhongMinhSuggestion from './KhongMinhSuggestion';
import { renderPostContent } from '../services/utils';
import ModelLabel from './ModelLabel';
import { taskService } from '../services/taskService';

const platformIcons: Record<string, React.FC<any>> = {
    YouTube: YouTubeIcon,
    Facebook: FacebookIcon,
    Instagram: InstagramIcon,
    TikTok: TikTokIcon,
    Pinterest: PinterestIcon
};

// --- MODAL PROPS (Restored to full version) ---
interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  postInfo: PostInfo;
  settings: Settings;
  language: string;
  onUpdatePost: (postInfo: PostInfo) => void;
  onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9", postInfo?: PostInfo, carouselImageIndex?: number) => void;
  onGenerateAllCarouselImages: (postInfo: PostInfo) => Promise<void>;
  onSetImage: (dataUrl: string, key: string, postInfo?: PostInfo, carouselImageIndex?: number) => void;
  onSetVideo: (dataUrl: string, key: string, postInfo: PostInfo) => void;
  onGeneratePrompt: (postInfo: PostInfo) => void;
  onGenerateInCharacterPost: (objective: string, platform: string, keywords: string[], pillar: string, postInfo: PostInfo) => Promise<void>;
  onRefinePost: (text: string) => Promise<string>;
  isRefining: boolean;
  onRunKhongMinhForPost: () => void;
  onAcceptSuggestion: (productId: string) => void;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  isGeneratingImage: (key: string) => boolean;
  isGeneratingPrompt: boolean;
  isAnyAnalysisRunning: boolean;
  isAnalyzing: boolean;
  khongMinhSuggestions: Record<string, AffiliateLink[]>;
  affiliateLinks: AffiliateLink[];
  isGenerating: boolean; 
  onGenerateComment: (postInfo: PostInfo) => void;
  isGeneratingComment: boolean;
  onOpenScheduleModal: (post: SchedulingPost) => void;
  onPublishPost: (postInfo: PostInfo) => Promise<void>; 
  publishedUrl?: string;
  publishedAt?: string;
  mongoBrandId: string | null;
  onTaskCreated: () => void;
}

// --- LOCALE TEXTS ---
const getLocaleTexts = (language: string) => {
    const T = {
        'Việt Nam': {
            edit: "Chỉnh sửa", save: "Lưu", cancel: "Hủy",
            refine_with_ai: "Viết lại với Persona", refining: "Đang viết...",
            objective_placeholder: "Mục tiêu bài viết...",
            generate_comment: "Tạo bình luận (Khong Minh)", generating_comment: "Đang tạo...",
            auto_comment: "Bình luận được tạo tự động", no_comment: "Chưa có bình luận.",
            regenerate: "Tạo lại", generate: 'Tạo Ảnh', generating: 'Đang tạo...',
            promoted_products: "Sản phẩm quảng bá", hashtags_title: "Hashtags", cta_title: "Kêu gọi hành động",
            scheduled_for: "Lên lịch cho", published: "Đã đăng vào",
            prompt: 'Prompt Ảnh', scriptPrompt: 'Prompt Kịch bản Video',
            pasteInstructions: 'Dán hoặc tải ảnh lên',
            publishNow: "Đăng ngay", publishing: "Đang đăng...", viewPost: "Xem bài đăng",
            postIsPublished: "Bài đăng này đã được xuất bản và không thể chỉnh sửa.",
        },
        'English': {
            edit: "Edit", save: "Save", cancel: "Cancel",
            refine_with_ai: "Rewrite with Persona", refining: "Rewriting...",
            objective_placeholder: "Post objective...",
            generate_comment: "Generate Comment (Khong Minh)", generating_comment: "Generating...",
            auto_comment: "Auto-Generated Comment", no_comment: "No comment generated yet.",
            regenerate: "Regenerate", generate: 'Generate Image', generating: 'Generating...',
            promoted_products: "Promoted Products", hashtags_title: "Hashtags", cta_title: "Call to Action",
            scheduled_for: "Scheduled for", published: "Published at",
            prompt: 'Image Prompt', scriptPrompt: 'Video Script Prompt',
            pasteInstructions: 'Paste or upload image',
            publishNow: "Publish Now", publishing: "Publishing...", viewPost: "View Post",
            postIsPublished: "This post has been published and cannot be edited.",
        }
    };
    return (T as any)[language] || T['English'];
};

// --- MAIN MODAL COMPONENT ---
const PostDetailModal: React.FC<PostDetailModalProps> = (props) => {
    const { isOpen, onClose, postInfo, language, onUpdatePost, onOpenScheduleModal, onPublishPost, publishedAt, publishedUrl, isRefining, mongoBrandId, onTaskCreated, onGenerateInCharacterPost, onGenerateComment, isGeneratingComment } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [editedPost, setEditedPost] = useState<MediaPlanPost | null>(postInfo.post);
    const [postObjective, setPostObjective] = useState('');
    const [postPlatform, setPostPlatform] = useState(postInfo.post.platform);
    const [postKeywords, setPostKeywords] = useState<string[]>([]);
    const [selectedPillar, setSelectedPillar] = useState<string>('');
    
    useEffect(() => {
        if (postInfo) setEditedPost(postInfo.post);
        if (!isOpen) setIsEditing(false); 
    }, [postInfo, isOpen]);

    if (!isOpen || !postInfo || !editedPost) return null;

    const { post } = postInfo;
    const Icon = platformIcons[post.platform] || SparklesIcon;
    const texts = getLocaleTexts(language);
    const locale = language === 'Việt Nam' ? 'vi-VN' : 'en-US';
    const isPublished = !!publishedUrl;

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedPost(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSaveEdit = () => {
        if (editedPost) onUpdatePost({ ...postInfo, post: editedPost });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedPost(post);
        setIsEditing(false);
    };

    const handleGenerateInCharacter = async () => {
        if (!postObjective.trim() || !selectedPillar || !mongoBrandId) return;
        await onGenerateInCharacterPost(postObjective, postPlatform, postKeywords, selectedPillar, postInfo);
    };

    const handlePublish = async () => {
        if (isPublishing) return;
        setIsPublishing(true);
        try {
            await onPublishPost(postInfo);
            onClose(); 
        } finally {
            setIsPublishing(false);
        }
    };

    const acceptedProducts = props.affiliateLinks.filter(link => 
        (editedPost.promotedProductIds || []).some(id => id && link.id && id.trim() === link.id.trim())
    );

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-40 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Icon className="h-7 w-7 text-gray-700" />
                        <div>
                            <h2 className="text-lg font-bold font-sans text-gray-900">{editedPost.title}</h2>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{editedPost.platform} - {editedPost.contentType}</span>
                                {editedPost.modelUsed && <ModelLabel model={editedPost.modelUsed} size="small" />}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
                </header>

                {/* Content */}
                <main className="flex-grow overflow-y-auto p-4 space-y-6">
                    {/* -- Main Post Content -- */}
                    <div className="space-y-4">
                        {isEditing ? (
                            <TextArea name="content" value={renderPostContent(editedPost.content)} onChange={handleEditChange} rows={8} className="text-base w-full" placeholder={texts.postContent} />
                        ) : (
                            <p className="text-gray-800 text-base font-serif whitespace-pre-wrap">{renderPostContent(editedPost.content)}</p>
                        )}
                    </div>

                    {/* -- Media Section -- */}
                    <MediaManager {...props} editedPost={editedPost} setEditedPost={setEditedPost} />

                    {/* -- Hashtags & CTA (Display Mode) -- */}
                    {!isEditing && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            {editedPost.hashtags && editedPost.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {editedPost.hashtags.map(tag => <span key={tag} className="text-sm bg-green-50 text-green-800 px-3 py-1 rounded-full font-sans">#{tag}</span>)}
                                </div>
                            )}
                            {editedPost.cta && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="text-blue-800 font-semibold italic">{editedPost.cta}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* -- AI Tools Section -- */}
                    {!isPublished && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            {/* Refine with AI */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <h5 className="font-bold text-sm text-gray-800 mb-2">{texts.refine_with_ai}</h5>
                                <div className="space-y-3">
                                    <TextArea value={postObjective} onChange={(e) => setPostObjective(e.target.value)} placeholder={texts.objective_placeholder} rows={2} className="text-sm" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select value={postPlatform} onChange={e => setPostPlatform(e.target.value as any)} className="text-sm">
                                            <option value="Facebook">Facebook</option> <option value="Instagram">Instagram</option> <option value="TikTok">TikTok</option> <option value="YouTube">YouTube</option> <option value="Pinterest">Pinterest</option>
                                        </Select>
                                        <Select value={selectedPillar} onChange={e => setSelectedPillar(e.target.value)} className="text-sm" required>
                                            <option value="" disabled>Select a pillar</option>
                                            {(props.settings.contentPillars || []).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                        </Select>
                                    </div>
                                    <TagInput label="Keywords" tags={postKeywords} setTags={setPostKeywords} placeholder="Add keywords..." />
                                </div>
                                <Button onClick={handleGenerateInCharacter} disabled={isRefining || !postObjective.trim()} className="w-full flex items-center justify-center gap-2 mt-3" size="sm">
                                    {isRefining ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon className="h-4 w-4" />}
                                    <span>{isRefining ? texts.refining : texts.refine_with_ai}</span>
                                </Button>
                            </div>

                            {/* Khong Minh Suggestions & Comment */}
                            <KhongMinhSuggestion language={language} isAnyAnalysisRunning={props.isAnyAnalysisRunning} isAnalyzing={props.isAnalyzing} acceptedProducts={acceptedProducts} suggestedProducts={(props.khongMinhSuggestions[post.id] || []).filter(s => !(editedPost.promotedProductIds || []).includes(s.id))} affiliateLinksCount={props.affiliateLinks.length} onAccept={props.onAcceptSuggestion} onRunAnalysis={props.onRunKhongMinhForPost} />
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <h5 className="font-bold text-sm text-gray-800 mb-2">{texts.auto_comment}</h5>
                                {editedPost.autoComment ? <p className="text-sm font-serif whitespace-pre-wrap bg-white p-2 rounded border">{editedPost.autoComment}</p> : <p className="text-sm text-gray-500 font-serif italic text-center py-4">{texts.no_comment}</p>}
                                {acceptedProducts.length > 0 && (
                                    <div className="mt-3 text-right">
                                        <Button variant="secondary" onClick={() => onGenerateComment(postInfo)} disabled={isGeneratingComment} size="sm">
                                            {isGeneratingComment ? <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div> : <SparklesIcon className="h-4 w-4" />}
                                            <span className="ml-2">{editedPost.autoComment ? texts.regenerate : texts.generate_comment}</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="p-4 border-t border-gray-200 flex-shrink-0">
                    {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="tertiary" onClick={handleCancelEdit}>{texts.cancel}</Button>
                            <Button onClick={handleSaveEdit}>{texts.save}</Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-gray-500">
                                {publishedAt ? (
                                    <a href={publishedUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-green-600 hover:underline">
                                        <CheckCircleIcon className="h-4 w-4" />
                                        <span>{texts.published} {new Date(publishedAt).toLocaleDateString(locale)}</span>
                                    </a>
                                ) : editedPost.scheduledAt ? (
                                    <span className="flex items-center gap-1.5 text-blue-600">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>{texts.scheduled_for} {new Date(editedPost.scheduledAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}</span>
                                    </span>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                                {!isPublished && (
                                    <>
                                        <Button variant="secondary" onClick={() => onOpenScheduleModal({ id: post.id, title: post.title, platform: post.platform, scheduledAt: post.scheduledAt || null, status: post.status, post: post })} size="sm"><CalendarIcon className="h-4 w-4"/> </Button>
                                        <Button variant="secondary" onClick={handlePublish} disabled={isPublishing} size="sm">
                                            {isPublishing ? <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div> : <LinkIcon className="h-4 w-4"/>}
                                        </Button>
                                    </>
                                )}
                                <Button variant="primary" onClick={() => setIsEditing(true)} disabled={isPublished} size="sm">{texts.edit}</Button>
                            </div>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

// --- MEDIA MANAGER COMPONENT (Always visible) ---
const MediaManager: React.FC<PostDetailModalProps & { editedPost: MediaPlanPost, setEditedPost: (post: MediaPlanPost) => void }> = (props) => {
    const { postInfo, onGenerateImage, onSetImage, isGeneratingImage, settings, editedPost, setEditedPost, onGenerateAllCarouselImages, generatedImages, generatedVideos } = props;
    const texts = getLocaleTexts(settings.language);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageKey: string, index?: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => ev.target?.result && onSetImage(ev.target.result as string, imageKey, postInfo, index);
        reader.readAsDataURL(file);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>, imageKey: string, index?: number) => {
        const file = e.clipboardData.files[0];
        if (file && file.type.startsWith('image/')) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (ev) => ev.target?.result && onSetImage(ev.target.result as string, imageKey, postInfo, index);
            reader.readAsDataURL(file);
        }
    };

    const mediaPrompts = Array.isArray(editedPost.mediaPrompt) 
        ? editedPost.mediaPrompt.map(p => typeof p === 'object' ? renderPostContent(p) : p) 
        : (editedPost.mediaPrompt ? [typeof editedPost.mediaPrompt === 'object' ? renderPostContent(editedPost.mediaPrompt) : editedPost.mediaPrompt] : []);
    const validMediaTypes = ['Image', 'Video', 'Carousel', 'Story', 'Shorts', 'Reel'];
    if (!editedPost.contentType || !validMediaTypes.includes(editedPost.contentType)) return null;

    // --- Single Image Post Logic ---
    if (editedPost.contentType === 'Image') {
        const imageKey = editedPost.imageKeys?.[0] || editedPost.id;
        const imageUrl = generatedImages[imageKey] || editedPost.imageUrl;

        return (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Media</h4>
                {imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                        <img src={imageUrl} alt={editedPost.title} className="w-full h-auto object-contain" />
                    </div>
                )}
                <div className="space-y-2">
                    <HoverCopyWrapper textToCopy={mediaPrompts[0] || ''}>
                        <p className="text-xs text-gray-600 font-mono p-2 bg-white rounded border border-gray-200">{mediaPrompts[0] || 'No prompt available.'}</p>
                    </HoverCopyWrapper>
                    {!imageUrl && (
                        <div 
                            onPaste={(e) => handlePaste(e, imageKey, 0)}
                            onClick={() => fileInputRef.current?.click()}
                            tabIndex={0}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-green"
                        >
                            <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, imageKey, 0)} className="hidden" accept="image/*" />
                            <UploadIcon className="h-6 w-6 text-gray-400 mx-auto" />
                            <p className="mt-1 text-xs text-gray-500">{texts.pasteInstructions}</p>
                        </div>
                    )}
                    <Button variant="secondary" onClick={() => onGenerateImage(mediaPrompts[0], imageKey, '1:1', postInfo, 0)} disabled={isGeneratingImage(imageKey)} size="sm" className="w-full">
                        {isGeneratingImage(imageKey) ? <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div> : <SparklesIcon className="h-4 w-4" />}
                        <span className="ml-2">{imageUrl ? texts.regenerate : texts.generate}</span>
                    </Button>
                </div>
            </div>
        );
    }

    // --- Carousel Post Logic ---
    if (editedPost.contentType === 'Carousel') {
        const carouselImageUrls = (editedPost.imageKeys || []).map(key => generatedImages[key]).filter(Boolean);

        return (
           <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
               <h4 className="text-sm font-bold text-gray-800">Media</h4>
               {carouselImageUrls.length > 0 && (
                   <div className="mb-4 rounded-lg overflow-hidden">
                       <Carousel images={carouselImageUrls} />
                   </div>
               )}
               <div className="space-y-4">
                    {mediaPrompts.map((prompt, index) => {
                        const imageKey = (editedPost.imageKeys || [])[index] || `${editedPost.id}_${index}`;
                        const imageUrl = generatedImages[imageKey];
                        return (
                            <div key={imageKey} className="p-3 border rounded-md bg-white space-y-3">
                                <HoverCopyWrapper textToCopy={prompt}>
                                    <p className="text-xs text-gray-600 font-mono">{prompt}</p>
                                </HoverCopyWrapper>
                                
                                {imageUrl && (
                                     <div className="rounded-md overflow-hidden"><img src={imageUrl} alt={`Carousel image ${index + 1}`} className="w-full h-auto object-contain" /></div>
                                )}
                                
                                {!imageUrl && (
                                   <div 
                                       onPaste={(e) => handlePaste(e, imageKey, index)}
                                       onClick={() => fileInputRef.current?.click()}
                                       tabIndex={0}
                                       className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-green"
                                   >
                                       <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, imageKey, index)} className="hidden" accept="image/*" />
                                       <UploadIcon className="h-6 w-6 text-gray-400 mx-auto" />
                                       <p className="mt-1 text-xs text-gray-500">{texts.pasteInstructions}</p>
                                   </div>
                                )}
                                <Button variant="secondary" onClick={() => onGenerateImage(prompt, imageKey, '1:1', postInfo, index)} disabled={isGeneratingImage(imageKey)} size="sm" className="w-full">
                                   {isGeneratingImage(imageKey) ? <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div> : <SparklesIcon className="h-4 w-4" />}
                                   <span className="ml-2">{imageUrl ? texts.regenerate : texts.generate}</span>
                               </Button>
                            </div>
                        );
                    })}
                </div>
               {mediaPrompts.length > 1 && (
                   <Button onClick={() => onGenerateAllCarouselImages(postInfo)} size="sm" className="w-full mt-4">
                       <SparklesIcon className="h-4 w-4"/>
                       <span className="ml-2">Generate All Carousel Images</span>
                   </Button>
               )}
           </div>
       );
   }

    // --- Video Post Logic ---
    if (['Video', 'Shorts', 'Reel'].includes(editedPost.contentType)) {
        const videoKey = editedPost.videoKey || editedPost.id;
        const videoUrl = generatedVideos[videoKey] || editedPost.videoUrl;
        const prompt = mediaPrompts[0] || '';

        return (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Media</h4>
                {videoUrl ? (
                    <div className="mb-2 rounded-lg overflow-hidden bg-black">
                        <video src={videoUrl} controls className="w-full h-auto max-h-96" />
                    </div>
                ) : (
                    <div 
                        tabIndex={0}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
                    >
                        <VideoCameraIcon className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">No video available.</p>
                    </div>
                )}
                <div className="space-y-2">
                    <HoverCopyWrapper textToCopy={prompt}>
                        <p className="text-xs text-gray-600 font-mono p-2 bg-white rounded border border-gray-200">{prompt || 'No script prompt available.'}</p>
                    </HoverCopyWrapper>
                    {/* Placeholder for video generation button if needed in the future */}
                </div>
            </div>
        );
    }

    // --- Fallback for other types or if logic is missing ---
    return (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
            <h4 className="text-sm font-bold text-gray-800">Media</h4>
            <p className="text-sm text-gray-500">Media management for '{editedPost.contentType}' is not yet implemented.</p>
        </div>
    );
};

export default PostDetailModal;