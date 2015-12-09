import App from '../../src/classes/app';
import RootApp from '../../src/classes/root-app';
import MutableOutlet from '../../src/classes/mutable-outlet';

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
    });
});
