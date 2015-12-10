import App from '../../src/classes/app';
import RootApp from '../../src/classes/root-app';
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

describe('App Functional Tests', () => {
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
            params: [],
        };
    });

    describe('Addresses', () => {
        it('expects no addresses', () => {
            expect(() => new TestApp(defaultOpts)).to.not.throw();
            let expectedAddresses = TestApp.prototype.expectedAddresses();
            defaultOpts.addresses = ['addy'];
            expect(() => new TestApp(defaultOpts)).to.throw(Error, [
                'TestApp\'s received addresses ',
                    JSON.stringify(defaultOpts.addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(expectedAddresses),
                '.',
            ].join(''));
        });
    });

    describe('Outlets', () => {
        it('does not implement expectedOutlets()', () => {
            expect(() => new App(defaultOpts)).to.throw(Error, 'App did not implement expectedOutlets().');
        });
    });

    describe('Mounting', () => {
        describe('Normal Routes', () => {
            it('throws if mount() does not return an object', () => {
                class MyApp extends TestApp {
                    mount() {
                        return null;
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp#mount() did not return an object.');
            });

            it('throws if any normal mount is not an instance of App or Route', () => {
                class MyApp extends TestApp {
                    mount() {
                        return {
                            'abc': function(){},
                        };
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp mount "abc" is not an instance of App or Route.');
            });
        });

        describe('Conditional Routes', () => {
            it('throws if mountConditionals() does not return an object', () => {
                class MyApp extends TestApp {
                    mountConditionals() {
                        return null;
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp#mountConditionals() did not return an object.');
            });

            it.skip('throws if a conditional mount\'s key cannot be parsed');
            it.skip('throws if any conditional mount\'s key requires a mount with an address that the App did not register');

            it('throws if any conditional mount is not an instance of Route', () => {
                class MyApp extends TestApp {
                    mountConditionals() {
                        return {
                            'abc': App,
                        };
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp conditional mount "abc" is not an instance of Route or an array of Route instances.');
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
                class MyApp extends TestApp {
                    createOutlets() {
                        return {
                            out: new MutableOutlet(document.createElement('div')),
                        };
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
                let rootApp = defaultOpts.rootApp;
                let app;
                expect(() => app = new MyApp(defaultOpts)).to.not.throw();
                expect(rootApp._atAddress('addy')).to.be.an.instanceof(AddressRoute);
                expect(rootApp._atAddress('addy2')).to.be.an.instanceof(AddressRouteTwo);
                expect(rootApp._atAddress('out')).to.have.property('outlets');
                expect(rootApp._atAddress('out').outlets).to.have.property('out');
                expect(rootApp._atAddress('out').outlets.out).to.be.an.instanceof(Outlet);
            });

            it('throws if any of the items an the array is not an instance of Route', () => {
                class NoOutletRoute extends Route { expectedOutlets() { return []; } }
                class MyApp extends TestApp {
                    mountConditionals() {
                        return {
                            '*': [NoOutletRoute, App],
                        };
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp conditional mount "*" is not an instance of Route or an array of Route instances.');
            });
        });

        describe('Outlets', () => {
            it('throws if any mount requests an outlet that the App does not own', () => {
                class MyApp extends TestApp {
                    mount() {
                        return {
                            'abc': App.outlets('something', 'more'),
                        };
                    }
                }
                expect(() => new MyApp(defaultOpts)).to.throw(Error, 'MyApp mount "abc" requested these outlets that MyApp does not own: ["something","more"].');
            });

            it('throws if any conditional mount requests an outlet that the App does not own', () => {
                class AddressApp extends TestApp {
                    expectedAddresses() {
                        return ['anApp'];
                    }
                }
                class MyApp extends TestApp {
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
