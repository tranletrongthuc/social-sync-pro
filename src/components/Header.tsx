import React, { useState } from 'react';
import { Button } from './ui';
import { SettingsIcon, MenuIcon, CheckCircleIcon, LinkIcon, CollectionIcon, TagIcon, UsersIcon, LightBulbIcon, ListBulletIcon } from './icons';

export type ActiveTab = 'brandKit' | 'mediaPlan' | 'affiliateVault' | 'personas' | 'strategy' | 'taskManager';

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
    activeTab: ActiveTab;
    onClick: (tabId: ActiveTab) => void;
}> = ({ tabId, text, activeTab, onClick }) => (
    <button       
        onClick={() => onClick(tabId)}
        className={`flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap ${
        activeTab === tabId
        ? 'border-b-2 border-gray-800 text-gray-800' 
        : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent'
    }`}
    >
        {text}
    </button>
);

const AutoSaveIndicator: React.FC<{ status: HeaderProps['autoSaveStatus'], language: string }> = ({ status, language }) => {
    const T = { 
        'Việt Nam': { saving: 'Đang lưu...', saved: 'Đã lưu', error: 'Lỗi lưu' }, 
        'English': { saving: 'Saving...', saved: 'All changes saved', error: 'Save error' }
    };
    const texts = (T as any)[language] || T['English'];
    
    let content = null;
    switch(status) {
        case 'saving':
            content = <><div className="w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div><span>{texts.saving}</span></>;
            break;
        case 'saved':
            content = <><CheckCircleIcon className="h-5 w-5 text-green-600" /><span>{texts.saved}</span></>;
            break;
        case 'error':
            content = <><span className="text-red-500 font-bold">!</span><span>{texts.error}</span></>;
            break;
        default:
            return <div className="w-44 h-6 text-right">&nbsp;</div>;
    }
    
    return <div className="flex items-center gap-2 text-sm text-gray-500 w-44 justify-end">{content}</div>;
};

export const Header: React.FC<HeaderProps> = (props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const TABS_CONFIG = {
        'Việt Nam': {
            brandKit: 'Bộ Thương hiệu',
            mediaPlan: 'Kế hoạch TT',
            strategy: 'Chiến lược ND',
            affiliateVault: 'Kho Affiliate',
            personas: 'KOL/KOC',
            taskManager: 'Tác vụ',
            saveProject: 'Lưu dự án',
            savingProject: 'Đang lưu...',
            startOver: 'Bắt đầu lại',
            settings: 'Cài đặt',
        },
        'English': {
            brandKit: 'Brand Kit',
            mediaPlan: 'Media Plan',
            strategy: 'Strategy',
            affiliateVault: 'Affiliate Vault',
            personas: 'Personas',
            taskManager: 'Tasks',
            saveProject: 'Save Project',
            savingProject: 'Saving...',
            startOver: 'Start Over',
            settings: 'Settings',
        }
    }
    const currentTexts = (TABS_CONFIG as any)[props.language] || TABS_CONFIG['English'];

    const actionButtons = (isMobile: boolean = false) => {
        const buttonSize = isMobile ? 'lg' : 'sm';
        const commonMobileClasses = isMobile ? 'w-full !justify-start' : '';

        return (
            <>
                <Button onClick={props.onSaveProject} disabled={props.isSavingProject} variant="secondary" size={buttonSize} className={commonMobileClasses}>
                    {props.isSavingProject ? currentTexts.savingProject : currentTexts.saveProject}
                </Button>
                <Button onClick={props.onOpenSettings} variant="tertiary" size={buttonSize} icon={<SettingsIcon className="h-4 w-4"/>} className={commonMobileClasses}>
                    <span className={isMobile ? '' : 'hidden sm:inline'}>{currentTexts.settings}</span>
                </Button>
                <Button onClick={() => window.location.href = '/admin'} variant="tertiary" size={buttonSize} className={commonMobileClasses}>
                    <span className={isMobile ? '' : 'hidden sm:inline'}>Admin</span>
                </Button>
                 <Button onClick={props.onStartOver} variant="tertiary" size={buttonSize} className={`${commonMobileClasses} text-red-600 hover:bg-red-50`}>
                    {currentTexts.startOver}
                </Button>
            </>
        );
    }
    
    return (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-gray-200">
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold text-gray-900 whitespace-nowrap">SocialSync Pro</h1>
                </div>

                {/* Center Navigation (Desktop) */}
                <div className="hidden md:flex flex-grow items-center justify-center">
                    <nav className="flex items-center gap-2 lg:gap-4 -mb-px">
                        <TabButton tabId="brandKit" text={currentTexts.brandKit} activeTab={props.activeTab} onClick={props.setActiveTab} />
                        <TabButton tabId="strategy" text={currentTexts.strategy} activeTab={props.activeTab} onClick={props.setActiveTab} />
                        <TabButton tabId="mediaPlan" text={currentTexts.mediaPlan} activeTab={props.activeTab} onClick={props.setActiveTab} />
                        <TabButton tabId="affiliateVault" text={currentTexts.affiliateVault} activeTab={props.activeTab} onClick={props.setActiveTab} />
                        <TabButton tabId="personas" text={currentTexts.personas} activeTab={props.activeTab} onClick={props.setActiveTab} />
                        <TabButton tabId="taskManager" text={currentTexts.taskManager} activeTab={props.activeTab} onClick={props.setActiveTab} />
                    </nav>
                </div>

                {/* Right Section (Desktop) */}
                <div className="hidden md:flex items-center gap-2 justify-end">
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

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full border-b border-gray-200 bg-white/95 shadow-lg">
                    <nav className="flex flex-col p-2">
                        <TabButton tabId="brandKit" text={currentTexts.brandKit} activeTab={props.activeTab} onClick={(tab) => { props.setActiveTab(tab); setIsMenuOpen(false); }} />
                        <TabButton tabId="strategy" text={currentTexts.strategy} activeTab={props.activeTab} onClick={(tab) => { props.setActiveTab(tab); setIsMenuOpen(false); }} />
                        <TabButton tabId="mediaPlan" text={currentTexts.mediaPlan} activeTab={props.activeTab} onClick={(tab) => { props.setActiveTab(tab); setIsMenuOpen(false); }} />
                        <TabButton tabId="affiliateVault" text={currentTexts.affiliateVault} activeTab={props.activeTab} onClick={(tab) => { props.setActiveTab(tab); setIsMenuOpen(false); }} />
                        <TabButton tabId="personas" text={currentTexts.personas} activeTab={props.activeTab} onClick={(tab) => { props.setActiveTab(tab); setIsMenuOpen(false); }} />
                        <TabButton tabId="taskManager" text={currentTexts.taskManager} activeTab={props.activeTab} onClick={(tab) => { props.setActiveTab(tab); setIsMenuOpen(false); }} />
                    </nav>
                    <div className="border-t border-gray-200 p-4 flex flex-col gap-3">
                        <div className="self-end"><AutoSaveIndicator status={props.autoSaveStatus} language={props.language} /></div>
                        {actionButtons(true)}
                    </div>
                </div>
            )}
        </header>
    );
};