
import React, { useState, useRef, useMemo, useEffect } from 'react';

import ExcelJS, { Cell } from 'exceljs';
import type { AffiliateLink } from '../types';
import { Button, Input, Select } from './ui';
import { ArrowPathIcon, PlusIcon, UploadIcon, SearchIcon, CashIcon, ScaleIcon, CollectionIcon, SparklesIcon, LinkIcon } from './icons';
import ProductCard from './ProductCard';

interface AffiliateVaultDisplayProps {
  affiliateLinks: AffiliateLink[];
  onSaveLink: (link: AffiliateLink) => void;
  onDeleteLink: (linkId: string) => void;
  onImportLinks: (links: AffiliateLink[]) => void;
  onReloadLinks: () => void; // New prop for reloading links
  onGenerateIdeasFromProduct?: (product: AffiliateLink) => void; // New prop for generating ideas from a product
  language: string;
  // Lazy loading props
  isDataLoaded?: boolean;
  onLoadData?: () => void;
  isLoading?: boolean;
}

const emptyLink: Omit<AffiliateLink, 'id'> = {
    productId: '',
    productName: '',
    price: 0,
    salesVolume: 0,
    providerName: '',
    commissionRate: 0,
    commissionValue: 0,
    productLink: '',
    promotionLink: '',
};

const AffiliateVaultDisplay: React.FC<AffiliateVaultDisplayProps> = ({ affiliateLinks, onSaveLink, onDeleteLink, onImportLinks, onReloadLinks, onGenerateIdeasFromProduct, language, isDataLoaded, onLoadData, isLoading }) => {
    const [isAffiliateVaultDataLoaded, setIsAffiliateVaultDataLoaded] = useState(false);
    const [isLoadingAffiliateVaultData, setIsLoadingAffiliateVaultData] = useState(false);
    
    // Load data when component mounts if not already loaded
    useEffect(() => {
        if (!isDataLoaded && onLoadData && !isLoading) {
            setIsLoadingAffiliateVaultData(true);
            onLoadData().finally(() => {
                setIsLoadingAffiliateVaultData(false);
                setIsAffiliateVaultDataLoaded(true);
            });
        } else if (isDataLoaded) {
            setIsAffiliateVaultDataLoaded(true);
        }
    }, [isDataLoaded, onLoadData, isLoading]);
    const [isAddingNewLink, setIsAddingNewLink] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('productName-asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(20);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, productsPerPage]);

    const T = {
        'Việt Nam': {
            title: "Kho Affiliate",
            subtitle: "Quản lý tất cả các liên kết sản phẩm affiliate của bạn ở một nơi.",
            addLink: "Thêm liên kết mới",
            importFromFile: "Nhập từ tệp",
            // Empty State
            noLinks: "Chưa có liên kết affiliate nào.",
            addFirstLink: "Thêm liên kết đầu tiên của bạn để bắt đầu.",
            noResults: "Không tìm thấy kết quả",
            noResultsDesc: "Hãy thử một tìm kiếm khác hoặc thêm một liên kết mới.",
            // Confirm
            confirmDeleteMessage: "Bạn có chắc chắn muốn xóa liên kết này không? Hành động này không thể hoàn tác và sẽ xóa bản ghi khỏi Airtable nếu được kết nối.",
            // KPIs
            totalLinks: "Tổng số liên kết",
            totalComm: "Tổng hoa hồng",
            avgRate: "Tỷ lệ trung bình",
            topPerformer: "Hiệu suất cao nhất",
            // Toolbar
            searchPlaceholder: "Tìm kiếm theo tên, ID, hoặc nhà cung cấp...",
            sortBy: "Sắp xếp theo",
            productsPerPage: "Sản phẩm/trang"
        },
        'English': {
            title: "Affiliate Vault",
            subtitle: "Manage all of your affiliate product links in one place.",
            addLink: "Add New Link",
            importFromFile: "Import from File",
            // Empty State
            noLinks: "No affiliate links yet.",
            addFirstLink: "Add your first link to get started.",
            noResults: "No results found",
            noResultsDesc: "Try a different search or add a new link.",
            // Confirm
            confirmDeleteMessage: "Are you sure you want to delete this link? This cannot be undone and will remove the record from Airtable if connected.",
            // KPIs
            totalLinks: "Total Links",
            totalComm: "Total Commission",
            avgRate: "Average Rate",
            topPerformer: "Top Performer",
            // Toolbar
            searchPlaceholder: "Search by name, ID, or provider...",
            sortBy: "Sort by",
            productsPerPage: "Products/page"
        }
    };
    const texts = (T as any)[language] || T['English'];

    const formatCurrency = useMemo(() => (value: number) => {
        return new Intl.NumberFormat(language === 'Việt Nam' ? 'vi-VN' : 'en-US', {
            style: 'currency',
            currency: language === 'Việt Nam' ? 'VND' : 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }, [language]);

    console.log("affiliateLinks:", affiliateLinks);

    const kpiData = useMemo(() => {
        const totalLinks = affiliateLinks.length;
        if (totalLinks === 0) {
            return {
                totalLinks: '0',
                totalComm: formatCurrency(0),
                avgRate: '0%',
                topPerformer: { name: 'N/A', value: '' }
            }
        }
        const totalComm = affiliateLinks.reduce((sum, link) => sum + link.commissionValue, 0);
        const totalRate = affiliateLinks.reduce((sum, link) => sum + link.commissionRate, 0);
        const avgRate = totalLinks > 0 ? totalRate / totalLinks : 0;
        const topPerformer = [...affiliateLinks].sort((a,b) => b.commissionValue - a.commissionValue)[0];

        return {
            totalLinks: totalLinks.toString(),
            totalComm: formatCurrency(totalComm),
            avgRate: `${avgRate.toFixed(1)}%`,
            topPerformer: {
                name: topPerformer?.productName || 'N/A',
                value: formatCurrency(topPerformer?.commissionValue || 0)
            }
        }
    }, [affiliateLinks, formatCurrency]);

    const processedLinks = useMemo(() => {
        const filtered = affiliateLinks.filter(link => 
            link.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            link.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            link.providerName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const [sortKey, sortDir] = sortBy.split('-');
        
        return filtered.sort((a, b) => {
            let valA, valB;
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

    const displayLinks = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        return processedLinks.slice(startIndex, startIndex + productsPerPage);
    }, [processedLinks, currentPage, productsPerPage]);

    const handleDelete = (linkId: string) => {
        if (window.confirm(texts.confirmDeleteMessage)) {
            onDeleteLink(linkId);
        }
    };

    const handleSaveNew = (link: AffiliateLink) => {
        onSaveLink(link);
        setIsAddingNewLink(false);
    };

    const handleGenerateIdeas = (product: AffiliateLink) => {
        // This function will be called when the "Generate Ideas" button is clicked
        if (onGenerateIdeasFromProduct) {
            onGenerateIdeasFromProduct(product);
        }
    };

    const getCellValue = (cell: Cell): string => {
        if (!cell || cell.value === null || cell.value === undefined) return '';
        const val = cell.value;
        if (typeof val === 'object' && val !== null) {
            if ('richText' in val && Array.isArray((val as any).richText)) return (val as any).richText.map((rt:any) => rt.text).join('');
            if ('text' in val) return String((val as any).text);
            if ('result' in val) return String((val as any).result);
            return val.toString();
        }
        return String(val);
    };

    const parseAffiliateNumeric = (value: string | number | null | undefined): number => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
    
        let s = String(value).toLowerCase().trim();
    
        // Remove currency symbols, percent, and '+' from "k+" etc.
        s = s.replace(/₫|vnd|\+|%/g, '').trim();
    
        let multiplier = 1;
        if (s.endsWith('tr')) {
            multiplier = 1000000;
            s = s.slice(0, -2).trim();
        } else if (s.endsWith('k')) {
            multiplier = 1000;
            s = s.slice(0, -1).trim();
        }
        
        // For Vietnamese style numbers: remove dots (thousands separators), then replace comma with dot (decimal separator).
        s = s.replace(/\./g, '').replace(/,/g, '.');
        
        const num = parseFloat(s);
    
        if (isNaN(num)) {
            return 0;
        }
    
        return num * multiplier;
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const workbook = new ExcelJS.Workbook();
        let worksheet: ExcelJS.Worksheet;
    
        try {
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                const csvText = await file.text();
                const parsedRows = csvText.trim().split(/\r?\n/).map(line => line.split(',').map(field => field.trim().replace(/^"|"$/g, '')));
                worksheet = workbook.addWorksheet('Imported CSV');
                worksheet.addRows(parsedRows);
            } else {
                const buffer = await file.arrayBuffer();
                await workbook.xlsx.load(buffer);
                worksheet = workbook.worksheets[0];
            }

            if (!worksheet) throw new Error("Could not find a worksheet.");
    
            const headers: Record<string, number> = {};
            worksheet.getRow(1).eachCell((cell, colNumber) => {
                headers[getCellValue(cell).trim().toLowerCase()] = colNumber;
            });
    
            const headerMapping: Record<string, keyof AffiliateLink> = {
                'mã sản phẩm': 'productId', 'product id': 'productId',
                'tên sản phẩm': 'productName', 'product name': 'productName',
                'giá': 'price', 'price': 'price',
                'doanh số': 'salesVolume', 'sales volume': 'salesVolume', 'doanh thu': 'salesVolume',
                'tên cửa hàng': 'providerName', 'provider name': 'providerName',
                'tỉ lệ hoa hồng': 'commissionRate', 'commission rate': 'commissionRate',
                'hoa hồng': 'commissionValue', 'commission value': 'commissionValue',
                'link sản phẩm': 'productLink', 'product link': 'productLink',
                'link ưu đãi': 'promotionLink', 'promotion link': 'promotionLink',
            };
    
            const importedLinks: AffiliateLink[] = [];
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
    
                const link: Partial<AffiliateLink> = {};
                Object.entries(headerMapping).forEach(([header, key]) => {
                    const colNumber = headers[header];
                    if (colNumber) {
                        const cellValue = getCellValue(row.getCell(colNumber));
                        if (cellValue) (link as any)[key] = cellValue;
                    }
                });
    
                if (link.productName && link.productLink) {
                    importedLinks.push({
                        id: crypto.randomUUID(),
                        productId: String(link.productId || ''),
                        productName: String(link.productName),
                        price: parseAffiliateNumeric(link.price),
                        salesVolume: parseAffiliateNumeric(link.salesVolume),
                        providerName: String(link.providerName || ''),
                        commissionRate: parseAffiliateNumeric(link.commissionRate),
                        commissionValue: parseAffiliateNumeric(link.commissionValue),
                        productLink: String(link.productLink),
                        promotionLink: String(link.promotionLink || ''),
                    });
                }
            });
            onImportLinks(importedLinks);
        } catch (err) {
            console.error("Failed to import file:", err);
            alert("Error processing file.");
        }
        event.target.value = '';
    };

    const totalPages = Math.ceil(processedLinks.length / productsPerPage);

    return (
        <div className="h-full flex flex-col p-6 lg:p-10 bg-gray-50/50">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900 flex items-center gap-3"><LinkIcon className="h-8 w-8 text-brand-green"/> {texts.title}</h2>
                    <p className="text-lg text-gray-500 font-serif mt-1">{texts.subtitle}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button variant="secondary" onClick={onReloadLinks} className="flex items-center gap-2">
                        <ArrowPathIcon className="h-5 w-5"/> {texts.reload}
                    </Button>
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                        <UploadIcon className="h-5 w-5"/> {texts.importFromFile}
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .csv" />
                    <Button onClick={() => setIsAddingNewLink(true)} className="flex items-center gap-2">
                        <PlusIcon className="h-5 w-5"/> {texts.addLink}
                    </Button>
                </div>
            </header>

            {/* KPIs */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-2 text-center">
                        <CollectionIcon className="h-7 w-7 text-green-600 mx-auto mb-1"/>
                        <p className="text-sm font-medium text-gray-500">{texts.totalLinks}</p>
                        <p className="text-xl font-bold text-gray-900">{kpiData.totalLinks}</p>
                    </div>
                    <div className="p-2 text-center">
                        <CashIcon className="h-7 w-7 text-green-600 mx-auto mb-1"/>
                        <p className="text-sm font-medium text-gray-500">{texts.totalComm}</p>
                        <p className="text-xl font-bold text-gray-900">{kpiData.totalComm}</p>
                    </div>
                    <div className="p-2 text-center">
                        <ScaleIcon className="h-7 w-7 text-green-600 mx-auto mb-1"/>
                        <p className="text-sm font-medium text-gray-500">{texts.avgRate}</p>
                        <p className="text-xl font-bold text-gray-900">{kpiData.avgRate}</p>
                    </div>
                    <div className="p-2 text-center">
                        <SparklesIcon className="h-7 w-7 text-green-600 mx-auto mb-1"/>
                        <p className="text-sm font-medium text-gray-500">{texts.topPerformer}</p>
                        <p className="text-xl font-bold text-gray-900 truncate" title={kpiData.topPerformer.name}>{kpiData.topPerformer.value}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Input 
                        placeholder={texts.searchPlaceholder} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                     <div className="flex items-center gap-2">
                        <label htmlFor="products-per-page" className="text-sm font-medium text-gray-700 whitespace-nowrap">{texts.productsPerPage}:</label>
                        <Select id="products-per-page" value={productsPerPage} onChange={(e) => setProductsPerPage(Number(e.target.value))}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
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
            </div>

            <main className="flex-grow overflow-y-auto -mx-2 p-2 sm:p-4 lg:p-6 flex flex-col">
                {(affiliateLinks.length > 0 || isAddingNewLink) ? (
                    <>
                        <div className="flex-grow">
                            {(displayLinks.length > 0 || isAddingNewLink) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                     {isAddingNewLink && (
                                        <ProductCard
                                            isNew
                                            link={{...emptyLink, id: 'new'}}
                                            onSave={handleSaveNew}
                                            onCancel={() => setIsAddingNewLink(false)}
                                            formatCurrency={formatCurrency}
                                            language={language}
                                        />
                                    )}
                                    {displayLinks.map(link => (
                                        <ProductCard 
                                            key={link.id}
                                            link={link}
                                            onSave={onSaveLink}
                                            onDelete={() => handleDelete(link.id)}
                                            formatCurrency={formatCurrency}
                                            language={language}
                                            onGenerateIdeas={handleGenerateIdeas}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <SearchIcon className="mx-auto h-16 w-16 text-gray-400" />
                                    <h3 className="mt-2 text-2xl font-bold font-sans text-gray-900">{texts.noResults}</h3>
                                    <p className="mt-1 text-md text-gray-500 font-serif">{texts.noResultsDesc}</p>
                                </div>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-center items-center gap-4 pt-4 border-t border-gray-200">
                                <Button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                >
                                    {language === 'Việt Nam' ? 'Trước' : 'Previous'}
                                </Button>
                                <span className="text-sm font-medium text-gray-700">
                                    {language === 'Việt Nam' ? `Trang ${currentPage} / ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                                </span>
                                <Button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    variant="outline"
                                >
                                    {language === 'Việt Nam' ? 'Sau' : 'Next'}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <LinkIcon className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-2 text-2xl font-bold font-sans text-gray-900">{texts.noLinks}</h3>
                        <p className="mt-1 text-md text-gray-500 font-serif">{texts.addFirstLink}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AffiliateVaultDisplay;
