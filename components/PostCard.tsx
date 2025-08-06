


import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, SparklesIcon, CheckCircleIcon, PencilIcon, CopyIcon, CheckSolidIcon, DotsVerticalIcon, KhongMinhIcon, ChatBubbleLeftIcon, VideoCameraIcon } from './icons';
import type { MediaPlanPost, PostInfo } from '../types';

const platformIcons: Record<string, React.FC<any>> = {
    YouTube: YouTubeIcon,
    Facebook: FacebookIcon,
    Instagram: InstagramIcon,
    TikTok: TikTokIcon,
    Pinterest: PinterestIcon
};

export interface PostCardProps {
    postInfo: PostInfo;
    language: string;
    onViewDetails: (postInfo: PostInfo) => void;
    imageUrl?: string;
    videoUrl?: string;
    promotedProductsCount?: number;
    isDraft: boolean;
    isSelected: boolean;
    onToggleSelection: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = (props) => {
    const { postInfo, language, onViewDetails, imageUrl, videoUrl, promotedProductsCount, isDraft, isSelected, onToggleSelection } = props;
    const { post } = postInfo;
    const Icon = platformIcons[post.platform] || SparklesIcon;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const T = {
        'Việt Nam': {
            edit: "Xem / Chỉnh sửa",
            copy: "Sao chép Nội dung",
            copied: "Đã chép",
            draft: "Bản nháp",
            promoted: "SP KM",
            commented: "Bình luận",
            video: "Video",
        },
        'English': {
            edit: "View / Edit",
            copy: "Copy Content",
            copied: "Copied",
            draft: "Draft",
            promoted: "Promo",
            commented: "Comment",
            video: "Video",
        }
    };
    const texts = (T as any)[language] || T['English'];
    
    const textToCopy = [ post.title, post.content, (post.hashtags || []).join(' '), `CTA: ${post.cta}` ].filter(Boolean).join('\n\n');
    
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => { setCopied(false); setIsMenuOpen(false); }, 2000);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.no-expand')) {
            return;
        }
        onViewDetails(postInfo);
    };

    const order = post.mediaOrder || [];
    const media: {type: 'image' | 'video', url: string}[] = [];

    // Use a map to ensure we only add each type once, respecting the explicit order first.
    const mediaMap = new Map<'image' | 'video', string>();
    if(imageUrl) mediaMap.set('image', imageUrl);
    if(videoUrl) mediaMap.set('video', videoUrl);

    const orderedMedia: {type: 'image' | 'video', url: string}[] = [];
    const addedTypes = new Set<'image' | 'video'>();

    // Add based on explicit order
    for (const type of order) {
        if (mediaMap.has(type) && !addedTypes.has(type)) {
            orderedMedia.push({ type, url: mediaMap.get(type)! });
            addedTypes.add(type);
        }
    }
    // Add any remaining media (for backward compatibility)
    for (const [type, url] of mediaMap.entries()) {
        if (!addedTypes.has(type)) {
             orderedMedia.push({ type, url });
        }
    }

    const firstMedia = orderedMedia[0];

    return (
        <div 
            className={`relative bg-white rounded-xl p-4 flex flex-col h-full border-2 shadow-sm group transition-all duration-200 ease-in-out cursor-pointer hover:shadow-md hover:-translate-y-0.5
                ${isSelected ? 'border-brand-green bg-green-50/50 shadow-lg' : 'border-gray-200'}
            `}
            onClick={handleCardClick}
        >
            <div 
                role="checkbox"
                aria-checked={isSelected}
                className="absolute top-3 left-3 z-10 no-expand"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(post.id);
                }}
            >
                <div className={`h-6 w-6 rounded-md flex items-center justify-center border-2 transition-colors
                    ${isSelected ? 'bg-brand-green border-brand-green-dark' : 'bg-white border-gray-300 group-hover:border-gray-400'}
                `}>
                    {isSelected && <CheckSolidIcon className="h-4 w-4 text-white" />}
                </div>
            </div>

            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 no-expand">
                <div className="relative" ref={menuRef}>
                    <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(o => !o); }} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <DotsVerticalIcon className="h-5 w-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-30">
                            <button onClick={() => { onViewDetails(postInfo); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <PencilIcon className="h-4 w-4" /> {texts.edit}
                            </button>
                            <button onClick={handleCopy} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                {copied ? <CheckCircleIcon className="h-4 w-4 text-brand-green" /> : <CopyIcon className="h-4 w-4" />} {copied ? texts.copied : texts.copy}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-grow">
                 <div className="flex items-start gap-3 mb-3 ml-8">
                    <Icon className="h-6 w-6 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                         <h4 className="font-bold font-sans text-gray-900 truncate pr-8" title={post.title}>{post.title}</h4>
                        <span className="text-sm text-gray-500 block truncate">{post.platform} - {post.contentType}</span>
                    </div>
                </div>

                {firstMedia && (
                    <div className="mb-2 rounded-lg overflow-hidden bg-gray-100 relative">
                        {firstMedia.type === 'image' ? (
                            <img src={firstMedia.url} alt={post.title} className="w-full h-24 object-cover" />
                        ) : (
                            <>
                                <video src={firstMedia.url} className="w-full h-24 object-cover bg-black" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                    <div className="bg-black/50 p-2 rounded-full">
                                        <VideoCameraIcon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            <div className="mt-auto flex-shrink-0 pt-2 flex justify-start items-center flex-wrap gap-2">
                 {isDraft && (
                    <div className="text-xs px-2 py-0.5 rounded-full font-medium text-gray-800 bg-gray-100">
                        {texts.draft}
                    </div>
                 )}
                 {post.videoKey && (
                     <div className="text-xs px-2 py-0.5 rounded-full font-medium text-blue-800 bg-blue-100 flex items-center gap-1">
                        <VideoCameraIcon className="h-3 w-3" />
                        <span>{texts.video}</span>
                    </div>
                 )}
                {promotedProductsCount && promotedProductsCount > 0 && (
                     <div className="text-xs px-2 py-0.5 rounded-full font-medium text-purple-800 bg-purple-100 flex items-center gap-1">
                        <KhongMinhIcon className="h-3 w-3" />
                        <span>{promotedProductsCount} {texts.promoted}</span>
                    </div>
                )}
                {post.autoComment && (
                     <div className="text-xs px-2 py-0.5 rounded-full font-medium text-sky-800 bg-sky-100 flex items-center gap-1">
                        <ChatBubbleLeftIcon className="h-3 w-3" />
                        <span>{texts.commented}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PostCard;