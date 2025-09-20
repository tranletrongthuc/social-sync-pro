import React, { useRef, useState, useEffect } from 'react';
import { Button, Carousel } from './ui';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, SparklesIcon, CheckCircleIcon, PencilIcon, CopyIcon, CheckSolidIcon, DotsVerticalIcon, KhongMinhIcon, ChatBubbleLeftIcon, VideoCameraIcon, TagIcon, PhotographIcon, CalendarIcon } from './icons';
import type { MediaPlanPost, PostInfo } from '../../types';
import { renderPostContent } from '../services/utils';

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
    imageUrls?: string[];
    videoUrl?: string;
    isSelected: boolean;
    onToggleSelection: (postId: string) => void;
    scheduledAt?: string;
    publishedAt?: string;
    publishedUrl?: string;
}

const PostCard: React.FC<PostCardProps> = (props) => {
    const { postInfo, language, onViewDetails, imageUrl, imageUrls, videoUrl, isSelected, onToggleSelection, scheduledAt, publishedAt, publishedUrl } = props;
    const { post } = postInfo;
    const Icon = platformIcons[post.platform] || SparklesIcon;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const T = {
        'Việt Nam': { edit: "Xem / Chỉnh sửa", copy: "Sao chép Nội dung", copied: "Đã chép", draft: "Bản nháp", promoted: "SP KM", commented: "Bình luận", video: "Video", scheduled: "Đã lên lịch vào", published: "Đã đăng vào", viewPost: "Xem bài đăng", },
        'English': { edit: "View / Edit", copy: "Copy Content", copied: "Copied", draft: "Draft", promoted: "Promo", commented: "Comment", video: "Video", scheduled: "Scheduled at", published: "Published at", viewPost: "View Post", }
    };
    const texts = (T as any)[language] || T['English'];
    const textToCopy = [
        post.title,
        Array.isArray(post.content) ? post.content.join('\n\n') : post.content,
        (post.hashtags || []).join(' '),
        `CTA: ${post.cta}`
    ].filter(Boolean).join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            setIsMenuOpen(false);
        }, 2000);
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
        if ((e.target as HTMLElement).closest('.no-expand') || (e.target as HTMLElement).closest('a')) {
            return;
        }
        onViewDetails(postInfo);
    };

    const hasPromo = (post.promotedProductIds?.length || 0) > 0;
    const hasComment = !!post.autoComment;
    const hasVideo = !!videoUrl;

    return (
        <div className={`bg-white rounded-xl border-2 transition-all duration-300 ${isSelected ? 'border-brand-green shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>
            <div className="relative cursor-pointer" onClick={handleCardClick}>
                <div className="absolute top-3 left-3 z-10 no-expand">
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                        checked={isSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onToggleSelection(post.id);
                        }}
                    />
                </div>
                
                {/* CORRECTED MEDIA RENDERING LOGIC */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
                    {(post.contentType === 'Carousel' && imageUrls && imageUrls.length > 0) ? (
                        <Carousel images={imageUrls} className="w-full h-full object-cover" />
                    ) : imageUrl ? (
                        <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
                    ) : hasVideo && videoUrl ? (
                         <video src={videoUrl} className="w-full h-full object-cover" controls={false} />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <PhotographIcon className="h-10 w-10 text-gray-400" />
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Icon className="h-5 w-5" />
                        <span>{post.platform}</span>
                        <span className="text-gray-300">•</span>
                        <span>{post.contentType}</span>
                    </div>
                    <div className="relative no-expand" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-400 hover:text-gray-600">
                            <DotsVerticalIcon className="h-5 w-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                                <button onClick={() => onViewDetails(postInfo)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                    <PencilIcon className="h-4 w-4" /> {texts.edit}
                                </button>
                                <button onClick={handleCopy} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                    {copied ? <CheckSolidIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
                                    {copied ? texts.copied : texts.copy}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <h3 className="mt-2 font-bold text-lg text-gray-900 leading-tight cursor-pointer" onClick={handleCardClick}>
                    {post.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 font-serif line-clamp-2 cursor-pointer" onClick={handleCardClick}>
                    {renderPostContent(post.content)}
                </p>
                <div className="mt-4 flex flex-wrap justify-between items-end gap-2">
                    <div className="flex flex-wrap gap-2">
                        {post.status === 'draft' && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{texts.draft}</span>}
                        {hasPromo && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><KhongMinhIcon className="h-3 w-3" /> {texts.promoted}</span>}
                        {hasComment && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"><ChatBubbleLeftIcon className="h-3 w-3" /> {texts.commented}</span>}
                        {hasVideo && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1"><VideoCameraIcon className="h-3 w-3" /> {texts.video}</span>}
                    </div>
                    <div className="text-xs text-gray-400 text-right min-w-max">
                        {publishedAt ? (
                            <a href={publishedUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:underline no-expand">
                                <CheckCircleIcon className="h-4 w-4" />
                                <span>{texts.published} {new Date(publishedAt).toLocaleDateString()}</span>
                            </a>
                        ) : scheduledAt ? (
                            <span className="flex items-center gap-1 text-blue-600">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{texts.scheduled} {new Date(scheduledAt).toLocaleDateString()}</span>
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;