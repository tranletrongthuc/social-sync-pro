import React from 'react';
import { Button } from './ui';
import type { FacebookPage } from '../types';

interface FacebookPageSelectionModalProps {
    isOpen: boolean;
    pages: FacebookPage[];
    onSelectPage: (page: FacebookPage) => void;
    onClose: () => void;
    language: string;
    onRetryConnect: () => void; // New prop to retry connection
}

const FacebookPageSelectionModal: React.FC<FacebookPageSelectionModalProps> = ({ isOpen, pages, onSelectPage, onClose, language, onRetryConnect }) => {
    //  console.log("FacebookPageSelectionModal isOpen:", isOpen);
    if (!isOpen) return null;

    const T = {
        'Việt Nam': {
            title: "Chọn Trang Facebook",
            subtitle: "Vui lòng chọn Trang Facebook bạn muốn kết nối.",
            select: "Chọn",
            cancel: "Hủy",
            noPages: "Không tìm thấy Trang Facebook nào. Vui lòng đảm bảo bạn có ít nhất một Trang và đã cấp quyền cần thiết.",
            retryConnect: "Thử kết nối lại",
        },
        'English': {
            title: "Select Facebook Page",
            subtitle: "Please select the Facebook Page you wish to connect.",
            select: "Select",
            cancel: "Cancel",
            noPages: "No Facebook Pages found. Please ensure you have at least one Page and have granted the necessary permissions.",
            retryConnect: "Try Connecting Again",
        }
    };
    const texts = (T as any)[language] || T['English'];

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 m-4 p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold font-sans text-gray-900 mb-2">{texts.title}</h2>
                <p className="text-gray-600 mb-4">{texts.subtitle}</p>

                {pages.length === 0 ? (
                    <div className="text-center my-4">
                        <p className="text-red-500 mb-4">{texts.noPages}</p>
                        <Button onClick={onRetryConnect}>{texts.retryConnect}</Button>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2">
                        {pages.map(page => (
                            <div key={page.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <span className="font-medium text-gray-800">{page.name}</span>
                                <Button size="sm" onClick={() => onSelectPage(page)}>{texts.select}</Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <Button variant="tertiary" onClick={onClose}>{texts.cancel}</Button>
                </div>
            </div>
        </div>
    );
};

export default FacebookPageSelectionModal;