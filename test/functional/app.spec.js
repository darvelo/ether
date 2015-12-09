import App from '../../src/classes/app';
import RootApp from '../../src/classes/root-app';
import MutableOutlet from '../../src/classes/mutable-outlet';
import Route from '../../src/classes/route';

class TestApp extends App {
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
        it('throws if mount() does not return an object', () => {
            class MyApp extends TestApp {
                mount() {
                    return null;
                }
            }
            expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp#mount() did not return an object.');
        });

        it('throws if mountConditionals() does not return an object', () => {
            class MyApp extends TestApp {
                mountConditionals() {
                    return null;
                }
            }
            expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp#mountConditionals() did not return an object.');
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

        it('throws if any conditional mount is not an instance of Route', () => {
            class MyApp extends TestApp {
                mountConditionals() {
                    return {
                        'abc': App,
                    };
                }
            }
            expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp conditional mount "abc" is not an instance of Route.');
        });

        it.skip('throws if a conditional mount\'s address-based id cannot be parsed');
        it.skip('throws if any conditional mount\'s id requires a mount with an address that the App did not register');

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
