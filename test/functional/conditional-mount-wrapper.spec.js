import ConditionalMountMapper from '../../src/classes/conditional-mount-mapper';
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

describe('ConditionalMountMapper', () => {
    let mapper, addresses;

    beforeEach(() => {
        mapper = new ConditionalMountMapper();
        addresses = ['first', 'second', 'third'];
        mapper.setAddresses(addresses);
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
                    return ['fourth'];
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
            let mounts = [
                ParamRoute,
                AddressesRoute.addresses('fourth'),
                OutletRoute.outlets('first', 'second'),
                SetupRoute.setup(function() { return 42; }),
            ];
            let [ paramSpy,
                  addressSpy,
                  outletSpy,
                  setupSpy ] = mounts.map(route => sinon.spy(route, 'create'));
            let parentData = {
                outlets: {
                    first: new Outlet(document.createElement('div')),
                    second: new Outlet(document.createElement('div')),
                    unused: new Outlet(document.createElement('div')),
                },
                params: ['id', 'action'],
            };

            // reset the rootApp on each call to add so
            // AddressesRoute addresses won't conflict
            let rootApps = [];

            // try with * logic
            parentData.rootApp = parentData.parentApp = createRootApp();
            rootApps.push(parentData.rootApp);
            mapper.add('*', mounts, parentData);
            // try with + logic
            parentData.rootApp = parentData.parentApp = createRootApp();
            rootApps.push(parentData.rootApp);
            mapper.add('+first', mounts, parentData);
            // try with ! logic
            parentData.rootApp = parentData.parentApp = createRootApp();
            rootApps.push(parentData.rootApp);
            mapper.add('!second', mounts, parentData);

            paramSpy.should.have.been.calledThrice;
            // sinon goes into an infinite loop if I use always.calledWith().
            // I think it's trying to do a deepEqual() on rootApp.
            // we must check each call's arguments manually
            [0,1,2].forEach(callNum => {
                let opts = paramSpy.getCall(callNum).args[0];
                // we need an explicit equals here to make sure it's an
                // exact reference match and not a deep equals match
                expect(opts.rootApp).to.equal(rootApps[callNum]);
                opts.should.deep.equal({
                    rootApp: rootApps[callNum],
                    addresses: [],
                    outlets: {},
                    params: ['id', 'action'],
                });
            });
            addressSpy.should.have.been.calledThrice;
            [0,1,2].forEach(callNum => {
                let opts = addressSpy.getCall(callNum).args[0];
                // we need an explicit equals here to make sure it's an
                // exact reference match and not a deep equals match
                expect(opts.rootApp).to.equal(rootApps[callNum]);
                opts.should.deep.equal({
                    rootApp: rootApps[callNum],
                    addresses: ['fourth'],
                    outlets: {},
                    params: ['id', 'action'],
                });
            });
            outletSpy.should.have.been.calledThrice;
            [0,1,2].forEach(callNum => {
                let opts = outletSpy.getCall(callNum).args[0];
                // we need an explicit equals here to make sure it's an
                // exact reference match and not a deep equals match
                expect(opts.rootApp).to.equal(rootApps[callNum]);
                opts.should.deep.equal({
                    rootApp: rootApps[callNum],
                    addresses: [],
                    outlets: {
                        first: parentData.outlets.first,
                        second: parentData.outlets.second,
                    },
                    params: ['id', 'action'],
                });
            });
            setupSpy.should.have.been.calledThrice;
            [0,1,2].forEach(callNum => {
                let opts = setupSpy.getCall(callNum).args[0];
                // we need an explicit equals here to make sure it's an
                // exact reference match and not a deep equals match
                expect(opts.rootApp).to.equal(rootApps[callNum]);
                opts.should.deep.equal({
                    rootApp: rootApps[callNum],
                    addresses: [],
                    outlets: {},
                    params: ['id', 'action'],
                    setup: 42,
                });
            });

            paramSpy.restore();
            addressSpy.restore();
            outletSpy.restore();
            setupSpy.restore();
        });
    });
});
