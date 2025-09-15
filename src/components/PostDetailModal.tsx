/// <reference types="react" />
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { MediaPlanPost, AffiliateLink, SchedulingPost, PostInfo, Settings } from '../../types';
import { Button, Input, TextArea, HoverCopyWrapper, Select, Carousel } from './ui';
import TagInput from './TagInput';
import { DownloadIcon, SparklesIcon, YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, UploadIcon, LinkIcon, CheckCircleIcon, CalendarIcon, VideoCameraIcon, DocumentTextIcon } from './icons';
import KhongMinhSuggestion from './KhongMinhSuggestion';

const platformIcons: Record<string, React.FC<any>> = {
    YouTube: YouTubeIcon,
    Facebook: FacebookIcon,
    Instagram: InstagramIcon,
    TikTok: TikTokIcon,
    Pinterest: PinterestIcon
};

const renderPostContent = (content: string | string[] | any): string => {
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content.join('\n\n');
    }
    if (typeof content === 'object' && content !== null) {
        return Object.entries(content)
            .map(([key, value]) => `**${key.charAt(0).toUpperCase() + key.slice(1)}:**\n${value}`)
            .join('\n\n');
    }
    return '';
};



// --- NEW DYNAMIC MEDIA HANDLERS ---

const TextPostHandler: React.FC<PostDetailModalProps> = ({ settings }) => {
    const texts = getLocaleTexts(settings.language);
    return (
        <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <DocumentTextIcon className="h-10 w-10 text-gray-400" />
            <h5 className="mt-3 font-semibold font-sans text-gray-700">{texts.textPostTitle}</h5>
            <p className="mt-1 text-sm text-gray-500 font-serif">{texts.textPostDescription}</p>
        </div>
    );
};

const ImagePostHandler: React.FC<PostDetailModalProps> = (props) => {
    const { postInfo, onGenerateImage, generatedImages, isGeneratingImage, settings, onSetImage } = props;
    const texts = getLocaleTexts(settings.language);
    const imageKey = postInfo.post.imageKey || postInfo.post.id;
    const generatedImage = generatedImages[imageKey];

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (e.target?.result) {
                            onSetImage(e.target.result as string, imageKey, postInfo);
                        }
                    };
                    reader.readAsDataURL(file);
                }
                event.preventDefault();
                break;
            }
        }
    };

    return (
        <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col">
            {generatedImage ? (
                <img src={generatedImage} alt="Generated visual" className="w-full object-cover rounded-md mb-4" />
            ) : (
                <div 
                    onPaste={handlePaste}
                    className="flex-grow border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center p-4 mb-4"
                >
                    <UploadIcon className="h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">{texts.pasteInstructions || 'Paste image here'}</p>
                </div>
            )}
            
            <div className="flex-grow overflow-y-auto pr-2">
                <h5 className="font-semibold font-sans text-gray-700 text-sm mb-2">{texts.prompt}</h5>
                <div className="text-gray-500 text-xs font-mono bg-gray-50 p-2 rounded-md whitespace-pre-wrap break-words">
                    {Array.isArray(postInfo.post.mediaPrompt) ? (
                        <div className="space-y-2">
                            {postInfo.post.mediaPrompt.map((prompt, index) => (
                                <HoverCopyWrapper key={index} textToCopy={prompt}>
                                    <div className="p-1 rounded hover:bg-gray-200 cursor-pointer">
                                        {prompt}
                                    </div>
                                </HoverCopyWrapper>
                            ))}
                        </div>
                    ) : (
                        <HoverCopyWrapper textToCopy={postInfo.post.mediaPrompt as string}>
                            <div>{postInfo.post.mediaPrompt as string}</div>
                        </HoverCopyWrapper>
                    )}
                </div>
            </div>

            <Button 
                onClick={() => onGenerateImage(Array.isArray(postInfo.post.mediaPrompt) ? postInfo.post.mediaPrompt.join('\n\n') : postInfo.post.mediaPrompt || '', imageKey, undefined, postInfo)}
                disabled={isGeneratingImage(imageKey)}
                className="w-full flex items-center justify-center gap-2 mt-4"
            >
                {isGeneratingImage(imageKey) ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon />}
                {generatedImage ? texts.regenerate : texts.generate}
            </Button>
        </div>
    );
};

const VideoPostHandler: React.FC<PostDetailModalProps> = (props) => {
    const { postInfo, settings } = props;
    const texts = getLocaleTexts(settings.language);

    return (
        <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col">
            <h5 className="font-semibold font-sans text-gray-700 text-sm mb-2">{texts.scriptPrompt}</h5>
            <div className="text-gray-500 text-xs font-mono bg-gray-50 p-2 rounded-md whitespace-pre-wrap break-words mb-4 flex-grow">
                {Array.isArray(postInfo.post.mediaPrompt) ? (
                    <div className="space-y-2">
                        {postInfo.post.mediaPrompt.map((prompt, index) => (
                            <HoverCopyWrapper key={index} textToCopy={prompt}>
                                <div className="p-1 rounded hover:bg-gray-200 cursor-pointer">
                                    {prompt}
                                </div>
                            </HoverCopyWrapper>
                        ))}
                    </div>
                ) : (
                    <HoverCopyWrapper textToCopy={postInfo.post.mediaPrompt as string}>
                        <div>{postInfo.post.mediaPrompt as string}</div>
                    </HoverCopyWrapper>
                )}
            </div>
            <Button disabled className="w-full flex items-center justify-center gap-2 mt-auto cursor-not-allowed">
                <VideoCameraIcon /> {texts.generateVideo}
            </Button>
        </div>
    );
};

const CarouselPostHandler: React.FC<PostDetailModalProps> = (props) => {
    const { postInfo, onGenerateImage, generatedImages, isGeneratingImage, settings, onSetImage, onGenerateAllCarouselImages } = props;
    const texts = getLocaleTexts(settings.language);
    const mediaPrompts = Array.isArray(postInfo.post.mediaPrompt) ? postInfo.post.mediaPrompt : [];
    const imageKeys = postInfo.post.imageKeys || [];
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [newlyGeneratedImages, setNewlyGeneratedImages] = useState<Record<string, string>>({});

    useEffect(() => {
        setNewlyGeneratedImages(generatedImages);
    }, [generatedImages]);

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>, imageKey: string, index: number) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (e.target?.result) {
                            onSetImage(e.target.result as string, imageKey, postInfo, index);
                        }
                    };
                    reader.readAsDataURL(file);
                }
                event.preventDefault();
                break;
            }
        }
    };

    const handleGenerateAll = async () => {
        setIsGeneratingAll(true);
        try {
            await onGenerateAllCarouselImages(postInfo);
        } catch (error) {
            console.error("Error during handleGenerateAll in modal:", error);
        } finally {
            setIsGeneratingAll(false);
        }
    };

    const carouselImageUrls = useMemo(() => {
        const urls = [...(postInfo.post.imageUrlsArray || [])];
        mediaPrompts.forEach((_, index) => {
            const imageKey = imageKeys[index] || `media_plan_post_${postInfo.post.id}_${index}`;
            if (imageKey && newlyGeneratedImages[imageKey]) {
                urls[index] = newlyGeneratedImages[imageKey];
            }
        });
        return urls.filter(url => url);
    }, [postInfo.post.imageUrlsArray, imageKeys, newlyGeneratedImages, mediaPrompts]);

    return (
        <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col">
            <h5 className="font-semibold font-sans text-gray-700 text-sm mb-2">{texts.carouselPrompts}</h5>
            
            <div className="mb-4">
                <Carousel images={carouselImageUrls} className="rounded-lg" />
            </div>
            
            <div className="space-y-3 mb-4 overflow-y-auto pr-2 flex-grow">
                {mediaPrompts.map((prompt, index) => {
                    const imageKey = imageKeys[index] || `media_plan_post_${postInfo.post.id}_${index}`;
                    const generatedImage = newlyGeneratedImages[imageKey] || (postInfo.post.imageUrlsArray?.[index]);
                    return (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div 
                                onPaste={(e) => handlePaste(e, imageKey, index)}
                                className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center p-3 hover:bg-gray-100 cursor-pointer transition-colors mb-2"
                            >
                                <UploadIcon className="h-5 w-5 text-gray-400" />
                                <p className="ml-2 text-sm text-gray-500">{texts.pasteInstructions || 'Dán ảnh vào đây'}</p>
                            </div>

                            <div className="text-gray-700 text-sm font-mono bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap break-words">
                                <span className="font-semibold">{index + 1}: </span>
                                {prompt}
                            </div>
                            
                            <Button 
                                variant="secondary"
                                onClick={() => onGenerateImage(prompt, imageKey, undefined, postInfo, index)}
                                disabled={isGeneratingImage(imageKey) || isGeneratingAll}
                                className="w-full text-xs mt-2 py-1.5 h-auto"
                            >
                                {isGeneratingImage(imageKey) ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-t-transparent border-gray-500 rounded-full animate-spin mr-1"></div>
                                        <span>{texts.generating}</span>
                                    </>
                                ) : (
                                    generatedImage ? texts.regenerate : texts.generate
                                )}
                            </Button>
                        </div>
                    );
                })}
            </div>
            
            <Button 
                onClick={handleGenerateAll} 
                disabled={isGeneratingAll}
                className="w-full flex items-center justify-center gap-2 mt-auto"
            >
                {isGeneratingAll ? (
                    <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        <span>{texts.generating}</span>
                    </>
                ) : (
                    <>
                        <SparklesIcon /> {texts.generateAll}
                    </>
                )}
            </Button>
        </div>
    );
};

// --- END NEW DYNAMIC MEDIA HANDLERS ---

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  postInfo: PostInfo;
  settings: Settings;
  language: string;
  weekTheme?: string;
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
}

const getLocaleTexts = (language: string) => {
    const T = {
        'Việt Nam': {
            edit: "Chỉnh sửa",
            schedule: "Lên lịch",
            draft: "Bản nháp",
            save: "Lưu",
            cancel: "Hủy",
            refine_with_ai: "Viết lại với Persona",
            refining: "Đang viết...",
            objective_placeholder: "Mục tiêu bài viết (vd: thông báo sản phẩm mới)",
            generate_comment: "Tạo bình luận (NgoSiLien)",
            generating_comment: "Đang tạo (NgoSiLien)...",
            auto_comment: "Bình luận được tạo tự động",
            no_comment: "Chưa có bình luận nào được tạo.",
            regenerate: "Tạo lại",
            promoted_products: "Sản phẩm quảng bá",
            hashtags_title: "Hashtags",
            cta_title: "Kêu gọi hành động",
            sources: "Nguồn",
            scheduled_for: "Lên lịch cho",
            generating: 'Đang tạo...', 
            generate: 'Tạo Ảnh',
            prompt: 'Prompt Ảnh',
            scriptPrompt: 'Prompt Kịch bản Video',
            generateVideo: 'Tạo Video (sắp có)',
            carouselPrompts: 'Carousel Prompts',
            generateAll: 'Tạo tất cả ảnh',
            textPostTitle: 'Bài đăng dạng văn bản',
            textPostDescription: 'Bài đăng này không yêu cầu phương tiện trực quan.',
            pasteInstructions: 'Dán ảnh vào đây',
            youtube_description: "Mô tả YouTube",
            youtube_script: "Kịch bản YouTube",
            script: "Kịch bản",
            publishNow: "Đăng ngay",
            publishing: "Đang đăng...",
            published: "Đã đăng vào",
            viewPost: "Xem bài đăng",
            postIsPublished: "Bài đăng này đã được xuất bản và không thể chỉnh sửa.",
        },
        'English': {
            edit: "Edit",
            schedule: "Schedule",
            draft: "Draft",
            save: "Save",
            cancel: "Cancel",
            refine_with_ai: "Rewrite with Persona",
            refining: "Rewriting...",
            objective_placeholder: "Post objective (e.g., announce a new product)",
            generate_comment: "Generate Comment (NgoSiLien)",
            generating_comment: "Generating (NgoSiLien)...",
            auto_comment: "Auto-Generated Comment",
            no_comment: "No comment generated yet.",
            regenerate: "Regenerate",
            promoted_products: "Promoted Products",
            hashtags_title: "Hashtags",
            cta_title: "Call to Action",
            sources: "Sources",
            scheduled_for: "Scheduled for",
            generating: 'Generating...', 
            generate: 'Generate Image',
            prompt: 'Image Prompt',
            scriptPrompt: 'Video Script Prompt',
            generateVideo: 'Generate Video (soon)',
            carouselPrompts: 'Carousel Prompts',
            generateAll: 'Generate All Images',
            textPostTitle: 'Text-Only Post',
            textPostDescription: 'This post does not require visual media.',
            pasteInstructions: 'Paste image here',
            youtube_description: "YouTube Description",
            youtube_script: "YouTube Script",
            script: "Script",
            publishNow: "Publish Now",
            publishing: "Publishing...",
            published: "Published at",
            viewPost: "View Post",
            postIsPublished: "This post has been published and cannot be edited.",
        }
    };
    return (T as any)[language] || T['English'];
};

const PostDetailModal: React.FC<PostDetailModalProps> = (props) => {
    const { isOpen, onClose, postInfo, language, onUpdatePost, onGenerateComment, isGeneratingComment, onOpenScheduleModal, onPublishPost, publishedAt, publishedUrl, onGenerateInCharacterPost, isRefining } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [postObjective, setPostObjective] = useState('');
    const [postPlatform, setPostPlatform] = useState(postInfo.post.platform);
    const [postKeywords, setPostKeywords] = useState<string[]>([]);
    const [selectedPillar, setSelectedPillar] = useState<string>('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [editedPost, setEditedPost] = useState<MediaPlanPost | null>(postInfo.post);
    
    useEffect(() => {
        if (postInfo) {
            setEditedPost(postInfo.post);
            setPostObjective('');
            setPostPlatform(postInfo.post.platform);
            setPostKeywords([]);
            setSelectedPillar(postInfo.post.pillar || '');
        }
        if (isOpen) {
            setIsEditing(false); 
        }
    }, [postInfo, isOpen]);

    // Update editedPost when generatedImages change for carousel posts
    useEffect(() => {
        if (postInfo && postInfo.post.contentType === 'Carousel') {
            setEditedPost(postInfo.post);
        }
    }, [props.generatedImages, postInfo]);

    if (!isOpen || !postInfo || !editedPost) return null;
    const { post } = postInfo;
    const Icon = platformIcons[post.platform] || SparklesIcon;
    const texts = getLocaleTexts(language);
    const locale = language === 'Việt Nam' ? 'vi-VN' : 'en-US';

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedPost(prev => {
            if (!prev) return null;
            if (name === 'hashtags') {
                return { ...prev, hashtags: value.split(',').map(h => h.trim()) };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSaveEdit = () => {
        if (editedPost) {
            onUpdatePost({ ...postInfo, post: editedPost });
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedPost(post);
        setIsEditing(false);
    };

    const handleStatusChange = (newStatus: any) => {
        if (editedPost) {
            const updatedPost = { ...editedPost, status: newStatus };
            setEditedPost(updatedPost);
            onUpdatePost({ ...postInfo, post: updatedPost });
        }
    };

    const handleGenerateInCharacter = async () => {
        if (!postObjective.trim() || !selectedPillar) return;
        await onGenerateInCharacterPost(postObjective, postPlatform, postKeywords, selectedPillar, postInfo);
    };
    
    const handlePublish = async () => {
        if (isPublishing) return;
        setIsPublishing(true);
        try {
            await onPublishPost(postInfo);
            onClose(); 
        } catch (error) {
            console.error("Failed to publish post:", error);
        } finally {
            setIsPublishing(false);
        }
    };
    
    const acceptedProducts = props.affiliateLinks.filter(link => 
        (editedPost.promotedProductIds || []).some(id => id && link.id && id.trim() === link.id.trim())
    );
    const suggestedProducts = (props.khongMinhSuggestions[post.id] || []).filter(s => !(editedPost.promotedProductIds || []).includes(s.id));
    const hasPromotedProducts = (editedPost.promotedProductIds || []).length > 0;
    const isPublished = !!publishedUrl;
    const isYouTubePillar = post.isPillar && post.platform === 'YouTube';

    const renderMediaManager = () => {
        const contentType = editedPost.contentType || '';
        console.log('[renderMediaManager] Rendering for contentType:', contentType);

        switch (contentType) {
            case 'Carousel':
                return <CarouselPostHandler {...props} />; 
            case 'Image':
                return <ImagePostHandler {...props} />; 
            case 'Video':
            case 'Reel':
            case 'Shorts':
            case 'Story':
                return <VideoPostHandler {...props} />; 
            default:
                if (editedPost.mediaPrompt && Array.isArray(editedPost.mediaPrompt) && editedPost.mediaPrompt.length > 0) {
                    console.warn(`No specific media handler for contentType: "${contentType}", falling back to ImagePostHandler due to presence of mediaPrompt.`);
                    return <ImagePostHandler {...props} />; 
                }
                return <TextPostHandler {...props} />; 
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl border border-gray-200 m-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-6 border-b border-gray-200 flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                        <Icon className="h-8 w-8 text-gray-700 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            {isEditing && !isPublished ? (
                                <Input name="title" value={editedPost.title} onChange={handleEditChange} className="text-xl font-bold p-1" />
                            ) : (
                                <h2 className="text-2xl font-bold font-sans text-gray-900">{editedPost.title}</h2>
                            )}
                            <p className="text-md text-gray-500">{editedPost.platform} - {editedPost.contentType}</p>
                        </div>
                        <div className="ml-auto pl-4 flex-shrink-0">
                            <Select 
                                value={editedPost.status || 'draft'}
                                onChange={(e) => handleStatusChange(e.target.value as any)}
                                className={`text-sm font-bold rounded-full px-3 py-1 border-2 ${ 
                                    {
                                        draft: 'bg-gray-100 border-gray-200 text-gray-800',
                                        needs_review: 'bg-yellow-100 border-yellow-200 text-yellow-800',
                                        approved: 'bg-green-100 border-green-200 text-green-800',
                                        scheduled: 'bg-blue-100 border-blue-200 text-blue-800',
                                    }[editedPost.status || 'draft']
                                }
                                `}
                                disabled={isPublished}
                            >
                                <option value="draft">Draft</option>
                                <option value="needs_review">Needs Review</option>
                                <option value="approved">Approved</option>
                                {editedPost.status === 'scheduled' && <option value="scheduled" disabled>Scheduled</option>}
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                         {isPublished && (
                            <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="text-sm px-3 py-1.5 rounded-full font-semibold text-white bg-brand-green hover:bg-brand-green-dark transition-colors flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5" />
                                {texts.viewPost}
                            </a>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 p-6">
                    {
/* Left Column (Content) */}
                    <div className="lg:col-span-3 flex flex-col">
                        {isPublished && (
                             <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                                <p className="text-sm text-blue-800">{texts.postIsPublished}</p>
                            </div>
                        )}
                        {isEditing && !isPublished ? (
                            <div className="flex-grow space-y-4">
                                { isYouTubePillar ? (
                                    <>
                                        <label className="font-bold text-sm">{texts.youtube_description}</label>
                                        <TextArea name="description" value={renderPostContent(editedPost.description || '')} onChange={handleEditChange} rows={5} className="text-base" />
                                        <label className="font-bold text-sm">{texts.youtube_script}</label>
                                        <TextArea name="content" value={renderPostContent(editedPost.content)} onChange={handleEditChange} rows={10} className="text-base" />
                                    </>
                                ) : (
                                    <>
                                        <TextArea name="content" value={renderPostContent(editedPost.content)} onChange={handleEditChange} rows={10} className="text-base" />
                                        {editedPost.contentType.includes('Video') || editedPost.contentType.includes('Shorts') || editedPost.contentType.includes('Story') ? (
                                            <>
                                                <label className="font-bold text-sm">{texts.script}</label>
                                                <TextArea name="script" value={editedPost.script || ''} onChange={handleEditChange} rows={5} className="text-base" />
                                            </>
                                        ) : null}
                                    </>
                                )}
                                <Input name="hashtags" value={(editedPost.hashtags || []).join(', ')} onChange={handleEditChange} placeholder="hashtags, comma, separated" />
                                <Input name="cta" value={editedPost.cta} onChange={handleEditChange} placeholder="Call to Action" />
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col">
                                { isYouTubePillar ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{texts.youtube_description}</h4>
                                            <p className="text-gray-800 text-base mt-1 font-serif whitespace-pre-wrap border p-2 rounded-md bg-gray-50">{renderPostContent(editedPost.description)}</p>
                                        </div>
                                         <div>
                                            <h4 className="font-bold text-gray-800">{texts.youtube_script}</h4>
                                            <p className="text-gray-800 text-base mt-1 font-serif whitespace-pre-wrap">{renderPostContent(editedPost.content)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-gray-800 text-base mb-4 font-serif whitespace-pre-wrap">{renderPostContent(editedPost.content)}</p>
                                        {editedPost.script && (
                                            <div>
                                                <h4 className="font-bold text-gray-800">{texts.script}</h4>
                                                <p className="text-gray-800 text-base mt-1 font-serif whitespace-pre-wrap border p-2 rounded-md bg-gray-50">{editedPost.script}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="text-sm text-gray-500 my-4 flex flex-wrap gap-x-4 gap-y-1">
                                    {props.weekTheme && (
                                        <span className="font-semibold">Week {postInfo.weekIndex + 1}: <span className="font-normal">{props.weekTheme}</span></span>
                                    )}
                                    {editedPost.scheduledAt && !publishedAt && (
                                        <span>{texts.scheduled_for}: {new Date(editedPost.scheduledAt).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' })}</span>
                                    )}
                                     {publishedAt && (
                                        <span>{texts.published}: {new Date(publishedAt).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' })}</span>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 space-y-5">
                                    {
/* Promoted Products Section */}
                                    {acceptedProducts.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-bold text-gray-600 mb-1.5 font-sans uppercase tracking-wider">{texts.promoted_products}</h5>
                                            <div className="space-y-2">
                                                {acceptedProducts.map(product => (
                                                    <a href={product.productLink} target="_blank" rel="noopener noreferrer" key={product.id} className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                                                        <LinkIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                        <span className="text-sm text-gray-800 font-medium truncate">{product.productName}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {
/* Sources section */}
                                    {editedPost.sources && editedPost.sources.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-bold text-gray-600 mb-1.5 font-sans uppercase tracking-wider">{texts.sources}</h5>
                                            <div className="space-y-1">
                                                {editedPost.sources.map((source, index) => (
                                                    <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-brand-green font-sans flex items-center gap-1.5 transition-colors" title={source.uri} >
                                                        <LinkIcon className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">{source.title}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {
/* Hashtags Section */}
                                    {editedPost.hashtags && editedPost.hashtags.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-bold text-gray-600 mb-2 font-sans uppercase tracking-wider">{texts.hashtags_title}</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {editedPost.hashtags.map(tag => <span key={tag} className="text-sm bg-green-50 text-green-800 px-3 py-1 rounded-full font-sans">{tag}</span>)}
                                            </div>
                                        </div>
                                    )}

                                    {
/* New CTA design */}
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-600 mb-1.5 font-sans uppercase tracking-wider">{texts.cta_title}</h5>
                                        <div className="bg-brand-green/10 p-4 rounded-lg flex items-start gap-3 border border-brand-green/20">
                                            <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xl">📢</span>
                                            </div>
                                            <p className="text-gray-800 text-base font-serif italic">{editedPost.cta}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                         <div className="mt-auto pt-4 border-t border-gray-200">
                            {isEditing && !isPublished ? (
                                <div className="flex items-center justify-end gap-2">
                                    <Button variant="tertiary" onClick={handleCancelEdit}>{texts.cancel}</Button>
                                    <Button onClick={handleSaveEdit}>{texts.save}</Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-end gap-2">
                                    {!isPublished && (
                                        <>
                                            <Button variant="secondary" onClick={() => onOpenScheduleModal({ id: postInfo.post.id, title: postInfo.post.title, platform: postInfo.post.platform, scheduledAt: postInfo.post.scheduledAt || null, status: postInfo.post.status, post: postInfo.post })} className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/> {texts.schedule}</Button>
                                            <Button variant="secondary" onClick={handlePublish} disabled={isPublishing} className="flex items-center gap-2">
                                                {isPublishing ? (
                                                    <><div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div><span>{texts.publishing}</span></>
                                                ) : (
                                                    <><LinkIcon className="h-4 w-4"/> {texts.publishNow}</>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="primary" onClick={() => setIsEditing(true)} disabled={isPublished}>{texts.edit}</Button>
                                </div>
                            )}
                        </div>
                    </div>
                    {
/* Right Column (Tools) */}
                    <div className="lg:col-span-2 space-y-4">
                       {renderMediaManager()}

                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h5 className="font-bold text-sm text-gray-800 mb-2">{texts.refine_with_ai}</h5>
                            <div className="space-y-3">
                                <TextArea 
                                    value={postObjective}
                                    onChange={(e) => setPostObjective(e.target.value)}
                                    placeholder={texts.objective_placeholder}
                                    rows={3}
                                    className="text-sm"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Platform</label>
                                        <Select value={postPlatform} onChange={e => setPostPlatform(e.target.value as any)} className="text-sm mt-1">
                                            <option value="Facebook">Facebook</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="YouTube">YouTube</option>
                                            <option value="Pinterest">Pinterest</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Pillar</label>
                                        <Select value={selectedPillar} onChange={e => setSelectedPillar(e.target.value)} className="text-sm mt-1" required>
                                            <option value="" disabled>Select a pillar</option>
                                            {(props.settings.contentPillars || []).map(p => (
                                                <option key={p.name} value={p.name}>{p.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="text-xs font-medium text-gray-600">Keywords</label>
                                    <TagInput label="Keywords" tags={postKeywords} setTags={setPostKeywords} placeholder="Add keywords..." />
                                </div>
                            </div>
                            <Button 
                                onClick={handleGenerateInCharacter} 
                                disabled={isRefining || !postObjective.trim()}
                                className="w-full flex items-center justify-center gap-2 mt-3"
                            >
                                {isRefining ? (
                                    <><div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div><span>{texts.refining}</span></>
                                ) : (
                                    <><SparklesIcon className="h-4 w-4" /><span>{texts.refine_with_ai}</span></>
                                )}
                            </Button>
                        </div>

                        {(props.affiliateLinks.length > 0 || acceptedProducts.length > 0) && (
                            <KhongMinhSuggestion
                                language={language}
                                isAnyAnalysisRunning={props.isAnyAnalysisRunning}
                                isAnalyzing={props.isAnalyzing}
                                acceptedProducts={acceptedProducts}
                                suggestedProducts={suggestedProducts}
                                affiliateLinksCount={props.affiliateLinks.length}
                                onAccept={(productId) => {
                                    if (!editedPost.promotedProductIds?.includes(productId)) {
                                        const updatedPost = { ...editedPost, promotedProductIds: [...(editedPost.promotedProductIds || []), productId] };
                                        setEditedPost(updatedPost);
                                        props.onUpdatePost({ ...postInfo, post: updatedPost });
                                    }
                                }}
                                onRunAnalysis={() => props.onRunKhongMinhForPost()}
                            />
                        )}

                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h5 className="font-bold text-sm text-gray-800 mb-2">{texts.auto_comment}</h5>
                            {isEditing && !isPublished ? (
                                <TextArea
                                    name="autoComment"
                                    value={editedPost.autoComment || ''}
                                    onChange={handleEditChange}
                                    rows={5}
                                    className="text-sm font-serif"
                                    placeholder="Generate or write a comment..."
                                />
                            ) : (
                                editedPost.autoComment ? (
                                    <p className="text-sm font-serif whitespace-pre-wrap bg-white p-2 rounded border">{editedPost.autoComment}</p>
                                ) : (
                                    <p className="text-sm text-gray-500 font-serif italic text-center py-4">{texts.no_comment}</p>
                                )
                            )}

                            {hasPromotedProducts && (
                                <div className="mt-3 text-right">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            if (!isEditing) setIsEditing(true);
                                            onGenerateComment(postInfo);
                                        }}
                                        disabled={isGeneratingComment || isPublished}
                                        className="text-xs py-1.5 px-2.5 flex items-center justify-center gap-1.5"
                                    >
                                        {isGeneratingComment ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div>
                                                <span>{texts.generating_comment}</span>
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="h-4 w-4" />
                                                <span>{editedPost.autoComment ? texts.regenerate : texts.generate_comment}</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default PostDetailModal;
