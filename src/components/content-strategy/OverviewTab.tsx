import React, { memo } from 'react';
import type { Trend, Idea, Persona, AffiliateLink } from '../../../types';
import { Button } from '../ui';
import { HoverCopyWrapper } from '../ui';

interface OverviewTabProps {
  trend: Trend;
  ideas: Idea[];
  language: string;
  onCreatePlanFromIdea: (prompt: string, productId?: string) => void;
  onGenerateContentPackage: (idea: Idea, personaId: string | null, selectedProductId: string | null, options: { tone: string; style: string; length: string; includeEmojis: boolean; }) => void;
  personas: Persona[];
  affiliateLinks: AffiliateLink[];
  generatedImages: Record<string, string>;
  isGeneratingIdeas: boolean;
}

const OverviewTabComponent: React.FC<OverviewTabProps> = ({
  trend,
  ideas,
  language,
  onCreatePlanFromIdea,
  onGenerateContentPackage,
  personas,
  affiliateLinks,
  generatedImages,
  isGeneratingIdeas
}) => {
  // Translation texts
  const T = {
    'Việt Nam': {
      createPlan: "Tạo Kế hoạch",
      createPackage: "Tạo Gói Nội dung",
      target: "Đối tượng:",
      imagePrompt: "Prompt hình ảnh:",
      cta: "CTA:",
      noIdeas: "No ideas generated yet",
      noIdeasDesc: "Click \"Generate Ideas\" to create content ideas for this trend",
    },
    'English': {
      createPlan: "Create Plan",
      createPackage: "Create Content Package",
      target: "Target:",
      imagePrompt: "Image Prompt:",
      cta: "CTA:",
      noIdeas: "No ideas generated yet",
      noIdeasDesc: "Click \"Generate Ideas\" to create content ideas for this trend",
    }
  };
  const texts = (T as any)[language] || T['English'];

  if (ideas.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="font-medium">{texts.noIdeas}</p>
        <p className="text-sm mt-1">{texts.noIdeasDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ideas.map(idea => (
        <div key={idea.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-bold text-gray-900">{idea.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
          {idea.targetAudience && <p className="text-xs text-gray-400 mt-2">{texts.target} {idea.targetAudience}</p>}
          {idea.mediaPrompt && (
            <HoverCopyWrapper textToCopy={Array.isArray(idea.mediaPrompt) ? idea.mediaPrompt.join('\n') : idea.mediaPrompt}>
              <p className="text-xs text-gray-400 mt-1">
                {texts.imagePrompt} {Array.isArray(idea.mediaPrompt) ? idea.mediaPrompt.join(', ') : idea.mediaPrompt}
              </p>
            </HoverCopyWrapper>
          )}
          {idea.cta && <p className="text-xs text-gray-400 mt-1">{texts.cta} {idea.cta}</p>}
          <div className="flex justify-end gap-2 mt-3">
            <Button 
              variant="secondary" 
              onClick={() => onCreatePlanFromIdea(idea.description, idea.productId)} 
              className="text-xs py-1 px-2"
            >
              {texts.createPlan}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => onGenerateContentPackage(idea, null, idea.productId || null, { 
                tone: '', 
                style: '', 
                length: '', 
                includeEmojis: false 
              })} 
              className="text-xs py-1 px-2"
            >
              {texts.createPackage}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const OverviewTab = memo(OverviewTabComponent);
export default OverviewTab;