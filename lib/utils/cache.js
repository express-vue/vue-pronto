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
        // @ts-ignore
        if (this.cache[cacheKey]) {
            // @ts-ignore
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
        // @ts-ignore
        this.cache[cacheKey] = object;
    }
}

module.exports = Cache;
