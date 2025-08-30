import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { MediaPlanGroup, AffiliateLink, Persona } from '../../types';
import { Button, Input, Select, TextArea } from './ui';
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from './icons';
import ProductSelector from './ProductSelector';

interface FunnelCampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  language: string;
  onCreatePlan: (plan: MediaPlanGroup) => void;
  generatedImages: Record<string, string>;
}

const FunnelCampaignWizard: React.FC<FunnelCampaignWizardProps> = ({
  isOpen,
  onClose,
  personas,
  affiliateLinks,
  language,
  onCreatePlan,
  generatedImages
}) => {
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [primaryObjective, setPrimaryObjective] = useState<'product' | 'general'>('product');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [generalGoal, setGeneralGoal] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [campaignDuration, setCampaignDuration] = useState<'1-week' | '2-weeks' | '1-month'>('1-month');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const totalSteps = 2;

  useEffect(() => {
    if (isOpen) {
      // Reset form when wizard opens
      setStep(1);
      setCampaignName('');
      setPrimaryObjective('product');
      setSelectedProductId(null);
      setGeneralGoal('');
      setSelectedPersonaId(null);
      setCampaignDuration('1-month');
      setIsGenerating(false);
      setGenerationError(null);
    }
  }, [isOpen]);

  const T = {
    'Việt Nam': {
      title: "Tạo Chiến dịch Funnel Mới",
      step: "Bước",
      of: "trên",
      // Step 1
      step1Title: "Xác định Mục tiêu Chiến dịch",
      campaignName: "Tên Chiến dịch",
      campaignNamePlaceholder: "Vd: Ra mắt Cà phê Rang đậm Q4",
      primaryObjective: "Mục tiêu Chính",
      promoteProduct: "Quảng bá Sản phẩm",
      generalGoal: "Mục tiêu Chung",
      selectProduct: "Chọn một sản phẩm để quảng bá",
      generalGoalPlaceholder: "Vd: Tăng số lượng đăng ký bản tin cho đại lý marketing của chúng tôi",
      targetAudience: "Đối tượng Khách hàng",
      selectPersona: "Chọn một Persona",
      noPersonasAvailable: "Chưa có Persona nào được định nghĩa. Bạn có thể thêm chúng trong tab 'KOL/KOC'.",
      campaignDuration: "Thời lượng Chiến dịch",
      oneWeek: "1 Tuần",
      twoWeeks: "2 Tuần",
      oneMonth: "1 Tháng",
      // Step 2
      step2Title: "Tạo Chiến dịch Funnel",
      generating: "Đang tạo chiến dịch funnel...",
      generateError: "Có lỗi xảy ra khi tạo chiến dịch:",
      // Buttons
      back: "Quay lại",
      next: "Tiếp theo",
      generate: "Tạo Chiến dịch Funnel",
      close: "Đóng",
      create: "Tạo",
    },
    'English': {
      title: "Create New Funnel Campaign",
      step: "Step",
      of: "of",
      // Step 1
      step1Title: "Define Campaign Goal",
      campaignName: "Campaign Name",
      campaignNamePlaceholder: "e.g., Q4 Dark Roast Coffee Launch",
      primaryObjective: "Primary Objective",
      promoteProduct: "Promote a Product",
      generalGoal: "General Goal",
      selectProduct: "Select a product to promote",
      generalGoalPlaceholder: "e.g., Increase newsletter sign-ups for our marketing agency",
      targetAudience: "Target Audience",
      selectPersona: "Select a Persona",
      noPersonasAvailable: "No Personas have been defined yet. You can add them in the 'KOL/KOC' tab.",
      campaignDuration: "Campaign Duration",
      oneWeek: "1 Week",
      twoWeeks: "2 Weeks",
      oneMonth: "1 Month",
      // Step 2
      step2Title: "Generate Funnel Campaign",
      generating: "Generating funnel campaign...",
      generateError: "An error occurred while generating the campaign:",
      // Buttons
      back: "Back",
      next: "Next",
      generate: "Generate Funnel Campaign",
      close: "Close",
      create: "Create",
    }
  };

  const texts = (T as any)[language] || T['English'];

  const calculateTotalPosts = () => {
    switch (campaignDuration) {
      case '1-week': return 7;
      case '2-weeks': return 14;
      case '1-month': return 30;
      default: return 30;
    }
  };

  const handleGenerateCampaign = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const selectedProduct = affiliateLinks.find(link => link.id === selectedProductId) || null;
      const selectedPersona = personas.find(p => p.id === selectedPersonaId) || null;

      // Create a shell for the media plan group. The actual content will be generated in App.tsx
      const newPlanGroup: MediaPlanGroup & { wizardData: any } = {
        id: uuidv4(),
        name: campaignName || (selectedProduct ? `Promotion: ${selectedProduct.productName}` : 'Funnel Campaign'),
        prompt: primaryObjective === 'product' && selectedProduct 
          ? `Funnel campaign to promote ${selectedProduct.productName}` 
          : `Funnel campaign for general goal: ${generalGoal}`,
        plan: [], // This will be populated by the AI generation service in the App component
        source: 'funnel-campaign',
        personaId: selectedPersona?.id,
        // Pass wizard data to the generation handler
        wizardData: {
            campaignDuration,
            primaryObjective,
            generalGoal,
            selectedProductId,
            selectedPersonaId,
        }
      };
      
      onCreatePlan(newPlanGroup);
      onClose();
    } catch (error: any) {
      console.error('Error generating funnel campaign:', error);
      setGenerationError(error.message || texts.generateError);
    } finally {
      setIsGenerating(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 1) {
      if (!campaignName.trim()) return true;
      if (primaryObjective === 'product' && !selectedProductId) return true;
      if (primaryObjective === 'general' && !generalGoal.trim()) return true;
      if (!selectedPersonaId) return true;
      return false;
    }
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 m-4 max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        <header className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <SparklesIcon className="h-7 w-7 text-brand-green" />
              {texts.title}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
            <div className="bg-brand-green h-1.5 rounded-full" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
          </div>
        </header>
        
        <main className="p-8 flex-grow overflow-y-auto">
          {step === 1 && (
            <div>
              <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step1Title}</h3>
              <div className="mt-8 space-y-6">
                <div>
                  <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.campaignName}
                  </label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={texts.campaignNamePlaceholder}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.primaryObjective}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPrimaryObjective('product')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        primaryObjective === 'product' 
                          ? 'bg-green-50 border-brand-green' 
                          : 'bg-white hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`mr-3 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          primaryObjective === 'product' 
                            ? 'bg-brand-green border-brand-green-dark' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {primaryObjective === 'product' && <CheckCircleIcon className="h-5 w-5 text-white" />}
                        </div>
                        <span className="font-semibold text-gray-800">{texts.promoteProduct}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setPrimaryObjective('general')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        primaryObjective === 'general' 
                          ? 'bg-green-50 border-brand-green' 
                          : 'bg-white hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`mr-3 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          primaryObjective === 'general' 
                            ? 'bg-brand-green border-brand-green-dark' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {primaryObjective === 'general' && <CheckCircleIcon className="h-5 w-5 text-white" />}
                        </div>
                        <span className="font-semibold text-gray-800">{texts.generalGoal}</span>
                      </div>
                    </button>
                  </div>
                  
                  {primaryObjective === 'product' ? (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {texts.selectProduct}
                      </label>
                      <ProductSelector
                        affiliateLinks={affiliateLinks}
                        onSelectProduct={setSelectedProductId}
                        selectedProductId={selectedProductId}
                        language={language}
                      />
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label htmlFor="generalGoal" className="block text-sm font-medium text-gray-700 mb-1">
                        {texts.generalGoal}
                      </label>
                      <TextArea
                        id="generalGoal"
                        value={generalGoal}
                        onChange={(e) => setGeneralGoal(e.target.value)}
                        placeholder={texts.generalGoalPlaceholder}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.targetAudience}
                  </label>
                  {personas.length === 0 ? (
                    <p className="text-gray-500 text-sm">{texts.noPersonasAvailable}</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {personas.map(persona => {
                        const imageUrl = persona.avatarImageKey ? generatedImages[persona.avatarImageKey] : undefined;
                        return (
                          <button
                            key={persona.id}
                            onClick={() => setSelectedPersonaId(persona.id)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                              selectedPersonaId === persona.id 
                                ? 'bg-green-50 border-brand-green shadow-sm -translate-y-1' 
                                : 'bg-white hover:bg-gray-100 border-gray-200'
                            }`}
                          >
                            <div className="w-16 h-16 rounded-full bg-gray-200 mb-2 overflow-hidden">
                              {imageUrl ? (
                                <img src={imageUrl} alt={persona.nickName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                  <span className="text-xs text-center px-1">{persona.nickName.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-gray-800 text-sm">{persona.nickName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="campaignDuration" className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.campaignDuration}
                  </label>
                  <Select
                    id="campaignDuration"
                    value={campaignDuration}
                    onChange={(e) => setCampaignDuration(e.target.value as any)}
                  >
                    <option value="1-week">{texts.oneWeek}</option>
                    <option value="2-weeks">{texts.twoWeeks}</option>
                    <option value="1-month">{texts.oneMonth}</option>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div>
              <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.step2Title}</h3>
              <div className="mt-8">
                {isGenerating ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">{texts.generating}</p>
                  </div>
                ) : generationError ? (
                  <div className="text-center py-10">
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                      <p className="font-bold">{texts.generateError}</p>
                      <p className="mt-2">{generationError}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Campaign Summary</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li><span className="font-semibold">Name:</span> {campaignName || (selectedProductId ? affiliateLinks.find(l => l.id === selectedProductId)?.productName : 'Unnamed Campaign')}</li>
                      <li><span className="font-semibold">Objective:</span> {primaryObjective === 'product' ? 'Product Promotion' : 'General Goal'}</li>
                      {primaryObjective === 'product' && selectedProductId && (
                        <li><span className="font-semibold">Product:</span> {affiliateLinks.find(l => l.id === selectedProductId)?.productName}</li>
                      )}
                      {primaryObjective === 'general' && generalGoal && (
                        <li><span className="font-semibold">Goal:</span> {generalGoal}</li>
                      )}
                      <li><span className="font-semibold">Persona:</span> {personas.find(p => p.id === selectedPersonaId)?.nickName || 'None selected'}</li>
                      <li><span className="font-semibold">Duration:</span> {campaignDuration === '1-week' ? texts.oneWeek : campaignDuration === '2-weeks' ? texts.twoWeeks : texts.oneMonth}</li>
                      <li><span className="font-semibold">Total Posts:</span> {calculateTotalPosts()}</li>
                    </ul>
                    
                    <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                      <h5 className="font-bold text-gray-900 mb-2">Funnel Stages:</h5>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li>Awareness (Top-of-Funnel)</li>
                        <li>Consideration (Middle-of-Funnel)</li>
                        <li>Decision (Bottom-of-Funnel)</li>
                        <li>Action (Post-Purchase)</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <footer className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button 
            variant="tertiary" 
            onClick={() => setStep(prev => prev - 1)} 
            disabled={step === 1 || isGenerating}
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            {texts.back}
          </Button>
          <div>
            {step < totalSteps ? (
              <Button 
                onClick={() => setStep(prev => prev + 1)} 
                disabled={isNextDisabled() || isGenerating}
              >
                {texts.next}
                <ChevronRightIcon className="h-5 w-5 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleGenerateCampaign} 
                disabled={isGenerating}
                className="w-48 flex justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    <span className="ml-2">{texts.generating}</span>
                  </>
                ) : (
                  texts.generate
                )}
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default FunnelCampaignWizard;