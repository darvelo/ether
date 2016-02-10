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

describe('MountMapper', () => {
    let mapper;

    beforeEach(() => {
        mapper = new MountMapper();
    });

    describe('Add', () => {
        it('accumulates params and passes them forward', () => {
            class MyRoute extends TestRoute {
                expectedParams() {
                    // this will be passed ['id', 'action'] but here
                    // we're just saying 'action' needs to be there.
                    // we can include 'id' and receive it on navigation
                    // without any other changes in the code.
                    return ['action'];
                }
            }
            class MyApp extends TestApp {
                expectedParams() {
                    return [];
                }
                mount() {
                    return {
                        '/{action=\\w+}/': MyRoute,
                    };
                }
            }
            class MyRootApp extends RootApp {
                expectedOutlets() {
                    return [];
                }
                mount() {
                    return {
                        '/{id=\\d+}/': MyApp,
                    };
                }
            }

            let appSpy   = sinon.spy(MyApp, 'create');
            let routeSpy = sinon.spy(MyRoute, 'create');
            let rootApp  = new MyRootApp({});
            let opts;

            appSpy.should.have.been.calledOnce;
            opts = appSpy.getCall(0).args[0];
            opts.params.sort().should.deep.equal(['id']);

            routeSpy.should.have.been.calledOnce;
            opts = routeSpy.getCall(0).args[0];
            opts.params.sort().should.deep.equal(['action', 'id']);
        });

        it('throws if expected params are not in accumulated params', () => {
            class MyRoute extends TestRoute {
                expectedParams()    { return ['id', 'action', 'type', 'user']; }
            }

            class MyApp extends TestApp {
                mount() {
                    return {
                        'profile/{action=\\w+}':  MyRoute,
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

            expect(() => new MyRootApp({})).to.throw(Error, 'MyApp#mount(): The following params were not available to "profile/{action=\\w+}": ["type","user"].');
        });

        it('calls create() on each mount instance with the proper options', () => {
            class OneParamRoute extends TestRoute {
                expectedParams() {
                    return ['action'];
                }
            }
            class TwoParamsRoute extends TestRoute {
                expectedParams() {
                    return ['id', 'action'];
                }
            }
            class BothParamsRoute extends TwoParamsRoute { }
            class AddressesRoute extends TwoParamsRoute {
                expectedAddresses() {
                    return ['addressRoute'];
                }
                addressesHandlers() {
                    return [function(){}];
                }
            }
            class OutletRoute extends TwoParamsRoute {
                expectedOutlets() {
                    return ['first', 'second'];
                }
            }
            class SetupRoute extends TwoParamsRoute {
                init(setup, ...args) {
                    super.init(setup, ...args);
                    this.setup = setup;
                }
            }
            let oneParamRoute   = OneParamRoute;
            let oneParamSpy     = sinon.spy(oneParamRoute, 'create');
            let oneParamCrumb   = '/one-param/{action=\\w+}/';

            let bothParamsRoute = BothParamsRoute;
            let bothParamsSpy   = sinon.spy(bothParamsRoute, 'create');
            let bothParamsCrumb = '/both-params/{action=\\w+}/';

            let addressRoute    = AddressesRoute.addresses('addressRoute');
            let addressSpy      = sinon.spy(addressRoute, 'create');
            let addressCrumb    = '/address/{action=\\w+}/';

            let outletRoute     = OutletRoute.outlets('first', 'second');
            let outletSpy       = sinon.spy(outletRoute, 'create');
            let outletCrumb     = '/outlet/{action=\\w+}/';

            let setupRoute      = SetupRoute.setup(function() { return 42; });
            let setupSpy        = sinon.spy(setupRoute, 'create');
            let setupCrumb      = '/setup/{action=\\w+}/';

            let parentData = {
                outlets: {
                    first:  new Outlet(document.createElement('div')),
                    second: new Outlet(document.createElement('div')),
                    unused: new Outlet(document.createElement('div')),
                },
                params: ['id'],
            };

            let rootApp = parentData.rootApp = parentData.parentApp = createRootApp();

            mapper.add({
                [oneParamCrumb]:   oneParamRoute,
                [bothParamsCrumb]: bothParamsRoute,
                [addressCrumb]:    addressRoute,
                [outletCrumb]:     outletRoute,
                [setupCrumb]:      setupRoute,
            }, parentData);

            let opts;

            oneParamSpy.should.have.been.calledOnce;
            opts = oneParamSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // MountMapper should make a shallow copy of
            // what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.params.sort();
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {},
                params: ['action', 'id'],
                setup: undefined,
            });

            bothParamsSpy.should.have.been.calledOnce;
            opts = bothParamsSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // MountMapper should make a shallow copy of
            // what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.params.sort();
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {},
                params: ['action', 'id'],
                setup: undefined,
            });

            addressSpy.should.have.been.calledOnce;
            opts = addressSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // MountMapper should make a shallow copy of
            // what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.params.sort();
            opts.should.deep.equal({
                rootApp,
                addresses: ['addressRoute'],
                outlets: {},
                params: ['action', 'id'],
                setup: undefined,
            });

            outletSpy.should.have.been.calledOnce;
            opts = outletSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // MountMapper should make a shallow copy of
            // what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.params.sort();
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {
                    first: parentData.outlets.first,
                    second: parentData.outlets.second,
                },
                params: ['action', 'id'],
                setup: undefined,
            });

            setupSpy.should.have.been.calledOnce;
            opts = setupSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // MountMapper should make a shallow copy of
            // what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.params.sort();
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {},
                params: ['action', 'id'],
                setup: 42,
            });

            oneParamSpy.restore();
            bothParamsSpy.restore();
            addressSpy.restore();
            outletSpy.restore();
            setupSpy.restore();
        });
    });
});
