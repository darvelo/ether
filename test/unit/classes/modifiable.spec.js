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

    it('extend() returns a function that inherits and adds static and instance props', () => {
        function instanceFn() {}
        function staticFn() {}
        let MyModifiable = Modifiable.extend({
            instanceFn,
        }, {
            staticFn,
        });

        expect(MyModifiable).to.be.a('function');
        // check passed-in props
        expect(MyModifiable.staticFn).to.equal(staticFn);
        expect(MyModifiable.prototype.instanceFn).to.equal(instanceFn);
        // check that the passed-in properties weren't improperly assigned
        expect(MyModifiable).to.not.have.property('instanceFn');
        expect(MyModifiable.prototype).to.not.have.property('staticFn');
        // check that it inherited from Modifiable
        expect(Object.getPrototypeOf(MyModifiable)).to.equal(Modifiable);
        expect(Object.getPrototypeOf(MyModifiable.prototype)).to.equal(Modifiable.prototype);
    });
});
