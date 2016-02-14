import { is, isnt } from '../../../src/utils/is';

describe('is/isnt Util', () => {
    it('checks if arg is/isnt undefined', () => {
        expect(is(undefined, undefined)).to.be.true;
        expect(is(undefined, 'Undefined')).to.be.true;
        expect(is(1, undefined)).to.be.false;
        expect(is(1, 'Undefined')).to.be.false;

        expect(isnt(1, undefined)).to.be.true;
        expect(isnt(1, 'Undefined')).to.be.true;
        expect(isnt(undefined, undefined)).to.be.false;
        expect(isnt(undefined, 'Undefined')).to.be.false;
    });

    it('checks if arg is/isnt null', () => {
        expect(is(null, null)).to.be.true;
        expect(is(null, 'Null')).to.be.true;
        expect(is(1, null)).to.be.false;
        expect(is(1, 'Null')).to.be.false;

        expect(isnt(1, null)).to.be.true;
        expect(isnt(1, 'Null')).to.be.true;
        expect(isnt(null, null)).to.be.false;
        expect(isnt(null, 'Null')).to.be.false;
    });

    it('checks if arg is/isnt a number', () => {
        expect(is(1, 'Number')).to.be.true;
        expect(is('a', 'Number')).to.be.false;

        expect(isnt('a', 'Number')).to.be.true;
        expect(isnt(1, 'Number')).to.be.false;
    });

    it('checks if arg is/isnt a string', () => {
        expect(is('a', 'String')).to.be.true;
        expect(is(1, 'String')).to.be.false;

        expect(isnt(1, 'String')).to.be.true;
        expect(isnt('a', 'String')).to.be.false;
    });

    it('checks if arg is/isnt an Array', () => {
        expect(is([], 'Array')).to.be.true;
        expect(is(1, 'Array')).to.be.false;

        expect(isnt(1, 'Array')).to.be.true;
        expect(isnt([], 'Array')).to.be.false;
    });

    it('checks if arg is/isnt an Object', () => {
        expect(is({}, 'Object')).to.be.true;
        expect(is(1, 'Object')).to.be.false;

        expect(isnt(1, 'Object')).to.be.true;
        expect(isnt({}, 'Object')).to.be.false;
    });

    it('checks if arg is/isnt a Function', () => {
        let func = function(){};
        expect(is(func, 'Function')).to.be.true;
        expect(is(1, 'Function')).to.be.false;

        expect(isnt(1, 'Function')).to.be.true;
        expect(isnt(func, 'Function')).to.be.false;
    });

    it('checks if arg is/isnt a Boolean', () => {
        expect(is(true, 'Boolean')).to.be.true;
        expect(is(1, 'Boolean')).to.be.false;

        expect(isnt(1, 'Boolean')).to.be.true;
        expect(isnt(true, 'Boolean')).to.be.false;
    });

    it('checks if arg is/isnt a Date', () => {
        let date = new Date();
        expect(is(date, 'Date')).to.be.true;
        expect(is(1, 'Date')).to.be.false;

        expect(isnt(1, 'Date')).to.be.true;
        expect(isnt(date, 'Date')).to.be.false;
    });
});
