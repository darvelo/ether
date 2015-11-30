import URLMapper from '../../../src/classes/url-mapper.js';

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

describe('URLMapper', () => {
    let mapper;

    beforeEach(() => {
        mapper = new URLMapper();
    });

    it('processes url regex-like specs into actual regex', () => {
        let pattern = 'word';
        let expected = /^word$/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
    });

    it('processes slashes correctly', () => {
        let pattern = '/first/second';
        let expected = /^\/first\/second$/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
    });

    it('processes backslashes correctly', () => {
        let pattern = '\\first\\second\\';
        let expected = /^\\first\\second\\$/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
    });

    it('processes a combination of slashes and backslashes correctly', () => {
        let pattern = '/\\first/\\/second\\';
        let expected = /^\/\\first\/\\\/second\\$/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
    });

    it('can extract parameter variables from regex', () => {
        let pattern = '/name/{id=\\d+}/view';
        let expected = /^\/name\/(\d+)\/view$/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
        expect(mapper.paramsFor(pattern)).to.deep.equal(['id']);
    });
});
