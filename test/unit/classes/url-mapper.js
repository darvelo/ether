import URLMapper from '../../../src/classes/url-mapper';

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
        expect(regexEqual(expected, mapper.regexFor(pattern))).to.be.ok;
    });

    it('clears cached data', () => {
        expect(mapper.regexFor('word')).to.not.be.ok;
        mapper.add('word');
        expect(mapper.regexFor('word')).to.be.an.instanceof(RegExp);
        mapper.clear();
        expect(mapper.regexFor('word')).to.not.be.ok;
    });

    it('processes slashes correctly', () => {
        let pattern = '/first/second';
        let expected = /^\/first\/second(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern))).to.be.ok;
    });

    it('processes backslashes correctly', () => {
        let pattern = '\\first\\second\\';
        let expected = /^\\first\\second\\(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern))).to.be.ok;
    });

    it('processes a combination of slashes and backslashes correctly', () => {
        let pattern = '/\\first/\\/second\\';
        let expected = /^\/\\first\/\\\/second\\(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern))).to.be.ok;
    });

    it('can extract parameter variables from regex', () => {
        let pattern = '/name/{id=\\d+}/view';
        let expected = /^\/name\/(\d+)\/view(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern))).to.be.ok;
        expect(mapper.paramsFor(pattern)).to.deep.equal(['id']);
    });

    it('throws if a parameter name is given more than once', () => {
        let pattern = '/user/{id=\\d+}/item/{id=[a-zA-Z]\\d+}[\\w]';
        expect(() => mapper.add(pattern)).to.throw(RangeError);
    });

    it('escapes parentheses and brackets when not processing a parameter', () => {
        let pattern = '/[user]/(item)';
        let expected = /^\/\[user\]\/\(item\)(.*)/;
        mapper.add(pattern);
        expect(regexEqual(expected, mapper.regexFor(pattern))).to.be.ok;
    });

    it('disallows parentheses/brackets/braces/slashes/backslashes when processing a parameter name', () => {
        expect(() => mapper.add('/user/{id(=\\d+}')).to.throw();
        expect(() => mapper.add('/user/{id)=\\d+}')).to.throw();
        expect(() => mapper.add('/user/{id[=\\d+}')).to.throw();
        expect(() => mapper.add('/user/{id]=\\d+}')).to.throw();
        expect(() => mapper.add('/user/{id{=\\d+}')).to.throw();
        expect(() => mapper.add('/user/{id}=\\d+}')).to.throw();
        expect(() => mapper.add('/user/{id/=\\d+}')).to.throw();
        expect(() => mapper.add('/user/{id\\=\\d+}')).to.throw();
    });

    it('escapes parentheses that the user escaped with backslashes', () => {
        let pattern = '/user/{id=\\(\\d+\\)}';
        let expected = /^\/user\/(\(\d+\))(.*)/;
        expect(() => mapper.add(pattern)).to.not.throw();
        expect(regexEqual(expected, mapper.regexFor(pattern))).to.be.ok;
    });

    it('throws on encountering a capturing group when processing a parameter value', () => {
        expect(() => mapper.add('/user/{id=(\\d+)}')).to.throw();
        expect(() => mapper.add('/user/{id=(?:\\d+)}')).to.not.throw();
        expect(() => mapper.add('/user/{id=(?=\\d+)}')).to.not.throw();
        expect(() => mapper.add('/user/{id=(?!\\d+)}')).to.not.throw();
        expect(() => mapper.add('/user/{id=\\(\\d+\\)}')).to.not.throw();
        // unmatched capturing group for closing parenthesis
        // JS engine handles this for us
        expect(() => mapper.add('/user/{id=\\(\\d+)}/')).to.throw(SyntaxError);
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
        let result;

        mapper.add(pattern, route);

        result = mapper.match('/user/25/profile');
        expect(result.route).to.equal(route);
        expect(result).to.deep.equal({
            route: route,
            rest: '/profile',
            params: {
                id: 25,
            },
        });

        result = mapper.match('/user/1xyz/profile');
        expect(result.route).to.equal(route);
        expect(result).to.deep.equal({
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

    it('matches patterns in order of slash count', () => {
        let result;
        mapper.add('/user/{id=\\d+}');
        result = mapper.match('/user/1/profile/edit');
        expect(result.rest).to.equal('/profile/edit');

        // has the most slashes, is tested first when matching
        mapper.add('/user/{id=\\d+}/profile/edit');
        result = mapper.match('/user/1/profile/edit');
        expect(result.rest).to.equal(null);

        // this pattern, though it would match, is a worse match than the above.
        // the above pattern has more slashes, and so is tested before this
        // pattern in order to find the best match first
        mapper.add('/user/{id=\\d+}/profile');

        let spy1 = sinon.spy(mapper.regexFor('/user/{id=\\d+}/profile'), 'exec');
        let spy2 = sinon.spy(mapper.regexFor('/user/{id=\\d+}/profile/edit'), 'exec');
        result = mapper.match('/user/1/profile/edit');
        expect(result.rest).to.equal(null);
        spy1.should.not.have.been.called;
        spy2.should.have.been.calledOnce;
    });

    it('does a stable sort when sorting by slash count', () => {
        // Tease out differences in JS engines' sorting implementations.
        // For Array.prototype.sort:
        //     Firefox and Safari are known to do a stable sort.
        //     Chrome is known not to do a stable sort if array size > 10,
        //        where quicksort is used over insertionsort.
        //        see: https://github.com/v8/v8/blob/master/src/js/array.js#L964
        mapper.add('/user/{id=\\d+}');
        mapper.add('/user/{id=\\d+}a');
        mapper.add('/user/{id=\\d+}ab');
        mapper.add('/user/{id=\\d+}abc');
        mapper.add('/user/{id=\\d+}abcd');
        mapper.add('/user/{id=\\d+}abcde');
        mapper.add('/user/{id=\\d+}abcdef');
        mapper.add('/user/{id=\\d+}abcdefg');
        mapper.add('/user/{id=\\d+}abcdefgh');
        mapper.add('/user/{id=\\d+}abcdefghi');
        mapper.add('/user/{id=\\d+}abcdefghij');
        mapper.add('/user/{id=\\d+}abcdefghijk');
        mapper.add('/user/{id=\\d+}abcdefghijkl');
        mapper.add('/user/{id=\\d+}abcdefghijklm');
        let result = mapper.match('/user/25abcdefghijklmnopqrstuvwxyz');
        expect(result.rest).to.equal('abcdefghijklmnopqrstuvwxyz');
    });
});
