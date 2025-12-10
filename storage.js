/**
 * STORAGE SYSTEM - Fallback Chain Storage Manager
 * Fallback priority: IndexedDB → localStorage → Memory Cache
 * Implements robust data persistence with error handling
 */

// Global Storage Object
window.storage = {
    // Config
    config: {
        dbName: 'misustech-db',
        version: 1,
        storeName: 'data',
        useMemoryCache: true
    },

    // Memory cache for absolute fallback
    memCache: {},

    // Initialize IndexedDB
    initIndexedDB: async function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.dbName, this.config.version);

            request.onerror = () => {
                console.warn('IndexedDB initialization failed:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.config.storeName)) {
                    db.createObjectStore(this.config.storeName, { keyPath: 'key' });
                    console.log('IndexedDB object store created');
                }
            };
        });
    },

    // Save data with fallback chain
    save: async function(key, value, useFile = false) {
        try {
            // Try IndexedDB first
            if (this.db) {
                try {
                    await this.saveToIndexedDB(key, value);
                    console.log(`Data saved to IndexedDB: ${key}`);
                    return { success: true, method: 'indexeddb' };
                } catch (err) {
                    console.warn('IndexedDB save failed, trying localStorage:', err);
                }
            }

            // Fallback to localStorage
            try {
                const storageKey = `mt-${key}`;
                localStorage.setItem(storageKey, JSON.stringify(value));
                console.log(`Data saved to localStorage: ${key}`);
                return { success: true, method: 'localstorage' };
            } catch (err) {
                console.warn('localStorage save failed, using memory cache:', err);
            }

            // Last resort: memory cache
            this.memCache[key] = value;
            console.log(`Data saved to memory cache: ${key}`);
            return { success: true, method: 'memory' };

        } catch (err) {
            console.error('All save methods failed:', err);
            return { success: false, error: err.message };
        }
    },

    // Load data with fallback chain
    load: async function(key, useFile = false) {
        try {
            // Try IndexedDB first
            if (this.db) {
                try {
                    const data = await this.loadFromIndexedDB(key);
                    if (data !== undefined) {
                        console.log(`Data loaded from IndexedDB: ${key}`);
                        return { success: true, data, method: 'indexeddb' };
                    }
                } catch (err) {
                    console.warn('IndexedDB load failed, trying localStorage:', err);
                }
            }

            // Fallback to localStorage
            try {
                const storageKey = `mt-${key}`;
                const item = localStorage.getItem(storageKey);
                if (item) {
                    const data = JSON.parse(item);
                    console.log(`Data loaded from localStorage: ${key}`);
                    return { success: true, data, method: 'localstorage' };
                }
            } catch (err) {
                console.warn('localStorage load failed, trying memory cache:', err);
            }

            // Check memory cache
            if (this.memCache[key] !== undefined) {
                console.log(`Data loaded from memory cache: ${key}`);
                return { success: true, data: this.memCache[key], method: 'memory' };
            }

            console.warn(`No data found for key: ${key}`);
            return { success: false, data: null };

        } catch (err) {
            console.error('All load methods failed:', err);
            return { success: false, error: err.message };
        }
    },

    // IndexedDB operations
    saveToIndexedDB: function(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.config.storeName], 'readwrite');
            const store = transaction.objectStore(this.config.storeName);
            const request = store.put({ key, value, timestamp: Date.now() });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    },

    loadFromIndexedDB: function(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.config.storeName], 'readonly');
            const store = transaction.objectStore(this.config.storeName);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result ? request.result.value : undefined);
        });
    },

    // Get with explicit source checking
    get: async function(key, checkAll = false) {
        return this.load(key);
    },

    // Set with explicit method
    set: async function(key, value) {
        return this.save(key, value);
    },

    // Clear all data
    clearAll: async function() {
        try {
            // Clear localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('mt-')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Clear IndexedDB
            if (this.db) {
                const transaction = this.db.transaction([this.config.storeName], 'readwrite');
                const store = transaction.objectStore(this.config.storeName);
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve();
                });
            }

            // Clear memory cache
            this.memCache = {};

            console.log('All storage cleared');
            return { success: true };
        } catch (err) {
            console.error('Clear storage failed:', err);
            return { success: false, error: err.message };
        }
    },

    // Initialize on load
    init: async function() {
        try {
            await this.initIndexedDB();
            console.log('Storage system initialized');
        } catch (err) {
            console.warn('IndexedDB not available, using localStorage+memory fallback:', err);
        }
    }
};

// Auto-initialize on script load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.storage.init());
} else {
    window.storage.init();
}
