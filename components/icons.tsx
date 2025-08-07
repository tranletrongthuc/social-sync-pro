





import React from 'react';

// Helper for standard UI icons
const UIIcon: React.FC<{ path: React.ReactNode, className?: string, viewBox?: string, fill?: string, strokeWidth?: number }> = ({ path, className, viewBox = "0 0 24 24", fill = "none", strokeWidth = 2 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill={fill} viewBox={viewBox} stroke="currentColor" strokeWidth={strokeWidth}>
        {path}
    </svg>
);

// --- Platform Icons ---

export const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8 text-red-600"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21.58 7.19C21.36 6.47 20.76 5.87 20 5.65C18.25 5.25 12 5.25 12 5.25s-6.25 0-8 .4C3.24 5.87 2.64 6.47 2.42 7.19C2 8.94 2 12 2 12s0 3.06.42 4.81c.22.72.82 1.32 1.54 1.54C5.75 18.75 12 18.75 12 18.75s6.25 0 8-.4c.72-.22 1.32-.82 1.54-1.54C22 15.06 22 12 22 12s0-3.06-.42-4.81zM10 14.75v-5.5L15 12l-5 2.75z"/>
  </svg>
);

export const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8 text-blue-600"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22,12c0-5.523-4.477-10-10-10S2,6.477,2,12c0,4.99,3.657,9.128,8.438,9.879V14.89h-2.54V12h2.54V9.797 c0-2.506,1.492-3.89,3.777-3.89c1.094,0,2.238,0.195,2.238,0.195v2.46h-1.26c-1.24,0-1.628,0.772-1.628,1.562V12h2.773l-0.443,2.89h-2.33V21.88C18.343,21.128,22,16.99,22,12z"/>
  </svg>
);

export const InstagramIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8 text-pink-600"} fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 2H16C19.33 2 22 4.67 22 8V16C22 19.33 19.33 22 16 22H8C4.67 22 2 19.33 2 16V8C2 4.67 4.67 2 8 2M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7M12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9M16.5 6A1.5 1.5 0 0 1 15 7.5A1.5 1.5 0 0 1 16.5 9A1.5 1.5 0 0 1 18 7.5A1.5 1.5 0 0 1 16.5 6Z" />
    </svg>
);

export const TikTokIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8 text-gray-800"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-1.06-.6-1.92-1.44-2.56-2.48-1.17-1.85-1.85-4.05-1.8-6.23C.04 10.8.35 9.52 1.07 8.44c.88-1.29 2.3-2.11 3.86-2.29.02-3.78.01-7.56.02-11.33h7.58z"/>
  </svg>
);

export const PinterestIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8 text-red-600"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12,2C6.477,2,2,6.477,2,12c0,4.237,2.636,7.855,6.356,9.312c-0.088-0.791-0.167-2.005,0.035-2.868 c0.182-0.78,1.172-4.97,1.172-4.97s-0.299-0.6-0.299-1.486c0-1.39,0.806-2.428,1.81-2.428c0.852,0,1.264,0.64,1.264,1.408 c0,0.858-0.545,2.14-0.828,3.326c-0.236,1.005,0.5,1.83,1.508,1.83c1.808,0,3.199-1.9,3.199-4.661c0-2.476-1.748-4.31-5.16-4.31 c-3.41,0-5.495,2.559-5.495,5.107c0,0.983,0.345,2.029,0.778,2.586c0.117,0.152,0.142,0.264,0.106,0.411 c-0.038,0.16-0.126,0.502-0.162,0.643c-0.048,0.19-0.224,0.245-0.412,0.155c-1.543-0.576-2.527-2.28-2.527-3.95 c0-2.072,1.503-4.949,6.01-4.949c3.167,0,5.334,2.261,5.334,5.201c0,3.14-1.986,5.589-4.757,5.589 c-0.995,0-1.928-0.519-2.258-1.125c0,0-0.493,1.954-0.588,2.339c-0.187,0.762-0.428,1.603-0.66,2.288 C9.46,21.84,10.692,22,12,22c5.523,0,10-4.477,10-10S17.523,2,12,2z"/>
  </svg>
);

export const AirtableIcon = ({ className }: { className?: string }) => (
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

export const DownloadIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />} />;
export const SparklesIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 17.657l-2.828 2.828m0 0l-2.828-2.828m2.828 2.828l2.828 2.828m-2.828-2.828l2.828-2.828M15 3v4M13 5h4M17.657 6.343l2.828-2.828m0 0l2.828 2.828m-2.828-2.828L17.657 9.172M12 21a9 9 0 100-18 9 9 0 000 18z" />} />;
export const ArchiveIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />} />;
export const UploadIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />} />;
export const CopyIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />} />;
export const PlugIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M6.729 15.226s-2.43-1.121-2.43-3.363C4.299 9.613 6.136 7.776 8.583 7.776c2.447 0 4.284 1.837 4.284 4.087 0 2.242-2.43 3.363-2.43 3.363m-4.284 0a2.43 2.43 0 01-2.43-2.43" />} />;
export const PlusIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />} />;
export const CheckCircleIcon = ({ className }: { className?: string }) => <UIIcon className={className} fill="currentColor" strokeWidth={0} path={<path fillRule="evenodd" clipRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />} />;
export const LinkIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />} />;
export const SettingsIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.052-.022c.563-.24 1.224-.265 1.787-.075l.042.014c.54.196.945.69 1.105 1.242l.016.056c.146.563.098 1.18-.13 1.74l-.046.115c-.244.563-.738 1.007-1.328 1.226l-.052.022c-.563.24-1.224.265-1.787.075l-.042-.014c-.54-.196-.945.69-1.105-1.242l-.016-.056c-.146-.563-.098-1.18.13-1.74l.046-.115zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM12 21a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z" />} />;
export const MenuIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />} />;
export const TagIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" />
    </svg>
);
export const TrashIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />} />;
export const PencilIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L13.5 6.5z" />} />;
export const CashIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />} />;
export const ScaleIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />} />;
export const CollectionIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h-2m-2 0h-4m-2 0H5" />} />;
export const SearchIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />} />;
export const DotsVerticalIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />} />;
export const CalendarIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />} />;
export const ListBulletIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />} />;
export const ChevronLeftIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />} />;
export const ChevronRightIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />} />;
export const ChevronDownIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />} />;
export const CheckSolidIcon = ({ className }: { className?: string }) => <UIIcon className={className} fill="currentColor" viewBox="0 0 20 20" path={<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />} />
export const ChatBubbleLeftIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00-1.925-2.007c-.417-.282-.82-.623-1.14-.994a4.48 4.48 0 00-1.022-1.071 4.48 4.48 0 00-.994-1.14c-.37-.32-.712-.724-.994-1.14a4.48 4.48 0 00-2.007-1.925 4.48 4.48 0 00-.065-.474c-.02-.16-.04-.323-.055-.488A8.25 8.25 0 012.25 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />} />;
export const PhotographIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />} />;
export const InformationCircleIcon = ({ className }: { className?: string }) => <UIIcon className={className} fill="currentColor" viewBox="0 0 20 20" path={<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />} />
export const VideoCameraIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />} />
export const UsersIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 12a4.125 4.125 0 100-8.25 4.125 4.125 0 000 8.25z" />} />
export const LightBulbIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />} />;
export const XIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />} />;
export const ArrowPathIcon = ({ className }: { className?: string }) => <UIIcon className={className} path={<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.695v4.992h-4.992v-4.992z" />} />;