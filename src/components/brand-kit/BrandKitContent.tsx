import React from 'react';
import type { GeneratedAssets, PostInfo } from '../../../types';
import AssetDisplay from '../AssetDisplay';
import StandardPageView from '../StandardPageView';
import { RefreshIcon } from '../icons';

interface BrandKitContentProps {
  assets: GeneratedAssets;
  language: string;
  onExport: () => void;
  isExporting: boolean;
  mongoBrandId: string | null;
  onLoadData?: (brandId: string) => Promise<void>;
  onGenerateImage?: (prompt: string, key: string, aspectRatio?: "1:1" | "16:9", postInfo?: PostInfo) => void;
  onSetImage?: (dataUrl: string, key: string, postInfo?: PostInfo) => void;
  generatedImages?: Record<string, string>;
  isGeneratingImage?: (key: string) => boolean;
  onRefresh?: () => Promise<void> | void;
  isLoading?: boolean;
}

const BrandKitContent: React.FC<BrandKitContentProps> = ({
  assets,
  language,
  onExport,
  isExporting,
  mongoBrandId,
  onLoadData,
  onGenerateImage,
  onSetImage,
  generatedImages = {},
  isGeneratingImage = () => false,
  onRefresh,
  isLoading = false
}) => {
  const T = {
    'Việt Nam': {
      title: "Bộ Thương hiệu",
      description: "Tạo và quản lý tài sản thương hiệu của bạn",
      refresh: "Làm mới",
      loading: "Đang tải...",
      export: "Xuất"
    },
    'English': {
      title: "Brand Kit",
      description: "Create and manage your brand assets",
      refresh: "Refresh",
      loading: "Loading...",
      export: "Export"
    }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <StandardPageView
      title={texts.title}
      subtitle={texts.description}
      actions={
        <div className="flex flex-row gap-2">
          <button 
            onClick={onExport}
            disabled={isExporting}
            className="px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed bg-brand-green text-white hover:bg-brand-green-dark"
          >
            {isExporting ? 'Exporting...' : texts.export}
          </button>
          <button 
            onClick={onRefresh}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Refresh data"
            disabled={isLoading}
          >
            <RefreshIcon className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <AssetDisplay 
        assets={assets}
        onGenerateImage={(prompt, key, aspectRatio) => onGenerateImage ? onGenerateImage(prompt, key, aspectRatio, undefined) : {}}
        onSetImage={(dataUrl, key) => onSetImage ? onSetImage(dataUrl, key, undefined) : {}}
        generatedImages={generatedImages}
        isGeneratingImage={isGeneratingImage}
        language={language}
        onExport={onExport}
        isExporting={isExporting}
        mongoBrandId={mongoBrandId}
        onLoadData={onLoadData}
      />
    </StandardPageView>
  );
};

export default BrandKitContent;