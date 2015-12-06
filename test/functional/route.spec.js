import RootApp from '../../src/classes/root-app';
import Route from '../../src/classes/route';
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

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe('Route Integration Tests', () => {
    describe('Addresses', () => {
        it('expects no addresses', () => {
            expect(() => new TestRoute(defaultOpts)).to.not.throw();
            let cachedAddresses = defaultOpts.addresses;
            defaultOpts.addresses = ['addy'];
            expect(() => new TestRoute(defaultOpts)).to.throw(Error, [
                'TestRoute\'s received addresses ',
                    JSON.stringify(defaultOpts.addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(cachedAddresses),
                '.',
            ].join(''));
            defaultOpts.addresses = cachedAddresses;
        });
    });

    describe('Outlets', () => {
        it('does not implement expectedOutlets', () => {
            expect(() => new Route(defaultOpts)).to.throw(Error, 'Route did not implement expectedOutlets().');
        });
    });
});
