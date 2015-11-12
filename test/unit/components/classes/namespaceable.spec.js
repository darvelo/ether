import Namespaceable from '../../../../src/classes/namespaceable';
import { OutletableTestClass } from './outletable.spec';

class TestClass {
    constructor(...args) {
        this.args = args;
    }
}

describe('Namespaceable', function() {
    it('is an instance of Namespaceable', function() {
        let n = new Namespaceable(TestClass, 'name');
        expect(n).to.be.an.instanceof(Namespaceable);
    });

    it('stores namespace name', function() {
        let name = 'myname';
        let n = new Namespaceable(TestClass, name);
        expect(n.namespaceName).to.equal(name);
    });

    it('constructs an object of the Class that was passed in', function() {
        let name = 'myname';
        let n = new Namespaceable(TestClass, name);
        let instance = n.createInstance(1, 2 ,3);
        expect(instance).to.be.an.instanceof(TestClass);
        expect(instance.args).to.deep.equal([1, 2, 3]);
    });

    it('constructs an object from Outletable', function() {
        let n = new Namespaceable(OutletableTestClass, 'name');
        var outlets = {
            first: 1,
            second: 2,
            third: 3,
        };

        expect(n.klass).to.equal(OutletableTestClass);
        n.outlets('second');
        expect(n.klass).to.not.equal(OutletableTestClass);

        let instance = n.createInstance({outlets});
        expect(instance).to.be.an.instanceof(OutletableTestClass);
        expect(instance.outlets).to.deep.equal({second: 2});
    });
});
