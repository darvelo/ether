import RootApp from '../../../src/classes/root-app';
import App from '../../../src/classes/app';
import Route from '../../../src/classes/route';
import Expectable from '../../../src/classes/expectable';

let defaultOpts = {
    rootApp: true,
};

class TestApp extends App {
    expectedAddresses() {
        return [];
    }
}

class TestRoute extends Route {
    expectedAddresses() {
        return [];
    }
}

describe('RootApp', () => {
    describe('Constructor', () => {
        it('RootApp is an instance of App', () => {
            expect(new RootApp(defaultOpts)).to.be.an.instanceof(App);
        });

        it('RootApp is an instance of Expectable', () => {
            expect(new RootApp(defaultOpts)).to.be.an.instanceof(Expectable);
        });

        it('adds itself to the RootApp\'s address registry', () => {
            class AppWithAddresses extends RootApp { expectedAddresses() { return ['first', 'second']; } }
            let opts = {
                rootApp: true,
                addresses: ['first', 'second'],
            };
            let rootApp = new AppWithAddresses(opts);
            opts.addresses.forEach(name => expect(rootApp._atAddress(name)).to.equal(rootApp));
        });
    });

    it('registers adresses on itself', () => {
        let rootApp = new RootApp(defaultOpts);
        let childOpts = {
            rootApp,
            addresses: [],
        };
        let route = new TestRoute(childOpts);
        expect(rootApp._atAddress('hello')).to.not.be.ok;
        rootApp._registerAddress('hello', route);
        expect(rootApp._atAddress('hello')).to.equal(route);
    });

    it('throws on registering an address that is already taken', () => {
        let rootApp = new RootApp(defaultOpts);
        let childOpts = {
            rootApp,
            addresses: [],
        };
        rootApp._registerAddress('hello', new TestApp(childOpts));
        expect(() => rootApp._registerAddress('hello', new TestRoute(childOpts))).to.throw(Error, 'RootApp address "hello" already taken. Could not register the address for TestRoute');
    });

    it('throws on registering an address if the dest is not an App or Route instance', () => {
        let rootApp = new RootApp(defaultOpts);
        let childOpts = {
            rootApp,
            addresses: [],
        };
        expect(() => rootApp._registerAddress('hello', {})).to.throw(TypeError, 'RootApp cannot register an address for a non-App/non-Route instance, Object.');
        expect(() => rootApp._registerAddress('hello', new TestApp(childOpts))).to.not.throw();
        expect(() => rootApp._registerAddress('hello2', new TestRoute(childOpts))).to.not.throw();
    });
});
