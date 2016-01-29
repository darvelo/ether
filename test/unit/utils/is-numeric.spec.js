import isNumeric from '../../../src/utils/is-numeric';

describe('isNumeric Util', () => {
    it('throws if not given a string', () => {
        expect(() => isNumeric(Infinity)).to.throw(TypeError, 'isNumeric expected a string and got: Infinity');
        expect(() => isNumeric(10)).to.throw(TypeError, 'isNumeric expected a string and got: 10');
        expect(() => isNumeric(/a/)).to.throw(TypeError, 'isNumeric expected a string and got: /a/');
    });

    it('returns true for strings containing only numbers', () => {
        expect(isNumeric('20')).to.equal(true);
    });

    it('returns false for strings that do not contain only numbers', () => {
        expect(isNumeric('20,000')).to.equal(false);
        expect(isNumeric('10abc')).to.equal(false);
    });

    it('does not coerce whitespace to 0', () => {
        expect(isNumeric(' \t\r\n')).to.equal(false);
    });
});
