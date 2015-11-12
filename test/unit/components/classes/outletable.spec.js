import Outletable from '../../../../src/classes/outletable';

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
        let n = new Outletable(TestClass);
        let instance = n.createInstance({});
        expect(instance).to.be.an.instanceof(TestClass);
    });

    it('constructs an object with the right outlets', function() {
        let n = new Outletable(OutletableTestClass, 'second');
        var outlets = {
            first: 1,
            second: 2,
            third: 3,
        };

        let instance = n.createInstance({outlets});
        expect(instance).to.be.an.instanceof(OutletableTestClass);
        expect(instance.outlets).to.deep.equal({second: 2});
    });
});
