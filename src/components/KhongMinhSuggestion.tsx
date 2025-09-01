import React, { useState, useEffect } from 'react';
import type { AffiliateLink } from '../../types';
import { Button } from './ui';
import { KhongMinhIcon, LinkIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface KhongMinhSuggestionProps {
  acceptedProducts: AffiliateLink[];
  suggestedProducts: AffiliateLink[];
  isAnalyzing: boolean;
  isAnyAnalysisRunning: boolean;
  onAccept: (productId: string) => void;
  language: string;
  onRunAnalysis: () => void;
  affiliateLinksCount: number;
}

const KhongMinhSuggestion: React.FC<KhongMinhSuggestionProps> = ({ acceptedProducts, suggestedProducts, isAnalyzing, isAnyAnalysisRunning, onAccept, language, onRunAnalysis, affiliateLinksCount }) => {
    
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // If the current index is now out of bounds because the list shrank, reset it.
        if (currentIndex >= suggestedProducts.length) {
            setCurrentIndex(suggestedProducts.length > 0 ? suggestedProducts.length - 1 : 0);
        }
    }, [suggestedProducts, currentIndex]);

    const T = {
        'Việt Nam': {
            thinking: "Khổng Minh đang suy nghĩ...",
            suggests: "Khổng Minh gợi ý",
            accept: "Chấp nhận",
            promotedProduct: "Sản phẩm được quảng bá",
            viewProduct: "Xem sản phẩm",
            getSuggestions: "Lấy gợi ý",
        },
        'English': {
            thinking: "KhongMinh is thinking...",
            suggests: "KhongMinh Suggests",
            accept: "Accept",
            promotedProduct: "Promoted Product",
            viewProduct: "View Product",
            getSuggestions: "Get Suggestions",
        }
    };
    const texts = T[language as keyof typeof T] || T['English'];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(language === 'Việt Nam' ? 'vi-VN' : 'en-US', {
            style: 'currency',
            currency: language === 'Việt Nam' ? 'VND' : 'USD',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const hasSuggestions = suggestedProducts && suggestedProducts.length > 0;
    const currentSuggestion = hasSuggestions ? suggestedProducts[currentIndex] : null;

    // Handle accepting a product
    const handleAccept = (productId: string) => {
        onAccept(productId);
        // When a product is accepted, the suggestedProducts array will be filtered in the parent component
        // The currentIndex will be automatically adjusted by the useEffect if it becomes out of bounds
    };

    return (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <h5 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <KhongMinhIcon className="h-5 w-5"/>
                KhongMinh
            </h5>

            {/* Accepted Products */}
            {acceptedProducts.length > 0 && (
                <div className="space-y-2">
                    {acceptedProducts.map(product => (
                        <div key={product.id} className="p-2 bg-green-100/50 border border-green-200 rounded-md">
                            <p className="text-xs text-green-800 font-semibold flex items-center gap-1.5"><CheckCircleIcon className="h-4 w-4" /> {texts.promotedProduct}</p>
                            <p className="mt-1 text-sm text-green-900 font-medium">{product.productName}</p>
                            <a href={product.productLink} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                {texts.viewProduct}
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {/* Suggestions Carousel / Get Suggestions Button */}
            {isAnalyzing && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
                    <div className="w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
                    {texts.thinking}
                </div>
            )}
            
            {!isAnalyzing && hasSuggestions && currentSuggestion && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800 font-semibold">{texts.suggests}</p>
                    <div className="flex items-center gap-1 mt-2">
                         <Button
                            variant="tertiary"
                            onClick={() => setCurrentIndex(i => i - 1)}
                            disabled={currentIndex === 0}
                            className="p-1 h-8 w-8 rounded-full"
                         >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </Button>

                        <div className="flex-grow text-center">
                            <p className="text-sm text-blue-900 font-semibold">{currentSuggestion.productName}</p>
                            <p className="text-xs text-blue-700">{formatCurrency(currentSuggestion.price)}</p>
                        </div>
                        
                         <Button
                            variant="tertiary"
                            onClick={() => setCurrentIndex(i => i + 1)}
                            disabled={currentIndex >= suggestedProducts.length - 1}
                            className="p-1 h-8 w-8 rounded-full"
                         >
                            <ChevronRightIcon className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="mt-3 flex justify-end items-center gap-2">
                         <a href={currentSuggestion.productLink} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-700 hover:underline flex items-center gap-1">
                            {texts.viewProduct}
                        </a>
                        <Button onClick={() => handleAccept(currentSuggestion.id)} className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700">{texts.accept}</Button>
                    </div>
                </div>
            )}

            {!isAnalyzing && !hasSuggestions && acceptedProducts.length === 0 && affiliateLinksCount > 0 && (
                <div className="mt-2">
                    <Button
                        variant="secondary"
                        onClick={onRunAnalysis}
                        disabled={isAnyAnalysisRunning}
                        className="w-full text-xs py-1.5 px-2 flex items-center justify-center gap-2"
                    >
                        <KhongMinhIcon className="h-4 w-4 text-gray-600"/>
                        {texts.getSuggestions}
                    </Button>
                </div>
            )}

        </div>
    );
};

export default KhongMinhSuggestion;