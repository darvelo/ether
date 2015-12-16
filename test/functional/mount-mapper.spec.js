import MountMapper from '../../src/classes/mount-mapper';
import Route from '../../src/classes/route';
import Outlet from '../../src/classes/outlet';
import RootApp from '../../src/classes/root-app';

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
        it('calls create() on each mount instance with the proper options', () => {
            class ParamRoute extends TestRoute {
                expectedParams() {
                    return ['id', 'action'];
                }
            }
            class AddressesRoute extends ParamRoute {
                expectedAddresses() {
                    return ['addressRoute'];
                }
                addressesHandlers() {
                    return [function(){}];
                }
            }
            class OutletRoute extends ParamRoute {
                expectedOutlets() {
                    return ['first', 'second'];
                }
            }
            class SetupRoute extends ParamRoute {
                init(setup, ...args) {
                    super.init(setup, ...args);
                    this.setup = setup;
                }
            }
            let paramRoute   = ParamRoute;
            let paramSpy     = sinon.spy(paramRoute, 'create');
            let paramCrumb   = '/param/{action=\\w+}/';

            let addressRoute = AddressesRoute.addresses('addressRoute');
            let addressSpy   = sinon.spy(addressRoute, 'create');
            let addressCrumb = '/address/{action=\\w+}/';

            let outletRoute  = OutletRoute.outlets('first', 'second');
            let outletSpy    = sinon.spy(outletRoute, 'create');
            let outletCrumb  = '/outlet/{action=\\w+}/';

            let setupRoute   = SetupRoute.setup(function() { return 42; });
            let setupSpy     = sinon.spy(setupRoute, 'create');
            let setupCrumb   = '/setup/{action=\\w+}/';

            let parentData = {
                outlets: {
                    first:  new Outlet(document.createElement('div')),
                    second: new Outlet(document.createElement('div')),
                    unused: new Outlet(document.createElement('div')),
                },
                params: ['id'],
            };

            let rootApp = parentData.rootApp = parentData.parentApp = createRootApp();

            mapper.add(paramCrumb,   paramRoute,   parentData);
            mapper.add(addressCrumb, addressRoute, parentData);
            mapper.add(outletCrumb,  outletRoute,  parentData);
            mapper.add(setupCrumb,   setupRoute,   parentData);

            let opts;

            paramSpy.should.have.been.calledOnce;
            opts = paramSpy.getCall(0).args[0];
            // we need an explicit equals here to make sure it's an
            // exact reference match and not a deep equals match
            expect(opts.rootApp).to.equal(rootApp);
            // MountMapper should make a shallow copy of
            // what it needs from parent's data
            expect(opts.outlets).to.not.equal(parentData.outlets);
            expect(opts.params).to.not.equal(parentData.params);
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {},
                params: ['id', 'action'],
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
            opts.should.deep.equal({
                rootApp,
                addresses: ['addressRoute'],
                outlets: {},
                params: ['id', 'action'],
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
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {
                    first: parentData.outlets.first,
                    second: parentData.outlets.second,
                },
                params: ['id', 'action'],
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
            opts.should.deep.equal({
                rootApp,
                addresses: [],
                outlets: {},
                params: ['id', 'action'],
                setup: 42,
            });

            paramSpy.restore();
            addressSpy.restore();
            outletSpy.restore();
            setupSpy.restore();
        });
    });
});
