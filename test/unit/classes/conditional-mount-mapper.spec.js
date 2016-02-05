import ConditionalMountMapper from '../../../src/classes/conditional-mount-mapper';
import RootApp from '../../../src/classes/root-app';
import Route from '../../../src/classes/route';
import regexEqual from '../../utils/regex-equal';

function onlyHasProperties(obj, props) {
    let copy = Object.assign({}, obj);
    for (let prop of props) {
        expect(obj).to.have.ownProperty(prop);
        delete copy[prop];
    }
    let keys = Object.keys(copy);
    if (keys.length) {
        throw new Error(`Object had more properties than expected: ${obj} => ${keys}`);
    }
}

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

class IdRoute extends TestRoute {
    expectedParams() { return ['id']; }
}
class IdActionRoute extends TestRoute {
    expectedParams() { return ['id', 'action']; }
}
class UserRoute extends TestRoute {
    expectedParams() { return ['user']; }
}

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
class MyRootApp extends TestRootApp {
    mount() {
        return {
            '{id=\\d+}': FirstSecondRoute.addresses('first', 'second'),
            '{id=\\d+}/{action=\\w+}': ThirdFourthRoute.addresses('third', 'fourth'),
            '{user=\\w+}': FifthRoute.addresses('fifth'),
        };
    }
}

describe('ConditionalMountMapper', () => {
    let mapper, mountMapper, mountsMetadata, parentData;

    beforeEach(() => {
        MyRootApp.prototype._instantiateConditionalMounts = function(params, mountsMeta) {
            mountMapper = this._mountMapper;
            mountsMetadata = mountsMeta;
        };
        let rootApp = new MyRootApp({});
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

        it('throws is any comma-delimited address is empty', () => {
            expect(() => mapper.parse('!,')).to.throw(Error, 'ConditionalMountMapper#parse(): Empty addresses are not allowed in conditional mount: "!,".');
            expect(() => mapper.parse('+,')).to.throw(Error, 'ConditionalMountMapper#parse(): Empty addresses are not allowed in conditional mount: "+,".');
            expect(() => mapper.parse('!hi,')).to.throw(Error, 'ConditionalMountMapper#parse(): Empty addresses are not allowed in conditional mount: "!hi,".');
            expect(() => mapper.parse('+hi,')).to.throw(Error, 'ConditionalMountMapper#parse(): Empty addresses are not allowed in conditional mount: "+hi,".');
            expect(() => mapper.parse('!,hi')).to.throw(Error, 'ConditionalMountMapper#parse(): Empty addresses are not allowed in conditional mount: "!,hi".');
            expect(() => mapper.parse('+,hi')).to.throw(Error, 'ConditionalMountMapper#parse(): Empty addresses are not allowed in conditional mount: "+,hi".');
            expect(() => mapper.parse('!hi,,hello')).to.throw(Error, 'ConditionalMountMapper#parse(): Empty addresses are not allowed in conditional mount: "!hi,,hello".');
            expect(() => mapper.parse('+hi,,hello')).to.throw(Error, 'ConditionalMountMapper#parse(): Empty addresses are not allowed in conditional mount: "+hi,,hello".');
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
        describe('* Operator', () => {
            it('returns all cMount crumbs regardless of the addresses given', () => {
                mapper.add({
                    '*': [TestRoute],
                }, parentData);
                onlyHasProperties(mapper.match([]),  ['*']);
                onlyHasProperties(mapper.match(['first']),  ['*']);
                onlyHasProperties(mapper.match(['second']), ['*']);
                onlyHasProperties(mapper.match(['third']),  ['*']);
                onlyHasProperties(mapper.match(['fourth']), ['*']);
                onlyHasProperties(mapper.match(['fifth']),  ['*']);
                onlyHasProperties(mapper.match(['first','second','third','fourth','fifth']), ['*']);
            });
        });

        describe('+ Operator', () => {
            it('returns all cMount crumbs that match the given addresses', () => {
                mapper.add({
                    '+first': [TestRoute],
                    '+first,second': [TestRoute],
                    '+second': [TestRoute],
                }, parentData);
                onlyHasProperties(mapper.match(['first']), ['+first', '+first,second']);
                onlyHasProperties(mapper.match(['second']), ['+first,second', '+second']);
                onlyHasProperties(mapper.match(['first', 'second']), ['+first', '+first,second', '+second']);
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
                onlyHasProperties(mapper.match(['first']), ['!second', '!third']);
                onlyHasProperties(mapper.match(['second']), ['!first', '!third']);
                onlyHasProperties(mapper.match(['third']), ['!first', '!first,second', '!second']);
                onlyHasProperties(mapper.match(['fourth']), ['!first', '!first,second', '!second', '!third']);
                onlyHasProperties(mapper.match([]), ['!first', '!first,second', '!second', '!third']);
                // note in the following how passing multiple addresses compounds the exclusion.
                // think of passing multiple addresses as an AND operation, not OR
                onlyHasProperties(mapper.match(['first', 'second']), ['!third']);
                onlyHasProperties(mapper.match(['second', 'third']), ['!first']);
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
                onlyHasProperties(mapper.match([]), ['!third,fourth', '!fifth', '*']);
                onlyHasProperties(mapper.match(['first']), ['+first', '+first,second', '!third,fourth', '!fifth', '*']);
                onlyHasProperties(mapper.match(['second']), ['+first,second', '!third,fourth', '!fifth', '*']);
                onlyHasProperties(mapper.match(['fifth']), ['!third,fourth', '*']);
                // note in the following how passing multiple addresses compounds the exclusion.
                // think of passing multiple addresses as an AND operation, not OR
                onlyHasProperties(mapper.match(['first', 'second']), ['+first', '+first,second', '!third,fourth', '!fifth', '*']);
                onlyHasProperties(mapper.match(['second', 'third']), ['+first,second', '!fifth', '*']);
                onlyHasProperties(mapper.match(['second', 'third', 'fifth']), ['+first,second', '*']);
                onlyHasProperties(mapper.match(['first', 'third', 'fifth']), ['+first', '+first,second', '*']);
            });
        });
    });

    describe('Info Retrieval', () => {
        describe('Getting the Routes for a Mount', () => {
            it('returns undefined if the mount does not exist', () => {
                let crumb = '+first';
                expect(mapper.routesFor(crumb)).to.equal(undefined);
            });

            it('returns the array of Route instances for a mount', () => {
                let crumb = '+first';
                mapper.add({[crumb]: [TestRoute, TestRoute]}, parentData);
                let routes = mapper.routesFor(crumb);
                expect(routes).to.be.an('array');
                expect(routes).to.have.length(2);
                expect(routes[0]).to.be.an.instanceof(TestRoute);
                expect(routes[1]).to.be.an.instanceof(TestRoute);
            });
        });

        describe('Getting the Current Mounts', () => {
            it('returns null if no current mounts are set', () => {
                let crumb = '+first';
                mapper.add({[crumb]: TestRoute}, parentData);
                expect(mapper.getCurrentMounts()).to.equal(null);
            });

            it('allows setting current mounts to null', () => {
                let crumb = '+first';
                mapper.add({[crumb]: IdRoute}, parentData);
                expect(() => mapper.setCurrentMounts(null)).to.not.throw();
                expect(mapper.getCurrentMounts()).to.equal(null);
            });

            it('throws on setting current mounts if first arg is not an object nor null', () => {
                let crumb = '+first';
                mapper.add({[crumb]: IdRoute}, parentData);
                expect(() => mapper.setCurrentMounts(['xyz'])).to.throw(TypeError, 'ConditionalMountMapper#setCurrentMounts(): The first argument given was not an object: ["xyz"].');
                expect(() => mapper.setCurrentMounts('xyz')).to.throw(TypeError, 'ConditionalMountMapper#setCurrentMounts(): The first argument given was not an object: "xyz".');
                expect(() => mapper.setCurrentMounts(1)).to.throw(TypeError, 'ConditionalMountMapper#setCurrentMounts(): The first argument given was not an object: 1.');
                expect(() => mapper.setCurrentMounts()).to.throw(TypeError, 'ConditionalMountMapper#setCurrentMounts(): The first argument given was not an object: undefined.');
            });

            it('throws on setting current mounts if any key in the passed obj is not a previously-added logic crumb', () => {
                let crumb = '+first';
                mapper.add({[crumb]: IdRoute}, parentData);
                expect(() => mapper.setCurrentMounts({
                    '+second': [{id: 20}],
                    '!third':  [{id: 10}],
                    '*':       [{id: 10}],
                })).to.throw(Error, 'ConditionalMountMapper#setCurrentMounts(): The following conditional mounts given were not added to this ConditionalMountMapper: ["!third","*","+second"].');
            });

            it('throws on setting current mounts if any params do not match the matching Route\'s expected params', () => {
                let crumb = '+third';
                mapper.add({
                    [crumb]: [IdRoute, IdActionRoute]
                }, parentData);
                expect(() => mapper.setCurrentMounts({
                    [crumb]: [{id: 10}, {id: 10}]
                })).to.throw(Error, 'ConditionalMountMapper#setCurrentMounts(): The params given for IdActionRoute ({"id":10}) did not match its expected params: ["action","id"].');
            });

            it('throws on setting current mounts if the params given have more params than just the expected params for the mount', () => {
                let crumb = '+third';
                mapper.add({
                    [crumb]: [IdRoute, IdActionRoute]
                }, parentData);
                expect(() => mapper.setCurrentMounts({
                    [crumb]: [{id: 10}, {id: 10, action: 'go', user: 'JimBob'}]
                })).to.throw(Error, 'ConditionalMountMapper#setCurrentMounts(): The params given for IdActionRoute ({"id":10,"action":"go","user":"JimBob"}) exceeded its expected params: ["action","id"].');
            });

            it('sets the current mounts with a mounts-to-params object', () => {
                let crumb1 = '+fourth';
                let crumb2 = '!first,second,fifth';
                let crumb3 = '+fifth';
                let crumb4 = '+first,third';
                let crumb5 = '+third';
                mapper.add({
                    [crumb1]: [IdRoute, IdActionRoute],
                    [crumb2]: [IdActionRoute, IdRoute],
                    [crumb3]: [UserRoute, UserRoute],
                    [crumb4]: [IdRoute, IdRoute],
                    [crumb5]: [IdRoute, IdRoute],
                }, parentData);
                mapper.setCurrentMounts({
                    [crumb1]: [{id: 10}, {id: 10, action: 'go'}],
                    [crumb2]: [{id: 10, action: 'go'}, {id: 10}],
                });
                expect(mapper.getCurrentMounts()).to.deep.equal([crumb2, crumb1]);

                mapper.setCurrentMounts({
                    [crumb3]: [{user: 'JimBob'}, {user: 'JimBob'}],
                });
                expect(mapper.getCurrentMounts()).to.deep.equal([crumb3]);

                mapper.setCurrentMounts({
                    [crumb4]: [{id: 10}, {id: 10}],
                    [crumb5]: [{id: 10}, {id: 10}],
                });
                expect(mapper.getCurrentMounts()).to.deep.equal([crumb4, crumb5]);
            });
        });

        describe('Getting the last params of a mount', () => {
            it('returns undefined if the mount has never been set as the current mount', () => {
                let crumb = '+first';
                mapper.add({[crumb]: IdRoute}, parentData);
                expect(mapper.lastParamsFor(crumb)).to.equal(undefined);
            });

            it('sets the last params for a mount when setCurrentMount() is called', () => {
                let crumb1 = '+fourth';
                let crumb2 = '!first,second,fifth';
                let crumb3 = '+fifth';
                let crumb4 = '+first,third';
                let crumb5 = '+third';
                mapper.add({
                    [crumb1]: [IdRoute, IdActionRoute],
                    [crumb2]: [IdActionRoute, IdRoute],
                    [crumb3]: [UserRoute, UserRoute],
                    [crumb4]: [IdRoute, IdRoute],
                    [crumb5]: [IdRoute, IdRoute],
                }, parentData);

                let params1 = [{id: 10}, {id: 10, action: 'go'}];
                let params2 = [{id: 10, action: 'go'}, {id: 10}];
                expect(mapper.lastParamsFor(crumb1)).to.equal(undefined);
                expect(mapper.lastParamsFor(crumb2)).to.equal(undefined);
                mapper.setCurrentMounts({
                    [crumb1]: params1,
                    [crumb2]: params2,
                });
                expect(mapper.lastParamsFor(crumb1)).to.not.equal(params1);
                expect(mapper.lastParamsFor(crumb1)).to.deep.equal(params1);
                expect(mapper.lastParamsFor(crumb2)).to.not.equal(params2);
                expect(mapper.lastParamsFor(crumb2)).to.deep.equal(params2);


                let params3 = [{user: 'JimBob'}, {user: 'JimBob'}];
                expect(mapper.lastParamsFor(crumb3)).to.equal(undefined);
                mapper.setCurrentMounts({
                    [crumb3]: params3,
                });
                expect(mapper.lastParamsFor(crumb3)).to.not.equal(params3);
                expect(mapper.lastParamsFor(crumb3)).to.deep.equal(params3);
                // last params for other mounts stay intact
                expect(mapper.lastParamsFor(crumb1)).to.deep.equal(params1);
                expect(mapper.lastParamsFor(crumb2)).to.deep.equal(params2);


                let params4 = [{id: 10}, {id: 10}];
                let params5 = [{id: 10}, {id: 10}];
                expect(mapper.lastParamsFor(crumb4)).to.equal(undefined);
                expect(mapper.lastParamsFor(crumb5)).to.equal(undefined);
                mapper.setCurrentMounts({
                    [crumb4]: params4,
                    [crumb5]: params5,
                });
                expect(mapper.lastParamsFor(crumb4)).to.deep.equal(params4);
                expect(mapper.lastParamsFor(crumb5)).to.deep.equal(params5);
                // last params for other mounts stay intact
                expect(mapper.lastParamsFor(crumb1)).to.deep.equal(params1);
                expect(mapper.lastParamsFor(crumb2)).to.deep.equal(params2);
                expect(mapper.lastParamsFor(crumb3)).to.deep.equal(params3);
            });
        });
    });
});
