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
    });
});
