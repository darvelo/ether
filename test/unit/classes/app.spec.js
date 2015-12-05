import App from '../../../src/classes/app';
import RootApp from '../../../src/classes/root-app';
import Expectable from '../../../src/classes/expectable';

let defaultOpts = {
    rootApp: new RootApp({}),
    addresses: [],
};

class TestApp extends App {
    expectedAddresses() {
        return [];
    }
}

describe('App', function() {
    describe('Constructor', () => {
        it('App is an instance of Expectable', () => {
            expect(new TestApp(defaultOpts)).to.be.an.instanceof(Expectable);
        });

        it('throws if not given a rootApp', () => {
            delete defaultOpts.rootApp;
            expect(() => new TestApp(defaultOpts)).to.throw(TypeError, 'App constructor was not given a reference to the Ether RootApp.');
        });

        it('adds itself to the RootApp\'s address registry', () => {
            class AppWithAddresses extends App { expectedAddresses() { return ['first', 'second']; } }
            let opts = {
                rootApp: new RootApp({}),
                addresses: ['first', 'second'],
            };
            let rootApp = opts.rootApp;
            opts.addresses.forEach(name => expect(rootApp._atAddress(name)).to.not.be.ok);
            let route = new AppWithAddresses(opts);
            opts.addresses.forEach(name => expect(rootApp._atAddress(name)).to.equal(route));
        });
    });
});
