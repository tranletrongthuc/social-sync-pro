import React from 'react';

// Helper for standard UI icons
const UIIcon: React.FC<{ path: React.ReactNode, className?: string, viewBox?: string, fill?: string, strokeWidth?: number }> = ({ path, className, viewBox = "0 0 24 24", fill = "none", strokeWidth = 2 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill={fill} viewBox={viewBox} stroke="currentColor" strokeWidth={strokeWidth}>
        {path}
    </svg>
);

// --- Platform Icons ---

export const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-8 w-8 text-red-600"}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" />
  </svg>
);

export const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-8 w-8 text-blue-600"}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const InstagramIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-8 w-8 text-pink-600"}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

export const TikTokIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-8 w-8 text-gray-800"}>
    <path d="M12 12a4 4 0 1 0 4 4v-12a5 5 0 0 0-5-5v12a5 5 0 0 0 5 5z" />
  </svg>
);

export const PinterestIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-8 w-8 text-red-600"}>
    <path d="M12 12a5 5 0 0 0-5 5c0 2.76 2.24 5 5 5s5-2.24 5-5a5 5 0 0 0-5-5z" /><path d="M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10s10-4.48 10-10A10 10 0 0 0 12 2z" /><path d="m9 12 6 6" />
  </svg>
);

export const DatabaseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8 text-sky-500"} fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.62,4.38l-2.54-2.54L12,9.07L4.92,1.84L2.38,4.38l7.07,7.07L2.38,18.52l2.54,2.54L12,13.83l7.07,7.07l2.54-2.54 l-7.07-7.07L21.62,4.38z"/>
    </svg>
);

export const KhongMinhIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.2,12.7C21.7,12.4,22,11.9,22,11.3V5.5c0-1.2-0.9-2,2-2h-0.2c-0.5,0-1,0.2-1.4,0.6L12,9.3L5.6,3.9C5.2,3.5,4.7,3.3,4.2,3.3 H4c-1.1,0-2,0.8-2,2v5.8c0,0.6,0.3,1.1,0.8,1.4l7.2,4.5l-4,2.5C5.5,18.1,5,18.7,5,19.5c0,1,0.8,1.8,1.8,1.8h0.4 c0.5,0,0.9-0.2,1.3-0.5l4.5-3.2l4.5,3.2c0.4,0.3,0.8,0.5,1.3,0.5h0.4c1,0,1.8-0.8,1.8-1.8c0-0.8-0.5-1.4-1.2-1.7l-4-2.5L21.2,12.7 z" />
    </svg>
);

// --- UI Icons ---

export const DocumentTextIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></>} />;
export const DownloadIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></>} />;
export const SparklesIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="m12 3-1.9 4.2-4.3.6 3.1 3-1 4.2 3.8-2 3.8 2-1-4.2 3.1-3-4.3-.6z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></>} />;
export const ArchiveIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></>} />;
export const UploadIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></>} />;
export const CopyIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>} />;
export const PlugIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 11v-1a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1a6 6 0 0 1 1 8h-2a6 6 0 0 1 1-8v-1a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1" /><path d="M6 11v-1a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a6 6 0 0 0-1 8h2a6 6 0 0 0-1-8v-1a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1" /></>} />;
export const PlusIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></>} />;
export const CheckIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path d="M20 6 9 17l-5-5" />} />;
export const CheckCircleIcon = ({ className }: { className?: string }) => <UIIcon className={className} fill="currentColor" strokeWidth={0} path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />;
export const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;

export const StarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" /></svg>;
export const SettingsIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M12.22 2h.44a2 2 0 0 1 2 2v.18a2 2 0 0 0 1.73 1.73h.18a2 2 0 0 1 2 2v.44a2 2 0 0 0 1.73 1.73h.18a2 2 0 0 1 2 2v.44a2 2 0 0 0 1.73 1.73h.18a2 2 0 0 1 2 2v.44a2 2 0 0 1-2 2h-.18a2 2 0 0 0-1.73 1.73v.18a2 2 0 0 1-2 2h-.44a2 2 0 0 1-2-2v-.18a2 2 0 0 0-1.73-1.73h-.18a2 2 0 0 1-2-2v-.44a2 2 0 0 0-1.73-1.73h-.18a2 2 0 0 1-2-2v-.44a2 2 0 0 0-1.73-1.73h-.18a2 2 0 0 1-2-2v-.44a2 2 0 0 1 2-2h.18a2 2 0 0 0 1.73-1.73v-.18a2 2 0 0 1 2-2h.44z" /><circle cx="12" cy="12" r="3" /></>} />;
export const MenuIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></>} />;
export const TagIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
);
export const TrashIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />;
export const PencilIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>} />;
export const CashIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="6" x2="6.01" y1="12" y2="12" /><line x1="18" x2="18.01" y1="12" y2="12" /></>} />;
export const ScaleIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /><path d="M12 18a6 6 0 1 1 6-6 6 6 0 0 1-6 6z" /></>} />;
export const CollectionIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>} />;
export const SearchIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>} />;
export const DotsVerticalIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></>} />;
export const CalendarIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></>} />;
export const ListBulletIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></>} />;
export const ChevronLeftIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="m15 18-6-6 6-6" /></>} />;
export const ChevronRightIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="m9 18 6-6-6-6" /></>} />;
export const ChevronDownIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="m6 9 6 6 6-6" /></>} />;
export const CheckSolidIcon = ({ className }: { className?: string }) => <UIIcon className={className} fill="currentColor" viewBox="0 0 20 20" path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />
export const ChatBubbleLeftIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>} />;
export const PhotographIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>} />;
export const InformationCircleIcon = ({ className }: { className?: string }) => <UIIcon className={className} fill="currentColor" viewBox="0 0 20 20" path={<><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="16" y2="12" /><line x1="12" x2="12.01" y1="8" y2="8" /></>} />
export const VideoCameraIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M22 8a2 2 0 0 1-2 2h-7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>} />;
export const UsersIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />;
export const LightBulbIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 8A6 6 0 0 0 6 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></>} />;
export const XIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></>} />;
export const ArrowPathIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6.4 2.6l-1.4 1.4" /><path d="M21 2v6h-6" /></>} />;

// Funnel Icon - New addition
export const FunnelIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);