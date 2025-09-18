import React from 'react';
import { CollectionIcon as ClipboardListIcon, UsersIcon as UsersGroupIcon, TagIcon as ColorSwatchIcon, LightBulbIcon, LinkIcon } from './icons';
import { ActiveTab } from './Header';

interface BottomTabBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const navItems: { tab: ActiveTab; label: string; icon: React.ElementType }[] = [
  { tab: 'mediaPlan', label: 'Media Plan', icon: ClipboardListIcon },
  { tab: 'strategy', label: 'Strategy', icon: LightBulbIcon },
  { tab: 'affiliateVault', label: 'Affiliate', icon: LinkIcon },
  { tab: 'personas', label: 'Personas', icon: UsersGroupIcon },
  { tab: 'brandKit', label: 'Brand Kit', icon: ColorSwatchIcon },
];

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg lg:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors duration-200 ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}>
            <Icon className="h-6 w-6 mb-1" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomTabBar;
