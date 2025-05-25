/**
 * Simple in-memory cache manager for the application
 * Used to cache rendered Excel files and other expensive operations
 */

// In-memory cache storage
const cache = new Map();

/**
 * Create a cache entry
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} expiresInSeconds - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
export const createCache = async (key, data, expiresInSeconds = 3600) => {
	try {
		const expiresAt = Date.now() + expiresInSeconds * 1000;

		cache.set(key, {
			data,
			expiresAt,
		});

		return true;
	} catch (error) {
		console.error("Error creating cache:", error);
		return false;
	}
};

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached data or null if not found/expired
 */
export const getFromCache = async (key) => {
	try {
		const cacheEntry = cache.get(key);

		// Check if entry exists and is not expired
		if (cacheEntry && cacheEntry.expiresAt > Date.now()) {
			return cacheEntry.data;
		}

		// If expired, remove it
		if (cacheEntry) {
			cache.delete(key);
		}

		return null;
	} catch (error) {
		console.error("Error getting from cache:", error);
		return null;
	}
};

/**
 * Clear a specific cache entry
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
export const clearCache = async (key) => {
	try {
		return cache.delete(key);
	} catch (error) {
		console.error("Error clearing cache:", error);
		return false;
	}
};

/**
 * Clear all expired cache entries
 * @returns {Promise<number>} - Number of cleared entries
 */
export const clearExpiredCache = async () => {
	try {
		let cleared = 0;
		const now = Date.now();

		for (const [key, entry] of cache.entries()) {
			if (entry.expiresAt <= now) {
				cache.delete(key);
				cleared++;
			}
		}

		return cleared;
	} catch (error) {
		console.error("Error clearing expired cache:", error);
		return 0;
	}
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} - Cache statistics
 */
export const getCacheStats = async () => {
	try {
		const now = Date.now();
		let expired = 0;
		let active = 0;
		let totalSize = 0;

		for (const [key, entry] of cache.entries()) {
			if (entry.expiresAt <= now) {
				expired++;
			} else {
				active++;
				// Rough estimate of memory usage
				totalSize += JSON.stringify(entry.data).length * 2; // Unicode characters are 2 bytes
			}
		}

		return {
			total: cache.size,
			active,
			expired,
			totalSizeBytes: totalSize,
			totalSizeKB: Math.round(totalSize / 1024),
		};
	} catch (error) {
		console.error("Error getting cache stats:", error);
		return {
			total: 0,
			active: 0,
			expired: 0,
			totalSizeBytes: 0,
			totalSizeKB: 0,
			error: error.message,
		};
	}
};
