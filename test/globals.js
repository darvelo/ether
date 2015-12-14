let chai = require('chai');
let sinon = require('sinon');
let sinonChai = require('sinon-chai');
let mocks = require('./mocks');

chai.should();
chai.use(sinonChai);
sinon.assert.expose(chai.assert, {prefix: ''});

// test regex equality
// see: http://stackoverflow.com/questions/10776600/testing-for-equality-of-regular-expressions
function regexEqual(r1, r2) {
    function throwUsefulError() {
        throw new Error(['RegExp ', r1.source, ' was not equal to ', r2.source].join(''));
    }

    if (!(r1 instanceof RegExp && r2 instanceof RegExp)) {
        throwUsefulError();
    }

    ['global', 'multiline', 'ignoreCase', 'source'].forEach(prop => {
        if (r1[prop] !== r2[prop]) {
            throwUsefulError();
        }
    });

    return true;
}

global.assert = chai.assert;
global.expect = chai.expect;
global.sinon = sinon;
global.window = mocks.window;
global.document = mocks.document;
global.Element = mocks.Element;
global.regexEqual = regexEqual;

require('babel-polyfill');
