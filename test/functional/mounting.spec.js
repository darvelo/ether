import App from '../../src/classes/app';
import RootApp from '../../src/classes/root-app';
import Route from '../../src/classes/route';
import Outlet from '../../src/classes/outlet';
import MutableOutlet from '../../src/classes/mutable-outlet';

class TestApp extends App {
    expectedOutlets() {
        return [];
    }
}

describe('Mounting Functional Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            rootApp: true,
            addresses: [],
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        };
    });

    describe('Child Instantiation', () => {
        describe('Addresses', () => {
            it('registers addresses of child routes and apps', () => {
                class NoOutletApp extends App { expectedOutlets() { return []; } }
                class NoOutletRoute extends Route { expectedOutlets() { return []; } }
                class ChildApp extends NoOutletApp {
                    expectedAddresses() {
                        return ['sameApp', 'anApp'];
                    }
                }
                class ChildRoute extends NoOutletRoute {
                    expectedAddresses() {
                        return ['sameRoute', 'aRoute'];
                    }
                }
                class ChildConditionalRoute extends NoOutletRoute {
                    expectedAddresses() {
                        return ['starRoute', 'conditional'];
                    }
                }
                class AddressApp extends NoOutletApp {
                    expectedAddresses() {
                        return ['addressApp'];
                    }
                    mount() {
                        return {
                            'abc': ChildApp.addresses('anApp', 'sameApp'),
                            'xyz': ChildRoute.addresses('aRoute', 'sameRoute'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': ChildConditionalRoute.addresses('conditional', 'starRoute'),
                        };
                    }
                }
                class AddressRoute extends NoOutletRoute {
                    expectedAddresses() {
                        return ['addressRoute'];
                    }
                }
                class AddressConditionalRoute extends NoOutletRoute {
                    expectedAddresses() {
                        return ['addressConditionalRoute'];
                    }
                }
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            '123': AddressApp.addresses('addressApp'),
                            '456': AddressRoute.addresses('addressRoute'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': AddressConditionalRoute.addresses('addressConditionalRoute'),
                        };
                    }
                }
                let rootApp = new MyRootApp(defaultOpts);
                expect(rootApp._atAddress('addressApp')).to.be.an.instanceof(AddressApp);
                expect(rootApp._atAddress('addressRoute')).to.be.an.instanceof(AddressRoute);
                expect(rootApp._atAddress('addressConditionalRoute')).to.be.an.instanceof(AddressConditionalRoute);
                expect(rootApp._atAddress('anApp')).to.equal(rootApp._atAddress('sameApp'));
                expect(rootApp._atAddress('anApp')).to.be.an.instanceof(ChildApp);
                expect(rootApp._atAddress('aRoute')).to.equal(rootApp._atAddress('sameRoute'));
                expect(rootApp._atAddress('aRoute')).to.be.an.instanceof(ChildRoute);
                expect(rootApp._atAddress('conditional')).to.equal(rootApp._atAddress('starRoute'));
                expect(rootApp._atAddress('conditional')).to.be.an.instanceof(ChildConditionalRoute);
            });
        });

        describe('Outlets', () => {
            it('passes outlets to child routes and apps', () => {
                // we'll need to use addresses to get
                // references to the actual App/Route instances
                //
                // we'll also need references to the outlets to
                // check that they're assigned to the right Apps/Routes
                let outlet1_1 = new Outlet(document.createElement('div'));
                let outlet1_2 = new Outlet(document.createElement('div'));
                let outlet2_1 = new Outlet(document.createElement('div'));
                let outlet2_2 = new Outlet(document.createElement('div'));
                let outlet3_1 = new Outlet(document.createElement('div'));
                let outlet3_2 = new Outlet(document.createElement('div'));
                let outlet4_1 = new Outlet(document.createElement('div'));
                let outlet4_2 = new Outlet(document.createElement('div'));
                let outlet5_1 = new Outlet(document.createElement('div'));
                let outlet5_2 = new Outlet(document.createElement('div'));
                let outlet6_1 = new Outlet(document.createElement('div'));
                let outlet6_2 = new Outlet(document.createElement('div'));
                defaultOpts.outlets['1_1'] = outlet1_1;

                class MyRootApp extends RootApp {
                    expectedOutlets() {
                        return ['main', '1_1'];
                    }
                    createOutlets(outlets) {
                        expect(outlets['1_1']).to.equal(outlet1_1);
                        outlets['1_2'] = outlet1_2;
                        outlets['2_1'] = outlet2_1;
                        outlets['2_2'] = outlet2_2;
                        outlets['3_1'] = outlet3_1;
                        outlets['3_2'] = outlet3_2;
                        outlets['4_1'] = outlet4_1;
                        outlets['4_2'] = outlet4_2;
                        outlets['5_1'] = outlet5_1;
                        outlets['5_2'] = outlet5_2;
                        outlets['6_1'] = outlet6_1;
                        outlets['6_2'] = outlet6_2;
                        return outlets;
                    }
                    mount() {
                        return {
                            '123': OutletApp.addresses('1').outlets('1_1', '1_2', '4_1', '4_2', '5_1', '5_2', '6_1', '6_2'),
                            '456': OutletRoute.addresses('2').outlets('2_1', '2_2'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': OutletConditionalRoute.addresses('3').outlets('3_1', '3_2'),
                        };
                    }
                }
                class OutletApp extends App {
                    expectedAddresses() {
                        return ['1'];
                    }
                    expectedOutlets() {
                        return ['1_1', '1_2', '4_1', '4_2', '5_1', '5_2', '6_1', '6_2'];
                    }
                    createOutlets(outlets) {
                        // outlets are inherited from parent app
                        // so we don't need to do anything here
                        return outlets;
                    }
                    mount() {
                        return {
                            'abc': ChildApp.addresses('4').outlets('4_1', '4_2'),
                            'xyz': ChildRoute.addresses('5').outlets('5_1', '5_2'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': ChildConditionalRoute.addresses('6').outlets('6_1', '6_2'),
                        };
                    }
                }
                // createOutlets() defaults to returning the inherited outlets,
                // so for the rest of these, no explicit outlet assignments need to be done
                class OutletRoute extends Route {
                    expectedAddresses() {
                        return ['2'];
                    }
                    expectedOutlets() {
                        return ['2_1', '2_2'];
                    }
                }
                class OutletConditionalRoute extends Route {
                    expectedAddresses() {
                        return ['3'];
                    }
                    expectedOutlets() {
                        return ['3_1', '3_2'];
                    }
                }
                class ChildApp extends App {
                    expectedAddresses() {
                        return ['4'];
                    }
                    expectedOutlets() {
                        return ['4_1', '4_2'];
                    }
                }
                class ChildRoute extends Route {
                    expectedAddresses() {
                        return ['5'];
                    }
                    expectedOutlets() {
                        return ['5_1', '5_2'];
                    }
                }
                class ChildConditionalRoute extends Route {
                    expectedAddresses() {
                        return ['6'];
                    }
                    expectedOutlets() {
                        return ['6_1', '6_2'];
                    }
                }
                let rootApp = new MyRootApp(defaultOpts);
                expect(rootApp._atAddress('1')).to.be.an.instanceof(OutletApp);
                expect(rootApp._atAddress('1').outlets).to.deep.equal({
                    '1_1': outlet1_1,
                    '1_2': outlet1_2,
                    '4_1': outlet4_1,
                    '4_2': outlet4_2,
                    '5_1': outlet5_1,
                    '5_2': outlet5_2,
                    '6_1': outlet6_1,
                    '6_2': outlet6_2,
                });
                expect(rootApp._atAddress('2')).to.be.an.instanceof(OutletRoute);
                expect(rootApp._atAddress('2').outlets).to.deep.equal({
                    '2_1': outlet2_1,
                    '2_2': outlet2_2,
                });
                expect(rootApp._atAddress('3')).to.be.an.instanceof(OutletConditionalRoute);
                expect(rootApp._atAddress('3').outlets).to.deep.equal({
                    '3_1': outlet3_1,
                    '3_2': outlet3_2,
                });
                expect(rootApp._atAddress('4')).to.be.an.instanceof(ChildApp);
                expect(rootApp._atAddress('4').outlets).to.deep.equal({
                    '4_1': outlet4_1,
                    '4_2': outlet4_2,
                });
                expect(rootApp._atAddress('5')).to.be.an.instanceof(ChildRoute);
                expect(rootApp._atAddress('5').outlets).to.deep.equal({
                    '5_1': outlet5_1,
                    '5_2': outlet5_2,
                });
                expect(rootApp._atAddress('6')).to.be.an.instanceof(ChildConditionalRoute);
                expect(rootApp._atAddress('6').outlets).to.deep.equal({
                    '6_1': outlet6_1,
                    '6_2': outlet6_2,
                });
            });
        });
    });
});
