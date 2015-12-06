import App from '../../src/classes/app';
import RootApp from '../../src/classes/root-app';
import Outlet from '../../src/classes/outlet';
import MutableOutlet from '../../src/classes/mutable-outlet';

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
    expectedOutlets() {
        return [];
    }
}

describe('App Integration Tests', () => {
    describe('Addresses', () => {
        it('expects no addresses', () => {
            expect(() => new TestApp(defaultOpts)).to.not.throw();
            let cachedAddresses = defaultOpts.addresses;
            defaultOpts.addresses = ['addy'];
            expect(() => new TestApp(defaultOpts)).to.throw(Error, [
                'TestApp\'s received addresses ',
                    JSON.stringify(defaultOpts.addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(cachedAddresses),
                '.',
            ].join(''));
            defaultOpts.addresses = cachedAddresses;
        });
    });

    describe('Outlets', () => {
        it('does not implement expectedOutlets()', () => {
            expect(() => new App(defaultOpts)).to.throw(Error, 'App did not implement expectedOutlets().');
        });
    });
});
