import ConditionalMountMapper from '../../src/classes/conditional-mount-mapper';
import MountMapper from '../../src/classes/mount-mapper';
import Route from '../../src/classes/route';
import Outlet from '../../src/classes/outlet';
import RootApp from '../../src/classes/root-app';
import App from '../../src/classes/app';

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

function createRootApp() {
    return new RootApp({
        outlets: {
            main: new Outlet(document.createElement('div')),
        },
    });
}

describe('ConditionalMountMapper', () => {
    let mapper, addresses, outlets;

    beforeEach(() => {
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
    });

    describe('Add', () => {
        it('calls create() on each mount instance with the proper options', () => {
            class OneParamRoute extends TestRoute {
                expectedParams() {
                    return ['action'];
                }
            }
            class BothParamsRoute extends TestRoute {
                expectedParams() {
                    return ['id', 'action'];
                }
            }
            class AddressesRoute extends BothParamsRoute {
                expectedAddresses() {
                    return ['fourth'];
                }
                addressesHandlers() {
                    return [function(){}];
                }
            }
            class OutletRoute extends BothParamsRoute {
                expectedOutlets() {
                    return ['fourth', 'fifth'];
                }
            }
            class SetupRoute extends BothParamsRoute {
                init(setup, ...args) {
                    super.init(setup, ...args);
                    this.setup = setup;
                }
            }
            let mounts = [
                OneParamRoute,
                BothParamsRoute,
                AddressesRoute.addresses('fourth'),
                OutletRoute.outlets('fourth', 'fifth'),
                SetupRoute.setup(function() { return 42; }),
            ];
            let [ oneParamSpy,
                  bothParamsSpy,
                  addressSpy,
                  outletSpy,
                  setupSpy ] = mounts.map(route => sinon.spy(route, 'create'));
            let parentData = {
                outlets: {
                    fourth:  new Outlet(document.createElement('div')),
                    fifth: new Outlet(document.createElement('div')),
                    unused: new Outlet(document.createElement('div')),
                },
                params: ['id', 'action'],
                mountsMetadata: {
                    addresses: {},
                    outlets: {},
                },
                mountMapper: new MountMapper(),
            };

            let rootApp = parentData.rootApp = parentData.parentApp = createRootApp();
            mapper.add({'*': mounts}, parentData);

            let opts;

            oneParamSpy.should.have.been.calledOnce;
            opts = oneParamSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // ConditionalMountMapper should make a shallow
            // copy of what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {},
                params: ['action'],
                setup: undefined,
            });

            bothParamsSpy.should.have.been.calledOnce;
            opts = bothParamsSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // ConditionalMountMapper should make a shallow
            // copy of what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {},
                params: ['id', 'action'],
                setup: undefined,
            });

            addressSpy.should.have.been.calledOnce;
            opts = addressSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // ConditionalMountMapper should make a shallow
            // copy of what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.should.deep.equal({
                rootApp,
                addresses: ['fourth'],
                outlets: {},
                params: ['id', 'action'],
                setup: undefined,
            });

            outletSpy.should.have.been.calledOnce;
            opts = outletSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // ConditionalMountMapper should make a shallow
            // copy of what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {
                    fourth: parentData.outlets.fourth,
                    fifth: parentData.outlets.fifth,
                },
                params: ['id', 'action'],
                setup: undefined,
            });

            setupSpy.should.have.been.calledOnce;
            opts = setupSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // ConditionalMountMapper should make a shallow
            // copy of what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {},
                params: ['id', 'action'],
                setup: 42,
            });

            oneParamSpy.restore();
            bothParamsSpy.restore();
            addressSpy.restore();
            outletSpy.restore();
            setupSpy.restore();
        });

        describe('Checking Accumulated Params Against Expected Params', () => {
            class FirstRoute extends TestRoute {
                expectedAddresses() { return ['first']; }
                expectedParams()    { return ['first', 'action']; }
                addressesHandlers() { return [function(){}]; }
            }
            class SecondRoute extends TestRoute {
                expectedAddresses() { return ['second']; }
                expectedParams()    { return ['second', 'action']; }
                addressesHandlers() { return [function(){}]; }
            }
            class ThirdRoute extends TestRoute {
                expectedAddresses() { return ['third']; }
                expectedParams()    { return ['third']; }
                addressesHandlers() { return [function(){}]; }
            }

            class MyApp extends TestApp {
                mount() {
                    return {
                        '{action=\\w+}/{first=\\w+}':  FirstRoute.addresses('first'),
                        '{action=\\w+}/{second=\\w+}': SecondRoute.addresses('second'),
                        '{third=\\w+}':  ThirdRoute.addresses('third'),
                    };
                }
            }
            class MyRootApp extends RootApp {
                expectedOutlets() { return []; }
                mount() {
                    return {
                        '{id=\\d+}': MyApp,
                    };
                }
            }

            class IdRoute extends TestRoute {
                expectedParams() { return ['id']; }
            }
            class IdActionRoute extends TestRoute {
                expectedParams() { return ['id', 'action']; }
            }
            class IdActionFirstRoute extends TestRoute {
                expectedParams() { return ['id', 'action', 'first']; }
            }
            class IdActionFirstSecondRoute extends TestRoute {
                expectedParams() { return ['id', 'action', 'first', 'second']; }
            }

            it('* operator: throws if expected params are missing from any mount in the parent App', () => {
                MyApp.prototype.mountConditionals = function() {
                    return {
                        '*': IdActionFirstSecondRoute,
                    };
                };
                expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mountConditionals(): Not every mount referenced in "*" had these params available: ["action","first","second"].');
                MyApp.prototype.mountConditionals = function() {
                    return {
                        '*': [IdRoute, IdRoute, IdActionFirstSecondRoute],
                    };
                };
                expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mountConditionals(): Not every mount referenced in "*" had these params available: ["action","first","second"].');
            });

            it('+ operator: throws if expected params are missing from any mount listed on the `+` list', () => {
                MyApp.prototype.mountConditionals = function() {
                    return {
                        '+first,second': IdActionFirstRoute,
                    };
                };
                expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mountConditionals(): Not every mount referenced in "+first,second" had these params available: ["first"].');
                MyApp.prototype.mountConditionals = function() {
                    return {
                        '+first,second,third': IdActionFirstRoute,
                    };
                };
                expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mountConditionals(): Not every mount referenced in "+first,second,third" had these params available: ["action","first"]');
                MyApp.prototype.mountConditionals = function() {
                    return {
                        '+first,second,third': [IdRoute, IdRoute, IdActionRoute],
                    };
                };
                expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mountConditionals(): Not every mount referenced in "+first,second,third" had these params available: ["action"].');
            });

            it('! operator: throws if expected params are missing from any mount not listed on the `!` list', () => {
                MyApp.prototype.mountConditionals = function() {
                    return {
                        '!first,second': IdActionRoute,
                    };
                };
                expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mountConditionals(): Not every mount referenced in "!first,second" had these params available: ["action"].');
                MyApp.prototype.mountConditionals = function() {
                    return {
                        '!third': IdActionFirstSecondRoute,
                    };
                };
                expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mountConditionals(): Not every mount referenced in "!third" had these params available: ["first","second"]');
                MyApp.prototype.mountConditionals = function() {
                    return {
                        '!third': [IdRoute, IdRoute, IdActionFirstSecondRoute],
                    };
                };
                expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mountConditionals(): Not every mount referenced in "!third" had these params available: ["first","second"].');
            });
        });
    });
});
