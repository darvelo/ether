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

describe('Routing Functional Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            rootApp: new RootApp({
                outlets: {
                    main: new MutableOutlet(document.createElement('div')),
                },
            }),
            addresses: [],
            outlets: {},
        };
    });

    describe('Child Instantiation', () => {
        it('only allows instances of App or Route to be mounted');

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
                class AddressTestApp extends NoOutletApp {
                    route() {
                        return {
                            'abc': ChildApp.addresses('anApp', 'sameApp'),
                            'xyz': ChildRoute.addresses('aRoute', 'sameRoute'),
                        };
                    }
                    routeConditionally() {
                        return {
                            '*': ChildConditionalRoute.addresses('conditional', 'starRoute'),
                        };
                    }
                }
                let app = new AddressTestApp(defaultOpts);
                let rootApp = defaultOpts.rootApp;
                expect(rootApp._atAddress('anApp')).to.equal(rootApp._atAddress('sameApp'));
                expect(rootApp._atAddress('anApp')).to.be.an.instanceof(ChildApp);
                expect(rootApp._atAddress('aRoute')).to.equal(rootApp._atAddress('sameRoute'));
                expect(rootApp._atAddress('aRoute')).to.be.an.instanceof(ChildRoute);
                // expect(rootApp._atAddress('conditional')).to.equal(rootApp._atAddress('starRoute'));
                // expect(rootApp._atAddress('conditional')).to.be.an.instanceof(ChildConditionalRoute);
            });
        });
    });
});
