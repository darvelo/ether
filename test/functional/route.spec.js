import RootApp from '../../src/classes/root-app';
import Route from '../../src/classes/route';
import MutableOutlet from '../../src/classes/mutable-outlet';

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe('Route Functional Tests', () => {
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
            params: [],
        };
    });

    describe('Addresses', () => {
        it('expects no addresses', () => {
            expect(() => new TestRoute(defaultOpts)).to.not.throw();
            let expectedAddresses = TestRoute.prototype.expectedAddresses();
            defaultOpts.addresses = ['addy'];
            expect(() => new TestRoute(defaultOpts)).to.throw(Error, [
                'TestRoute\'s received addresses ',
                    JSON.stringify(defaultOpts.addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(expectedAddresses),
                '.',
            ].join(''));
        });
    });

    describe('Outlets', () => {
        it('does not implement expectedOutlets()', () => {
            expect(() => new Route(defaultOpts)).to.throw(Error, 'Route did not implement expectedOutlets().');
        });
    });
});
