import React, { useState, useEffect, useRef } from 'react';
import type { AffiliateLink } from '../../types';
import { Button, Input, TextArea } from './ui';
import { DotsVerticalIcon, PencilIcon, TrashIcon, LinkIcon, SparklesIcon, StarIcon } from './icons';

interface ProductCardProps {
    link: AffiliateLink;
    onSave: (link: AffiliateLink) => void;
    onDelete?: () => void;
    onCancel?: () => void;
    isNew?: boolean;
    language: string;
    onGenerateIdeas?: (product: AffiliateLink) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ link, onSave, onDelete, onCancel, isNew = false, language, onGenerateIdeas }) => {
    const [isEditing, setIsEditing] = useState(isNew);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [editedLink, setEditedLink] = useState<AffiliateLink>(link);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setEditedLink(link);
    }, [link]);

    const T = {
        'Việt Nam': {
            edit: "Sửa", delete: "Xóa", save: "Lưu", cancel: "Hủy",
            productName: "Tên sản phẩm", providerName: "Nhà cung cấp", notes: "Ghi chú",
            commissionRate: "Tỷ lệ HH", productLink: "Link sản phẩm", generateIdeas: "Tạo ý tưởng",
            price: "Giá", salesVolume: "Doanh số", promotionLink: "Link KM",
            productDescription: "Mô tả sản phẩm", features: "Tính năng (phân cách bằng dấu phẩy)",
            useCases: "Trường hợp SD (phân cách bằng dấu phẩy)", customerReviews: "Đánh giá của khách hàng",
            productRating: "Xếp hạng (0-5)",
        },
        'English': {
            edit: "Edit", delete: "Delete", save: "Save", cancel: "Cancel",
            productName: "Product Name", providerName: "Provider", notes: "Notes",
            commissionRate: "Comm. Rate", productLink: "Product Link", generateIdeas: "Generate Ideas",
            price: "Price", salesVolume: "Sales Volume", promotionLink: "Promo Link",
            productDescription: "Product Description", features: "Features (comma-separated)",
            useCases: "Use Cases (comma-separated)", customerReviews: "Customer Reviews",
            productRating: "Rating (0-5)",
        }
    };
    const texts = (T as any)[language] || T['English'];

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        const linkToSave = isNew && editedLink.id === 'new' 
            ? { ...editedLink, id: crypto.randomUUID() } 
            : editedLink;
        onSave(linkToSave);
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let processedValue: any = value;
        if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        } else if (name === 'features' || name === 'use_cases') {
            processedValue = value.split(',').map(s => s.trim()).filter(Boolean);
        }
        setEditedLink(prev => ({ ...prev, [name]: processedValue }));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderDisplayMode = () => (
        <>
            <div className="flex items-start gap-4">
                {link.product_avatar && <img src={link.product_avatar} alt={link.productName} className="w-20 h-20 rounded-lg object-cover border" />}
                <div className="flex-1">
                    <p className="text-xs text-gray-400">{link.providerName}</p>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight" title={link.productName}>{link.productName}</h3>
                    {link.product_rating !== undefined && <StarRating rating={link.product_rating} />}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center my-4">
                <InfoField label={texts.price} value={link.price ? `$${link.price.toFixed(2)}` : 'N/A'} />
                <InfoField label={texts.commissionRate} value={`${link.commissionRate}%`} />
                <InfoField label={texts.salesVolume} value={link.salesVolume?.toLocaleString() || 'N/A'} />
            </div>

            {link.product_description && <InfoField label={texts.productDescription} value={link.product_description} isTruncated={false} className="text-sm font-normal text-gray-600" />}
            
            <TagSection title={texts.features} tags={link.features} />
            <TagSection title={texts.useCases} tags={link.use_cases} />

            {link.customer_reviews && <InfoField label={texts.customerReviews} value={link.customer_reviews} isTruncated={false} className="text-sm font-normal text-gray-600 italic mt-2" />}
        </>
    );

    const renderEditMode = () => (
        <div className="space-y-3">
            <InputField label={texts.productName} name="productName" value={editedLink.productName} onChange={handleChange} required />
            <InputField label={texts.providerName} name="providerName" value={editedLink.providerName} onChange={handleChange} />
            <InputField label="Product Avatar URL" name="product_avatar" value={editedLink.product_avatar || ''} onChange={handleChange} />
            <TextAreaField label={texts.productDescription} name="product_description" value={editedLink.product_description || ''} onChange={handleChange} />
            <div className="grid grid-cols-3 gap-2">
                <InputField label={texts.price} name="price" type="number" value={editedLink.price || ''} onChange={handleChange} />
                <InputField label={texts.commissionRate} name="commissionRate" type="number" value={editedLink.commissionRate} onChange={handleChange} />
                <InputField label={texts.salesVolume} name="salesVolume" type="number" value={editedLink.salesVolume || ''} onChange={handleChange} />
            </div>
            <InputField label={texts.productRating} name="product_rating" type="number" value={editedLink.product_rating || ''} onChange={handleChange} />
            <InputField label={texts.features} name="features" value={(editedLink.features || []).join(', ')} onChange={handleChange} />
            <InputField label={texts.useCases} name="use_cases" value={(editedLink.use_cases || []).join(', ')} onChange={handleChange} />
            <TextAreaField label={texts.customerReviews} name="customer_reviews" value={editedLink.customer_reviews || ''} onChange={handleChange} />
            <InputField label={texts.productLink} name="productLink" type="url" value={editedLink.productLink} onChange={handleChange} required />
            <InputField label={texts.promotionLink} name="promotionLink" type="url" value={editedLink.promotionLink || ''} onChange={handleChange} />
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col transition-all duration-200 shadow-sm h-full">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                    {isEditing && <h3 className="text-lg font-bold text-gray-900">{isNew ? 'Add New Product' : 'Edit Product'}</h3>}
                </div>
                {!isNew && !isEditing && (
                    <div className="relative ml-2" ref={menuRef}>
                        <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="text-gray-400 hover:text-gray-700 p-1 rounded-full">
                            <DotsVerticalIcon className="h-5 w-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-10">
                                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); setIsEditing(true); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><PencilIcon className="h-4 w-4"/> {texts.edit}</button>
                                <button onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4"/> {texts.delete}</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-grow">
                {isEditing ? renderEditMode() : renderDisplayMode()}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                 {isEditing ? (
                    <div className="flex justify-end w-full gap-2">
                        <Button variant="tertiary" onClick={(e) => { e.stopPropagation(); isNew ? onCancel && onCancel() : setIsEditing(false); }}>{texts.cancel}</Button>
                        <Button onClick={handleSave}>{texts.save}</Button>
                    </div>
                ) : (
                    <>
                        {onGenerateIdeas && (
                            <Button variant="secondary" onClick={(e) => { e.stopPropagation(); onGenerateIdeas(link); }} className="text-xs py-1 px-2 flex items-center gap-1">
                                <SparklesIcon className="h-4 w-4"/> {texts.generateIdeas}
                            </Button>
                        )}
                        <div className="flex items-center gap-3">
                            {link.promotionLink && <a href={link.promotionLink} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" title="Promotion Link" className="text-red-500 hover:text-red-700 transition-colors font-semibold text-sm">Promo</a>}
                            <a href={link.productLink} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" title={texts.productLink} className="text-gray-500 hover:text-brand-green transition-colors"><LinkIcon className="h-5 w-5"/></a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
        ))}
        <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
    </div>
);

const TagSection: React.FC<{ title: string, tags?: string[] }> = ({ title, tags }) => {
    if (!tags || tags.length === 0) return null;
    return (
        <div className="mt-3">
            <p className="text-xs text-gray-500">{title}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map(tag => <span key={tag} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{tag}</span>)}
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

const InputField: React.FC<{ label: string; name: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, required?: boolean }> = ({ label, ...props }) => (
    <div>
        <label className="text-xs text-gray-500 font-medium">{label}</label>
        <Input {...props} className="mt-1 p-2 text-sm w-full"/>
    </div>
);

const TextAreaField: React.FC<{ label: string; name: string, value: any, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }> = ({ label, ...props }) => (
    <div>
        <label className="text-xs text-gray-500 font-medium">{label}</label>
        <TextArea {...props} className="mt-1 p-2 text-sm w-full" rows={3} />
    </div>
);

export default ProductCard;