import React, { useState, useRef, useEffect, memo, useId } from 'react';
import type { Persona, PersonaPhoto, SocialAccount } from '../types';
import { Button, Input, TextArea } from './ui';
import { PlusIcon, UsersIcon, SearchIcon, TrashIcon, UploadIcon, DotsVerticalIcon, PencilIcon, FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon, PinterestIcon } from './icons';
import { connectSocialAccountToPersona, disconnectSocialAccountFromPersona, handleConnectFacebookPage } from '../services/socialAccountService';
import FacebookPageSelectionModal from './FacebookPageSelectionModal';

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
    onUpdatePersona: (persona: Persona) => void; // New prop for updating persona after social account changes
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

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => {
    const inputId = useId(); // Generate a unique ID
    return (
        <div className="mb-2">
            <label htmlFor={inputId} className="text-xs font-medium text-gray-500">{label}</label>
            <Input id={inputId} {...props} className="mt-1 p-1 text-sm"/>
        </div>
    );
};
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {label: string}> = ({label, ...props}) => {
    const textareaId = useId(); // Generate a unique ID
    return (
        <div className="mb-2">
            <label htmlFor={textareaId} className="text-xs font-medium text-gray-500">{label}</label>
            <TextArea id={textareaId} {...props} className="mt-1 p-1 text-sm"/>
        </div>
    );
};


// PersonaCard component is now defined inside PersonasDisplay
const PersonaCard: React.FC<PersonaCardProps> = memo(({ persona, isNew = false, onSave, onDelete, onCancel, onSetImage, generatedImages, isUploadingImage, language, onUpdatePersona }) => {
    const [isEditing, setIsEditing] = useState(isNew);
    const [editedPersona, setEditedPersona] = useState(persona);
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // State for Facebook Page Selection
    const [isFacebookPageSelectionModalOpen, setIsFacebookPageSelectionModalOpen] = useState(false);
    const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
    const [facebookUserAccessToken, setFacebookUserAccessToken] = useState<string | null>(null);

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
            socialAccounts: "Tài khoản Mạng xã hội",
            connect: "Kết nối",
            disconnect: "Ngắt kết nối",
            connecting: "Đang kết nối...",
            facebook: "Facebook",
            instagram: "Instagram",
            tiktok: "TikTok",
            youtube: "YouTube",
            pinterest: "Pinterest",
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
            socialAccounts: "Social Accounts",
            connect: "Connect",
            disconnect: "Disconnect",
            connecting: "Connecting...",
            facebook: "Facebook",
            instagram: "Instagram",
            tiktok: "TikTok",
            youtube: "YouTube",
            pinterest: "Pinterest",
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

    const handleConnectAccount = async (platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest') => {
        setConnectingPlatform(platform);
        try {
            const result = await connectSocialAccountToPersona(editedPersona, platform);
            console.log("Result from connectSocialAccountToPersona:", result);
            if ('pages' in result) {
                console.log("Multiple Facebook pages found. Opening selection modal.", result.pages);
                setFacebookPages(result.pages);
                setFacebookUserAccessToken(result.userAccessToken);
                setIsFacebookPageSelectionModalOpen(true);
            } else {
                console.log("Single Facebook page or other platform connected directly.", result);
                setEditedPersona(result);
                onUpdatePersona(result); // Propagate the change up
            }
        } catch (error) {
            console.error(`Failed to connect ${platform} account:`, error);
            console.log("Error object from connectSocialAccountToPersona:", error);
            // If connection fails, and it's Facebook, and no pages were returned, open the modal with an empty page list
            if (platform === 'Facebook' && error instanceof Error && error.message.includes("No Facebook Pages found")) {
                setFacebookPages([]);
                setFacebookUserAccessToken(null); // Clear any partial token
                setIsFacebookPageSelectionModalOpen(true);
            } else {
                // For other errors or non-Facebook platforms, show a generic alert
                alert(`Failed to connect ${platform} account. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        } finally {
            setConnectingPlatform(null);
        }
    };

    const handleDisconnectAccount = async (platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest') => {
        if (!window.confirm(`Are you sure you want to disconnect the ${platform} account from ${editedPersona.nickName}?`)) {
            return;
        }
        setConnectingPlatform(platform); // Use connectingPlatform for disconnection too for simplicity
        try {
            const updated = disconnectSocialAccountFromPersona(editedPersona.id, platform);
            setEditedPersona(prev => ({
                ...prev,
                socialAccounts: prev.socialAccounts?.filter(acc => acc.platform !== platform)
            }));
            onUpdatePersona({
                ...editedPersona,
                socialAccounts: editedPersona.socialAccounts?.filter(acc => acc.platform !== platform)
            });
        } catch (error) {
            console.error(`Failed to disconnect ${platform} account:`, error);
            alert(`Failed to disconnect ${platform} account. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setConnectingPlatform(null);
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'Facebook': return <FacebookIcon className="h-5 w-5" />;
            case 'Instagram': return <InstagramIcon className="h-5 w-5" />;
            case 'TikTok': return <TikTokIcon className="h-5 w-5" />;
            case 'YouTube': return <YouTubeIcon className="h-5 w-5" />;
            case 'Pinterest': return <PinterestIcon className="h-5 w-5" />;
            default: return null;
        }
    };

    const getPlatformColor = (platform: string) => {
        switch (platform) {
            case 'Facebook': return 'bg-blue-600 hover:bg-blue-700';
            case 'Instagram': return 'bg-pink-600 hover:bg-pink-700';
            case 'TikTok': return 'bg-black hover:bg-gray-800';
            case 'YouTube': return 'bg-red-600 hover:bg-red-700';
            case 'Pinterest': return 'bg-red-700 hover:bg-red-800';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const socialPlatforms: ('Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest')[] = ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'Pinterest'];

    const handleFacebookPageSelected = (page: FacebookPage) => {
        const updatedPersona = handleConnectFacebookPage(
            editedPersona.id,
            page.id,
            page.access_token
        );
        setEditedPersona(updatedPersona);
        onUpdatePersona(updatedPersona);
        setIsFacebookPageSelectionModalOpen(false);
        setFacebookPages([]);
        setFacebookUserAccessToken(null);
    };

    const handleRetryFacebookConnect = () => {
        setIsFacebookPageSelectionModalOpen(false);
        // Re-initiate the Facebook connection flow
        handleConnectAccount('Facebook');
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {persona.avatarImageUrl || (persona.photos.length > 0 && generatedImages[persona.photos[0].imageKey]) ? (
                                <img
                                    src={persona.avatarImageUrl || generatedImages[persona.photos[0].imageKey]}
                                    alt={persona.nickName}
                                    className="h-16 w-16 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-semibold">
                                    <UsersIcon className="h-8 w-8" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{persona.nickName}</h3>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">{texts.mainStyle}:</span> {persona.mainStyle}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">{texts.activityField}:</span> {persona.activityField}
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                             <MenuDropDown
                                onEdit={() => setIsEditing(true)}
                                onDelete={onDelete}
                                texts={texts}
                            />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">{texts.socialAccounts}</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {socialPlatforms.map(platform => {
                                const account = editedPersona.socialAccounts?.find(acc => acc.platform === platform);
                                const isLoading = connectingPlatform === platform;
                                return (
                                    <div key={platform} className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            {getPlatformIcon(platform)}
                                            {account ? (
                                                <a href={account.profileUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                                                    {account.displayName || `${platform} Connected`}
                                                </a>
                                            ) : (
                                                <span className="text-sm font-medium text-gray-700">{texts[platform.toLowerCase() as keyof typeof texts]}</span>
                                            )}
                                        </div>
                                        {account ? (
                                            <Button
                                                onClick={() => handleDisconnectAccount(platform)}
                                                variant="secondary"
                                                size="sm"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <div className="w-4 h-4 border-2 border-t-transparent border-gray-600 rounded-full animate-spin"></div> : texts.disconnect}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleConnectAccount(platform)}
                                                className={`${getPlatformColor(platform)} text-white`}
                                                size="sm"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : texts.connect}
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
            <FacebookPageSelectionModal
                isOpen={isFacebookPageSelectionModalOpen}
                pages={facebookPages}
                onSelectPage={handleFacebookPageSelected}
                onClose={() => setIsFacebookPageSelectionModalOpen(false)}
                language={language}
                onRetryConnect={handleRetryFacebookConnect}
            />
        </div>
    );
});


interface PersonasDisplayProps {
    personas: Persona[];
    generatedImages: Record<string, string>;
    onSavePersona: (persona: Persona) => void;
    onDeletePersona: (personaId: string) => void;
    onSetPersonaImage: (dataUrl: string, imageKey: string, personaId: string) => void;
    isUploadingImage: (imageKey: string) => boolean;
    language: string;
    onUpdatePersona: (persona) => void; // New prop for updating persona after social account changes
    // Lazy loading props
    isDataLoaded?: boolean;
    onLoadData?: () => void;
    isLoading?: boolean;
}

const PersonasDisplay: React.FC<PersonasDisplayProps> = ({ personas, generatedImages, onSavePersona, onDeletePersona, onSetPersonaImage, isUploadingImage, language, onUpdatePersona, isDataLoaded, onLoadData, isLoading }) => {
    const [isPersonasDataLoaded, setIsPersonasDataLoaded] = useState(false);
    const [isLoadingPersonasData, setIsLoadingPersonasData] = useState(false);
    
    // Load data when component mounts if not already loaded
    useEffect(() => {
        if (!isDataLoaded && onLoadData && !isLoading) {
            setIsLoadingPersonasData(true);
            onLoadData().finally(() => {
                setIsLoadingPersonasData(false);
                setIsPersonasDataLoaded(true);
            });
        } else if (isDataLoaded) {
            setIsPersonasDataLoaded(true);
        }
    }, [isDataLoaded, onLoadData, isLoading]);
    
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
            })),
            socialAccounts: [],
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
            {/* Loading indicator */}
            {isLoadingPersonasData && (
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
                                onUpdatePersona={onSavePersona} // Pass onSavePersona as onUpdatePersona for new personas
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
                                onUpdatePersona={onUpdatePersona}
                            />
                        ))}
                    </div>
                )}
             </main>
        </div>
    );
};

export default PersonasDisplay;