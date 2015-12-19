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
                    return ['first', 'second'];
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
                OutletRoute.outlets('first', 'second'),
                SetupRoute.setup(function() { return 42; }),
            ];
            let [ oneParamSpy,
                  bothParamsSpy,
                  addressSpy,
                  outletSpy,
                  setupSpy ] = mounts.map(route => sinon.spy(route, 'create'));
            let parentData = {
                outlets: {
                    first:  new Outlet(document.createElement('div')),
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

            oneParamSpy.should.have.been.calledThrice;
            // since we use a different rootApp for each call
            // we must check each call's arguments manually
            rootApps.forEach((rootApp, callNum) => {
                let opts = oneParamSpy.getCall(callNum).args[0];
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
            });

            bothParamsSpy.should.have.been.calledThrice;
            // since we use a different rootApp for each call
            // we must check each call's arguments manually
            rootApps.forEach((rootApp, callNum) => {
                let opts = bothParamsSpy.getCall(callNum).args[0];
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
            });

            addressSpy.should.have.been.calledThrice;
            // since we use a different rootApp for each call
            // we must check each call's arguments manually
            rootApps.forEach((rootApp, callNum) => {
                let opts = addressSpy.getCall(callNum).args[0];
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
            });

            outletSpy.should.have.been.calledThrice;
            // since we use a different rootApp for each call
            // we must check each call's arguments manually
            rootApps.forEach((rootApp, callNum) => {
                let opts = outletSpy.getCall(callNum).args[0];
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
                        first: parentData.outlets.first,
                        second: parentData.outlets.second,
                    },
                    params: ['id', 'action'],
                    setup: undefined,
                });
            });

            setupSpy.should.have.been.calledThrice;
            // since we use a different rootApp for each call
            // we must check each call's arguments manually
            rootApps.forEach((rootApp, callNum) => {
                let opts = setupSpy.getCall(callNum).args[0];
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
            });

            oneParamSpy.restore();
            bothParamsSpy.restore();
            addressSpy.restore();
            outletSpy.restore();
            setupSpy.restore();
        });
    });
});
