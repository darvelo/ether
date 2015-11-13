import OutletNameIterable from '../../../../src/classes/outlet-name-iterable';

class TestClass {
    constructor(...args) {
        this.args = args;
    }
}

describe('OutletNameIterable', function() {
    it('is an instance of OutletNameIterable', function() {
        let n = new OutletNameIterable(TestClass);
        expect(n).to.be.an.instanceof(OutletNameIterable);
    });

    it('stores outlet names', function() {
        let names = ['one', 'two', 'three'];
        let n = new OutletNameIterable(TestClass, ...names);
        expect(n.names).to.deep.equal(names);
    });

    it('constructs an object of the Class that was passed in', function() {
        let names = ['one', 'two', 'three'];
        let n = new OutletNameIterable(TestClass, ...names);
        let instance = n.createInstance(1, 2 ,3);
        expect(instance).to.be.an.instanceof(TestClass);
        expect(instance.args).to.deep.equal([1, 2, 3]);
    });
});
