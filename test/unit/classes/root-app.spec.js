import RootApp from '../../../src/classes/root-app';
import App from '../../../src/classes/app';
import Route from '../../../src/classes/route';
import Expectable from '../../../src/classes/expectable';
import Outlet from '../../../src/classes/outlet';
import MutableOutlet from '../../../src/classes/mutable-outlet';

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

describe('RootApp', () => {
    let defaultOpts;
    let childOpts;

    beforeEach(() => {
        defaultOpts = {
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            }
        };

        childOpts = {
            addresses: [],
            outlets: {},
        };
    });

    describe('Constructor', () => {
        it('RootApp is an instance of App', () => {
            expect(new RootApp(defaultOpts)).to.be.an.instanceof(App);
        });

        it('RootApp is an instance of Expectable', () => {
            expect(new RootApp(defaultOpts)).to.be.an.instanceof(Expectable);
        });

        it('adds itself to the RootApp\'s address registry', () => {
            class RootAppWithAddresses extends RootApp {
                expectedAddresses() {
                    return ['first', 'second'];
                }
            }
            defaultOpts.addresses = ['first', 'second'];
            let rootApp = new RootAppWithAddresses(defaultOpts);
            defaultOpts.addresses.forEach(name => expect(rootApp._atAddress(name)).to.equal(rootApp));
        });
    });

    it('registers adresses on itself', () => {
        let rootApp = new RootApp(defaultOpts);
        childOpts.rootApp = rootApp;
        let route = new TestRoute(childOpts);
        expect(rootApp._atAddress('hello')).to.not.be.ok;
        rootApp._registerAddress('hello', route);
        expect(rootApp._atAddress('hello')).to.equal(route);
    });

    it('throws on registering an address that is already taken', () => {
        let rootApp = new RootApp(defaultOpts);
        childOpts.rootApp = rootApp;
        rootApp._registerAddress('hello', new TestApp(childOpts));
        expect(() => rootApp._registerAddress('hello', new TestRoute(childOpts))).to.throw(Error, 'RootApp address "hello" already taken. Could not register the address for TestRoute');
    });

    it('throws on registering an address if the dest is not an App or Route instance', () => {
        let rootApp = new RootApp(defaultOpts);
        childOpts.rootApp = rootApp;
        expect(() => rootApp._registerAddress('hello', {})).to.throw(TypeError, 'RootApp cannot register an address for a non-App/non-Route instance, Object.');
        expect(() => rootApp._registerAddress('hello', new TestApp(childOpts))).to.not.throw();
        expect(() => rootApp._registerAddress('hello2', new TestRoute(childOpts))).to.not.throw();
    });

    it('stores passed-in outlets, allowing MutableOutlets', () => {
        class RootAppWithOutlets extends RootApp {
            expectedOutlets() {
                return ['first', 'second'];
            }
        }
        let firstOutlet = new MutableOutlet(document.createElement('div'));
        let secondOutlet = new MutableOutlet(document.createElement('div'));
        defaultOpts.outlets = {
            first: firstOutlet,
            second: secondOutlet,
        };
        let rootApp = new RootAppWithOutlets(defaultOpts);
        expect(rootApp).to.have.property('outlets');
        expect(rootApp.outlets).to.be.an('object');
        expect(rootApp.outlets.first).to.equal(firstOutlet);
        expect(rootApp.outlets.second).to.equal(secondOutlet);
    });
});
