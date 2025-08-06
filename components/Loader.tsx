import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from './icons';

interface LoaderProps {
    title: string;
    steps: string[];
    currentStep?: number; // Optional: for externally controlled progress
}

const Loader: React.FC<LoaderProps> = ({ title, steps, currentStep }) => {
    const [internalStep, setInternalStep] = useState(0);
    
    // Use the externally provided step if it exists, otherwise use internal state.
    const currentStepIndex = currentStep !== undefined ? currentStep : internalStep;

    useEffect(() => {
        // If the loader is externally controlled, don't run the internal timer.
        if (currentStep !== undefined || steps.length === 0) return;

        // Approximate total time for a long generation task, divided by number of steps
        const totalDuration = 25000; // 25 seconds
        const stepInterval = Math.max(2000, totalDuration / steps.length);

        const interval = setInterval(() => {
            setInternalStep(prev => {
                // Stop incrementing when we reach the second to last step. The last step will show as "in-progress" until the loader is removed.
                if (prev < steps.length - 1) {
                    return prev + 1;
                }
                clearInterval(interval);
                return prev;
            });
        }, stepInterval);

        return () => clearInterval(interval);
    }, [steps, currentStep]);

    return (
        <div className="fixed inset-0 bg-white/95 flex flex-col items-center justify-center z-50 backdrop-blur-md p-4 transition-opacity duration-300">
            <div className="w-full max-w-lg text-center">
                <div className="w-12 h-12 border-4 border-t-transparent border-brand-green rounded-full animate-spin mx-auto"></div>
                <h2 className="mt-6 text-3xl font-bold font-sans text-gray-900">{title}</h2>
                <p className="mt-2 text-lg text-gray-500 font-serif">Our AI is crafting your assets. This may take a moment.</p>
                
                {steps.length > 0 && (
                    <ul className="mt-8 space-y-4 text-left border-t border-gray-200 pt-6">
                        {steps.map((step, index) => (
                            <li key={index} className={`flex items-start gap-4 transition-all duration-500 ${currentStepIndex >= index ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-0.5">
                                    {currentStepIndex > index ? (
                                        <CheckCircleIcon className="h-6 w-6 text-brand-green" />
                                    ) : currentStepIndex === index ? (
                                        <div className="w-6 h-6 rounded-full bg-brand-green/20 flex items-center justify-center">
                                            <div className="h-3 w-3 bg-brand-green rounded-full animate-pulse"></div>
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                <span className={`font-medium ${currentStepIndex > index ? 'text-gray-500 line-through' : currentStepIndex === index ? 'text-gray-900' : 'text-gray-500'}`}>{step}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Loader;
