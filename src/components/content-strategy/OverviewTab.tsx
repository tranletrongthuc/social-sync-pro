import React, { memo, useState, useRef, useEffect } from 'react';
import type { Trend, Idea, Persona, AffiliateLink } from '../../../types';
import { Button } from '../ui';
import { HoverCopyWrapper } from '../ui';
import ModelLabel from '../ModelLabel';
import { DotsVerticalIcon, ArchiveIcon, PencilIcon } from '../icons';
import { ListItem } from '../../design/components/ListItem';

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
  onToggleIdeaArchive: (ideaId: string) => void;
  onEditIdea: (idea: Idea) => void; // New prop for editing ideas
}

const IdeaCard: React.FC<{ 
    idea: Idea; 
    language: string; 
    texts: any; 
    onToggleIdeaArchive: (id: string) => void; 
    onEditIdea: (idea: Idea) => void; 
    onCreatePlanFromIdea: (p: string, id?: string) => void; 
    onGenerateContentPackage: (i: Idea, p: string|null, id: string|null, o: any) => void;
}> = ({ idea, language, texts, onToggleIdeaArchive, onEditIdea, onCreatePlanFromIdea, onGenerateContentPackage }) => {
    const handleToggleArchive = () => {
        onToggleIdeaArchive(idea.id);
    };

    const handleEdit = () => {
        onEditIdea(idea);
    };

    return (
        <ListItem
            onEdit={handleEdit}
            onToggle={handleToggleArchive}
            isToggled={idea.isArchived}
            showToggle={true}
            toggleTooltip={idea.isArchived ? "Unarchive Idea" : "Archive Idea"}
            className="mb-2"
        >
            <div className="flex-grow">
                <h4 className="font-bold text-gray-900 pr-8">{idea.title}</h4>
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
                <div className="flex justify-between items-center mt-3">
                    <div>
                        {idea.modelUsed && <ModelLabel model={idea.modelUsed} size="small" />}
                        {idea.isArchived && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-600">{texts.archived}</span>}
                    </div>
                    <div className="flex gap-2">
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
            </div>
        </ListItem>
    );
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
  isGeneratingIdeas,
  onToggleIdeaArchive,
  onEditIdea
}) => {
  const T = {
    'Việt Nam': {
      createPlan: "Tạo Kế hoạch",
      createPackage: "Tạo Gói Nội dung",
      target: "Đối tượng:",
      imagePrompt: "Prompt hình ảnh:",
      cta: "CTA:",
      noIdeas: "Chưa có ý tưởng nào được tạo",
      noIdeasDesc: "Nhấp vào \"Tạo ý tưởng\" để tạo ý tưởng nội dung cho xu hướng này",
      archive: "Lưu trữ",
      unarchive: "Bỏ lưu trữ",
      archived: "Đã lưu trữ",
    },
    'English': {
      createPlan: "Create Plan",
      createPackage: "Create Content Package",
      target: "Target:",
      imagePrompt: "Image Prompt:",
      cta: "CTA:",
      noIdeas: "No ideas generated yet",
      noIdeasDesc: "Click \"Generate Ideas\" to create content ideas for this trend",
      archive: "Archive",
      unarchive: "Unarchive",
      archived: "Archived",
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
        <IdeaCard 
            key={idea.id} 
            idea={idea} 
            language={language} 
            texts={texts} 
            onToggleIdeaArchive={onToggleIdeaArchive} 
            onEditIdea={onEditIdea}
            onCreatePlanFromIdea={onCreatePlanFromIdea} 
            onGenerateContentPackage={onGenerateContentPackage} 
        />
      ))}
    </div>
  );
};

const OverviewTab = memo(OverviewTabComponent);
export default OverviewTab;