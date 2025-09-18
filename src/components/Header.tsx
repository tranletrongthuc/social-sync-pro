


import React, { useState } from 'react';
import { Button } from './ui';
import { SettingsIcon, PlugIcon, ArchiveIcon, MenuIcon, CheckCircleIcon, LinkIcon, CollectionIcon, TagIcon, UsersIcon, LightBulbIcon } from './icons';

export type ActiveTab = 'brandKit' | 'mediaPlan' | 'affiliateVault' | 'personas' | 'strategy';

interface HeaderProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    onSaveProject: () => void;
    isSavingProject: boolean;
    onStartOver: () => void;
    autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
    onOpenSettings: () => void;
    onOpenIntegrations: () => void;
    language: string;
}

const TabButton: React.FC<{
    tabId: ActiveTab;
    text: string;
    icon: React.ReactNode;
    activeTab: ActiveTab;
    onClick: (tabId: ActiveTab) => void;
}> = ({ tabId, text, icon, activeTab, onClick }) => (
    <button       
        onClick={() => {
        console.log("Tab button clicked:", tabId);
        onClick(tabId);
    }}
    className={`flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap ${
        activeTab === tabId
        ? 'border-b-2 border-gray-800 text-gray-800' 
        : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent'
    }`}
    >
        {icon}
        {text}
        </button>
    );

const AutoSaveIndicator: React.FC<{ status: HeaderProps['autoSaveStatus'], language: string }> = ({ status, language }) => {
    console.log('AutoSaveIndicator rendering with status:', status);
    const T = { 
        'Việt Nam': { saving: 'Đang lưu...', saved: 'Đã lưu', error: 'Lỗi lưu' }, 
        'English': { saving: 'Saving...', saved: 'All changes saved', error: 'Save error' }
    };
    const texts = (T as any)[language] || T['English'];
    
    let content = null;
    switch(status) {
        case 'saving':
            content = (
                <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div>
                    <span>{texts.saving}</span>
                </>
            );
            break;
        case 'saved':
            content = (
                <>
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span>{texts.saved}</span>
                </>
            );
            break;
        case 'error':
            content = (
                <>
                    <span className="text-red-500 font-bold">!</span>
                    <span>{texts.error}</span>
                </>
            );
            break;
        default:
            return <div className="w-44 h-6 text-right">&nbsp;</div>; // Keep space for layout consistency
    }
    
    return (
        <div className="flex items-center gap-2 text-sm text-gray-500 w-44 justify-end">
            {content}
        </div>
    )
};


export const Header: React.FC<HeaderProps> = (props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const TABS_CONFIG = {
        'Việt Nam': {
            brandKit: { text: 'Bộ Thương hiệu', icon: <TagIcon className="h-5 w-5"/> },
            mediaPlan: { text: 'Kế hoạch Truyền thông', icon: <CollectionIcon className="h-5 w-5"/> },
            strategy: { text: 'Chiến lược Nội dung', icon: <LightBulbIcon className="h-5 w-5"/> },
            affiliateVault: { text: 'Kho Affiliate', icon: <LinkIcon className="h-5 w-5"/> },
            personas: { text: 'KOL/KOC', icon: <UsersIcon className="h-5 w-5"/> },
            saveProject: 'Lưu dự án',
            savingProject: 'Đang lưu...',
            startOver: 'Bắt đầu lại',
            settings: 'Cài đặt',
        },
        'English': {
            brandKit: { text: 'Brand Kit', icon: <TagIcon className="h-5 w-5"/> },
            mediaPlan: { text: 'Media Plan', icon: <CollectionIcon className="h-5 w-5"/> },
            strategy: { text: 'Content Strategy', icon: <LightBulbIcon className="h-5 w-5"/> },
            affiliateVault: { text: 'Affiliate Vault', icon: <LinkIcon className="h-5 w-5"/> },
            personas: { text: 'KOL/KOC', icon: <UsersIcon className="h-5 w-5"/> },
            saveProject: 'Save Project',
            savingProject: 'Saving...',
            startOver: 'Start Over',
            settings: 'Settings',
        }
    }
    const currentTexts = (TABS_CONFIG as any)[props.language] || TABS_CONFIG['English'];

    const actionButtons = (isMobile: boolean = false) => {
        const mobileClasses = isMobile ? 'w-full !justify-start text-base' : '';
        return (
            <>
                <Button onClick={props.onSaveProject} disabled={props.isSavingProject} variant="secondary" className={`${mobileClasses}`}>
                    {props.isSavingProject ? currentTexts.savingProject : currentTexts.saveProject}
                </Button>
                <Button onClick={props.onOpenSettings} variant="tertiary" className={`flex items-center gap-2 ${mobileClasses}`}>
                    <SettingsIcon className="h-5 w-5"/>
                    <span>{currentTexts.settings}</span>
                </Button>
                <Button onClick={() => window.location.href = '/admin'} variant="tertiary" className={`flex items-center gap-2 ${mobileClasses}`}>
                    <span>Admin</span>
                </Button>
                 <Button onClick={props.onStartOver} variant="tertiary" className={`text-red-600 hover:bg-red-50 ${mobileClasses}`}>
                    {currentTexts.startOver}
                </Button>
            </>
        );
    }
    
    return (
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg">
             <div className="border-b border-gray-200">
                <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16">
                    <h1 className="text-xl font-semibold text-gray-900">SocialSync Pro</h1>
                    
                    {/* Desktop Buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        <AutoSaveIndicator status={props.autoSaveStatus} language={props.language} />
                        {actionButtons(false)}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <Button variant="tertiary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <MenuIcon className="h-6 w-6"/>
                        </Button>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-b border-gray-200 p-4 bg-white/95">
                    <div className="flex flex-col gap-3">
                        <div className="self-end"><AutoSaveIndicator status={props.autoSaveStatus} language={props.language} /></div>
                        {actionButtons(true)}
                    </div>
                </div>
            )}
            <div className="border-b border-gray-200 hidden md:block">
                <div className="px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-8 overflow-x-auto whitespace-nowrap -mb-px">
                         <TabButton tabId="brandKit" text={currentTexts.brandKit.text} icon={currentTexts.brandKit.icon} activeTab={props.activeTab} onClick={props.setActiveTab} />
                         <TabButton tabId="strategy" text={currentTexts.strategy.text} icon={currentTexts.strategy.icon} activeTab={props.activeTab} onClick={props.setActiveTab} />
                         <TabButton tabId="mediaPlan" text={currentTexts.mediaPlan.text} icon={currentTexts.mediaPlan.icon} activeTab={props.activeTab} onClick={props.setActiveTab} />
                         <TabButton tabId="affiliateVault" text={currentTexts.affiliateVault.text} icon={currentTexts.affiliateVault.icon} activeTab={props.activeTab} onClick={props.setActiveTab} />
                         <TabButton tabId="personas" text={currentTexts.personas.text} icon={currentTexts.personas.icon} activeTab={props.activeTab} onClick={props.setActiveTab} />
                    </nav>
                </div>
            </div>
        </header>
    );
};