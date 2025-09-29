import React from 'react';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, SparklesIcon, PhotographIcon, VideoCameraIcon, CollectionIcon, ChatBubbleLeftIcon, CheckCircleIcon, ClockIcon, PencilIcon } from './icons';
import type { PostInfo } from '../../types';

const platformIcons: Record<string, React.FC<any>> = {
    YouTube: YouTubeIcon,
    Facebook: FacebookIcon,
    Instagram: InstagramIcon,
    TikTok: TikTokIcon,
    Pinterest: PinterestIcon
};

const contentTypeIcons: Record<string, React.FC<any>> = {
    Image: PhotographIcon,
    Video: VideoCameraIcon,
    Carousel: CollectionIcon,
    Story: SparklesIcon,
    Shorts: VideoCameraIcon,
    Reel: VideoCameraIcon
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
    onTogglePostApproval: (postInfo: PostInfo) => void;
    scheduledAt?: string;
    publishedAt?: string;
    publishedUrl?: string;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'published': return 'bg-green-100 text-green-800';
        case 'scheduled': return 'bg-blue-100 text-blue-800';
        case 'approved': return 'bg-purple-100 text-purple-800';
        case 'needs_review': return 'bg-yellow-100 text-yellow-800';
        case 'draft': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const PostCard: React.FC<PostCardProps> = (props) => {
    const { postInfo, onViewDetails, imageUrl, imageUrls, videoUrl, isSelected, onToggleSelection, scheduledAt, publishedAt } = props;
    const { post } = postInfo;
    const Icon = platformIcons[post.platform] || SparklesIcon;
    const ContentTypeIcon = contentTypeIcons[post.contentType] || SparklesIcon;

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.no-expand')) {
            return;
        }
        onViewDetails(postInfo);
    };

    // Format timestamp
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown time';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} minutes ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hours ago`;
        } else {
            return `${diffDays} days ago`;
        }
    };

    // Get first 200 characters of title
    const getTitlePreview = () => {
        if (!post.title) return 'Untitled Post';
        return post.title.length > 200 ? `${post.title.substring(0, 200)}...` : post.title;
    };

    // Get first sentence of content
    const getContentPreview = () => {
        if (!post.content) return 'No content';
        
        // If content is an array, join it
        const contentStr = Array.isArray(post.content) ? post.content.join(' ') : post.content;
        
        // Extract first sentence (ending with . ! or ?)
        const sentenceMatch = contentStr.match(/^[^.!?]*[.!?]/);
        if (sentenceMatch) {
            return sentenceMatch[0].trim();
        }
        
        // If no sentence found, return first 100 characters
        return contentStr.length > 100 ? `${contentStr.substring(0, 100)}...` : contentStr;
    };

    // Format hashtags as badges
    const renderHashtags = () => {
        if (!post.hashtags || post.hashtags.length === 0) return null;
        
        return (
            <div className="flex flex-wrap gap-1 mt-2">
                {post.hashtags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {tag}
                    </span>
                ))}
                {post.hashtags.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        +{post.hashtags.length - 3} more
                    </span>
                )}
            </div>
        );
    };

    // Format labels for status, pillar, modelUsed
    const renderLabels = () => {
        return (
            <div className="flex flex-wrap gap-1 mt-2">
                {post.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(post.status)}`}>
                        {post.status}
                    </span>
                )}
                {post.pillar && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {post.pillar}
                    </span>
                )}
                {post.modelUsed && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full truncate max-w-[120px]" title={post.modelUsed}>
                        {post.modelUsed}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div 
            className={`flex items-start p-4 border-b border-gray-200 transition-colors duration-200 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-green-50' : 'bg-white'}`}
            onClick={handleCardClick}
        >
            {/* Selection Checkbox - Left side */}
            <div className="pr-3 pt-1 no-expand flex-shrink-0">
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

            {/* Thumbnail Image - Left side */}
            <div className="w-24 flex-shrink-0 bg-gray-100 rounded overflow-hidden mr-4 self-stretch">
                {(post.contentType === 'Carousel' && imageUrls && imageUrls.length > 0) ? (
                    <img 
                        src={imageUrls[0]} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                    />
                ) : imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                    />
                ) : videoUrl ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                        <video 
                            src={videoUrl} 
                            className="w-full h-full object-cover" 
                            controls={false} 
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <VideoCameraIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <PhotographIcon className="h-6 w-6 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Content - Right side */}
            <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                    {getTitlePreview()}
                </h3>
                
                {/* Content Preview */}
                <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                    {getContentPreview()}
                </p>
                
                {/* Platform and Content Type Icons */}
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                        <Icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <span className="text-xs text-gray-500">{post.platform}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <ContentTypeIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <span className="text-xs text-gray-500">{post.contentType}</span>
                    </div>
                </div>
                
                {/* Labels (status, pillar, modelUsed) */}
                {renderLabels()}
                
                {/* Hashtags */}
                {renderHashtags()}
                
                {/* Timestamps */}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {publishedAt && (
                        <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span title={`Published: ${publishedAt}`}>{formatDate(publishedAt)}</span>
                        </div>
                    )}
                    {scheduledAt && (
                        <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span title={`Scheduled: ${scheduledAt}`}>{formatDate(scheduledAt)}</span>
                        </div>
                    )}
                    {post.publishedAt && (
                        <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span title={`Published: ${post.publishedAt}`}>{formatDate(post.publishedAt)}</span>
                        </div>
                    )}
                    {post.scheduledAt && (
                        <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span title={`Scheduled: ${post.scheduledAt}`}>{formatDate(post.scheduledAt)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCard;