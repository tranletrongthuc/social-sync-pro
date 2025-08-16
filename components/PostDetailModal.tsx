import React, { useState, useEffect, useRef } from 'react';
import type { MediaPlanPost, AffiliateLink, SchedulingPost, PostInfo } from '../types';
import { Button, Input, TextArea, HoverCopyWrapper } from './ui';
import { DownloadIcon, SparklesIcon, YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, UploadIcon, LinkIcon, CheckCircleIcon, CalendarIcon, VideoCameraIcon } from './icons';
import KhongMinhSuggestion from './KhongMinhSuggestion';


const platformIcons: Record<string, React.FC<any>> = {
    YouTube: YouTubeIcon,
    Facebook: FacebookIcon,
    Instagram: InstagramIcon,
    TikTok: TikTokIcon,
    Pinterest: PinterestIcon
};

const renderPostContent = (content: string | any): string => {
    if (typeof content === 'string') {
        return content;
    }
    if (typeof content === 'object' && content !== null) {
        // This handles cases where the AI returns a structured object instead of a string.
        // We'll format it nicely into a readable string.
        return Object.entries(content)
            .map(([key, value]) => `**${key.charAt(0).toUpperCase() + key.slice(1)}:**\n${value}`)
            .join('\n\n');
    }
    return ''; // Return empty string for other types like null, undefined, etc.
};


const GenerateIdeaHandler: React.FC <{
    onGeneratePrompt: () => void;
    isGenerating: boolean;
    texts: any;
}> = ({ onGeneratePrompt, isGenerating, texts }) => {
    return (
        <div className="bg-white border border-gray-200 p-6 rounded-lg h-full flex flex-col items-center justify-center text-center">
            <SparklesIcon className="h-12 w-12 text-gray-400" />
            <h5 className="mt-4 font-semibold font-sans text-gray-800 text-lg">{texts.generateIdeaTitle}</h5>
            <p className="mt-1 text-gray-500 text-sm font-serif">{texts.generateIdeaDesc}</p>
            <Button
                onClick={onGeneratePrompt}
                disabled={isGenerating}
                className="mt-4 w-full flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        <span>{texts.generatingIdea}</span>
                    </>
                ) : (
                    <>
                        <SparklesIcon className="h-5 w-5" />
                        {texts.generateIdea}
                    </>
                )}
            </Button>
        </div>
    );
};

interface MediaHandlerProps {
    postInfo: PostInfo;
    aspectRatio: "1:1" | "16:9";
    onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9") => void;
    onSetImage: (dataUrl: string, key: string) => void;
    onSetVideo: (dataUrl: string, key: string) => void;
    generatedImages: Record<string, string>;
    generatedVideos: Record<string, string>;
    isGenerating: boolean;
    texts: any;
};

const MediaHandler: React.FC<MediaHandlerProps> = ({ postInfo, aspectRatio, onGenerateImage, onSetImage, onSetVideo, generatedImages, generatedVideos, isGenerating, texts }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { post } = postInfo;

    const handleFile = (file: File | null) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
                if (file.type.startsWith('video/')) {
                    onSetVideo(dataUrl, post.id); // Use post id as base key
                } else if (file.type.startsWith('image/')) {
                    onSetImage(dataUrl, post.imageKey || post.id);
                }
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
    
    const generatedImage = post.imageKey ? generatedImages[post.imageKey] : undefined;
    const generatedVideo = post.videoKey ? generatedVideos[post.videoKey] : undefined;

    const renderImageComponent = () => {
        if (!generatedImage) return null;
        return (
             <div className="relative group rounded-lg overflow-hidden" tabIndex={0}>
                <img src={generatedImage} alt={post.mediaPrompt} className="w-full object-cover" style={{ aspectRatio }}/>
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="flex flex-col gap-2 items-center p-2">
                        <Button onClick={() => onGenerateImage(post.mediaPrompt!, post.imageKey!, aspectRatio)} disabled={isGenerating} variant="primary" className="w-full flex items-center justify-center gap-2 text-xs py-1 px-2">
                            <SparklesIcon className="h-4 w-4" /> {texts.regenerate}
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full flex items-center justify-center gap-2 text-xs py-1 px-2">
                           <UploadIcon className="h-4 w-4" /> {texts.changeImage}
                        </Button>
                    </div>
                    <a href={generatedImage} download={`${post.imageKey}.jpg`} className="absolute bottom-2 right-2 bg-gray-800 text-white p-2 rounded-full hover:bg-black transition-colors">
                       <DownloadIcon className="h-4 w-4"/>
                    </a>
                </div>
            </div>
        );
    };
    
    const renderVideoComponent = () => {
        if (!generatedVideo) return null;
        return (
            <div className="relative group rounded-lg overflow-hidden bg-black" tabIndex={0}>
                <video src={generatedVideo} controls className="w-full h-full object-cover" style={{ aspectRatio }} />
                <div className="absolute top-2 right-2 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="flex items-center justify-center gap-2 text-xs py-1 px-2 bg-white/80 hover:bg-white backdrop-blur-sm">
                       <UploadIcon className="h-4 w-4" /> {texts.changeVideo}
                    </Button>
                    <a href={generatedVideo} download={`${post.videoKey || 'video'}.mp4`} className="bg-gray-800/80 text-white p-2 rounded-full hover:bg-black transition-colors backdrop-blur-sm">
                       <DownloadIcon className="h-4 w-4"/>
                    </a>
                </div>
            </div>
        );
    };
    
    const renderImagePromptUploader = () => {
        if (!post.mediaPrompt) return null;

        const renderMediaPrompt = () => {
            if (Array.isArray(post.mediaPrompt)) {
                return (
                    <div className="space-y-2">
                        {post.mediaPrompt.map((prompt, index) => (
                            <HoverCopyWrapper key={index} textToCopy={prompt}>
                                <p className="text-gray-500 italic text-sm font-serif">{index + 1}: "{prompt}"</p>
                            </HoverCopyWrapper>
                        ))}
                    </div>
                )
            }
            return (
                <HoverCopyWrapper textToCopy={post.mediaPrompt as string}>
                    <p className="text-gray-500 italic mb-3 text-sm font-serif flex-grow">"{post.mediaPrompt}"</p>
                </HoverCopyWrapper>
            )
        }

        return (
            <div className="bg-white border border-gray-200 p-4 rounded-lg h-full flex flex-col">
                <h5 className="font-semibold font-sans text-gray-700 text-sm">{texts.prompt}</h5>
                {renderMediaPrompt()}
                {post.script && (
                    <>
                        <h5 className="font-semibold font-sans text-gray-700 text-sm mt-4">{texts.script}</h5>
                        <p className="text-gray-500 italic mb-3 text-sm font-serif flex-grow">{post.script}</p>
                    </>
                )}
                <div className="space-y-2 mt-auto">
                    <Button onClick={() => onGenerateImage(post.mediaPrompt!, post.imageKey || post.id, aspectRatio)} disabled={isGenerating} className="w-full flex items-center justify-center gap-2">
                        <SparklesIcon /> {texts.generate}
                    </Button>
                    <div 
                        className="relative w-full text-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-brand-green transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="text-xs text-gray-500 mt-1">{texts.uploadOrPaste}</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderGenericUploader = () => (
        <div 
            className="w-full h-full min-h-[200px] bg-gray-50 flex flex-col justify-center items-center text-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-green transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="flex items-center gap-4 text-gray-400">
                <VideoCameraIcon className="h-10 w-10"/>
                <span className="text-2xl font-thin">/</span>
                <SparklesIcon className="h-10 w-10"/>
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-600">{texts.uploadMedia}</p>
            <p className="text-xs text-gray-500 mt-1">{texts.uploadOrPaste}</p>
        </div>
    );
    
    if (isGenerating) {
        return (
            <div className="w-full bg-gray-100 flex flex-col items-center justify-center rounded-lg border border-gray-200" style={{ aspectRatio, minHeight: '150px' }}>
                <div className="w-8 h-8 border-2 border-t-transparent border-brand-green rounded-full animate-spin"></div>
                <span className="text-sm mt-2 text-gray-500">{texts.generating}</span>
            </div>
        );
    }

    const imageContent = generatedImage ? renderImageComponent() : renderImagePromptUploader();
    const videoContent = renderVideoComponent();
    
    const mediaMap = { image: imageContent, video: videoContent };
    let orderedComponents: (JSX.Element | null)[] = [];
    const order = post.mediaOrder || [];
    const addedTypes = new Set<'image' | 'video'>();

    for (const type of order) {
        if (mediaMap[type]) {
            orderedComponents.push(mediaMap[type]);
            addedTypes.add(type);
        }
    }
    for (const type of ['image', 'video'] as const) {
        if (!addedTypes.has(type) && mediaMap[type]) {
            orderedComponents.push(mediaMap[type]);
        }
    }
    
    if (orderedComponents.length === 0) {
        orderedComponents.push(renderGenericUploader());
    }

    return (
        <div onPaste={handlePaste} tabIndex={-1} className="focus:outline-none">
            <div className={`grid ${orderedComponents.filter(Boolean).length > 1 ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'grid-cols-1'}`}>
                {orderedComponents.map((comp, index) => comp ? <div key={index}>{comp}</div> : null)}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
        </div>
    );
};


interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  postInfo: PostInfo;
  language: string;
  weekTheme?: string;
  onUpdatePost: (postInfo: PostInfo) => void;
  onGenerateImage: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9", postInfo?: PostInfo) => void;
  onSetImage: (dataUrl: string, key: string, postInfo?: PostInfo) => void;
  onSetVideo: (dataUrl: string, key: string, postInfo: PostInfo) => void;
  onGeneratePrompt: (postInfo: PostInfo) => void;
  onRefinePost: (text: string) => Promise<string>;
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
  onGenerateComment: (postInfo: PostInfo) => void;
  isGeneratingComment: boolean;
  onOpenScheduleModal: (post: SchedulingPost) => void;
  onPublishPost: (postInfo: PostInfo) => Promise<void>; 
  publishedUrl?: string;
  publishedAt?: string;
}



const PostDetailModal: React.FC<PostDetailModalProps> = (props) => {
    const { isOpen, onClose, postInfo, language, onUpdatePost, onGenerateComment, isGeneratingComment, onOpenScheduleModal, onSetVideo, onPublishPost, publishedAt, publishedUrl } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [editedPost, setEditedPost] = useState<MediaPlanPost | null>(postInfo.post);
    
    useEffect(() => {
        if (postInfo) {
            setEditedPost(postInfo.post);
        }
        if (isOpen) {
            setIsEditing(false); 
        }
    }, [postInfo, isOpen]);

    if (!isOpen || !postInfo || !editedPost) return null;
    const { post } = postInfo;
    const Icon = platformIcons[post.platform] || SparklesIcon;

    const T = {
        'Việt Nam': {
            edit: "Chỉnh sửa",
            schedule: "Lên lịch",
            draft: "Bản nháp",
            generateIdea: "Tạo ý tưởng ảnh",
            generateIdeaTitle: "Tạo một ý tưởng hình ảnh",
            generateIdeaDesc: "Để AI tạo một khái niệm hình ảnh cho bài đăng này dựa trên nội dung của nó.",
            generatingIdea: "Đang tạo...",
            save: "Lưu",
            cancel: "Hủy",
            refine_with_ai: "Làm mới bằng AI",
            refining: "Đang làm mới...",
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
            generate: 'Tạo ảnh',
            prompt: 'Prompt ảnh:',
            changeImage: 'Đổi ảnh',
            changeVideo: 'Đổi video',
            uploadOrPaste: 'Bấm để tải lên hoặc dán phương tiện',
            uploadMedia: 'Tải lên Ảnh hoặc Video',
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
            generateIdea: "Generate Image Idea",
            generateIdeaTitle: "Generate an Image Idea",
            generateIdeaDesc: "Let AI create a visual concept for this post based on its content.",
            generatingIdea: "Generating...",
            save: "Save",
            cancel: "Cancel",
            refine_with_ai: "Refine with AI",
            refining: "Refining...",
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
            prompt: 'Image Prompt:',
            changeImage: 'Change Image',
            changeVideo: 'Change Video',
            uploadOrPaste: 'Click to upload or paste media',
            uploadMedia: 'Upload Image or Video',
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
    const texts = (T as any)[language] || T['English'];
    const locale = language === 'Việt Nam' ? 'vi-VN' : 'en-US';

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedPost(prev => {
            if (!prev) return null;
            if (name === 'hashtags') {
                return { ...prev, hashtags: value.split(',').map(h => h.trim()) };
            }
            if (name === 'script') {
                return { ...prev, script: value };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSaveEdit = () => {
        if (editedPost) {
            const postToSave = { ...editedPost };
            if (typeof postToSave.content !== 'string') {
                postToSave.content = JSON.stringify(postToSave.content, null, 2);
            }
            if (postToSave.description && typeof postToSave.description !== 'string') {
                postToSave.description = JSON.stringify(postToSave.description, null, 2);
            }
            onUpdatePost({ ...postInfo, post: postToSave });
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedPost(post);
        setIsEditing(false);
    };

    const handleRefine = async () => {
        if (!editedPost || isRefining) return;
        const contentToRefine = typeof editedPost.content === 'string' ? editedPost.content : JSON.stringify(editedPost.content, null, 2);
        if (!contentToRefine.trim()) return;

        setIsRefining(true);
        try {
            const refinedText = await props.onRefinePost(contentToRefine);
            setEditedPost(prev => prev ? { ...prev, content: refinedText } : null);
        } catch (error) {
            console.error("Refinement failed in modal:", error);
        } finally {
            setIsRefining(false);
        }
    };
    
    const handlePublish = async () => {
        if (isPublishing) return;
        setIsPublishing(true);
        try {
            await onPublishPost(postInfo);
            // Optionally close modal on success, or show a success message
            onClose(); 
        } catch (error) {
            console.error("Failed to publish post:", error);
            // Optionally show an error message to the user
        } finally {
            setIsPublishing(false);
        }
    };
    
    // Match promoted products with affiliate links
    // Handle both cases: IDs might be UUIDs or Airtable record IDs (starting with "rec")
    const acceptedProducts = props.affiliateLinks.filter(link => 
        (editedPost.promotedProductIds || []).some(id => {
            // Direct match (both are UUIDs)
            if (id.trim() === link.id.trim()) {
                return true;
            }
            // If the promoted ID looks like an Airtable record ID, we might need to handle it differently
            // But since we've fixed the saving logic, this should be rare
            return false;
        })
    );
    const suggestedProducts = (props.khongMinhSuggestions[post.id] || []).filter(s => !(editedPost.promotedProductIds || []).includes(s.id));
    const hasPromotedProducts = (editedPost.promotedProductIds || []).length > 0;
    
    const hasMediaPath = editedPost.mediaPrompt || editedPost.script || (editedPost.imageKey && props.generatedImages[editedPost.imageKey]) || (editedPost.videoKey && props.generatedVideos[editedPost.videoKey]);

    const isYouTubePillar = post.isPillar && post.platform === 'YouTube';
    const isPublished = !!publishedUrl;

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
                    {/* Left Column (Content) */}
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
                                        <TextArea name="description" value={typeof editedPost.description === 'string' ? editedPost.description || '' : JSON.stringify(editedPost.description, null, 2)} onChange={handleEditChange} rows={5} className="text-base" />
                                        <label className="font-bold text-sm">{texts.youtube_script}</label>
                                        <TextArea name="content" value={typeof editedPost.content === 'string' ? editedPost.content : JSON.stringify(editedPost.content, null, 2)} onChange={handleEditChange} rows={10} className="text-base" />
                                    </>
                                ) : (
                                    <>
                                        <TextArea name="content" value={typeof editedPost.content === 'string' ? editedPost.content : JSON.stringify(editedPost.content, null, 2)} onChange={handleEditChange} rows={10} className="text-base" />
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
                                    {/* Promoted Products Section */}
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

                                    {/* Sources section */}
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

                                    {/* Hashtags Section */}
                                    {editedPost.hashtags && editedPost.hashtags.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-bold text-gray-600 mb-2 font-sans uppercase tracking-wider">{texts.hashtags_title}</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {editedPost.hashtags.map(tag => <span key={tag} className="text-sm bg-green-50 text-green-800 px-3 py-1 rounded-full font-sans">{tag}</span>)}
                                            </div>
                                        </div>
                                    )}

                                    {/* New CTA design */}
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
                                    <Button variant="secondary" onClick={handleRefine} disabled={isRefining || !(typeof editedPost?.content === 'string' && editedPost.content.trim())}>
                                        {isRefining ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div>
                                                <span>{texts.refining}</span>
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="h-4 w-4" />
                                                <span>{texts.refine_with_ai}</span>
                                            </>
                                        )}
                                    </Button>
                                    <Button onClick={handleSaveEdit}>{texts.save}</Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-end gap-2">
                                    {!isPublished && (
                                        <>
                                            <Button variant="secondary" onClick={() => onOpenScheduleModal(postInfo as SchedulingPost)} className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/> {texts.schedule}</Button>
                                            <Button variant="secondary" onClick={handlePublish} disabled={isPublishing} className="flex items-center gap-2">
                                                {isPublishing ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div>
                                                        <span>{texts.publishing}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <LinkIcon className="h-4 w-4"/> {texts.publishNow}
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="primary" onClick={() => setIsEditing(true)} disabled={isPublished}>{texts.edit}</Button>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Right Column (Tools) */}
                    <div className="lg:col-span-2 space-y-4">
                       { hasMediaPath ? (
                            <MediaHandler
                                postInfo={postInfo}
                                aspectRatio={editedPost.platform === 'YouTube' ? '16:9' : '1:1'}
                                onGenerateImage={(prompt, key, aspectRatio) => props.onGenerateImage(prompt, key, aspectRatio, postInfo)}
                                onSetImage={(dataUrl, key) => props.onSetImage(dataUrl, key, postInfo)}
                                onSetVideo={(dataUrl, key) => onSetVideo(dataUrl, key, postInfo)}
                                generatedImages={props.generatedImages}
                                generatedVideos={props.generatedVideos}
                                isGenerating={props.isGeneratingImage(editedPost.imageKey || editedPost.id)}
                                texts={texts}
                            />
                        ) : (
                            <GenerateIdeaHandler
                                onGeneratePrompt={() => props.onGeneratePrompt(postInfo)}
                                isGenerating={props.isGeneratingPrompt}
                                texts={texts}
                            />
                        )}

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