import React, { useState } from 'react';
import { CopyIcon, CheckCircleIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', isLoading, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-brand-green text-white hover:bg-brand-green-dark',
    secondary: 'bg-white text-brand-green border border-brand-green hover:bg-green-50',
    tertiary: 'bg-transparent text-gray-600 hover:bg-gray-100'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
      ) : (
        children
      )}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input
    className={`w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-colors ${className}`}
    {...props}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, ...props }) => (
    <select
      className={`w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-colors ${className}`}
      {...props}
    />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
  <textarea
    className={`w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-colors ${className}`}
    rows={3}
    {...props}
  />
);

export const Section: React.FC<{ title: string; children: React.ReactNode, id?: string }> = ({ title, children, id }) => (
  <div id={id} className="py-8">
    <h3 className="text-3xl font-bold font-sans text-gray-900 mb-2 pb-4 border-b border-gray-200">{title}</h3>
    <div className="mt-4 font-serif text-gray-700 space-y-4">
        {children}
    </div>
  </div>
);

export const CopyableText: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg my-1 border border-gray-200">
            <code className="text-gray-700 break-all">{text}</code>
            <button onClick={handleCopy} className="ml-4 text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0">
                {copied ? 'Copied!' : <CopyIcon className="h-5 w-5"/>}
            </button>
        </div>
    );
};

export const HoverCopyWrapper: React.FC<{ children: React.ReactNode; textToCopy: string; className?: string; }> = ({ children, textToCopy, className }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`relative group ${className || ''}`}>
            {children}
            <button
                onClick={handleCopy}
                className="absolute top-1 right-1 p-1.5 bg-white/70 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                aria-label="Copy text"
                disabled={!textToCopy}
            >
                {copied ? <CheckCircleIcon className="h-5 w-5 text-brand-green" /> : <CopyIcon className="h-5 w-5" />}
            </button>
        </div>
    );
};


export const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, id, disabled = false }) => (
  <div className="flex items-center">
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`${
        checked ? 'bg-brand-green' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
    <label htmlFor={id} className={`ml-3 text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
      {label}
    </label>
  </div>
);

export const Checkbox: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}> = ({ checked, onCheckedChange, id, className }) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      id={id}
      className={`peer h-4 w-4 shrink-0 rounded-sm border-2 border-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-brand-green border-brand-green' : 'bg-white'} ${className}`}
    >
      <div className={`flex items-center justify-center text-white ${checked ? 'opacity-100' : 'opacity-0'}`}>
        <CheckIcon className="h-3 w-3" />
      </div>
    </button>
  );
};

export const Carousel: React.FC<{ images: string[], className?: string }> = ({ images, className }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    if (!images || images.length === 0) {
        return <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">No images to display</div>;
    }

    return (
        <div className={`relative w-full aspect-video group ${className || ''}`}>
            <div
                style={{ backgroundImage: `url(${images[currentIndex]})` }}
                className="w-full h-full rounded-lg bg-center bg-cover duration-500"
            ></div>
            {/* Left Arrow */}
            <div onClick={goToPrevious} className="hidden group-hover:block absolute top-[50%] -translate-y-[-50%] left-2 text-2xl rounded-full p-1 bg-black/20 text-white cursor-pointer">
                <ChevronLeftIcon className="w-6 h-6" />
            </div>
            {/* Right Arrow */}
            <div onClick={goToNext} className="hidden group-hover:block absolute top-[50%] -translate-y-[-50%] right-2 text-2xl rounded-full p-1 bg-black/20 text-white cursor-pointer">
                <ChevronRightIcon className="w-6 h-6" />
            </div>
            <div className="absolute bottom-2 right-0 left-0">
                <div className="flex items-center justify-center gap-2">
                    {images.map((_, slideIndex) => (
                        <div
                            key={slideIndex}
                            onClick={() => setCurrentIndex(slideIndex)}
                            className={`transition-all cursor-pointer w-2 h-2 bg-white rounded-full ${currentIndex === slideIndex ? 'p-1.5' : 'bg-opacity-50'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};