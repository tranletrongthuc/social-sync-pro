import React, { useState, useEffect, useRef } from 'react';
import type { AffiliateLink } from '../types';
import { Button, Input } from './ui';
import { DotsVerticalIcon, PencilIcon, TrashIcon, LinkIcon, TagIcon, SparklesIcon } from './icons';

interface ProductCardProps {
    link: AffiliateLink;
    onSave: (link: AffiliateLink) => void;
    onDelete?: () => void;
    onCancel?: () => void;
    isNew?: boolean;
    language: string;
    formatCurrency: (value: number) => string;
    onGenerateIdeas?: (product: AffiliateLink) => void; // New prop for generating ideas
}

const ProductCard: React.FC<ProductCardProps> = ({ link, onSave, onDelete, onCancel, isNew = false, language, formatCurrency, onGenerateIdeas }) => {
    const [isEditing, setIsEditing] = useState(isNew);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [editedLink, setEditedLink] = useState<AffiliateLink>(link);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setEditedLink(link);
    }, [link]);

    const T = {
        'Việt Nam': {
            edit: "Chỉnh sửa",
            delete: "Xóa",
            price: "Giá",
            commissionValue: "Giá trị HH",
            commissionRate: "Tỷ lệ HH",
            productId: "Mã SP",
            productLink: "Link sản phẩm",
            promoLink: "Link ưu đãi",
            save: "Lưu",
            cancel: "Hủy",
            productName: "Tên sản phẩm",
            providerName: "Nhà cung cấp",
            salesVolume: "Doanh số",
            generateIdeas: "Tạo ý tưởng",
        },
        'English': {
            edit: "Edit",
            delete: "Delete",
            price: "Price",
            commissionValue: "Commission",
            commissionRate: "Comm. Rate",
            productId: "Product ID",
            productLink: "Product Link",
            promoLink: "Promo Link",
            save: "Save",
            cancel: "Cancel",
            productName: "Product Name",
            providerName: "Provider",
            salesVolume: "Sales Volume",
            generateIdeas: "Generate Ideas",
        }
    };
    const texts = (T as any)[language] || T['English'];

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setIsEditing(true);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete();
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isNew && onCancel) {
            onCancel();
        } else {
            setIsEditing(false);
            setEditedLink(link);
        }
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        // For new links, generate a proper ID instead of using 'new'
        const linkToSave = isNew && editedLink.id === 'new' 
            ? { ...editedLink, id: crypto.randomUUID() } 
            : editedLink;
        onSave(linkToSave);
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setEditedLink(prev => {
            const newLink = { ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value };
            if (name === 'price' || name === 'commissionRate') {
                const price = name === 'price' ? parseFloat(value) || 0 : newLink.price;
                const rate = name === 'commissionRate' ? parseFloat(value) || 0 : newLink.commissionRate;
                newLink.commissionValue = Math.round(price * (rate / 100));
            }
            return newLink;
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const content = (
        <div className="flex-grow">
            <div className="mt-4 grid grid-cols-2 gap-4">
                {isEditing ? (
                    <>
                        <InputField label={texts.price} name="price" type="number" value={editedLink.price} onChange={handleChange} />
                        <InputField label={texts.commissionValue} name="commissionValue" type="number" value={editedLink.commissionValue} onChange={handleChange} />
                        <InputField label={texts.commissionRate} name="commissionRate" type="number" value={editedLink.commissionRate} onChange={handleChange} />
                        <InputField label={texts.productId} name="productId" value={editedLink.productId} onChange={handleChange} />
                    </>
                ) : (
                    <>
                        <InfoField label={texts.price} value={formatCurrency(link.price)} />
                        <InfoField label={texts.commissionValue} value={formatCurrency(link.commissionValue)} className="text-green-600" />
                        <InfoField label={texts.commissionRate} value={`${link.commissionRate}%`} />
                        <InfoField label={texts.productId} value={link.productId || 'N/A'} isTruncated />
                    </>
                )}
            </div>
             {isEditing && (
                <div className="space-y-3 mt-4">
                     <InputField label={texts.productLink} name="productLink" type="url" value={editedLink.productLink} onChange={handleChange} required />
                     <InputField label={texts.promoLink} name="promotionLink" type="url" value={editedLink.promotionLink} onChange={handleChange} />
                </div>
            )}
        </div>
    );

    return (
        <div
            className={`bg-white rounded-xl border border-gray-200 p-5 flex flex-col transition-all duration-200 shadow-sm`}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                         <div className="space-y-2">
                             <InputField label={texts.productName} name="productName" value={editedLink.productName} onChange={handleChange} required />
                             <InputField label={texts.providerName} name="providerName" value={editedLink.providerName} onChange={handleChange} required />
                         </div>
                    ) : (
                        <>
                            <p className="text-xs text-gray-400">{link.providerName}</p>
                            <div className="flex items-center gap-3 mb-2">
                                {link.product_avatar ? (
                                    <img src={link.product_avatar} alt={link.productName} className="h-15 w-15 rounded-md object-cover border border-gray-200" />
                                ) : (
                                    <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                                        <TagIcon className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                            <div>
                                
                                <h3 className={`text-lg font-bold text-gray-900 leading-tight`}>{link.productName}</h3>
                                {link.product_rating !== undefined && link.product_rating !== null && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <span className="text-yellow-500">★</span> {link.product_rating.toFixed(1)}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
                <div className="relative ml-2 no-expand" ref={menuRef}>
                    {!isNew && (
                         <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="text-gray-400 hover:text-gray-700 p-1 rounded-full">
                            <DotsVerticalIcon className="h-5 w-5" />
                        </button>
                    )}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-10">
                            <button onClick={handleEditClick} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><PencilIcon className="h-4 w-4"/> {texts.edit}</button>
                            <button onClick={handleDeleteClick} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4"/> {texts.delete}</button>
                        </div>
                    )}
                </div>
            </div>
            
            {content}

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                 {isEditing ? (
                    <>
                        <Button variant="tertiary" onClick={handleCancel}>{texts.cancel}</Button>
                        <Button onClick={handleSave}>{texts.save}</Button>
                    </>
                ) : (
                    <>
                        {onGenerateIdeas && (
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={(e) => { 
                                    e.stopPropagation();
                                    onGenerateIdeas(link);
                                }}
                                className="text-xs py-1 px-2"
                            >
                                <SparklesIcon className="h-4 w-4 mr-1" />
                                {texts.generateIdeas}
                            </Button>
                        )}
                        <a href={link.productLink} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" title={texts.productLink} className="text-gray-500 hover:text-brand-green transition-colors"><LinkIcon className="h-5 w-5"/></a>
                        {link.promotionLink && <a href={link.promotionLink} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" title={texts.promoLink} className="text-yellow-500 hover:text-yellow-700 transition-colors"><TagIcon className="h-5 w-5"/></a>}
                    </>
                )}
            </div>
        </div>
    );
};

const InfoField: React.FC<{ label: string; value: string; className?: string; isTruncated?: boolean }> = ({ label, value, className, isTruncated }) => (
    <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-md font-semibold text-gray-800 ${isTruncated ? 'truncate' : ''} ${className}`} title={value}>{value}</p>
    </div>
);

const InputField: React.FC<{ label: string; name: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, required?: boolean }> = ({label, ...props}) => (
    <div>
        <label className="text-xs text-gray-500">{label}</label>
        <Input {...props} className="mt-1 p-1 text-sm"/>
    </div>
);

export default ProductCard;