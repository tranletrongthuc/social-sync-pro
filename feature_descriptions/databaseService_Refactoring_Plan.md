Absolutely. Based on your feedback, here's a **revised refactoring plan** that keeps **everything in a single file** (`databaseService.ts`) — just like your original — but **eliminates duplication**, improves **maintainability**, and enhances **type safety**, all while preserving the existing structure and naming.

This approach uses a **generic utility function** to abstract the repeated `fetch` logic, and maps each action to a clean, reusable wrapper. No new files, no modular split — just **leaner, cleaner, and future-proof code** in **one file**.

---

# 🧱 Refactoring Plan: `databaseService.ts` (Single-File, No New Files)

> ✅ **Goal:** Eliminate duplicated `fetch` logic, reduce code size, and improve maintainability — **without splitting into multiple files**.

---

## 🔍 Problem Summary

Your `databaseService.ts` contains **~30 functions** with nearly identical patterns:
```ts
const someAction = async (args) => {
  const response = await fetch('/api/mongodb?action=xxx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(...);
  return await response.json();
};
```

This leads to:
- 📉 **High duplication**
- 🐞 **Inconsistent error handling**
- 🧩 **Manual cache invalidation scattered**
- 🛠 **Hard to modify globally** (e.g. add auth, logging, retries)

---

## ✅ Solution: Introduce a Generic `callMongoAction` Utility

We’ll refactor the file by:
1. Creating **one generic function** to handle all API calls.
2. Defining **type-safe action wrappers**.
3. Keeping **all exports** and **behavior** intact.
4. **Preserving cache logic** and side effects (e.g. `clearCacheForBrand`).

All in **one file**, no new dependencies.

---

## 🛠 Phase 1: Add Generic API Caller (`callMongoAction`)

### 📌 What
Create a reusable `callMongoAction` function to replace all manual `fetch` calls.

### 🛠 Why
- Eliminates 90% of duplicated code.
- Centralizes error handling, headers, and JSON parsing.
- Makes future changes (e.g. auth, logging) easy.

### 👥 Who
Any developer maintaining the service.

### 📅 When
Now — first step.

### 📍 Where
Inside `databaseService.ts`, near the top.

### 🔧 How
Add this utility function:

```ts
/**
 * Generic utility to call MongoDB API actions
 */
async function callMongoAction<T>(
  action: string,
  payload: Record<string, any>,
  options?: {
    invalidatesCacheForBrand?: string;
    expectsJson?: boolean;
  }
): Promise<T> {
  const { invalidatesCacheForBrand, expectsJson = true } = options || {};

  try {
    const response = await fetch(`/api/mongodb?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error [${action}]:`, response.status, errorText);
      throw new Error(`Failed to ${action}: ${response.statusText}`);
    }

    const result = expectsJson ? await response.json() : await response.text();

    // Optional cache invalidation
    if (invalidatesCacheForBrand) {
      clearCacheForBrand(invalidatesCacheForBrand);
    }

    return result;
  } catch (error) {
    console.error(`callMongoAction: Error in action '${action}':`, error);
    throw error;
  }
}
```

> ✅ This replaces **all** `fetch` boilerplate.

---

## 🛠 Phase 2: Refactor Functions to Use `callMongoAction`

Now, rewrite each function as a **thin wrapper** around `callMongoAction`.

We’ll group them by **pattern** for clarity.

---

### ✅ Pattern 1: Save/Update Actions (No Return, Clear Cache)

**Functions:**  
- `saveSettingsToDatabase`
- `saveAffiliateLinksToDatabase`
- `syncAssetMediaWithDatabase`
- `assignPersonaToPlanInDatabase`
- `updateMediaPlanPostInDatabase`
- `saveAIModelToDatabase`

**Refactored Template:**
```ts
const saveSettingsToDatabase = async (settings: Settings, brandId: string): Promise<void> => {
  await callMongoAction('save-settings', { settings, brandId }, { invalidatesCacheForBrand: brandId });
};
```

✅ Apply same pattern to all above.

---

### ✅ Pattern 2: Save with ID Return

**Functions:**  
- `savePersonaToDatabase`
- `saveTrendToDatabase`

```ts
const saveTrendToDatabase = async (
  trend: Omit<Trend, 'id'> & { id?: string },
  brandId: string
): Promise<string> => {
  const result = await callMongoAction<{ id: string }>('save-trend', { trend, brandId }, { invalidatesCacheForBrand: brandId });
  return result.id;
};
```

```ts
const savePersonaToDatabase = async (persona: Persona, brandId: string): Promise<string> => {
  const result = await callMongoAction<{ id: string }>('save-persona', { persona, brandId }, { invalidatesCacheForBrand: brandId });
  return result.id;
};
```

---

### ✅ Pattern 3: Delete Actions (Clear Cache)

**Functions:**  
- `deleteAffiliateLinkFromDatabase`
- `deletePersonaFromDatabase`
- `deleteTrendFromDatabase`

```ts
const deleteTrendFromDatabase = async (trendId: string, brandId: string): Promise<void> => {
  await callMongoAction('delete-trend', { trendId, brandId }, { invalidatesCacheForBrand: brandId });
};
```

✅ Same for others.

---

### ✅ Pattern 4: Load with Caching

**Functions:**  
- `loadTrend`
- `loadIdeasForTrend`

These use `dataCache`. Keep that logic, but simplify with `callMongoAction`.

```ts
export const loadTrend = async (trendId: string, brandId: string): Promise<Trend | null> => {
  const cacheKey = `trend-${trendId}-${brandId}`;
  if (dataCache[cacheKey]) return dataCache[cacheKey];

  try {
    const result = await callMongoAction<{ trend: Trend }>('load-trend', { trendId, brandId }, { expectsJson: true });
    dataCache[cacheKey] = result.trend;
    return result.trend;
  } catch (error) {
    console.error("Error loading trend:", error);
    return null;
  }
};
```

```ts
const loadIdeasForTrend = async (trendId: string, brandId: string): Promise<Idea[]> => {
  const cacheKey = `ideas-${trendId}-${brandId}`;
  if (dataCache[cacheKey]) return dataCache[cacheKey];

  const result = await callMongoAction<{ ideas: Idea[] }>('load-ideas-for-trend', { trendId, brandId });
  dataCache[cacheKey] = result.ideas;
  return result.ideas;
};
```

---

### ✅ Pattern 5: Load with No Cache

**Functions:**  
- `loadInitialProjectData`
- `loadMediaPlanGroupsList`
- `loadStrategyHubData`
- `loadAffiliateVaultData`
- `loadPersonasData`
- `loadSettingsDataFromDatabase`
- `initializeApp`

```ts
const loadStrategyHubData = async (brandId: string): Promise<{ trends: Trend[]; ideas: Idea[] }> => {
  return await callMongoAction('load-strategy-hub', { brandId });
};
```

```ts
const initializeApp = async (): Promise<{
  credentialsSet: boolean;
  brands: { id: string; name: string }[];
  adminDefaults: Settings;
}> => {
  return await callMongoAction('app-init', {});
};
```

✅ All follow same pattern.

---

### ✅ Pattern 6: Bulk Actions

**Functions:**  
- `bulkPatchPostsInDatabase`
- `bulkUpdatePostSchedulesInDatabase`

```ts
const bulkPatchPostsInDatabase = async (updates: { postId: string; fields: Record<string, any> }[]): Promise<void> => {
  await callMongoAction('bulk-patch-posts', { updates });
};
```

---

### ✅ Pattern 7: Special Cases

#### `createOrUpdateBrandRecordInDatabase`
Returns `brandId`.

```ts
const createOrUpdateBrandRecordInDatabase = async (
  assets: GeneratedAssets,
  brandId: string | null
): Promise<string> => {
  const result = await callMongoAction<{ brandId: string }>('create-or-update-brand', { assets, brandId });
  return result.brandId;
};
```

#### `loadProjectFromDatabase` & `loadCompleteAssetsFromDatabase`
Already return full payload.

```ts
const loadProjectFromDatabase = async (brandId: string): Promise<{
  assets: GeneratedAssets;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  brandId: string;
}> => {
  return await callMongoAction('load-complete-project', { brandId });
};

// Alias or keep both
const loadCompleteAssetsFromDatabase = loadProjectFromDatabase;
```

#### `checkIfProductExistsInDatabase`
Returns boolean, may fail silently.

```ts
const checkIfProductExistsInDatabase = async (productId: string): Promise<boolean> => {
  try {
    const result = await callMongoAction<{ exists: boolean }>('check-product-exists', { productId });
    return result.exists;
  } catch (error) {
    console.error('Failed to check if product exists:', error);
    return false;
  }
};
```

---

## ✅ Final File Structure

Your refactored `databaseService.ts` will have:

```ts
// 1. Imports
// 2. dataCache & clearCache functions
// 3. callMongoAction (generic utility)
// 4. All refactored functions (thin wrappers)
// 5. Export list (unchanged)
```

No new files. No breaking changes. Just **cleaner, maintainable code**.

---

## 📊 Before vs After

| Metric | Before | After |
|-------|--------|-------|
| Lines of Code | ~600 | ~200 |
| Duplicated Logic | High | Near zero |
| `fetch` calls | 30+ | 1 (`callMongoAction`) |
| Cache invalidation | Scattered | Centralized option |
| Type safety | Partial | Full (via generics) |
| Extensibility | Low | High (add logging/auth in one place) |

---

## ✅ Benefits of This Approach

- ✅ **One file only** — no new files or modules.
- ✅ **No breaking changes** — all function names and exports preserved.
- ✅ **Easy to test** — `callMongoAction` can be mocked.
- ✅ **Easy to extend** — add auth, retries, logging in one place.
- ✅ **Cache logic preserved** — but now optional and consistent.

---

## ✅ Final Recommendation

Replace your current file with this structure:

```ts
// databaseService.ts

import type { ... } from '../../types';

export const dataCache: Record<string, any> = {};

export const clearCacheForBrand = (brandId: string) => { ... };
export const clearAllCache = () => { ... };

// 👉 Add: callMongoAction utility

// 👉 Replace all functions with thin wrappers

// 👉 Keep: export { ... } list
```

Let me know if you'd like a **complete refactored version** of your file — I can generate it for you with all functions rewritten.