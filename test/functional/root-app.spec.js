import App from '../../src/classes/app';
import RootApp from '../../src/classes/root-app';
import Outlet from '../../src/classes/outlet';
import MutableOutlet from '../../src/classes/mutable-outlet';

let defaultOpts = {
    outlets: {
        main: new MutableOutlet(document.createElement('div')),
    },
};

describe('RootApp Integration Tests', () => {
    describe('Addresses', () => {
        it('expects no addresses', () => {
            expect(() => new RootApp(defaultOpts)).to.not.throw();
            let cachedAddresses = defaultOpts.addresses;
            defaultOpts.addresses = ['addy'];
            expect(() => new RootApp(defaultOpts)).to.throw(Error, [
                'RootApp\'s received addresses ',
                    JSON.stringify(defaultOpts.addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(cachedAddresses),
                '.',
            ].join(''));
            defaultOpts.addresses = cachedAddresses;
        });
    });

    describe('Outlets', () => {
        it('expects an outlet called "main"', () => {
            let cachedOutlets = defaultOpts.outlets;
            defaultOpts.outlets = {};
            expect(() => new RootApp(defaultOpts)).to.throw(Error, [
                'RootApp\'s received outlets ',
                    JSON.stringify(Object.keys(defaultOpts.outlets).sort()),
                ' did not match its expected outlets ',
                    JSON.stringify(RootApp.prototype.expectedOutlets()),
                '.',
            ].join(''));
            defaultOpts.outlets = cachedOutlets;
        });
    });
});
