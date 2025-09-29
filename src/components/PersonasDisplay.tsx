import React, { useState, useRef, useEffect, memo } from 'react';
import type { Persona, BrandFoundation } from '../../types';
import { Button } from '../design/components';
import { PlusIcon, UsersIcon, SparklesIcon, TrashIcon, PencilIcon, CheckIcon, RefreshIcon } from './icons';
import RefreshButton from './RefreshButton';
import PersonaEditorModal from './PersonaEditorModal';
import GenericTabTemplate from './GenericTabTemplate';
import ModelLabel from './ModelLabel';
import { Card, Label } from '../design/components';

// A simplified, read-only card to display in the main grid
const PersonaCard: React.FC<{ 
    persona: Persona; 
    onEdit: () => void; 
    onDelete: () => void;
    onSelect: () => void;
    onToggle: (newState: boolean) => void;
    isSelected: boolean;
    generatedImages: Record<string, string>; 
    language: string; 
}> = memo(({ persona, onEdit, onDelete, onSelect, onToggle, isSelected, generatedImages, language }) => {
    const T = {
        'Việt Nam': { occupation: "Nghề nghiệp", location: "Địa điểm", edit: "Sửa", delete: "Xóa", active: "Hoạt động" },
        'English': { occupation: "Occupation", location: "Location", edit: "Edit", delete: "Delete", active: "Active" },
    };
    const texts = (T as any)[language] || T['English'];

    const getAvatar = () => {
        if (persona.imageUrl) return persona.imageUrl;
        const firstPhotoKey = persona.imageKey;
        return firstPhotoKey ? generatedImages[firstPhotoKey] : null;
    };

    const avatarUrl = getAvatar();

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(!persona.isActive);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const cardHeader = (
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={persona.nickName} className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md" />
                ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <UsersIcon className="h-8 w-8" />
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{persona.nickName}</h3>
                    <p className="text-sm text-gray-600">{persona.demographics?.occupation}</p>
                    <p className="text-xs text-gray-500">{persona.demographics?.location}</p>
                </div>
            </div>
            <div
                onClick={handleToggle}
                className={`flex items-center justify-center w-6 h-6 rounded cursor-pointer
                    border-2 transition-all duration-200
                    ${persona.isActive ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300 hover:border-emerald-400'}
                `}
                role="checkbox"
                aria-checked={persona.isActive}
                title={persona.isActive ? "Deactivate Persona" : "Activate Persona"}
            >
                {persona.isActive && <CheckIcon className="w-4 h-4 text-white" />}
            </div>
        </div>
    );

    const cardFooter = (
        <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
                {(persona.voice?.personalityTraits || []).slice(0, 2).map(trait => (
                    <Label key={trait} variant="info" size="sm">{trait}</Label>
                ))}
                {(persona.interestsAndHobbies || []).slice(0, 2).map(interest => (
                    <Label key={interest} variant="success" size="sm">{interest}</Label>
                ))}
                {persona.modelUsed && <ModelLabel model={persona.modelUsed} size="small" />}
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleEdit}><PencilIcon className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={handleDelete}><TrashIcon className="h-4 w-4 text-red-500" /></Button>
            </div>
        </div>
    );

    return (
        <div onClick={onSelect} className={`transition-all duration-200 rounded-lg ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}>
            <Card header={cardHeader} footer={cardFooter} hoverable={true}>
                <p className="text-sm text-gray-700 line-clamp-3 h-16">{persona.backstory || persona.background}</p>
            </Card>
        </div>
    );
});

interface PersonasDisplayProps {
    mongoBrandId: string | null;
    personas: Persona[];
    generatedImages: Record<string, string>;
    onSavePersona: (persona: Persona) => void;
    onDeletePersona: (personaId: string) => void;
    onTogglePersonaState: (personaId: string, isActive: boolean) => void;
    language: string;
    brandFoundation?: BrandFoundation;
    onAutoGeneratePersona: () => void;
    isLoading?: boolean;
    isDataLoaded?: boolean;
    onLoadData?: (brandId: string) => Promise<void>;
}

const PersonasDisplay: React.FC<PersonasDisplayProps> = ({ mongoBrandId, personas, generatedImages, onSavePersona, onDeletePersona, onTogglePersonaState, language, brandFoundation, onAutoGeneratePersona, isLoading, isDataLoaded, onLoadData }) => {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

    useEffect(() => {
        if (!isDataLoaded && onLoadData && mongoBrandId) {
            onLoadData(mongoBrandId);
        }
    }, [isDataLoaded, onLoadData, mongoBrandId]);

    const T = {
        'Việt Nam': {
            title: "Quản lý Persona",
            subtitle: "Định nghĩa các nhân vật sẽ đại diện cho thương hiệu của bạn.",
            addPersona: "Thêm Persona",
            autoGenerate: "Tự động tạo",
            noPersonas: "Chưa có Persona nào.",
            addFirst: "Thêm người đầu tiên để bắt đầu.",
            confirmDelete: "Bạn có chắc muốn xóa persona này không?",
        },
        'English': {
            title: "Persona Management",
            subtitle: "Define the characters who will represent your brand.",
            addPersona: "Add New Persona",
            autoGenerate: "Auto-Generate",
            noPersonas: "No personas yet.",
            addFirst: "Add your first one to get started.",
            confirmDelete: "Are you sure you want to delete this persona?",
        }
    };
    const texts = (T as any)[language] || T['English'];

    const createEmptyPersona = (): Persona => {
        return {
            id: crypto.randomUUID(), // Add temporary unique ID
            nickName: '',
            fullName: '',
            background: '',
            outfitDescription: '',
            brandId: '', // Will be populated on save
            isActive: true,
            demographics: { age: 30, gender: 'Non-binary', location: '', occupation: '', incomeLevel: '' },
            backstory: '',
            goalsAndMotivations: [],
            painPoints: [],
            interestsAndHobbies: [],
            knowledgeBase: [],
            brandRelationship: { awareness: '', perception: '', engagement: '' },
            photos: [],
            voice: {
                personalityTraits: [],
                linguisticRules: [],
                communicationStyle: {
                    tone: '',
                    voice: '',
                    preferredChannels: []
                }
            },
            imageKey: undefined,
            imageUrl: undefined,
            avatarImageKey: undefined,
            avatarImageUrl: undefined,
            mainStyle: undefined,
            activityField: undefined,
contentTone: undefined,
            visualCharacteristics: undefined,
            coreCharacteristics: undefined,
            keyMessages: undefined,
            gender: 'Non-binary',
        };
    };
    
    const handleAddNew = () => {
        setEditingPersona(createEmptyPersona());
        setIsEditorOpen(true);
    };

    const handleEdit = (persona: Persona) => {
        setEditingPersona(persona);
        setIsEditorOpen(true);
    };

    const handleCloseEditor = () => {
        setIsEditorOpen(false);
        setEditingPersona(null);
    };

    const handleSave = (persona: Persona) => {
        onSavePersona(persona);
        handleCloseEditor();
    };

    const handleDelete = (personaId: string) => {
        if (window.confirm(texts.confirmDelete)) {
            onDeletePersona(personaId);
        }
    };

    const handleSelectPersona = (personaId: string) => {
        setSelectedPersonaId(prevId => prevId === personaId ? null : personaId);
    };

    const handleTogglePersona = (personaId: string, isActive: boolean) => {
        onTogglePersonaState(personaId, isActive);
    };

    const actionButtons = (
        <div className="flex flex-row gap-2">
            <Button 
                onClick={onAutoGeneratePersona} 
                variant="secondary"
                size="sm"
                disabled={!brandFoundation?.mission || !brandFoundation?.usp}
                className="whitespace-nowrap"
            >
                <SparklesIcon className="h-4 w-4"/> 
                <span className="hidden sm:inline">{texts.autoGenerate}</span>
            </Button>
            <Button onClick={handleAddNew} size="sm" className="whitespace-nowrap">
                <PlusIcon className="h-4 w-4"/> 
                <span className="hidden sm:inline">{texts.addPersona}</span>
            </Button>
            <RefreshButton 
                onClick={() => onLoadData && mongoBrandId && onLoadData(mongoBrandId)}
                isLoading={isLoading}
                language={language}
            />
        </div>
    );

    return (
        <GenericTabTemplate
            title={texts.title}
            subtitle={texts.subtitle}
            actionButtons={actionButtons}
            isLoading={isLoading}
        >
            <main className="flex-grow overflow-y-auto -mx-2">
                {(!personas || personas.length === 0) && !isLoading ? (
                     <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <UsersIcon className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-2 text-2xl font-bold font-sans text-gray-900">{texts.noPersonas}</h3>
                        <p className="mt-1 text-md text-gray-500 font-serif">{texts.addFirst}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 p-2">
                        {personas.map(p => (
                            <PersonaCard
                                key={p.id}
                                persona={p}
                                onEdit={() => handleEdit(p)}
                                onDelete={() => handleDelete(p.id)}
                                onSelect={() => handleSelectPersona(p.id)}
                                onToggle={(newState) => handleTogglePersona(p.id, newState)}
                                isSelected={selectedPersonaId === p.id}
                                generatedImages={generatedImages}
                                language={language}
                            />
                        ))}
                    </div>
                )}
             </main>

            {isEditorOpen && (
                <PersonaEditorModal 
                    isOpen={isEditorOpen}
                    persona={editingPersona}
                    onClose={handleCloseEditor}
                    onSave={handleSave}
                    language={language}
                />
            )}
        </GenericTabTemplate>
    );
};

export default PersonasDisplay;