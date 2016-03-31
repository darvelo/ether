import MountMapper from '../../../src/classes/mount-mapper';
import RootApp from '../../../src/classes/root-app';
import App from '../../../src/classes/app';
import Route from '../../../src/classes/route';
import Outlet from '../../../src/classes/outlet';
import regexEqual from '../../utils/regex-equal';

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

class IdParamApp extends TestApp {
    expectedParams() {
        return ['id'];
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

class IdActionParamRoute extends TestRoute {
    expectedParams() {
        return ['id', 'action'];
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
            let expected = /^\/?word(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('processes slashes correctly', () => {
            let crumb = '/first/second';
            let expected = /^\/?first\/second(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('processes backslashes correctly', () => {
            let crumb = '\\first\\second\\';
            let expected = /^\/?\\first\\second\\(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('processes a combination of slashes and backslashes correctly', () => {
            let crumb = '/\\first/\\/second\\';
            let expected = /^\/?\\first\/\\\/second\\(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('can extract parameter variables from regex', () => {
            let crumb = '/name/{id=\\d+}/view';
            let expected = /^\/?name\/(\d+)\/view(.*)/;
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
            let expected = /^\/?\[user\]\/\(item\)(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expected, result.regex)).to.be.ok;
        });

        it('disallows parentheses/brackets/braces/slashes/backslashes/dots when processing a parameter name', () => {
            expect(() => mapper.parse('/user/{id(=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id)=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id[=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id]=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id{=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id}=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id/=\\d+}')).to.throw();
            expect(() => mapper.parse('/user/{id\\=\\d+}')).to.throw();
        });

        it('disallows the dot character "." when processing a parameter value', () => {
            expect(() => mapper.parse('/user/{id=.}')).to.throw('Ether MountMapper: The "." character is not allowed in the regex of a parameter value. Breadcrumb given was /user/{id=.}');
        });

        it('allows a slash character in a parameter value when it is within a negated character class', () => {
            expect(() => mapper.parse('/user/{id=/}')).to.throw('Ether MountMapper: The "/" character is not allowed in the regex of a parameter value, unless it is part of a negated character class. Breadcrumb given was /user/{id=/}');
            expect(() => mapper.parse('/user/{id=[^/]}')).to.not.throw();
            expect(() => mapper.parse('/user/{id=[^a/]}')).to.not.throw();
            expect(() => mapper.parse('/user/{id=[^/a]}')).to.not.throw();
        });

        it('escapes parentheses that the user escaped with backslashes', () => {
            let crumb = '/user/{id=\\(\\d+\\)}';
            let expected = /^\/?user\/(\(\d+\))(.*)/;
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
            let expectedRegex = /^\/?user\/(\d+)(.*)/;
            let result = mapper.parse(crumb);
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            expect(result).to.deep.equal({
                regex: expectedRegex,
                paramNames: ['id'],
                slashes: 1,
            });
        });

        it('makes a leading slash optional', () => {
            let hasSlash = '/user/{id=\\d+}';
            let noSlash = 'user/{id=\\d+}';
            let expectedRegex = /^\/?user\/(\d+)(.*)/;
            let resultHasSlash = mapper.parse(hasSlash);
            let resultNoSlash = mapper.parse(noSlash);
            expect(regexEqual(expectedRegex, resultHasSlash.regex)).to.be.ok;
            expect(resultHasSlash).to.deep.equal({
                regex: expectedRegex,
                paramNames: ['id'],
                slashes: 1,
            });
            expect(regexEqual(expectedRegex, resultNoSlash.regex)).to.be.ok;
            expect(resultNoSlash).to.deep.equal({
                regex: expectedRegex,
                paramNames: ['id'],
                slashes: 1,
            });
        });

        it('does not count a leading slash in the slashes count', () => {
            let crumb = '/user/{id=\\d+}';
            let result = mapper.parse(crumb);
            expect(result.slashes).to.equal(1);
        });
    });

    describe('Adding', () => {
        it('expects mounts to be an object', () => {
            expect(() => mapper.add([], [])).to.throw(Error, 'MountMapper#add() expected an object containing the mounts.');
        });

        it('expects parentData to be an object', () => {
            expect(() => mapper.add({'/': TestRoute}, [])).to.throw(Error, 'MountMapper#add() expected an object containing the mount\'s parent data.');
        });

        it('throws if parentData.rootApp is not an App instance', () => {
            parentData.rootApp = null;
            expect(() => mapper.add({'/': TestRoute}, parentData)).to.throw(TypeError, 'MountMapper#add() did not receive an App instance for parentData.rootApp.');
        });

        it('throws if parentData.parentApp is not an App instance', () => {
            parentData.parentApp = null;
            expect(() => mapper.add({'/': TestRoute}, parentData)).to.throw(TypeError, 'MountMapper#add() did not receive an App instance for parentData.parentApp.');
        });

        it('throws if parentData.outlets is not an Object', () => {
            parentData.outlets = null;
            expect(() => mapper.add({'/': TestRoute}, parentData)).to.throw(TypeError, 'MountMapper#add() did not receive an object for parentData.outlets.');
        });

        it('throws if parentData.params is not an Array', () => {
            parentData.params = null;
            expect(() => mapper.add({'/': TestRoute}, parentData)).to.throw(TypeError, 'MountMapper#add() did not receive an array for parentData.params.');
        });

        it('only allows adding mounts once', () => {
            expect(() => mapper.add({'/a': TestRoute}, parentData)).to.not.throw();
            expect(() => mapper.add({'/b': TestRoute}, parentData)).to.throw(Error, 'MountMapper#add() can only be called once.');
        });

        it('returns the metadata for all mounts', () => {
            parentData.outlets = {
                first: new Outlet(document.createElement('div')),
                second: new Outlet(document.createElement('div')),
                third: new Outlet(document.createElement('div')),
            };
            class FirstRoute extends TestRoute {
                expectedAddresses() { return ['first']; }
                addressesHandlers() { return [function(){}]; }
                expectedOutlets() { return ['first']; }
            }
            class SecondRoute extends TestRoute {
                expectedAddresses() { return ['second']; }
                addressesHandlers() { return [function(){}]; }
                expectedOutlets() { return ['second']; }
            }
            let metadata = mapper.add({
                '/first': FirstRoute.addresses('first').outlets('first'),
                '/second': SecondRoute.addresses('second').outlets('second'),
            }, parentData);
            expect(metadata).to.deep.equal({
                addresses: {
                    first: true,
                    second: true,
                },
                outlets: {
                    first: true,
                    second: true,
                },
            });
        });
    });

    describe('Info Retrieval', () => {
        it('returns whether mounts have been added', () => {
            expect(mapper.mountsAdded()).to.equal(false);
            mapper.add({'/': TestRoute}, parentData);
            expect(mapper.mountsAdded()).to.equal(true);
        });

        describe('Getting Mounts', () => {
            it('returns undefined for a non-existent crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                expect(mapper.mountFor(crumb)).to.equal(undefined);
            });

            it('returns the mount for a crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                mapper.add({[crumb]: TestRoute}, parentData);
                expect(mapper.mountFor(crumb)).to.be.an.instanceof(TestRoute);
            });
        });

        describe('Getting Mounts Metadata', () => {
            it('gets all metadata for all mounts added', () => {
                class AddressRoute extends TestRoute {
                    expectedAddresses() { return ['first', 'second']; }
                    addressesHandlers() { return [function(){},function(){}]; }
                }
                expect(mapper.allMounts()).to.deep.equal([]);
                let crumb1 = '';
                let crumb2 = '{id=\\d+}/profile';
                mapper.add({
                    [crumb1]: TestRoute,
                    [crumb2]: AddressRoute.addresses('first', 'second'),
                }, parentData);
                let mounts = mapper.allMounts();
                expect(mounts).to.have.length(2);
                expect(mounts[0].mount).to.be.an.instanceof(TestRoute);
                expect(mounts[1].mount).to.be.an.instanceof(TestRoute);
                // delete mounts so we avoid doing a deep equal comparison on them
                delete mounts[0].mount;
                delete mounts[1].mount;
                expect(mounts).to.deep.equal([
                    {
                        crumb: crumb2,
                        addresses: ['first', 'second'],
                        regex: /^\/?(\d+)\/profile(.*)/,
                        paramNames: ['id'],
                        slashes: 1,
                    },
                    {
                        crumb: crumb1,
                        addresses: null,
                        regex: /^\/?(.*)/,
                        paramNames: null,
                        slashes: 0,
                    },
                ]);
            });
        });

        describe('Getting the Current Mount', () => {
            it('returns undefined if no current mount is set', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                expect(mapper.getCurrentMount()).to.equal(null);
            });

            it('allows setting current mount to null', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                expect(mapper.getCurrentMount()).to.equal(null);
                expect(() => mapper.setCurrentMount(null)).to.not.throw();
                expect(mapper.getCurrentMount()).to.equal(null);
            });

            it('throws on setting current mount if first arg is not a string or null', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                expect(() => mapper.setCurrentMount([], {id: 20})).to.throw(TypeError, 'MountMapper#setCurrentMount(): The first argument given was not a string: [].');
                expect(() => mapper.setCurrentMount(1, {id: 20})).to.throw(TypeError, 'MountMapper#setCurrentMount(): The first argument given was not a string: 1.');
                expect(() => mapper.setCurrentMount({}, {id: 20})).to.throw(TypeError, 'MountMapper#setCurrentMount(): The first argument given was not a string: {}.');
                expect(() => mapper.setCurrentMount(undefined)).to.throw(TypeError, 'MountMapper#setCurrentMount(): The first argument given was not a string: undefined.');
            });

            it('throws on setting current mount if second arg is not an object or null', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                expect(() => mapper.setCurrentMount('xyz', [])).to.throw(TypeError, 'MountMapper#setCurrentMount(): The second argument given was not an object or null: [].');
                expect(() => mapper.setCurrentMount('xyz', 1)).to.throw(TypeError, 'MountMapper#setCurrentMount(): The second argument given was not an object or null: 1.');
                expect(() => mapper.setCurrentMount('xyz', 'hi')).to.throw(TypeError, 'MountMapper#setCurrentMount(): The second argument given was not an object or null: "hi".');
            });

            it('throws on setting current mount if first arg is not a previously-added crumb', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                expect(() => mapper.setCurrentMount('xyz', {id: 20})).to.throw(Error, 'MountMapper#setCurrentMount(): The breadcrumb "xyz" was not added to this MountMapper.');
            });

            it('throws on setting current mount if second arg does not match the mount\'s expected params', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                expect(() => mapper.setCurrentMount(crumb, {})).to.throw(Error, `MountMapper#setCurrentMount(): The params given for breadcrumb "${crumb}" did not match its expected params.`);
            });

            it('throws on setting current mount if the params given have more params than just the expected params for the mount', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                expect(() => mapper.setCurrentMount(crumb, {id: 20, xyz: 30})).to.throw(Error, `MountMapper#setCurrentMount(): The params given for breadcrumb "${crumb}" exceeded its expected params.`);
            });

            it('sets the current mount with a crumb and a params object', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                mapper.setCurrentMount(crumb, {id: 20});
                expect(mapper.getCurrentMount()).to.equal(crumb);
            });

            it('sets the current mount with a crumb and with params as null', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: TestRoute}, parentData);
                mapper.setCurrentMount(crumb, null);
                expect(mapper.getCurrentMount()).to.equal(crumb);
            });
        });

        describe('Getting the last params of a mount', () => {
            it('returns undefined if the mount has never been set as the current mount', () => {
                let crumb = '/user/{id=\\d+}';
                mapper.add({[crumb]: IdParamRoute}, parentData);
                expect(mapper.lastParamsFor(crumb)).to.equal(undefined);
            });

            it('sets the last params for a mount when setCurrentMount() is called', () => {
                let crumb1 = '/user/{id=\\d+}';
                let crumb2 = '/action';
                let params = {id: 20};
                mapper.add({
                    [crumb1]: IdParamRoute,
                    [crumb2]: TestRoute,
                }, parentData);
                mapper.setCurrentMount(crumb1, params);
                expect(mapper.lastParamsFor(crumb1)).to.not.equal(params);
                expect(mapper.lastParamsFor(crumb1)).to.deep.equal(params);
                mapper.setCurrentMount(crumb2, null);
                expect(mapper.lastParamsFor(crumb2)).to.deep.equal({});
            });
        });

        describe('Getting Regex', () => {
            it('returns undefined for a non-existent crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                expect(mapper.regexFor(crumb)).to.equal(undefined);
            });

            it('returns regex for a crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                let expected = /^\/?path\/(\d+)\/somewhere(.*)/;
                mapper.add({[crumb]: IdParamRoute}, parentData);
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
                mapper.add({[crumb]: TestRoute}, parentData);
                expect(mapper.paramNamesFor(crumb)).to.deep.equal([]);
            });

            it('gets param names for a crumb', () => {
                let crumb = '/path/{id=\\d+}/somewhere';
                mapper.add({[crumb]: IdParamRoute}, parentData);
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
                mapper.add({[crumb]: TestRoute}, parentData);
                expect(mapper.slashesFor(crumb)).to.equal(2);
            });
        });

        describe('Getting Addresses', () => {
            it('returns undefined for a non-existent crumb', () => {
                let crumb = '/path/to/somewhere';
                expect(mapper.addressesFor(crumb)).to.equal(undefined);
            });

            it('returns an empty array if a crumb\'s mount has no addresses', () => {
                let crumb = '/path/to/somewhere';
                mapper.add({[crumb]: TestRoute}, parentData);
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
                mapper.add({[crumb]: AddressApp.addresses('addressApp', 'myApp')}, parentData);
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
                mapper.add({
                    '/path/somewhere': AddressApp.addresses('addressApp', 'myApp'),
                    '/path/somewhere/else': AddressApp2.addresses('addressApp2', 'myApp2'),
                }, parentData);
                expect(mapper.allAddresses()).to.deep.equal(['addressApp', 'addressApp2', 'myApp', 'myApp2']);
            });
        });
    });

    describe('Matching', () => {
        it('matches a given crumb with a previously mapped crumb', () => {
            let crumb = '/user/{id=\\d+}';
            let result;

            mapper.add({[crumb]: IdParamApp}, parentData);

            result = mapper.match('/user/25/profile');
            expect(result).to.deep.equal({
                crumb,
                rest: '/profile',
                params: {id: '25'},
            });

            result = mapper.match('/user/1xyz/profile');
            expect(result).to.deep.equal({
                crumb,
                rest: 'xyz/profile',
                params: {id: '1'},
            });
        });

        it('matches within a path resource', () => {
            let crumb = '/user/{id=\\d+}red_';
            mapper.add({[crumb]: IdParamApp}, parentData);
            expect(mapper.match('/user/1red_block')).to.deep.equal({
                crumb,
                rest: 'block',
                params: {id: '1'},
            });
            expect(mapper.match('/user/1red_sphere')).to.deep.equal({
                crumb,
                rest: 'sphere',
                params: {id: '1'},
            });
        });

        it('returns null if a match is not found', () => {
            let crumb = '/user/{id=\\d+}';
            mapper.add({[crumb]: IdParamRoute}, parentData);
            expect(mapper.match('/user/xyz/profile')).to.equal(null);
            expect(mapper.match('/user/xyz1/profile')).to.equal(null);
            expect(mapper.match('/user/x1yz/profile')).to.equal(null);
        });

        it('matches crumbs in order of slash count', () => {
            mapper.add({
                '/user/{id=\\d+}': IdParamRoute,
                // this crumb, though it would match, is a worse match than the below.
                // the above crumb has more slashes, and so is tested before this
                // crumb in order to find the best match first
                '/user/{id=\\d+}/profile': IdParamRoute,
                // has the most slashes, is tested first when matching
                '/user/{id=\\d+}/profile/edit': IdParamRoute,
            }, parentData);

            let spy1 = sinon.spy(mapper.regexFor('/user/{id=\\d+}'), 'exec');
            let spy2 = sinon.spy(mapper.regexFor('/user/{id=\\d+}/profile'), 'exec');
            let spy3 = sinon.spy(mapper.regexFor('/user/{id=\\d+}/profile/edit'), 'exec');

            let result = mapper.match('/user/1/profile/edit');
            expect(result.rest).to.equal(null);
            spy1.should.not.have.been.called;
            spy2.should.not.have.been.called;
            spy3.should.have.been.calledOnce;

            result = mapper.match('/user/1/profile');
            expect(result.rest).to.equal(null);
            spy1.should.not.have.been.called;
            spy2.should.have.been.calledOnce;
            spy3.should.have.been.calledTwice;

            result = mapper.match('/user/1');
            expect(result.rest).to.equal(null);
            spy1.should.have.been.calledOnce;
            spy2.should.have.been.calledTwice;
            spy3.should.have.been.calledThrice;
        });

        it('does a stable sort when sorting by slash count', () => {
            // Tease out differences in JS engines' sorting implementations.
            // For Array.prototype.sort:
            //     Firefox and Safari are known to do a stable sort.
            //     Chrome is known not to do a stable sort if array size > 10,
            //        where quicksort is used over insertionsort.
            //        see: https://github.com/v8/v8/blob/master/src/js/array.js#L964
            mapper.add({
                '/user/{id=\\d+}': IdParamApp,
                '/user/{id=\\d+}a': IdParamApp,
                '/user/{id=\\d+}ab': IdParamApp,
                '/user/{id=\\d+}abc': IdParamApp,
                '/user/{id=\\d+}abcd': IdParamApp,
                '/user/{id=\\d+}abcde': IdParamApp,
                '/user/{id=\\d+}abcdef': IdParamApp,
                '/user/{id=\\d+}abcdefg': IdParamApp,
                '/user/{id=\\d+}abcdefgh': IdParamApp,
                '/user/{id=\\d+}abcdefghi': IdParamApp,
                '/user/{id=\\d+}abcdefghij': IdParamApp,
                '/user/{id=\\d+}abcdefghijk': IdParamApp,
                '/user/{id=\\d+}abcdefghijkl': IdParamApp,
                '/user/{id=\\d+}abcdefghijklm': IdParamApp,
            }, parentData);
            let result = mapper.match('/user/25abcdefghijklmnopqrstuvwxyz');
            expect(result.rest).to.equal('abcdefghijklmnopqrstuvwxyz');
        });

        it('decodes URI components', () => {
            let crumb = '/user/{id=[^/]+}';
            let result;

            mapper.add({[crumb]: IdParamRoute}, parentData);

            result = mapper.match('/user/%3Chello%3E%20there');
            expect(result).to.deep.equal({
                crumb,
                rest: null,
                params: {id: '<hello> there'},
            });
        });

        it('does not coerce whitespace to the number 0', () => {
            let crumb = '/user/{id=[^/]+}';
            let result;

            mapper.add({[crumb]: IdParamRoute}, parentData);

            result = mapper.match('/user/%20%09%0D%0A');
            expect(result).to.deep.equal({
                crumb,
                rest: null,
                params: {id: ' \t\r\n'},
            });
        });

        it('does not turn strings `true` and `false` into boolean true and false', () => {
            let crumb = '/user/{id=[^/]+}/{action=[^/]+}';
            let result;

            mapper.add({[crumb]: IdActionParamRoute}, parentData);

            result = mapper.match('/user/true/false');
            expect(result).to.deep.equal({
                crumb,
                rest: null,
                params: {
                    id: 'true',
                    action: 'false',
                },
            });
        });

        it('bypasses Routes where matching gives extra URL chars', () => {
            let routeCrumb = 'user/{id=\\d+}';
            let appCrumb   = 'user';
            let result;

            mapper.add({
                [routeCrumb]: IdParamRoute,
                [appCrumb]: TestApp,
            }, parentData);

            result = mapper.match('/user/20');
            expect(result).to.be.an('object');
            expect(result.crumb).to.equal(routeCrumb);
            // MountMapper will test routeCrumb first, since it has more slashes
            // but will pass because the match string will give `rest`(===`abc`)
            // and so the App instance is chosen as the better candidate
            result = mapper.match('/user/20abc');
            expect(result.crumb).to.equal(appCrumb);
            // no match
            result = mapper.match('/use');
            expect(result).to.equal(null);
        });
    });
});
