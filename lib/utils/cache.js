// @ts-check

class Cache {
    /**
     * Cache For Internal Use
     * @param {object} [options]
     */
    constructor(options) {
        this.cache = {};
    }
    /**
     * @param {string} cacheKey
     */
    get(cacheKey) {
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        } else {
            return undefined;
        }
    }
    /**
     *
     * @param {string} cacheKey
     * @param {object} object
     */
    set(cacheKey, object) {
        this.cache[cacheKey] = object;
    }
}

module.exports = Cache;
