import React from 'react';
import type { AffiliateLink } from '../../../types';
import AffiliateVaultDisplay from '../AffiliateVaultDisplay';
import StandardPageView from '../StandardPageView';
import { RefreshIcon, PlusIcon, DownloadIcon } from '../icons';

interface AffiliateVaultContentProps {
  affiliateLinks: AffiliateLink[];
  onSaveLink: (link: AffiliateLink) => void;
  onDeleteLink: (linkId: string) => void;
  onImportLinks: (links: AffiliateLink[]) => void;
  onReloadLinks: () => void;
  onGenerateIdeasFromProduct: (product: AffiliateLink) => void;
  generatingIdeasForProductId?: string | null;
  language: string;
  mongoBrandId: string | null;
  onLoadData?: (brandId: string) => Promise<void>;
  isDataLoaded?: boolean;
  isLoading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

const AffiliateVaultContent: React.FC<AffiliateVaultContentProps> = (props) => {
  const T = {
    'Việt Nam': {
      title: "Kho Affiliate",
      description: "Quản lý các liên kết tiếp thị liên kết",
      refresh: "Làm mới",
      loading: "Đang tải...",
      addLink: "Thêm liên kết"
    },
    'English': {
      title: "Affiliate Vault",
      description: "Manage your affiliate links",
      refresh: "Refresh",
      loading: "Loading...",
      addLink: "Add Link"
    }
  };
  const texts = (T as any)[props.language] || T['English'];

  return (
    <StandardPageView
      title={texts.title}
      subtitle={texts.description}
      actions={
        <div className="flex flex-row gap-2">
          <button 
            onClick={() => {
              // This would open the add link modal, which is handled by the component
              const event = new CustomEvent('addAffiliateLink');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed bg-brand-green text-white hover:bg-brand-green-dark flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            {texts.addLink}
          </button>
          <button 
            onClick={props.onRefresh}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Refresh data"
            disabled={props.isLoading}
          >
            <RefreshIcon className={`h-5 w-5 text-gray-600 ${props.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <AffiliateVaultDisplay
        affiliateLinks={props.affiliateLinks}
        onSaveLink={props.onSaveLink}
        onDeleteLink={props.onDeleteLink}
        onImportLinks={props.onImportLinks}
        onReloadLinks={props.onReloadLinks}
        onGenerateIdeasFromProduct={props.onGenerateIdeasFromProduct}
        generatingIdeasForProductId={props.generatingIdeasForProductId}
        language={props.language}
        mongoBrandId={props.mongoBrandId}
        onLoadData={props.onLoadData}
        isDataLoaded={props.isDataLoaded}
        isLoading={props.isLoading}
      />
    </StandardPageView>
  );
};

export default AffiliateVaultContent;