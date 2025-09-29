import React, { useState, useRef, useMemo, useEffect } from 'react';
import ExcelJS, { Cell } from 'exceljs';
import type { AffiliateLink } from '../../types';
import { Button, Input, Select } from './ui';
import { ArrowPathIcon, PlusIcon, UploadIcon, SearchIcon, ScaleIcon, CollectionIcon, LinkIcon, RefreshIcon } from './icons';
import RefreshButton from './RefreshButton';
import ProductCard from './ProductCard';
import GenericTabTemplate from './GenericTabTemplate';

interface AffiliateVaultDisplayProps {
  mongoBrandId: string | null;
  affiliateLinks: AffiliateLink[];
  onSaveLink: (link: AffiliateLink) => void;
  onDeleteLink: (linkId: string) => void;
  onImportLinks: (links: Omit<AffiliateLink, 'id' | 'brandId'>[]) => void;
  onReloadLinks: () => void;
  onGenerateIdeasFromProduct?: (product: AffiliateLink) => void;
  generatingIdeasForProductId?: string | null;
  language: string;
  isDataLoaded?: boolean;
  onLoadData?: (brandId: string) => Promise<void>;
  isLoading?: boolean;
}

const emptyLink: Omit<AffiliateLink, 'id' | 'brandId'> = {
    productName: '',
    productLink: '',
    providerName: '',
    commissionRate: 0,
    notes: '',
};

const AffiliateVaultDisplay: React.FC<AffiliateVaultDisplayProps> = ({ mongoBrandId, affiliateLinks, onSaveLink, onDeleteLink, onImportLinks, onReloadLinks, onGenerateIdeasFromProduct, generatingIdeasForProductId, language, isDataLoaded, onLoadData, isLoading }) => {
    const [isAddingNewLink, setIsAddingNewLink] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('productName-asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(20);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedProductIds, setSelectedProductIds] = useState(new Set<string>());

    useEffect(() => {
        if (!isDataLoaded && onLoadData && mongoBrandId) {
            onLoadData(mongoBrandId);
        }
    }, [isDataLoaded, onLoadData, mongoBrandId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, productsPerPage]);

    const handleToggleSelection = (linkId: string) => {
        const newSelection = new Set(selectedProductIds);
        if (newSelection.has(linkId)) {
            newSelection.delete(linkId);
        } else {
            newSelection.add(linkId);
        }
        setSelectedProductIds(newSelection);
    };

    const handleToggleActive = (link: AffiliateLink) => {
        onSaveLink({ ...link, isActive: link.isActive === false ? true : false });
    };

    const T = {
        'Việt Nam': {
            title: "Kho Affiliate",
            subtitle: "Quản lý tất cả các liên kết sản phẩm affiliate của bạn ở một nơi.",
            addLink: "Thêm liên kết mới",
            importFromFile: "Nhập từ tệp",
            reload: "Tải lại",
            noLinks: "Chưa có liên kết affiliate nào.",
            addFirstLink: "Thêm liên kết đầu tiên của bạn để bắt đầu.",
            noResults: "Không tìm thấy kết quả",
            noResultsDesc: "Hãy thử một tìm kiếm khác hoặc thêm một liên kết mới.",
            confirmDeleteMessage: "Bạn có chắc chắn muốn xóa liên kết này không?",
            totalLinks: "Tổng số liên kết",
            avgRate: "Tỷ lệ HH TB",
            searchPlaceholder: "Tìm kiếm theo tên hoặc nhà cung cấp...",
            sortBy: "Sắp xếp theo",
            productsPerPage: "Sản phẩm/trang"
        },
        'English': {
            title: "Affiliate Vault",
            subtitle: "Manage all of your affiliate product links in one place.",
            addLink: "Add New Link",
            importFromFile: "Import from File",
            reload: "Reload",
            noLinks: "No affiliate links yet.",
            addFirstLink: "Add your first link to get started.",
            noResults: "No results found",
            noResultsDesc: "Try a different search or add a new link.",
            confirmDeleteMessage: "Are you sure you want to delete this link?",
            totalLinks: "Total Links",
            avgRate: "Avg. Rate",
            searchPlaceholder: "Search by name or provider...",
            sortBy: "Sort by",
            productsPerPage: "Products/page"
        }
    };
    const texts = (T as any)[language] || T['English'];

    const processedLinks = useMemo(() => {
        const filtered = affiliateLinks.filter(link =>
            (link.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (link.providerName || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        const [sortKey, sortDir] = sortBy.split('-');

        return filtered.sort((a, b) => {
            let valA: string | number, valB: string | number;
            switch (sortKey) {
                case 'commissionRate':
                    valA = a.commissionRate || 0;
                    valB = b.commissionRate || 0;
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

    const getCellValue = (cell: Cell): string => {
        if (!cell || cell.value === null || cell.value === undefined) return '';
        const val = cell.value;
        if (typeof val === 'object' && val !== null) {
            if ('richText' in val && Array.isArray((val as any).richText)) return (val as any).richText.map((rt: any) => rt.text).join('');
            if ('text' in val) return String((val as any).text);
            if ('result' in val) return String((val as any).result);
            return val.toString();
        }
        return String(val);
    };
    
    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const workbook = new ExcelJS.Workbook();
        let worksheet: ExcelJS.Worksheet;
    
        try {
            const buffer = await file.arrayBuffer();
            await workbook.xlsx.load(buffer);
            worksheet = workbook.worksheets[0];

            if (!worksheet) throw new Error("Could not find a worksheet.");
    
            const headers: Record<string, number> = {};
            worksheet.getRow(1).eachCell((cell, colNumber) => {
                headers[getCellValue(cell).trim().toLowerCase()] = colNumber;
            });
    
            const headerMapping: Record<string, keyof Omit<AffiliateLink, 'id' | 'brandId'>> = {
                'product name': 'productName',
                'tên sản phẩm': 'productName',
                'product link': 'productLink',
                'link sản phẩm': 'productLink',
                'provider name': 'providerName',
                'tên cửa hàng': 'providerName',
                'commission rate': 'commissionRate',
                'tỉ lệ hoa hồng': 'commissionRate',
                'notes': 'notes',
                'ghi chú': 'notes',
            };
    
            const importedLinks: Omit<AffiliateLink, 'id' | 'brandId'>[] = [];
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
    
                const link: Partial<AffiliateLink> = {};
                Object.entries(headerMapping).forEach(([header, key]) => {
                    const colNumber = headers[header];
                    if (colNumber) {
                        const cellValue = getCellValue(row.getCell(colNumber));
                        if (cellValue) {
                            if (key === 'commissionRate') {
                                (link as any)[key] = parseFloat(cellValue) || 0;
                            } else {
                                (link as any)[key] = cellValue;
                            }
                        }
                    }
                });
    
                if (link.productName && link.productLink) {
                    importedLinks.push({
                        productName: String(link.productName),
                        productLink: String(link.productLink),
                        providerName: String(link.providerName || ''),
                        commissionRate: Number(link.commissionRate || 0),
                        notes: String(link.notes || ''),
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

    const actionButtons = (
        <div className="flex flex-row gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                className="hidden"
                accept=".xlsx"
            />
            <Button onClick={onReloadLinks} variant="secondary" size="sm" className="whitespace-nowrap">
                <ArrowPathIcon className="h-4 w-4" /> 
                <span className="hidden sm:inline">{texts.reload}</span>
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="sm" className="whitespace-nowrap">
                <UploadIcon className="h-4 w-4" /> 
                <span className="hidden sm:inline">{texts.importFromFile}</span>
            </Button>
            <Button onClick={() => setIsAddingNewLink(true)} size="sm" className="whitespace-nowrap">
                <PlusIcon className="h-4 w-4" /> 
                <span className="hidden sm:inline">{texts.addLink}</span>
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
            isLoading={isLoading && !generatingIdeasForProductId}
        >
            <div className="mb-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                    <Input
                        placeholder={texts.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                     <div className="flex items-center gap-2">
                        <label htmlFor="products-per-page" className="text-sm font-medium text-gray-700 whitespace-nowrap">Products/page:</label>
                        <Select id="products-per-page" value={productsPerPage} onChange={(e) => setProductsPerPage(Number(e.target.value))}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                        <Select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="productName-asc">Product Name (A-Z)</option>
                            <option value="productName-desc">Product Name (Z-A)</option>
                            <option value="commissionRate-desc">Comm. Rate (High-Low)</option>
                            <option value="commissionRate-asc">Comm. Rate (Low-High)</option>
                        </Select>
                    </div>
                </div>
            </div>

            <main className="flex-grow overflow-y-auto -mx-4 p-4 flex flex-col">
                {(affiliateLinks.length > 0 || isAddingNewLink) ? (
                    <>
                        <div className="flex-grow">
                            {(displayLinks.length > 0 || isAddingNewLink) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                                     {isAddingNewLink && (
                                        <ProductCard
                                            isNew
                                            link={{...emptyLink, id: 'new', brandId: ''}}
                                            onSave={handleSaveNew}
                                            onCancel={() => setIsAddingNewLink(false)}
                                            language={language}
                                            onGenerateIdeas={onGenerateIdeasFromProduct}
                                            generatingIdeasForProductId={generatingIdeasForProductId}
                                            isSelected={false}
                                            onToggleSelection={() => {}}
                                            onToggleActive={() => {}}
                                        />
                                    )}
                                    {displayLinks.map(link => (
                                        <ProductCard
                                            key={link.id}
                                            link={link}
                                            onSave={onSaveLink}
                                            onDelete={() => handleDelete(link.id)}
                                            language={language}
                                            onGenerateIdeas={onGenerateIdeasFromProduct}
                                            generatingIdeasForProductId={generatingIdeasForProductId}
                                            isSelected={selectedProductIds.has(link.id)}
                                            onToggleSelection={handleToggleSelection}
                                            onToggleActive={handleToggleActive}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <SearchIcon className="mx-auto h-16 w-16 text-gray-400" />
                                    <h3 className="mt-2 text-2xl font-bold font-sans text-gray-900">No results found</h3>
                                    <p className="mt-1 text-md text-gray-500 font-serif">Try a different search or add a new link.</p>
                                </div>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-center items-center gap-4 pt-4 border-t border-gray-200">
                                <Button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    variant="tertiary"
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-medium text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    variant="tertiary"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <LinkIcon className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-2 text-2xl font-bold font-sans text-gray-900">No affiliate links yet.</h3>
                        <p className="mt-1 text-md text-gray-500 font-serif">Add your first link to get started.</p>
                    </div>
                )}
            </main>
        </GenericTabTemplate>
    );
};

export default AffiliateVaultDisplay;