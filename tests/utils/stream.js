const test = require('ava');
const Utils = require('../../lib/utils');

const htmlStream = new Utils.StreamUtils('foo', 'bar');

test('it should have a head', t => {
    t.is(htmlStream.head , 'foo');
})

test('it should have a tail', t => {
    t.is(htmlStream.tail, 'bar');
})

test.cb('it should end', t => {
    htmlStream._transform(new Buffer('qux'), 'utf-8', () => {
        t.pass();
        t.end();
    });
})