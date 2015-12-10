import Expectable from '../../../src/classes/expectable';
import Outlet from '../../../src/classes/outlet';

class ExpectsAddresses extends Expectable {
    expectedAddresses() {
        return ['first', 'second'];
    }
}

class ExpectsAddressesOutlets extends ExpectsAddresses {
    expectedOutlets() {
        return ['first', 'second'];
    }
}

class ExpectsAddressesOutletsParams extends ExpectsAddressesOutlets {
    expectedParams() {
        return ['id', 'name'];
    }
}

class TestExpectable extends ExpectsAddressesOutletsParams { }

describe('Expectable', function() {
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            addresses: ['first', 'second'],
            outlets: {
                first: new Outlet(document.createElement('div')),
                second: new Outlet(document.createElement('div')),
            },
            params: ['id', 'name'],
        };
    });

    it('throws if not passed an options object', () => {
        expect(() => new Expectable()).to.throw(TypeError, 'Expectable constructor was not given an options object.');
    });

    describe('expectedAddresses() tests', () => {
        it('throws if expectedAddresses() is not defined', () => {
            expect(() => new Expectable(defaultOpts)).to.throw(Error, 'Expectable did not implement expectedAddresses().');
        });

        it('throws if options.addresses is not an array', () => {
            delete defaultOpts.addresses;
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, 'TestExpectable constructor\'s options.addresses property was not an Array.');
        });

        it('throws if expectedAddresses() doesn\'t return an array', () => {
            class Nope extends TestExpectable {
                expectedAddresses() {
                    return null;
                }
            }
            expect(() => new Nope(defaultOpts)).to.throw(Error, 'Nope#expectedAddresses() did not return an Array.');
        });

        it('throws if options.addresses doesn\'t match expectedAddresses()', () => {
            defaultOpts.addresses = [];
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, [
                'TestExpectable\'s received addresses ',
                    JSON.stringify(defaultOpts.addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(TestExpectable.prototype.expectedAddresses()),
                '.'
            ].join(''));

            defaultOpts.addresses = ['other'];
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, [
                'TestExpectable\'s received addresses ',
                    JSON.stringify(defaultOpts.addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(TestExpectable.prototype.expectedAddresses()),
                '.'
            ].join(''));
        });
    });

    describe('expectedOutlets() tests', () => {
        it('throws if expectedOutlets() is not defined', () => {
            expect(() => new ExpectsAddresses(defaultOpts)).to.throw(Error, 'ExpectsAddresses did not implement expectedOutlets().');
        });

        it('throws if options.outlets is not an object', () => {
            delete defaultOpts.outlets;
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, 'TestExpectable constructor\'s options.outlets property was not an Object.');
        });

        it('throws if expectedOutlets() doesn\'t return an array', () => {
            class Nope extends TestExpectable {
                expectedOutlets() {
                    return null;
                }
            }
            expect(() => new Nope(defaultOpts)).to.throw(Error, 'Nope#expectedOutlets() did not return an Array.');
        });

        it('throws if any outlet in options.outlet is not an instance of Outlet', () => {
            defaultOpts.outlets = {first: null, second: null};
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, [
                'TestExpectable did not receive instances of Outlet for named outlets: ',
                    JSON.stringify(Object.keys(defaultOpts.outlets).sort()),
                '.',
            ].join(''));

            defaultOpts.outlets = {first: new Outlet(document.createElement('div')), second: null};
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, 'TestExpectable did not receive instances of Outlet for named outlets: ["second"].');
        });

        it('throws if options.outlets doesn\'t match expectedOutlets()', () => {
            defaultOpts.outlets = {};
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, [
                'TestExpectable\'s received outlets ',
                    JSON.stringify(Object.keys(defaultOpts.outlets).sort()),
                ' did not match its expected outlets ',
                    JSON.stringify(TestExpectable.prototype.expectedOutlets()),
                '.'
            ].join(''));

            defaultOpts.outlets = {other: new Outlet(document.createElement('div'))};
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, [
                'TestExpectable\'s received outlets ',
                    JSON.stringify(Object.keys(defaultOpts.outlets).sort()),
                ' did not match its expected outlets ',
                    JSON.stringify(TestExpectable.prototype.expectedOutlets()),
                '.'
            ].join(''));
        });
    });

    describe('expectedParams() tests', () => {
        it('throws if expectedParams() is not defined', () => {
            expect(() => new ExpectsAddressesOutlets(defaultOpts)).to.throw(Error, 'ExpectsAddressesOutlets did not implement expectedParams().');
        });


        it('throws if options.params is not an array', () => {
            delete defaultOpts.params;
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, 'TestExpectable constructor\'s options.params property was not an Array.');
        });

        it('throws if expectedParams() doesn\'t return an array', () => {
            class Nope extends TestExpectable {
                expectedParams() {
                    return null;
                }
            }
            expect(() => new Nope(defaultOpts)).to.throw(Error, 'Nope#expectedParams() did not return an Array.');
        });

        it('throws if options.params doesn\'t match expectedParams()', () => {
            defaultOpts.params = [];
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, [
                'TestExpectable\'s received params ',
                    JSON.stringify(defaultOpts.params),
                ' did not match its expected params ',
                    JSON.stringify(TestExpectable.prototype.expectedParams()),
                '.'
            ].join(''));

            defaultOpts.params = ['nope'];
            expect(() => new TestExpectable(defaultOpts)).to.throw(Error, [
                'TestExpectable\'s received params ',
                    JSON.stringify(defaultOpts.params),
                ' did not match its expected params ',
                    JSON.stringify(TestExpectable.prototype.expectedParams()),
                '.'
            ].join(''));
        });
    });
});
