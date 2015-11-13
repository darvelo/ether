import Outletable from '../../../src/classes/outletable';

class TestClass {
    constructor(...args) {
        this.args = args;
    }
}

export class OutletableTestClass {
    constructor(opts) {
        let outlets = opts.outlets;
        this.outlets = {};

        for (let name in outlets) {
            if (outlets.hasOwnProperty(name)) {
                this.outlets[name] = outlets[name];
            }
        }
    }
}

describe('Outletable', function() {
    it('is an instance of Outletable', function() {
        let n = new Outletable(TestClass, 'name');
        expect(n).to.be.an.instanceof(Outletable);
    });

    it('constructs an object of the Class that was passed in', function() {
        let opts = {};
        let n = new Outletable(TestClass);
        let instance = n.createInstance(opts, 1, 2, 3);
        expect(instance).to.be.an.instanceof(TestClass);
        expect(instance.args).to.deep.equal([{outlets: {}}, 1, 2, 3]);
    });

    it('constructs an object with the right outlets', function() {
        let n = new Outletable(OutletableTestClass, 'second');
        let outlets = {
            first: 1,
            second: 2,
            third: 3,
        };
        let opts = {outlets};

        let instance = n.createInstance(opts);
        expect(instance).to.be.an.instanceof(OutletableTestClass);
        expect(instance.outlets).to.deep.equal({second: 2});
    });
});
