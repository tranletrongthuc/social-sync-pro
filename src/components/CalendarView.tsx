
import React, { useMemo, useState } from 'react';
import type { MediaPlan, SchedulingPost, MediaPlanPost, PostInfo } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, PinterestIcon, SparklesIcon } from './icons';

interface CalendarViewProps {
  plan: MediaPlan;
  planId: string;
  language: string;
  onPostDrop: (postInfo: SchedulingPost, newDate: Date) => void;
  onViewDetails: (postInfo: PostInfo) => void;
}

const platformIcons: Record<string, React.FC<any>> = {
    YouTube: YouTubeIcon,
    Facebook: FacebookIcon,
    Instagram: InstagramIcon,
    TikTok: TikTokIcon,
    Pinterest: PinterestIcon
};

const PostLozenge: React.FC<{
    postInfo: SchedulingPost;
    onClick: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ postInfo, onClick, onDragStart }) => {
    const { post } = postInfo;
    const Icon = platformIcons[post.platform] || SparklesIcon;

    const platformColors: Record<string, string> = {
        YouTube: 'bg-red-100 border-red-200 text-red-800 hover:bg-red-200',
        Facebook: 'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200',
        Instagram: 'bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200',
        TikTok: 'bg-gray-200 border-gray-300 text-gray-800 hover:bg-gray-300',
        Pinterest: 'bg-red-100 border-red-200 text-red-800 hover:bg-red-200',
    };
    const colorClasses = platformColors[post.platform] || 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200';

    return (
        <div
            onClick={onClick}
            draggable={true}
            onDragStart={onDragStart}
            className={`rounded-md px-2 py-1 flex items-center gap-1.5 cursor-pointer transition-colors ${colorClasses}`}
            title={post.title}
        >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-medium truncate flex-1">{post.title}</span>
        </div>
    );
};


const CalendarView: React.FC<CalendarViewProps> = ({ plan, planId, language, onPostDrop, onViewDetails }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedOverDay, setDraggedOverDay] = useState<Date | null>(null);

    const handlePrevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const allPosts = useMemo(() => {
        const postsWithDate: (SchedulingPost & { date: Date })[] = [];
        
        (plan || []).forEach((week, weekIndex) => {
            (week.posts || []).forEach((post, postIndex) => {
                if (post.scheduledAt) { // Only include scheduled posts
                    const postDate = new Date(post.scheduledAt);
                    postsWithDate.push({ planId, weekIndex, postIndex, post, date: postDate });
                }
            });
        });
        return postsWithDate;
    }, [plan, planId]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday

        const grid: { date: Date; posts: SchedulingPost[]; isCurrentMonth: boolean }[] = [];
        
        // Days from previous month
        const prevMonthLastDay = new Date(year, month, 0);
        const prevMonthDays = prevMonthLastDay.getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            grid.push({
                date: new Date(year, month - 1, prevMonthDays - i),
                posts: [],
                isCurrentMonth: false
            });
        }
        
        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const postsForDay = allPosts.filter(p => p.date.toDateString() === date.toDateString());
            grid.push({ date, posts: postsForDay, isCurrentMonth: true });
        }

        // Days from next month
        const nextMonthStartDay = lastDayOfMonth.getDay();
        for (let i = 1; i < 7 - nextMonthStartDay; i++) {
             grid.push({
                date: new Date(year, month + 1, i),
                posts: [],
                isCurrentMonth: false
            });
        }
        
        return grid;
    }, [currentDate, allPosts]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, postInfo: SchedulingPost) => {
        e.dataTransfer.setData('application/json', JSON.stringify(postInfo));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, date: Date | null) => {
        e.preventDefault();
        if (date) setDraggedOverDay(date);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: Date | null) => {
        e.preventDefault();
        setDraggedOverDay(null);
        if (!date) return;
        
        try {
            const postInfoJSON = e.dataTransfer.getData('application/json');
            if (!postInfoJSON) return;
            const postInfo = JSON.parse(postInfoJSON) as SchedulingPost;
            onPostDrop(postInfo, date);
        } catch (err) {
            console.error("Failed to handle drop:", err);
        }
    };

    const dayHeaders = language === 'Việt Nam'
      ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
    const today = new Date().toDateString();

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Previous month">
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 capitalize">
                    {currentDate.toLocaleString(language === 'Việt Nam' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Next month">
                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {dayHeaders.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-500 py-2 bg-gray-50">
                        {day}
                    </div>
                ))}
                {calendarGrid.map((day, index) => (
                    <div 
                        key={index} 
                        className={`min-h-[8rem] p-1.5 flex flex-col transition-colors duration-200
                          ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                          ${draggedOverDay && day.date && draggedOverDay.toDateString() === day.date.toDateString() ? 'ring-2 ring-brand-green ring-inset' : ''}
                        `}
                        onDragOver={(e) => handleDragOver(e, day.date)}
                        onDragLeave={() => setDraggedOverDay(null)}
                        onDrop={(e) => handleDrop(e, day.date)}
                    >
                         <span className={`text-xs font-semibold self-start
                           ${day.date.toDateString() === today ? 'bg-brand-green text-white rounded-full h-5 w-5 flex items-center justify-center' : ''}
                           ${day.isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                         `}>
                            {day.date.getDate()}
                        </span>
                         <div className="flex-grow space-y-1.5 mt-1">
                            {day.posts.map((pInfo) => (
                                <PostLozenge
                                    key={pInfo.post.id}
                                    postInfo={pInfo}
                                    onClick={() => onViewDetails(pInfo)}
                                    onDragStart={(e) => handleDragStart(e, pInfo)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CalendarView;