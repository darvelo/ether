import App from '../../../src/classes/app';
import RootApp from '../../../src/classes/root-app';
import Expectable from '../../../src/classes/expectable';
import Outlet from '../../../src/classes/outlet';
import MutableOutlet from '../../../src/classes/mutable-outlet';

let defaultOpts = {
    rootApp: new RootApp({
        outlets: {
            main: new MutableOutlet(document.createElement('div')),
        },
    }),
    addresses: [],
    outlets: {},
};

class TestApp extends App {
    expectedAddresses() {
        return [];
    }
    expectedOutlets() {
        return [];
    }
}

describe('App', function() {
    describe('Constructor', () => {
        it('App is an instance of Expectable', () => {
            expect(new TestApp(defaultOpts)).to.be.an.instanceof(Expectable);
        });

        it('throws if not given a rootApp', () => {
            let cachedRootApp = defaultOpts.rootApp;
            delete defaultOpts.rootApp;
            expect(() => new TestApp(defaultOpts)).to.throw(TypeError, 'App constructor was not given a reference to the Ether RootApp.');
            defaultOpts.rootApp = cachedRootApp;
        });

        it('adds itself to the RootApp\'s address registry', () => {
            class AppWithAddresses extends App {
                expectedAddresses() {
                    return ['first', 'second'];
                }
                expectedOutlets() {
                    return [];
                }
            }
            let { rootApp, addresses: cachedAddresses } = defaultOpts;
            defaultOpts.addresses = ['first', 'second'];
            defaultOpts.addresses.forEach(name => expect(rootApp._atAddress(name)).to.not.be.ok);
            let app = new AppWithAddresses(defaultOpts);
            defaultOpts.addresses.forEach(name => expect(rootApp._atAddress(name)).to.equal(app));
            defaultOpts.addresses = cachedAddresses;
        });
    });
});
