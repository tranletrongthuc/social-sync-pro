import { useEffect, useRef, useCallback } from 'react';
import type { GeneratedAssets } from '../../types';
import { createOrUpdateBrandRecordInDatabase } from '../services/databaseService';

interface UseAutoSaveProps {
    generatedAssets: GeneratedAssets | null;
    mongoBrandId: string | null;
    updateAutoSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    autoSaveInterval?: number; // milliseconds, default 2000
}

export const useAutoSave = ({
    generatedAssets,
    mongoBrandId,
    updateAutoSaveStatus,
    autoSaveInterval = 2000
}: UseAutoSaveProps) => {
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedAssetsRef = useRef<string | null>(null);
    const isSavingRef = useRef<boolean>(false);
    const retryCountRef = useRef<number>(0);
    const MAX_RETRY_ATTEMPTS = 3;

    const getAssetsHash = useCallback((assets: GeneratedAssets | null): string => {
        if (!assets) return '';
        // This hash should only include fields that are part of the main 'brands' document.
        // Sub-collections like ideas, personas, and media plans are saved via their own
        // explicit actions and should not trigger this top-level auto-save.
        const simplifiedAssets = {
            brandFoundation: assets.brandFoundation,
            coreMediaAssets: assets.coreMediaAssets,
            unifiedProfileAssets: assets.unifiedProfileAssets,
            // DO NOT include counts of sub-collections here.
        };
        return JSON.stringify(simplifiedAssets);
    }, []);

    const performSave = useCallback(async (assets: GeneratedAssets, brandId: string) => {
        if (isSavingRef.current) {
            console.log('[AutoSave] Save operation already in progress, skipping...');
            return;
        }

        isSavingRef.current = true;
        try {
            console.log('[AutoSave] Starting save operation...');
            updateAutoSaveStatus('saving');
            
            await createOrUpdateBrandRecordInDatabase(assets, brandId);
            
            lastSavedAssetsRef.current = getAssetsHash(assets);
            retryCountRef.current = 0; // Reset retry count on success
            
            updateAutoSaveStatus('saved');
            console.log('[AutoSave] Save operation completed successfully');
        } catch (error) {
            console.error('[AutoSave] Save operation failed:', error);
            retryCountRef.current++;
            
            if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
                console.log(`[AutoSave] Retrying save operation (${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})...`);
                setTimeout(() => {
                    isSavingRef.current = false;
                    performSave(assets, brandId);
                }, 1000);
                return;
            }
            
            retryCountRef.current = 0; // Reset retry count
            updateAutoSaveStatus('error');
            console.log('[AutoSave] Save operation failed after maximum retries');
        } finally {
            isSavingRef.current = false;
        }
    }, [getAssetsHash, updateAutoSaveStatus]);

    const scheduleSave = useCallback((assets: GeneratedAssets, brandId: string) => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            performSave(assets, brandId);
        }, autoSaveInterval);
    }, [autoSaveInterval, performSave]);

    useEffect(() => {
        if (!generatedAssets || !mongoBrandId) {
            return;
        }

        const currentHash = getAssetsHash(generatedAssets);
        
        if (lastSavedAssetsRef.current === currentHash) {
            return;
        }

        console.log('[AutoSave] Assets changed, scheduling auto-save...');
        scheduleSave(generatedAssets, mongoBrandId);
    }, [generatedAssets, mongoBrandId, getAssetsHash, scheduleSave]);

    useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);

    const forceSave = useCallback(() => {
        if (!generatedAssets || !mongoBrandId || isSavingRef.current) {
            return Promise.resolve();
        }
        
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
            autoSaveTimeoutRef.current = null;
        }
        
        return performSave(generatedAssets, mongoBrandId);
    }, [generatedAssets, mongoBrandId, performSave]);

    const syncLastSaved = useCallback((assets: GeneratedAssets) => {
        console.log('[AutoSave] Manually syncing last saved state.');
        lastSavedAssetsRef.current = getAssetsHash(assets);
    }, [getAssetsHash]);

    return {
        forceSave,
        syncLastSaved
    };
};