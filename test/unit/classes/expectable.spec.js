import Expectable from '../../../src/classes/expectable';

class ExpectsAddresses extends Expectable {
    expectedAddresses() {
        return ['first', 'second'];
    }
}

class TestExpectable extends ExpectsAddresses { }

describe('Expectable', function() {
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            addresses: ['first', 'second'],
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
            class Nope extends TestExpectable { expectedAddresses() { return null; }}
            expect(() => new Nope(defaultOpts)).to.throw(Error, 'Nope#expectedAdddresses() did not return an Array.');
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
        });
    });
});
