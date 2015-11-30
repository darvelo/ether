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
        let expected = /^word(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
    });

    it('processes slashes correctly', () => {
        let pattern = '/first/second';
        let expected = /^\/first\/second(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
    });

    it('processes backslashes correctly', () => {
        let pattern = '\\first\\second\\';
        let expected = /^\\first\\second\\(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
    });

    it('processes a combination of slashes and backslashes correctly', () => {
        let pattern = '/\\first/\\/second\\';
        let expected = /^\/\\first\/\\\/second\\(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
    });

    it('can extract parameter variables from regex', () => {
        let pattern = '/name/{id=\\d+}/view';
        let expected = /^\/name\/(\d+)\/view(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern)));
        expect(mapper.paramsFor(pattern)).to.deep.equal(['id']);
    });

    it('keeps a slash character count for a path', () => {
        let pattern = '/path/to/somewhere';
        mapper.add(pattern);
        expect(mapper.slashesFor(pattern)).to.equal(3);
    });

    it('associates a route with a path', () => {
        let pattern = '/path/to/somewhere';
        let route = {};
        mapper.add(pattern, route);
        expect(mapper.routeFor(pattern)).to.equal(route);
    });

    it('matches a given path with a previously mapped pattern', () => {
        let pattern = '/user/{id=\\d+}';
        let route = {};
        mapper.add(pattern, route);
        expect(mapper.match('/user/25/profile')).to.deep.equal({
            route: route,
            rest: '/profile',
            params: {
                id: 25,
            },
        });
        expect(mapper.match('/user/1xyz/profile')).to.deep.equal({
            route: route,
            rest: 'xyz/profile',
            params: {
                id: 1,
            },
        });
    });

    it('returns null if a match is not found', () => {
        let pattern = '/user/{id=\\d+}';
        mapper.add(pattern);
        expect(mapper.match('/user/xyz/profile')).to.equal(null);
        expect(mapper.match('/user/xyz1/profile')).to.equal(null);
        expect(mapper.match('/user/x1yz/profile')).to.equal(null);
    });
});
