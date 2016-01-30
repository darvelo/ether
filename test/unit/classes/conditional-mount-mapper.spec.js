import ConditionalMountMapper from '../../../src/classes/conditional-mount-mapper';
import MountMapper from '../../../src/classes/mount-mapper';
import RootApp from '../../../src/classes/root-app';
import Route from '../../../src/classes/route';
import regexEqual from '../../utils/regex-equal';

class TestRootApp extends RootApp {
    expectedOutlets() {
        return [];
    }
}

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe('ConditionalMountMapper', () => {
    let mapper, addresses, outlets, parentData;

    beforeEach(() => {
        let rootApp = new TestRootApp({});
        mapper = new ConditionalMountMapper();
        addresses = {
            'first': true,
            'second': true,
            'third': true,
        };
        outlets = {
            'first': true,
            'second': true,
            'third': true,
        };
        parentData = {
            rootApp,
            parentApp: rootApp,
            outlets: {},
            params: [],
            mountsMetadata: {
                addresses: {},
                outlets: {},
            },
            mountMapper: new MountMapper(),
        };
    });

    describe('Parsing', () => {
        it('throws if the first character is not supported', () => {
            expect(() => mapper.parse('abc')).to.throw(Error, 'ConditionalMountMapper only supports the initial character being one of this list: ["*","+","!"].');
        });

        it('parses *', () => {
            let expectedRegex = /.*/;
            let result = mapper.parse('*');
            result.logic.should.equal('*');
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            result.operator.should.equal('*');
            result.addresses.should.deep.equal([]);
        });

        it('parses +', () => {
            let expectedRegex = /^(?:first|second|third)$/;
            let result = mapper.parse('+first,second,third');
            result.logic.should.equal('+first,second,third');
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            result.operator.should.equal('+');
            result.addresses.should.deep.equal(['first', 'second', 'third']);
        });

        it('parses !', () => {
            let expectedRegex = /^(?!first$|second$|third$).*/;
            let result = mapper.parse('!first,second,third');
            result.logic.should.equal('!first,second,third');
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            result.operator.should.equal('!');
            result.addresses.should.deep.equal(['first', 'second', 'third']);
        });

        it('throws if operator is not * and no addresses are listed', () => {
            expect(() => mapper.parse('!')).to.throw(Error, 'Conditional mounts that are not "*" require a comma-delimited list of required addresses.');
            expect(() => mapper.parse('+')).to.throw(Error, 'Conditional mounts that are not "*" require a comma-delimited list of required addresses.');
        });
    });

    describe('Adding', () => {
        it('expects mounts to be an object', () => {
            expect(() => mapper.add([], parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() expected an object of mounts.');
        });

        it('expects parentData to be an object', () => {
            expect(() => mapper.add({'*': [TestRoute]}, [])).to.throw(TypeError, 'ConditionalMountMapper#add() expected an object containing the mount\'s parent data.');
        });

        it('throws if parentData.rootApp is not an App instance', () => {
            parentData.rootApp = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an App instance for parentData.rootApp.');
        });

        it('throws if parentData.parentApp is not an App instance', () => {
            parentData.parentApp = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an App instance for parentData.parentApp.');
        });

        it('throws if parentData.outlets is not an Object', () => {
            parentData.outlets = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.outlets.');
        });

        it('throws if parentData.params is not an Array', () => {
            parentData.params = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an array for parentData.params.');
        });

        it('throws if parentData.mountsMetadata is not an Object', () => {
            parentData.mountsMetadata = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.mountsMetadata.');
        });

        it('throws if parentData.mountsMetadata.addresses is not an Object', () => {
            parentData.mountsMetadata.addresses = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.mountsMetadata.addresses.');
        });

        it('throws if parentData.mountsMetadata.outlets is not an Object', () => {
            parentData.mountsMetadata.outlets = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.mountsMetadata.outlets.');
        });

        it('throws if parentData.mountMapper is not an instance of MountMapper', () => {
            parentData.mountMapper = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an instance of MountMapper for parentData.mountMapper.');
        });

        it('throws if a mount is an empty array', () => {
            expect(() => mapper.add({'*': []}, parentData)).to.throw(Error, 'ConditionalMountMapper#add() received an empty array for a mount.');
        });

        it('only allows adding mounts once', () => {
            expect(() => mapper.add({'*': TestRoute}, parentData)).to.not.throw();
            expect(() => mapper.add({'*': TestRoute}, parentData)).to.throw(Error, 'ConditionalMountMapper#add() can only be called once.');
        });
    });

    describe('Matching', () => {
        class OneAddressRoute extends TestRoute {
            addressesHandlers() { return [function(){}]; }
        }
        class TwoAddressRoute extends TestRoute {
            addressesHandlers() { return [function(){},function(){}]; }
        }
        class FirstSecondRoute extends TwoAddressRoute {
            expectedAddresses() { return ['first', 'second']; }
        }
        class ThirdFourthRoute extends TwoAddressRoute {
            expectedAddresses() { return ['third', 'fourth']; }
        }
        class FifthRoute extends OneAddressRoute {
            expectedAddresses() { return ['fifth']; }
        }
        class MatchingRootApp extends TestRootApp {
            mount() {
                return {
                    '{id=\\d+}': FirstSecondRoute.addresses('first', 'second'),
                    '{id=\\d+}/{action=\\w+}': ThirdFourthRoute.addresses('third', 'fourth'),
                    '{user=\\w+}': FifthRoute.addresses('fifth'),
                };
            }
        }

        beforeEach(() => {
            let mountsMetadata, mountMapper;
            MatchingRootApp.prototype._instantiateConditionalMounts = function(params, mountsMeta) {
                mountsMetadata = mountsMeta;
                mountMapper= this._mountMapper;
            };
            let rootApp = new MatchingRootApp({});
            mapper = new ConditionalMountMapper();
            parentData = {
                rootApp,
                parentApp: rootApp,
                outlets: {},
                params: [],
                mountsMetadata,
                mountMapper,
            };
        });

        describe('* Operator', () => {
            it('returns all cMount crumbs regardless of the addresses given', () => {
                mapper.add({
                    '*': [TestRoute],
                }, parentData);
                expect(mapper.match(['first'] )).to.deep.equal(['*']);
                expect(mapper.match(['second'])).to.deep.equal(['*']);
                expect(mapper.match(['third'] )).to.deep.equal(['*']);
                expect(mapper.match(['fourth'])).to.deep.equal(['*']);
                expect(mapper.match(['fifth'] )).to.deep.equal(['*']);
                expect(mapper.match(['first','second','third','fourth','fifth'])).to.deep.equal(['*']);
            });
        });

        describe('+ Operator', () => {
            it('returns all cMount crumbs that match the given addresses', () => {
                mapper.add({
                    '+first': [TestRoute],
                    '+first,second': [TestRoute],
                    '+second': [TestRoute],
                }, parentData);
                expect(mapper.match(['first'])).to.deep.equal(['+first', '+first,second']);
                expect(mapper.match(['second'])).to.deep.equal(['+first,second', '+second']);
                expect(mapper.match(['first', 'second'])).to.deep.equal(['+first', '+first,second', '+second']);
            });
        });

        describe('! Operator', () => {
            it('returns all cMount crumbs that do not match the given addresses', () => {
                mapper.add({
                    '!first': [TestRoute],
                    '!first,second': [TestRoute],
                    '!second': [TestRoute],
                    '!third': [TestRoute],
                }, parentData);
                expect(mapper.match(['first'])).to.deep.equal(['!second', '!third']);
                expect(mapper.match(['second'])).to.deep.equal(['!first', '!third']);
                expect(mapper.match(['third'])).to.deep.equal(['!first', '!first,second', '!second']);
                expect(mapper.match(['fourth'])).to.deep.equal(['!first', '!first,second', '!second', '!third']);
                // note in the following how passing multiple addresses compounds the exclusion.
                // think of passing multiple addresses as an AND operation, not OR
                expect(mapper.match(['first', 'second'])).to.deep.equal(['!third']);
                expect(mapper.match(['second', 'third'])).to.deep.equal(['!first']);
            });
        });

        describe('All Operators', () => {
            it('returns null if a match is not found', () => {
                mapper.add({
                    '+first': [TestRoute],
                    '+first,second': [TestRoute],
                    '!fifth': TestRoute,
                }, parentData);
                expect(mapper.match(['fifth'])).to.equal(null);
            });

            it('returns all cMount crumbs matching each operator\'s logic', () => {
                mapper.add({
                    '+first': [TestRoute],
                    '+first,second': [TestRoute],
                    '!third,fourth': TestRoute,
                    '!fifth': TestRoute,
                    '*': [TestRoute],
                }, parentData);
                expect(mapper.match(['first'])).to.deep.equal(['+first', '+first,second', '!third,fourth', '!fifth', '*']);
                expect(mapper.match(['second'])).to.deep.equal(['+first,second', '!third,fourth', '!fifth', '*']);
                expect(mapper.match(['fifth'])).to.deep.equal(['!third,fourth', '*']);
                // note in the following how passing multiple addresses compounds the exclusion.
                // think of passing multiple addresses as an AND operation, not OR
                expect(mapper.match(['first', 'second'])).to.deep.equal(['+first', '+first,second', '!third,fourth', '!fifth', '*']);
                expect(mapper.match(['second', 'third'])).to.deep.equal(['+first,second', '!fifth', '*']);
                expect(mapper.match(['second', 'third', 'fifth'])).to.deep.equal(['+first,second', '*']);
                expect(mapper.match(['first', 'third', 'fifth'])).to.deep.equal(['+first', '+first,second', '*']);
            });
        });
    });
});
