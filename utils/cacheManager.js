import NodeCache from "node-cache";

// Create cache instance with default TTL of 1 hour
const cache = new NodeCache({
	stdTTL: 3600,
	checkperiod: 120,
	useClones: false,
});

/**
 * Create/update a cache entry
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {boolean} Success status
 */
export const createCache = async (key, data, ttl = 3600) => {
	try {
		return cache.set(key, data, ttl);
	} catch (error) {
		console.error(`Error setting cache for ${key}:`, error);
		return false;
	}
};

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {any} Cached data or null
 */
export const getFromCache = async (key) => {
	try {
		return cache.get(key);
	} catch (error) {
		console.error(`Error getting cache for ${key}:`, error);
		return null;
	}
};

/**
 * Remove data from cache
 * @param {string} key - Cache key
 * @returns {number} Number of deleted entries
 */
export const deleteFromCache = async (key) => {
	try {
		return cache.del(key);
	} catch (error) {
		console.error(`Error deleting cache for ${key}:`, error);
		return 0;
	}
};

/**
 * Clear cache using wildcard pattern
 * @param {string} pattern - Key pattern with * as wildcard
 * @returns {number} Number of deleted entries
 */
export const clearCache = async (pattern) => {
	try {
		if (!pattern.includes("*")) {
			return await deleteFromCache(pattern);
		}

		// Convert pattern to regex
		const regexPattern = new RegExp(pattern.replace(/\*/g, ".*"));

		// Get all keys and filter by pattern
		const keys = cache.keys();
		let deletedCount = 0;

		for (const key of keys) {
			if (regexPattern.test(key)) {
				if (cache.del(key)) {
					deletedCount++;
				}
			}
		}

		return deletedCount;
	} catch (error) {
		console.error(`Error clearing cache with pattern ${pattern}:`, error);
		return 0;
	}
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
	return cache.getStats();
};

/**
 * Flush all cache
 * @returns {boolean} Success status
 */
export const flushAll = () => {
	try {
		cache.flushAll();
		return true;
	} catch (error) {
		console.error("Error flushing cache:", error);
		return false;
	}
};

export default {
	createCache,
	getFromCache,
	deleteFromCache,
	clearCache,
	getCacheStats,
	flushAll,
};
