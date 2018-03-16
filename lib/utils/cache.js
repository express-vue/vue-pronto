// @ts-check

class Cache {
    /**
     * Cache For Internal Use
     * @param {object} [options]
     */
    constructor(options) {
        this.options = options || null;
        this.cache = {};
    }
    /**
     * @param {string} cacheKey
     * @returns {object}
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
     * @returns {void}
     */
    set(cacheKey, object) {
        this.cache[cacheKey] = object;
    }
}

module.exports = Cache;
