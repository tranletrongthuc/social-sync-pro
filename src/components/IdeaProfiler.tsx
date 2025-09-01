import React, { useState, useEffect, useRef } from 'react';
import { Button, TextArea } from './ui';
import { SparklesIcon, PlugIcon, UploadIcon, PlusIcon } from './icons';
import { listBrandsFromDatabase } from '../services/databaseService';

interface IdeaProfilerProps {
  onGenerateProfile: (idea: string) => void;
  isLoading: boolean;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadProjectFromDatabase: (brandId: string) => void;
  onOpenIntegrations: () => void;
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  integrationsVersion: number;
  areCredentialsSet: boolean;
}

const IdeaProfiler: React.FC<IdeaProfilerProps> = ({ onGenerateProfile, isLoading, onLoadProject, onLoadProjectFromDatabase, onOpenIntegrations, language, setLanguage, integrationsVersion, areCredentialsSet }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [idea, setIdea] = useState('');
  const [brands, setBrands] = useState<{ id: string, name: string }[]>([]);
  const [isFetchingBrands, setIsFetchingBrands] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCredentialsAndFetch = async () => {
      if (areCredentialsSet) {
        setIsFetchingBrands(true);
        setError(null);
        try {
          const fetchedBrands = await listBrandsFromDatabase();
          setBrands(fetchedBrands);
        } catch (err) {
          console.error("Failed to fetch brands from Database:", err);
          setError(err instanceof Error ? err.message : "Could not fetch projects.");
        } finally {
          setIsFetchingBrands(false);
        }
      } else {
        setBrands([]); // Clear brands if credentials are not set
      }
    };
    checkCredentialsAndFetch();
  }, [integrationsVersion, areCredentialsSet]);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      onGenerateProfile(idea);
    }
  };

  const texts = {
    'Việt Nam': {
      title: 'SocialSync Pro',
      welcomeTitle: "Bắt đầu với ý tưởng lớn của bạn",
      welcomeSubtitle: "Mô tả ý tưởng kinh doanh hoặc thương hiệu của bạn, và chúng tôi sẽ tạo ra một hồ sơ chuyên nghiệp để bắt đầu.",
      placeholder: "Vd: Một hộp đăng ký hàng tháng cho đồ chơi chó thân thiện với môi trường, được sản xuất tại địa phương và bền vững.",
      generateButton: 'Tạo hồ sơ thương hiệu',
      generateButtonLoading: 'Đang tạo...',
      connectDB: "Kết nối Cơ sở dữ liệu",
      loadFile: "Tải dự án",
      yourProjects: "Hoặc tiếp tục với một dự án hiện có",
      loadingProjects: "Đang tải dự án...",
      footerText: "Cung cấp bởi Google Gemini",
      noProjectsFound: "Không tìm thấy dự án nào trong cơ sở dữ liệu của bạn.",
    },
    'English': {
      title: 'SocialSync Pro',
      welcomeTitle: "Start with your big idea",
      welcomeSubtitle: "Describe your business or brand concept, and we'll generate a professional profile to get you started.",
      placeholder: 'e.g., A subscription box for eco-friendly dog toys, locally made and sustainable.',
      generateButton: 'Generate Brand Profile',
      generateButtonLoading: 'Generating...',
      connectDB: "Connect Database",
      loadFile: "Load Project",
      yourProjects: "Or continue with an existing project",
      loadingProjects: "Loading projects...",
      footerText: "Powered by Google Gemini",
      noProjectsFound: "No projects found in your database.",
    }
  };
  const currentTexts = (texts as any)[language] || texts['English'];
  
  return (
    <div className="bg-brand-light text-dark-text font-sans flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex-shrink-0">
                    <h1 className="text-xl font-bold text-dark-text">{currentTexts.title}</h1>
                </div>
                <div className="flex items-center">
                    <select
                        id="language"
                        value={language}
                        onChange={async (e) => await setLanguage(e.target.value)}
                        className="text-sm bg-transparent border-gray-300 rounded-md py-1.5 focus:ring-brand-green focus:border-brand-green"
                    >
                        <option value="Việt Nam">VI</option>
                        <option value="English">EN</option>
                    </select>
                </div>
            </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center py-12 sm:py-20">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-dark-text leading-tight">{currentTexts.welcomeTitle}</h1>
                <p className="mt-4 text-lg text-dark-subtle font-serif max-w-2xl mx-auto">{currentTexts.welcomeSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 max-w-2xl mx-auto">
                <TextArea
                    id="idea"
                    name="idea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    required
                    placeholder={currentTexts.placeholder}
                    rows={4}
                    className="text-lg p-4 shadow-lg border-gray-300 focus:border-brand-green focus:ring-brand-green"
                />
                <Button type="submit" disabled={isLoading || !idea.trim()} className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-lg">
                    {isLoading ? (
                        currentTexts.generateButtonLoading
                    ) : (
                        <>
                            <SparklesIcon className="h-6 w-6" />
                            {currentTexts.generateButton}
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-12">
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-brand-light px-4 text-sm font-medium text-dark-subtle">{currentTexts.yourProjects}</span>
                    </div>
                </div>

                <div className="mt-6 flex justify-center gap-4">
                    {!areCredentialsSet && (
                        <Button variant="secondary" onClick={onOpenIntegrations} className="flex items-center gap-2">
                            <PlugIcon className="h-5 w-5"/> {currentTexts.connectDB}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={handleLoadClick} className="flex items-center gap-2">
                        <UploadIcon className="h-5 w-5"/> {currentTexts.loadFile}
                    </Button>
                </div>

                 {areCredentialsSet && (
                     <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mt-8">
                        {isFetchingBrands ? (
                             <p className="text-center text-gray-500 py-10">{currentTexts.loadingProjects}</p>
                        ) : error ? (
                            <p className="text-center text-red-600 py-10">{error}</p>
                        ) : brands.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {brands.map(brand => (
                                    <button 
                                        key={brand.id}
                                        onClick={() => onLoadProjectFromDatabase(brand.id)}
                                        className="p-4 bg-gray-50 rounded-lg text-left hover:bg-green-100 hover:shadow-md transition-all border border-gray-200"
                                    >
                                        <h3 className="font-bold text-dark-text">{brand.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono mt-1">{brand.id}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                 <p className="text-gray-500">{currentTexts.noProjectsFound}</p>
                            </div>
                        )}
                    </div>
                 )}
            </div>
        </div>
      </main>

      <footer className="bg-white mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-dark-subtle">
            <p>&copy; {new Date().getFullYear()} {currentTexts.title}. {currentTexts.footerText}.</p>
        </div>
      </footer>
      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onLoadProject} 
          className="hidden" 
          accept=".ssproj,.json"
      />
    </div>
  );
};

export default IdeaProfiler;