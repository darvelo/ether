import RootApp from '../../../src/classes/root-app';
import App from '../../../src/classes/app';
import Route from '../../../src/classes/route';

class TestApp extends App { }
class TestRoute extends Route { }

describe('RootApp', () => {
    describe('Constructor', () => {
        it('throws if not passed an options object', () => {
            expect(() => new RootApp()).to.throw(TypeError, 'RootApp was not given an options object.');
        });
    });

    it('registers adresses on itself', () => {
        let route = new TestRoute({});
        let rootApp = new RootApp({});
        expect(rootApp._atAddress('hello')).to.not.be.ok;
        rootApp._registerAddress('hello', route);
        expect(rootApp._atAddress('hello')).to.equal(route);
    });

    it('throws on registering an address that is already taken', () => {
        let rootApp = new RootApp({});
        let opts = {rootApp: rootApp};
        rootApp._registerAddress('hello', new TestApp(opts));
        expect(() => rootApp._registerAddress('hello', new TestRoute(opts))).to.throw(Error, 'RootApp address "hello" already taken. Could not register the address for TestRoute');
    });

    it('throws on registering an address if the dest is not an App or Route instance', () => {
        let rootApp = new RootApp({});
        let opts = {rootApp: rootApp};
        expect(() => rootApp._registerAddress('hello', {})).to.throw(TypeError, 'RootApp cannot register an address for a non-App/non-Route instance, Object.');
        expect(() => rootApp._registerAddress('hello', new TestApp(opts))).to.not.throw();
        expect(() => rootApp._registerAddress('hello2', new TestRoute(opts))).to.not.throw();
    });
});
