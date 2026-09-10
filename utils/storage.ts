// Safe storage wrapper that falls back to in-memory storage if localStorage is blocked (e.g. in cross-origin iframes)
const memoryStore = new Map<string, string>();

let isLocalStorageAvailable = false;
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
  }
} catch (e) {
  isLocalStorageAvailable = false;
  console.warn('localStorage is not available, falling back to memory storage:', e);
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (isLocalStorageAvailable) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`safeStorage.getItem error for key "${key}":`, e);
    }
    return memoryStore.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (isLocalStorageAvailable) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`safeStorage.setItem error for key "${key}":`, e);
    }
    memoryStore.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (isLocalStorageAvailable) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`safeStorage.removeItem error for key "${key}":`, e);
    }
    memoryStore.delete(key);
  },

  clear: (): void => {
    try {
      if (isLocalStorageAvailable) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('safeStorage.clear error:', e);
    }
    memoryStore.clear();
  },
};
