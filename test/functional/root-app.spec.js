import RootApp from '../../src/classes/root-app';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import MutableOutlet from '../../src/classes/mutable-outlet';

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
        it('throws if mount() does not return an object', () => {
            class MyApp extends RootApp {
                mount() {
                    return null;
                }
            }
            expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp#mount() did not return an object.');
        });

        it('throws if mountConditionals() does not return an object', () => {
            class MyApp extends RootApp {
                mountConditionals() {
                    return null;
                }
            }
            expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp#mountConditionals() did not return an object.');
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

        it('throws if any conditional mount is not an instance of Route', () => {
            class MyApp extends RootApp {
                mountConditionals() {
                    return {
                        'abc': App,
                    };
                }
            }
            expect(() => new MyApp(defaultOpts)).to.throw(TypeError, 'MyApp conditional mount "abc" is not an instance of Route.');
        });

        it.skip('throws if a conditional mount\'s address-based id cannot be parsed');
        it.skip('throws if any conditional mount\'s id requires a mount with an address that the RootApp did not register');

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
