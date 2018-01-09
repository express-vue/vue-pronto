// @ts-check
const {Transform} = require("stream");

/**
 * Class for StreamTransform
 * @class
 * @extends Transform
 */
class RenderStreamTransform extends Transform {
    /**
     * @constructor
     * @param {String} head
     * @param {String} tail
     * @param {object} options
     * @property {String} head
     * @property {String} tail
     * @property {Boolean} flag
     */
    constructor(head, tail, options = {}) {
        super(options);
        this.head = head;
        this.tail = tail;
        this.flag = true;
    }
    /**
     * @constructor
     * @param {*} chunk
     * @param {String} encoding
     * @param {Function} callback
     */
    _transform(chunk, encoding, callback) {
        if (this.flag) {
            this.push(new Buffer(this.head));
            this.flag = false;
        }
        this.push(chunk);
        callback();
    }
    end() {
        this.push(new Buffer(this.tail));
        this.push(null);
    }
}

module.exports = RenderStreamTransform;
