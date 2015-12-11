import RootApp from '../../src/classes/root-app';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import MutableOutlet from '../../src/classes/mutable-outlet';
import Outlet from '../../src/classes/outlet';

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

describe('RootApp Functional Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        };
    });

    describe('Addresses', () => {
        it('expects no addresses', () => {
            expect(() => new RootApp(defaultOpts)).to.not.throw();
            let expectedAddresses = RootApp.prototype.expectedAddresses();
            defaultOpts.addresses = ['addy'];
            expect(() => new RootApp(defaultOpts)).to.throw(Error, [
                'RootApp\'s received addresses ',
                    JSON.stringify(defaultOpts.addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(expectedAddresses),
                '.',
            ].join(''));
        });
    });

    describe('Outlets', () => {
        it('expects an outlet called "main"', () => {
            let expectedOutlets = RootApp.prototype.expectedOutlets();
            defaultOpts.outlets = {};
            expect(() => new RootApp(defaultOpts)).to.throw(Error, [
                'RootApp\'s received outlets ',
                    JSON.stringify(Object.keys(defaultOpts.outlets).sort()),
                ' did not match its expected outlets ',
                    JSON.stringify(expectedOutlets),
                '.',
            ].join(''));
        });
    });

    describe('Mounting', () => {
        describe('Normal Mounts', () => {
            it('throws if mount() does not return an object', () => {
                class MyApp extends RootApp {
                    mount() {
                        return null;
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp#mount() did not return an object.');
            });

            it('throws if any normal mount is not an instance of App or Route', () => {
                class MyApp extends RootApp {
                    mount() {
                        return {
                            'abc': function(){},
                        };
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp mount "abc" is not an instance of App or Route.');
            });

            it('throws if a mount\'s params overlap the parent\'s params', () => {
                class ParamRoute extends TestRoute {
                    expectedParams() {
                        return ['id'];
                    }
                }
                class ChildApp extends TestApp {
                    expectedParams() {
                        return ['id'];
                    }
                    mount() {
                        return {
                            '/xyz/{id=\\w+}': ParamRoute,
                        };
                    }
                }
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            '/abc/{id=\\w+}': ChildApp,
                        };
                    }
                }
                expect(() => new MyRootApp(defaultOpts)).to.throw(Error, 'ChildApp mount on "/xyz/{id=\\\\w+}" declares parameter(s) that were already declared higher in the App chain: ["id"].');
            });
        });

        describe('Conditional Mounts', () => {
            it('throws if mountConditionals() does not return an object', () => {
                class MyApp extends RootApp {
                    mountConditionals() {
                        return null;
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp#mountConditionals() did not return an object.');
            });

            it.skip('throws if a conditional mount\'s address-based id cannot be parsed');
            it.skip('throws if any conditional mount\'s id requires a mount with an address that the RootApp did not register');

            it('throws if any conditional mount is not an instance of Route', () => {
                class AddressRoute extends TestRoute {
                    expectedAddresses() {
                        return ['abc'];
                    }
                }
                class MyApp extends RootApp {
                    mount() {
                        return {
                            '/route': AddressRoute.addresses('abc'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '!abc': App,
                        };
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp conditional mount "!abc" is not an instance of Route or an array of Route instances.');
            });

            it('allows an array of routes', () => {
                class AddressRoute extends TestRoute { expectedAddresses() { return ['addy']; } }
                class AddressRouteTwo extends TestRoute { expectedAddresses() { return ['addy2']; } }
                class AddressRouteABC extends TestRoute { expectedAddresses() { return ['abc']; } }
                class AddressRouteXYZ extends TestRoute { expectedAddresses() { return ['xyz']; } }
                class NoOutletRoute extends Route { expectedOutlets() { return []; } }
                class OutletRoute extends Route {
                    expectedAddresses() { return ['out']; }
                    expectedOutlets() { return ['out']; }
                }
                class MyRootApp extends RootApp {
                    createOutlets(outlets) {
                        outlets.out = new MutableOutlet(document.createElement('div'));
                        return outlets;
                    }
                    mount() {
                        return {
                            'abc': AddressRouteABC.addresses('abc'),
                            'xyz': AddressRouteXYZ.addresses('xyz'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': [AddressRoute.addresses('addy'), OutletRoute.outlets('out').addresses('out')],
                            '+abc,xyz': [NoOutletRoute, AddressRouteTwo.addresses('addy2')],
                            '!xyz': [NoOutletRoute, NoOutletRoute],
                        };
                    }
                }
                let rootApp;
                expect(() => rootApp = new MyRootApp(defaultOpts)).to.not.throw();
                expect(rootApp._atAddress('addy')).to.be.an.instanceof(AddressRoute);
                expect(rootApp._atAddress('addy2')).to.be.an.instanceof(AddressRouteTwo);
                expect(rootApp._atAddress('out')).to.have.property('outlets');
                expect(rootApp._atAddress('out').outlets).to.have.property('out');
                expect(rootApp._atAddress('out').outlets.out).to.be.an.instanceof(Outlet);
            });

            it('throws if any of the items an the array is not an instance of Route', () => {
                class NoOutletRoute extends Route { expectedOutlets() { return []; } }
                class MyRootApp extends RootApp {
                    mountConditionals() {
                        return {
                            '*': [NoOutletRoute, App],
                        };
                    }
                }
                expect(() => new MyRootApp(defaultOpts)).to.throw(TypeError, 'MyRootApp conditional mount "*" is not an instance of Route or an array of Route instances.');
            });

            it('throws if a required address was not created during mount()', () => {
                class AddressConditionalRoute extends TestRoute {
                    expectedAddresses() {
                        return ['four'];
                    }
                }
                class AddressRoute extends TestRoute {
                    expectedAddresses() {
                        return ['three'];
                    }
                }
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            '/xyz': AddressRoute.addresses('three'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '+one,two,three,four': TestRoute,
                            '!one': AddressConditionalRoute.addresses('four'),
                        };
                    }
                }
                expect(() => new MyRootApp(defaultOpts)).to.throw(Error, 'MyRootApp#mountConditionals() requires addresses that are not created in MyRootApp#mount(): ["four","one","two"].');
            });
        });

        describe('Outlets', () => {
            it('throws if any mount requests an outlet that the RootApp does not own', () => {
                class MyApp extends RootApp {
                    mount() {
                        return {
                            'abc': App.outlets('something', 'more'),
                        };
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(Error, 'MyApp mount "abc" requested these outlets that MyApp does not own: ["something","more"].');
            });

            it('throws if any conditional mount requests an outlet that the RootApp does not own', () => {
                class AddressApp extends App {
                    expectedAddresses() {
                        return ['anApp'];
                    }
                    expectedOutlets() {
                        return [];
                    }
                }
                class MyApp extends RootApp {
                    mount() {
                        return {
                            '/app': AddressApp.addresses('anApp'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '+anApp': Route.outlets('something', 'more'),
                        };
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(Error, 'MyApp conditional mount "+anApp" requested these outlets that MyApp does not own: ["something","more"].');
            });
        });
    });
});
