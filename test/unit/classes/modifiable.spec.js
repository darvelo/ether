import Modifiable from '../../../src/classes/modifiable';

class TestModifiable extends Modifiable {
    constructor(...args) {
        super(...args);
        this.args = args;
    }
    expectedAddresses() {
        return [];
    }
    addressesHandlers() {
        return [];
    }
    expectedOutlets() {
        return [];
    }
    expectedParams() {
        return [];
    }
    expectedSetup() {
        return [];
    }
}

describe('Modifiable', () => {
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            addresses: [],
            outlets: {},
            params: [],
        };
    });

    it('can create an instance of itself', () => {
        expect(TestModifiable.create(defaultOpts)).to.be.an.instanceof(Modifiable);
    });

    it('create() passes args to the constructor ', () => {
        expect(TestModifiable.create(...[defaultOpts, 1, 2, 3]).args).to.deep.equal([defaultOpts, 1, 2, 3]);
    });
});
