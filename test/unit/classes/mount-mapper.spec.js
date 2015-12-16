import MountMapper from '../../../src/classes/mount-mapper';
import RootApp from '../../../src/classes/root-app';
import App from '../../../src/classes/app';
import Route from '../../../src/classes/route';

class TestRootApp extends RootApp {
    expectedOutlets() {
        return [];
    }
}

class TestApp extends App {
    expectedOutlets() {
        return [];
    }
}

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

class IdParamRoute extends TestRoute {
    expectedParams() {
        return ['id'];
    }
}

describe('MountMapper', () => {
    let mapper, parentData;

    beforeEach(() => {
        let rootApp = new TestRootApp({});
        mapper = new MountMapper();
        parentData = {
            rootApp,
            parentApp: rootApp,
            outlets: {},
            params: [],
        };
    });

    describe('Parsing', () => {
        it('processes url regex-like specs into actual regex', () => {
            let crumb = 'word';
            let expected = /^word(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('processes slashes correctly', () => {
            let crumb = '/first/second';
            let expected = /^\/first\/second(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('processes backslashes correctly', () => {
            let crumb = '\\first\\second\\';
            let expected = /^\\first\\second\\(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('processes a combination of slashes and backslashes correctly', () => {
            let crumb = '/\\first/\\/second\\';
            let expected = /^\/\\first\/\\\/second\\(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('can extract parameter variables from regex', () => {
            let crumb = '/name/{id=\\d+}/view';
            let expected = /^\/name\/(\d+)\/view(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
            expect(result.paramNames).to.deep.equal(['id']);
        });

        it('throws if a parameter name is given more than once', () => {
            let crumb = '/user/{id=\\d+}/item/{id=[a-zA-Z]\\d+}[\\w]';
            expect(() => mapper.parse(crumb)).to.throw(RangeError);
        });

        it('escapes parentheses and brackets when not processing a parameter', () => {
            let crumb = '/[user]/(item)';
            let expected = /^\/\[user\]\/\(item\)(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('disallows parentheses/brackets/braces/slashes/backslashes when processing a parameter name', () => {
            expect(() => mapper.parse('/user/{id(=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id)=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id[=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id]=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id{=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id}=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id/=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id\\=\\d+}')).to.throw();
        });

        it('escapes parentheses that the user escaped with backslashes', () => {
            let crumb = '/user/{id=\\(\\d+\\)}';
            let expected = /^\/user\/(\(\d+\))(.*)/;
            let result;
            expect(() => result = mapper.parse(crumb)).to.not.throw();
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('throws on encountering a capturing group when processing a parameter value', () => {
            expect(() => mapper.parse('/user/{id=(\\d+)}')).to.throw();
            expect(() => mapper.parse('/user/{id=(?:\\d+)}')).to.not.throw();
            expect(() => mapper.parse('/user/{id=(?=\\d+)}')).to.not.throw();
            expect(() => mapper.parse('/user/{id=(?!\\d+)}')).to.not.throw();
            expect(() => mapper.parse('/user/{id=\\(\\d+\\)}')).to.not.throw();
            // unmatched capturing group for closing parenthesis
            // JS engine handles this for us
            expect(() => mapper.parse('/user/{id=\\(\\d+)}/')).to.throw(SyntaxError);
        });

        it('returns the parsing results', () => {
            let crumb = '/user/{id=\\d+}';
            expect(mapper.parse(crumb)).to.deep.equal({
                regex: /^\/user\/(\d+)(.*)/,
                paramNames: ['id'],
                slashes: 2,
            });
        });
    });

    describe('Adding', () => {
        it('expects parentData to be an object', () => {
            expect(() => mapper.add('/', TestRoute, [])).to.throw(Error, 'MountMapper#add() expected an object containing the mount\'s parent data.');
        });

        it('throws if parentData.rootApp is not an App instance', () => {
            parentData.rootApp = null;
            expect(() => mapper.add('/', TestRoute, parentData)).to.throw(TypeError, 'MountMapper#add() did not receive an App instance for parentData.rootApp.');
        });

        it('throws if parentData.parentApp is not an App instance', () => {
            parentData.parentApp = null;
            expect(() => mapper.add('/', TestRoute, parentData)).to.throw(TypeError, 'MountMapper#add() did not receive an App instance for parentData.parentApp.');
        });

        it('throws if parentData.outlets is not an Object', () => {
            parentData.outlets = null;
            expect(() => mapper.add('/', TestRoute, parentData)).to.throw(TypeError, 'MountMapper#add() did not receive an object for parentData.outlets.');
        });

        it('throws if parentData.params is not an Array', () => {
            parentData.params = null;
            expect(() => mapper.add('/', TestRoute, parentData)).to.throw(TypeError, 'MountMapper#add() did not receive an array for parentData.params.');
        });
    });

    describe('Info Retrieval', () => {
        describe('Getting Regex', () => {
            it('returns undefined for a non-existent crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                expect(mapper.regexFor(crumb)).to.equal(undefined);
            });

            it('returns regex for a crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                let expected = /^\/path\/(\d+)\/somewhere(.*)/;
                mapper.add(crumb, IdParamRoute, parentData);
                expect(regexEqual(expected, mapper.regexFor(crumb))).to.be.ok;
            });
        });

        describe('Getting Param Names', () => {
            it('returns undefined for a non-existent crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                expect(mapper.paramNamesFor(crumb)).to.equal(undefined);
            });

            it('returns an empty array if a crumb has no params', () => {
                let crumb = '/path/to/somewhere';
                mapper.add(crumb, TestRoute, parentData);
                expect(mapper.paramNamesFor(crumb)).to.deep.equal([]);
            });

            it('gets param names for a crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                mapper.add(crumb, IdParamRoute, parentData);
                expect(mapper.paramNamesFor(crumb)).to.deep.equal(['id']);
            });
        });

        describe('Getting Slashes', () => {
            it('returns undefined for a non-existent crumb', () => {
                let crumb = '/path/to/somewhere';
                expect(mapper.slashesFor(crumb)).to.equal(undefined);
            });

            it('gets slash character count for a crumb', () => {
                let crumb = '/path/to/somewhere';
                mapper.add(crumb, TestRoute, parentData);
                expect(mapper.slashesFor(crumb)).to.equal(3);
            });
        });

        describe('Getting Addresses', () => {
            it('returns undefined for a non-existent crumb', () => {
                let crumb = '/path/to/somewhere';
                expect(mapper.addressesFor(crumb)).to.equal(undefined);
            });

            it('returns an empty array if a crumb\'s mount has no addresses', () => {
                let crumb = '/path/to/somewhere';
                mapper.add(crumb, TestRoute, parentData);
                expect(mapper.addressesFor(crumb)).to.deep.equal([]);
            });

            it('gets mount\'s addresses for a crumb', () => {
                class AddressApp extends TestApp {
                    expectedAddresses() {
                        return ['addressApp', 'myApp'];
                    }
                    addressesHandlers() {
                        return [function(){},function(){}];
                    }
                }
                let crumb = '/path/to/somewhere';
                mapper.add(crumb, AddressApp.addresses('addressApp', 'myApp'), parentData);
                expect(mapper.addressesFor(crumb)).to.deep.equal(['addressApp', 'myApp']);
            });

            it('gets a list of all addresses ever registered', () => {
                class AddressApp extends TestApp {
                    expectedAddresses() {
                        return ['addressApp', 'myApp'];
                    }
                    addressesHandlers() {
                        return [function(){},function(){}];
                    }
                }
                class AddressApp2 extends TestApp {
                    expectedAddresses() {
                        return ['addressApp2', 'myApp2'];
                    }
                    addressesHandlers() {
                        return [function(){},function(){}];
                    }
                }
                mapper.add('/path/somewhere', AddressApp.addresses('addressApp', 'myApp'), parentData);
                mapper.add('/path/somewhere/else', AddressApp2.addresses('addressApp2', 'myApp2'), parentData);
                expect(mapper.allAddresses()).to.deep.equal(['addressApp', 'addressApp2', 'myApp', 'myApp2']);
            });
        });
    });

    describe('Matching', () => {
        it('matches a given crumb with a previously mapped crumb', () => {
            let crumb = '/user/{id=\\d+}';
            let result;

            mapper.add(crumb, IdParamRoute, parentData);

            result = mapper.match('/user/25/profile');
            expect(result).to.deep.equal({
                rest: '/profile',
                params: {
                    id: 25,
                },
            });

            result = mapper.match('/user/1xyz/profile');
            expect(result).to.deep.equal({
                rest: 'xyz/profile',
                params: {
                    id: 1,
                },
            });
        });

        it('returns null if a match is not found', () => {
            let crumb = '/user/{id=\\d+}';
            mapper.add(crumb, IdParamRoute, parentData);
            expect(mapper.match('/user/xyz/profile')).to.equal(null);
            expect(mapper.match('/user/xyz1/profile')).to.equal(null);
            expect(mapper.match('/user/x1yz/profile')).to.equal(null);
        });

        it('matches crumbs in order of slash count', () => {
            let result;
            mapper.add('/user/{id=\\d+}', IdParamRoute, parentData);
            result = mapper.match('/user/1/profile/edit');
            expect(result.rest).to.equal('/profile/edit');

            // has the most slashes, is tested first when matching
            mapper.add('/user/{id=\\d+}/profile/edit', IdParamRoute, parentData);
            result = mapper.match('/user/1/profile/edit');
            expect(result.rest).to.equal(null);

            // this crumb, though it would match, is a worse match than the above.
            // the above crumb has more slashes, and so is tested before this
            // crumb in order to find the best match first
            mapper.add('/user/{id=\\d+}/profile', IdParamRoute, parentData);

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
            mapper.add('/user/{id=\\d+}', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}a', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}ab', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abc', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcd', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcde', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcdef', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcdefg', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcdefgh', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcdefghi', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcdefghij', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcdefghijk', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcdefghijkl', IdParamRoute, parentData);
            mapper.add('/user/{id=\\d+}abcdefghijklm', IdParamRoute, parentData);
            let result = mapper.match('/user/25abcdefghijklmnopqrstuvwxyz');
            expect(result.rest).to.equal('abcdefghijklmnopqrstuvwxyz');
        });
    });
});
