
import React, { useState, useMemo, useEffect } from 'react';
import { AffiliateLink } from '../types';
import { Input, Select, Button } from './ui';
import { SearchIcon, LinkIcon, CheckCircleIcon } from './icons';

interface ProductSelectorProps {
    affiliateLinks: AffiliateLink[];
    onSelectProduct: (productId: string | null) => void;
    selectedProductId: string | null;
    language: string;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ affiliateLinks, onSelectProduct, selectedProductId, language }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('productName-asc');

    const T = {
        'Việt Nam': {
            title: "Chọn Sản phẩm từ Kho Affiliate",
            subtitle: "Chọn một sản phẩm để quảng bá trong kế hoạch truyền thông này. Sản phẩm này sẽ được tự động liên kết với các bài đăng.",
            searchPlaceholder: "Tìm kiếm theo tên sản phẩm, ID, hoặc nhà cung cấp...",
            sortBy: "Sắp xếp theo",
            noProducts: "Không có sản phẩm nào trong Kho Affiliate.",
            noResults: "Không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn.",
            selectProduct: "Chọn sản phẩm này",
            selected: "Đã chọn",
            clearSelection: "Xóa lựa chọn",
        },
        'English': {
            title: "Select Product from Affiliate Vault",
            subtitle: "Choose a product to promote in this media plan. This product will be automatically linked to the posts.",
            searchPlaceholder: "Search by product name, ID, or provider...",
            sortBy: "Sort by",
            noProducts: "No products available in Affiliate Vault.",
            noResults: "No products found matching your search.",
            selectProduct: "Select this product",
            selected: "Selected",
            clearSelection: "Clear Selection",
        }
    };
    const texts = (T as any)[language] || T['English'];

    const processedLinks = useMemo(() => {
        const filtered = (affiliateLinks || []).filter(link =>
            link.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            link.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (link.providerName && link.providerName.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        const [sortKey, sortDir] = sortBy.split('-');

        return filtered.sort((a, b) => {
            let valA: any, valB: any;
            switch(sortKey) {
                case 'price':
                case 'commissionValue':
                    valA = a[sortKey as keyof AffiliateLink] as number;
                    valB = b[sortKey as keyof AffiliateLink] as number;
                    break;
                case 'productName':
                default:
                    valA = a.productName.toLowerCase();
                    valB = b.productName.toLowerCase();
                    break;
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [affiliateLinks, searchQuery, sortBy]);

    return (
        <div className="mt-6">
            <h3 className="text-2xl font-bold font-sans text-center text-gray-900">{texts.title}</h3>
            <p className="text-gray-500 font-serif text-center mt-1">{texts.subtitle}</p>

            <div className="mt-8 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Input
                        placeholder={texts.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 whitespace-nowrap">{texts.sortBy}:</label>
                    <Select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="productName-asc">{language === 'Việt Nam' ? 'Tên sản phẩm (A-Z)' : 'Product Name (A-Z)'}</option>
                        <option value="productName-desc">{language === 'Việt Nam' ? 'Tên sản phẩm (Z-A)' : 'Product Name (Z-A)'}</option>
                        <option value="price-desc">{language === 'Việt Nam' ? 'Giá (Cao-Thấp)' : 'Price (High-Low)'}</option>
                        <option value="price-asc">{language === 'Việt Nam' ? 'Giá (Thấp-Cao)' : 'Price (Low-High)'}</option>
                        <option value="commissionValue-desc">{language === 'Việt Nam' ? 'Hoa hồng (Cao-Thấp)' : 'Commission (High-Low)'}</option>
                        <option value="commissionValue-asc">{language === 'Việt Nam' ? 'Hoa hồng (Thấp-Cao)' : 'Commission (Low-High)'}</option>
                    </Select>
                </div>
            </div>

            {affiliateLinks.length === 0 ? (
                <div className="text-center py-20">
                    <LinkIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-2 text-2xl font-bold font-sans text-gray-900">{texts.noProducts}</h3>
                </div>
            ) : processedLinks.length === 0 ? (
                <div className="text-center py-20">
                    <SearchIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-2 text-2xl font-bold font-sans text-gray-900">{texts.noResults}</h3>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                    {processedLinks.map(link => (
                        <div
                            key={link.id}
                            className={`p-4 border rounded-lg shadow-sm flex flex-col ${selectedProductId === link.id ? 'border-brand-green bg-green-50' : 'bg-white hover:border-gray-300'}`}
                        >
                            <div className="flex items-center mb-2">
                                {link.product_avatar && (
                                    <img src={link.product_avatar} alt={link.productName} className="w-12 h-12 rounded-md object-cover mr-3" />
                                )}
                                <h4 className="font-bold text-gray-900 text-lg flex-grow">{link.productName}</h4>
                                {selectedProductId === link.id && (
                                    <CheckCircleIcon className="h-6 w-6 text-brand-green ml-2" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1"><strong>ID:</strong> {link.productId}</p>
                            <p className="text-sm text-gray-600 mb-1"><strong>{language === 'Việt Nam' ? 'Nhà cung cấp' : 'Provider'}:</strong> {link.providerName}</p>
                            <p className="text-sm text-gray-600 mb-2"><strong>{language === 'Việt Nam' ? 'Giá' : 'Price'}:</strong> {new Intl.NumberFormat(language === 'Việt Nam' ? 'vi-VN' : 'en-US', { style: 'currency', currency: language === 'Việt Nam' ? 'VND' : 'USD' }).format(link.price)}</p>
                            <div className="mt-auto pt-2 border-t border-gray-100">
                                {selectedProductId === link.id ? (
                                    <Button variant="secondary" onClick={() => onSelectProduct(null)} className="w-full">
                                        {texts.clearSelection}
                                    </Button>
                                ) : (
                                    <Button onClick={() => onSelectProduct(link.id)} className="w-full">
                                        {texts.selectProduct}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductSelector;
