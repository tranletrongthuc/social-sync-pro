import React, { useState, useRef, useEffect, memo } from 'react';
import type { Persona, BrandFoundation } from '../../types';
import { Button } from './ui';
import { PlusIcon, UsersIcon, SparklesIcon, TrashIcon, PencilIcon, DotsVerticalIcon } from './icons';
import PersonaEditorModal from './PersonaEditorModal';

// A simplified, read-only card to display in the main grid
const PersonaCard: React.FC<{ persona: Persona; onEdit: () => void; onDelete: () => void; generatedImages: Record<string, string>; language: string; }> = memo(({ persona, onEdit, onDelete, generatedImages, language }) => {
    const T = {
        'Việt Nam': { occupation: "Nghề nghiệp", location: "Địa điểm", edit: "Sửa", delete: "Xóa" },
        'English': { occupation: "Occupation", location: "Location", edit: "Edit", delete: "Delete" },
    };
    const texts = (T as any)[language] || T['English'];

    const getAvatar = () => {
        if (persona.imageUrl) return persona.imageUrl;
        const firstPhotoKey = persona.imageKey;
        return firstPhotoKey ? generatedImages[firstPhotoKey] : null;
    };

    const avatarUrl = getAvatar();

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col transition-all duration-200 shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
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
                <MenuDropDown onEdit={onEdit} onDelete={onDelete} texts={texts} />
            </div>
            <div className="flex-grow">
                <p className="text-sm text-gray-700 line-clamp-3">{persona.backstory || persona.background}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {(persona.personalityTraits || []).slice(0, 3).map(trait => (
                    <span key={trait} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{trait}</span>
                ))}
                {(persona.interestsAndHobbies || []).slice(0, 3).map(interest => (
                    <span key={interest} className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">{interest}</span>
                ))}
            </div>
        </div>
    );
});

const MenuDropDown: React.FC<{onEdit: () => void, onDelete: () => void, texts: any}> = ({ onEdit, onDelete, texts }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div ref={menuRef} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full"><DotsVerticalIcon className="h-5 w-5" /></button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-10">
                    <button onClick={onEdit} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><PencilIcon className="h-4 w-4"/> {texts.edit}</button>
                    <button onClick={onDelete} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4"/> {texts.delete}</button>
                </div>
            )}
        </div>
    )
};

interface PersonasDisplayProps {
    personas: Persona[];
    generatedImages: Record<string, string>;
    onSavePersona: (persona: Persona) => void;
    onDeletePersona: (personaId: string) => void;
    language: string;
    brandFoundation?: BrandFoundation;
    onAutoGeneratePersona: () => void;
    isLoading?: boolean;
}

const PersonasDisplay: React.FC<PersonasDisplayProps> = ({ personas, generatedImages, onSavePersona, onDeletePersona, language, brandFoundation, onAutoGeneratePersona, isLoading }) => {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

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
            demographics: { age: 30, gender: 'Non-binary', location: '', occupation: '', incomeLevel: '' },
            backstory: '',
            personalityTraits: [],
            goalsAndMotivations: [],
            painPoints: [],
            communicationStyle: { tone: '', voice: '', preferredChannels: [] },
            interestsAndHobbies: [],
            knowledgeBase: [],
            brandRelationship: { awareness: '', perception: '', engagement: '' },
            photos: [],
            // Setting other optional fields to undefined for clarity
            imageKey: undefined,
            imageUrl: undefined,
            avatarImageKey: undefined,
            avatarImageUrl: undefined,
            mainStyle: undefined,
            activityField: undefined,
            voice: undefined,
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

    return (
        <div className="h-full flex flex-col p-6 lg:p-10 bg-gray-50/50">
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-700 font-medium">Loading personas data...</p>
                    </div>
                </div>
            )}
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900 flex items-center gap-3"><UsersIcon className="h-8 w-8 text-brand-green"/> {texts.title}</h2>
                    <p className="text-lg text-gray-500 font-serif mt-1">{texts.subtitle}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <Button 
                        onClick={onAutoGeneratePersona} 
                        variant="secondary"
                        disabled={!brandFoundation?.mission || !brandFoundation?.usp}
                        title={(!brandFoundation?.mission || !brandFoundation?.usp) ? "Please define a mission and USP in the Brand Kit tab first." : "Auto-generate new personas"}
                        className="flex items-center gap-2"
                    >
                        <SparklesIcon className="h-5 w-5"/> {texts.autoGenerate}
                    </Button>
                    <Button onClick={handleAddNew} className="flex items-center gap-2">
                        <PlusIcon className="h-5 w-5"/> {texts.addPersona}
                    </Button>
                </div>
            </header>

             <main className="flex-grow overflow-y-auto -mx-2">
                {(!personas || personas.length === 0) ? (
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
        </div>
    );
};

export default PersonasDisplay;