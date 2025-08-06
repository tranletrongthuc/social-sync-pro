import React, { useState, useRef, useEffect, memo } from 'react';
import type { Persona, PersonaPhoto } from '../types';
import { Button, Input, TextArea } from './ui';
import { PlusIcon, UsersIcon, SearchIcon, TrashIcon, UploadIcon, DotsVerticalIcon, PencilIcon } from './icons';

interface PersonaCardProps {
    persona: Persona;
    isNew?: boolean;
    onSave: (persona: Persona) => void;
    onDelete: () => void;
    onCancel: () => void;
    onSetImage: (photoId: string, dataUrl: string) => Promise<string | undefined>;
    generatedImages: Record<string, string>;
    isUploadingImage: (photoKey: string) => boolean;
    language: string;
}

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
        <div ref={menuRef}>
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

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div className="mb-2">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <Input {...props} className="mt-1 p-1 text-sm"/>
    </div>
);
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {label: string}> = ({label, ...props}) => (
    <div className="mb-2">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <TextArea {...props} className="mt-1 p-1 text-sm"/>
    </div>
);


// PersonaCard component is now defined inside PersonasDisplay
const PersonaCard: React.FC<PersonaCardProps> = memo(({ persona, isNew = false, onSave, onDelete, onCancel, onSetImage, generatedImages, isUploadingImage, language }) => {
    const [isEditing, setIsEditing] = useState(isNew);
    const [editedPersona, setEditedPersona] = useState(persona);
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setEditedPersona(persona);
    }, [persona]);

    const T = {
        'Việt Nam': {
            nickName: "Biệt danh",
            mainStyle: "Phong cách chính",
            activityField: "Lĩnh vực hoạt động",
            outfitDescription: "Mô tả trang phục/phong cách",
            photos: "Ảnh đại diện",
            uploadHint: "Tải lên / Dán",
            save: "Lưu",
            cancel: "Hủy",
            edit: "Chỉnh sửa",
            delete: "Xóa",
        },
        'English': {
            nickName: "Nickname",
            mainStyle: "Main Style",
            activityField: "Field of Activity",
            outfitDescription: "Outfit/Style Description",
            photos: "Reference Photos",
            uploadHint: "Upload / Paste",
            save: "Save",
            cancel: "Cancel",
            edit: "Edit",
            delete: "Delete",
        }
    };
    const texts = (T as any)[language] || T['English'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedPersona(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, photoId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const result = event.target?.result;
            if (result && typeof result === 'string') {
                const newImageKey = await onSetImage(photoId, result);
                if (newImageKey) {
                    setEditedPersona(prev => {
                        const newPhotos = prev.photos.map(p => p.id === photoId ? { ...p, imageKey: newImageKey } : p);
                        return { ...prev, photos: newPhotos };
                    });
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLButtonElement>, photoId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.clipboardData.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const result = event.target?.result;
                if (result && typeof result === 'string') {
                    const newImageKey = await onSetImage(photoId, result);
                    if (newImageKey) {
                        setEditedPersona(prev => {
                            const newPhotos = prev.photos.map(p => p.id === photoId ? { ...p, imageKey: newImageKey } : p);
                            return { ...prev, photos: newPhotos };
                        });
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        const personaToSave = { ...editedPersona };
        // Synthesize the single avatar from the first available photo for backward compatibility
        const firstPhotoWithImage = personaToSave.photos.find(p => generatedImages[p.imageKey]);
        if (firstPhotoWithImage) {
            personaToSave.avatarImageKey = firstPhotoWithImage.imageKey;
            personaToSave.avatarImageUrl = generatedImages[firstPhotoWithImage.imageKey];
        } else {
            personaToSave.avatarImageKey = undefined;
            personaToSave.avatarImageUrl = undefined;
        }

        onSave(personaToSave);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (isNew) onCancel();
        else {
            setIsEditing(false);
            setEditedPersona(persona);
        }
    };

    const renderPhotoUploader = (photo: PersonaPhoto, index: number) => {
        const imageUrl = generatedImages[photo.imageKey];
        const isUploading = isUploadingImage(photo.imageKey);

        return (
            <div key={photo.id} className="aspect-square relative">
                <input
                    type="file"
                    className="hidden"
                    ref={el => { fileInputRefs.current[index] = el; }}
                    onChange={(e) => handleFileChange(e, photo.id)}
                    accept="image/*"
                />
                <button
                    onPaste={(e) => handlePaste(e, photo.id)}
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={!isEditing || isUploading}
                    className={`w-full h-full rounded-md flex items-center justify-center border-2 border-dashed transition-colors ${imageUrl ? 'border-transparent' : 'border-gray-300 hover:border-brand-green'}`}
                    style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    aria-label={`${texts.uploadHint} for photo ${index + 1}`}
                >
                    {!imageUrl && !isUploading && (
                        <div className="text-center text-gray-500">
                            <UploadIcon className="h-6 w-6 mx-auto"/>
                            <span className="text-xs mt-1 block">{texts.uploadHint}</span>
                        </div>
                    )}
                </button>
                 {isUploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md">
                        <div className="w-6 h-6 border-2 border-t-transparent border-brand-green rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    };

    const renderReadOnlyPhoto = (photo: PersonaPhoto) => {
        const imageUrl = generatedImages[photo.imageKey];
        if (!imageUrl) return null;
        return <div key={photo.id} className="aspect-square bg-gray-100 rounded-md" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col transition-all duration-200 shadow-sm">
            {isEditing ? (
                <>
                    <InputField label={texts.nickName} name="nickName" value={editedPersona.nickName} onChange={handleChange} required />
                    <InputField label={texts.mainStyle} name="mainStyle" value={editedPersona.mainStyle} onChange={handleChange} />
                    <InputField label={texts.activityField} name="activityField" value={editedPersona.activityField} onChange={handleChange} />
                    <TextAreaField label={texts.outfitDescription} name="outfitDescription" value={editedPersona.outfitDescription} onChange={handleChange} rows={3} />
                    
                    <label className="text-xs font-medium text-gray-500 mt-4 block">{texts.photos}</label>
                    <div className="grid grid-cols-5 gap-2 mt-1">
                        {editedPersona.photos.map(renderPhotoUploader)}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                        <Button variant="tertiary" onClick={handleCancel}>{texts.cancel}</Button>
                        <Button onClick={handleSave}>{texts.save}</Button>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{persona.nickName}</h3>
                        <div className="relative">
                             <MenuDropDown
                                onEdit={() => setIsEditing(true)}
                                onDelete={onDelete}
                                texts={texts}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">{persona.mainStyle} | {persona.activityField}</p>
                    <div className="grid grid-cols-5 gap-2 mt-4">
                        {persona.photos.map(renderReadOnlyPhoto)}
                    </div>
                </>
            )}
        </div>
    );
});


interface PersonasDisplayProps {
  personas: Persona[];
  generatedImages: Record<string, string>;
  onSavePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
  onSetPersonaImage: (personaId: string, photoId: string, dataUrl: string) => Promise<string | undefined>;
  isUploadingImage: (key: string) => boolean;
  language: string;
}

const PersonasDisplay: React.FC<PersonasDisplayProps> = ({ personas, generatedImages, onSavePersona, onDeletePersona, onSetPersonaImage, isUploadingImage, language }) => {
    const [newPersona, setNewPersona] = useState<Persona | null>(null);

    const T = {
        'Việt Nam': {
            title: "Quản lý KOL/KOC",
            subtitle: "Định nghĩa các nhân vật sẽ đại diện cho thương hiệu của bạn trong các chiến dịch.",
            addPersona: "Thêm KOL/KOC mới",
            noPersonas: "Chưa có KOL/KOC nào.",
            addFirst: "Thêm người đầu tiên để bắt đầu.",
            confirmDelete: "Bạn có chắc muốn xóa nhân vật này không? Điều này không thể hoàn tác.",
        },
        'English': {
            title: "KOL/KOC Management",
            subtitle: "Define the personas who will represent your brand in campaigns.",
            addPersona: "Add New KOL/KOC",
            noPersonas: "No personas yet.",
            addFirst: "Add your first one to get started.",
            confirmDelete: "Are you sure you want to delete this persona? This cannot be undone.",
        }
    };
    const texts = (T as any)[language] || T['English'];

    const createEmptyPersona = (): Persona => {
        const id = crypto.randomUUID();
        return {
            id,
            nickName: '',
            outfitDescription: '',
            mainStyle: '',
            activityField: '',
            photos: Array.from({ length: 5 }, (_, i) => ({
                id: crypto.randomUUID(),
                imageKey: `persona_${id}_photo_${i}`
            }))
        };
    };
    
    const handleAddNew = () => {
        setNewPersona(createEmptyPersona());
    };

    const handleSaveNew = (persona: Persona) => {
        onSavePersona(persona);
        setNewPersona(null);
    };

    const handleCancelNew = () => {
        setNewPersona(null);
    };

    const handleDelete = (personaId: string) => {
        if (window.confirm(texts.confirmDelete)) {
            onDeletePersona(personaId);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 lg:p-10 bg-gray-50/50">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900 flex items-center gap-3"><UsersIcon className="h-8 w-8 text-brand-green"/> {texts.title}</h2>
                    <p className="text-lg text-gray-500 font-serif mt-1">{texts.subtitle}</p>
                </div>
                <div className="flex-shrink-0">
                    <Button onClick={handleAddNew} className="flex items-center gap-2">
                        <PlusIcon className="h-5 w-5"/> {texts.addPersona}
                    </Button>
                </div>
            </header>

             <main className="flex-grow overflow-y-auto -mx-2">
                {(!personas || personas.length === 0) && !newPersona ? (
                     <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <UsersIcon className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-2 text-2xl font-bold font-sans text-gray-900">{texts.noPersonas}</h3>
                        <p className="mt-1 text-md text-gray-500 font-serif">{texts.addFirst}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2">
                        {newPersona && (
                            <PersonaCard
                                persona={newPersona}
                                isNew
                                onSave={handleSaveNew}
                                onCancel={handleCancelNew}
                                onDelete={() => {}} // Not applicable for new
                                onSetImage={(photoId, dataUrl) => onSetPersonaImage(newPersona.id, photoId, dataUrl)}
                                generatedImages={generatedImages}
                                isUploadingImage={isUploadingImage}
                                language={language}
                            />
                        )}
                        {personas.map(p => (
                            <PersonaCard
                                key={p.id}
                                persona={p}
                                onSave={onSavePersona}
                                onDelete={() => handleDelete(p.id)}
                                onCancel={() => {}} // Not applicable
                                onSetImage={(photoId, dataUrl) => onSetPersonaImage(p.id, photoId, dataUrl)}
                                generatedImages={generatedImages}
                                isUploadingImage={isUploadingImage}
                                language={language}
                            />
                        ))}
                    </div>
                )}
             </main>
        </div>
    );
};

export default PersonasDisplay;