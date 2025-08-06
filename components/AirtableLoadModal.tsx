import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui';
import { AirtableIcon } from './icons';
import { listBrandsFromAirtable } from '../services/airtableService';

interface AirtableLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (brandId: string) => Promise<void>;
  language: string;
  ensureCredentials: () => Promise<boolean>;
}

const AirtableLoadModal: React.FC<AirtableLoadModalProps> = ({ isOpen, onClose, onLoadProject, language, ensureCredentials }) => {
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const T = {
      'Việt Nam': {
          title: "Tải từ Airtable",
          subtitle: "Chọn một thương hiệu để tải. Thao tác này sẽ tải bộ thương hiệu và danh sách các kế hoạch truyền thông của nó.",
          noProjects: "Không tìm thấy dự án nào trong bảng 'Brand Kit'.",
          loadButton: "Tải Thương hiệu",
          loadingButton: "Đang tải...",
          cancelButton: "Đóng",
          errorTitle: "Lỗi Kết nối",
          envNotSetMessage: "Tích hợp Airtable chưa được cấu hình. Vui lòng cung cấp thông tin đăng nhập trong bảng Tích hợp.",
      },
      'English': {
          title: "Load from Airtable",
          subtitle: "Select a brand to load. This will load the brand kit and its list of media plans.",
          noProjects: "No projects found in the 'Brand Kit' table.",
          loadButton: "Load Brand",
          loadingButton: "Loading...",
          cancelButton: "Close",
          errorTitle: "Connection Error",
          envNotSetMessage: "Airtable integration is not configured. Please provide credentials in the Integrations panel.",
      }
  };
  const texts = (T as any)[language] || T['English'];

  useEffect(() => {
    if (!isOpen) {
        return;
    }

    const fetchBrands = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const hasCreds = await ensureCredentials();
            if (!hasCreds) {
                setError(texts.envNotSetMessage);
                setIsLoading(false);
                return;
            }
            
            const brandList = await listBrandsFromAirtable();
            setBrands(brandList);

        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred while fetching brands.");
        } finally {
            setIsLoading(false);
        }
    };

    fetchBrands();

  }, [isOpen, ensureCredentials, language, texts.envNotSetMessage]);


  const handleSelectBrand = async (brand: {id: string, name: string}) => {
    setIsLoading(true);
    setError(null);
    try {
        await onLoadProject(brand.id);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project.");
        setIsLoading(false);
    }
  }

  const resetAndClose = () => {
    setBrands([]);
    setError(null);
    onClose();
  };
  
  if (!isOpen) return null;

  const hasCredentials = !!(window as any).process.env.AIRTABLE_PAT && !!(window as any).process.env.AIRTABLE_BASE_ID;
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={resetAndClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 border border-gray-200 m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <AirtableIcon className="h-8 w-8 text-sky-500" />
              {texts.title}
            </h2>
            <p className="text-gray-500 mt-1 font-serif">{texts.subtitle}</p>
          </div>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 relative" role="alert">
                <strong className="font-bold">{texts.errorTitle}:</strong>
                <span className="block sm:inline ml-2">{error}</span>
            </div>
        )}

        {isLoading ? (
            <div className="flex justify-center items-center h-40"><div className="w-8 h-8 border-2 border-t-transparent border-brand-green rounded-full animate-spin"></div></div>
        ) : hasCredentials && !error ? (
            <div>
                {brands.length > 0 ? (
                    <ul className="space-y-2 max-h-80 overflow-y-auto">
                        {brands.map(brand => (
                            <li key={brand.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <span className="text-gray-800 font-medium">{brand.name}</span>
                                <Button onClick={() => handleSelectBrand(brand)} disabled={isLoading} variant="secondary" className="text-sm py-1 px-3">
                                    {isLoading ? texts.loadingButton : texts.loadButton}
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-center text-gray-500 py-10">{texts.noProjects}</p>}
                <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                    <Button type="button" onClick={resetAndClose} variant="tertiary">{texts.cancelButton}</Button>
                </div>
            </div>
        ) : (
             <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                <Button type="button" onClick={resetAndClose} variant="tertiary">{texts.cancelButton}</Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AirtableLoadModal;