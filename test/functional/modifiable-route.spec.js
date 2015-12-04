import ModifiableRoute from '../../src/classes/modifiable-route';
import ModifiedRoute from '../../src/classes/modified-route';
import Addressable from '../../src/classes/modifiers/addressable';
import OutletsReceivable from '../../src/classes/modifiers/outlets-receivable';

class IdentityModifier {
    static transform(modifiedRoute) {
        return modifiedRoute;
    }
}

class TestRoute extends ModifiableRoute {
    constructor(...args) {
        super();
        this.args = args;
    }
}

let transformTestsArgs = [
    {
        addresses: ['should-be-overwritten'],
        outlets: {
            one: 1,
            two: 2,
            three: 3,
        },
    },
    4, 5, 6,
];

let transformTests = {
    address: {
        klass: Addressable,
        prop: 'addresses',
        args: ['addy1', 'addy2'],
        run: function(addressable) {
            let modified = addressable[this.prop](...this.args);
            let stub = sinon.stub(modified, 'klass');
            modified._createInstance(...transformTestsArgs);
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWithNew;
            let callArgs = stub.getCall(0).args;
            callArgs.should.have.length.above(1);
            callArgs[0].should.have.property('addresses');
            callArgs[0].addresses.should.deep.equal(this.args);
            stub.restore();
            return modified;
        }
    },
    outlets: {
        klass: OutletsReceivable,
        prop: 'outlets',
        args: ['one', 'three'],
        run: function(outletable) {
            let modified = outletable[this.prop](...this.args);
            let stub = sinon.stub(modified, 'klass');
            expect(modified.outlets).to.deep.equal(this.args);
            modified._createInstance(...transformTestsArgs);
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWithNew;
            let callArgs = stub.getCall(0).args;
            callArgs.should.have.length.above(1);
            callArgs[0].should.have.property('outlets');
            callArgs[0].outlets.should.deep.equal({one: 1, three: 3});
            stub.restore();
            return modified;
        }
    },
};

describe('ModifiableRoute Class Static Modifiers', () => {
    describe('Addressable', () => {
        it('static fn returns a ModifiedRoute', () => {
            let route = ModifiableRoute.addresses('addy');
            route.should.be.an.instanceof(ModifiedRoute);
        });

        it('static fn calls transform', () => {
            let stub = sinon.stub(Addressable, 'transform');
            let route = ModifiableRoute.addresses('addy');
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith(route, 'addy');
            stub.restore();
        });

        it('instance fn returns a ModifiedRoute', () => {
            let modified = new ModifiedRoute(null, IdentityModifier);
            modified.addresses('addy').should.be.an.instanceof(ModifiedRoute);
        });

        it('instance fn calls transform', () => {
            let modified = new ModifiedRoute(null, IdentityModifier);
            let mock = sinon.mock(Addressable);
            mock.expects('transform').once().withArgs(modified, 'addy');
            modified.addresses('addy');
            mock.verify();
        });

        it('applies the proper transformation', () => {
            transformTests.address.run(ModifiableRoute);
        });

        it('creates an instance of ModifiableRoute with args passed', () => {
            let modified = TestRoute.addresses('addy');
            let route = modified._createInstance({}, 'mic', 'check');
            route.should.be.an.instanceof(TestRoute);
            expect(route.args).to.deep.equal([{addresses: ['addy']}, 'mic', 'check']);
        });
    });

    describe('OutletsReceivable', () => {
        it('static fn returns a ModifiedRoute', () => {
            let route = ModifiableRoute.outlets('one', 'two');
            route.should.be.an.instanceof(ModifiedRoute);
        });

        it('static fn calls transform', () => {
            let stub = sinon.stub(OutletsReceivable, 'transform');
            let route = ModifiableRoute.outlets('one', 'two');
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith(route, 'one', 'two');
            stub.restore();
        });

        it('instance fn returns a ModifiedRoute', () => {
            let modified = new ModifiedRoute(null, IdentityModifier);
            modified = modified.outlets('one', 'two');
            modified.should.be.an.instanceof(ModifiedRoute);
        });

        it('instance fn calls transform', () => {
            let modified = new ModifiedRoute(null, IdentityModifier);
            let mock = sinon.mock(OutletsReceivable);
            mock.expects('transform').once().withArgs(modified, 'one', 'two');
            modified.outlets('one', 'two');
            mock.verify();
        });

        it('applies the proper transformation', () => {
            transformTests.outlets.run(ModifiableRoute);
        });

        it('creates an instance of ModifiableRoute with args passed', () => {
            let args = [{
                outlets: {
                    one: 1,
                    two: 2,
                    three: 3,
                }
            }, 4, 5, 6];
            let modified = TestRoute.outlets('two');
            let route = modified._createInstance(...args);
            route.should.be.an.instanceof(TestRoute);
            expect(route.args).to.deep.equal([{
                outlets: {
                    two: 2,
                }
            }, 4, 5, 6]);
        });

        it('throws if missing any expected outlet', () => {
            let args = [{
                outlets: {
                    one: 1,
                    two: 2,
                    three: 3,
                }
            }, 4, 5, 6];
            let modified = TestRoute.outlets('two', 'four');
            expect(() => modified._createInstance(...args)).to.throw(
                Error,
                'Route expected outlets ["two","four"] but received ["one","three","two"].'
            );
        });
    });

    describe('Chaining', () => {
        it('calls transform method for any permutation of modifiers', () => {
            let modifiers = [];

            for (let prop in transformTests) {
                if (transformTests.hasOwnProperty(prop)) {
                    modifiers.push(transformTests[prop]);
                }
            }

            if (modifiers.length > 7)  {
                throw new Error('Number of permutations will be too high.');
            }

            function swap(array, i, j) {
                let tmp = array[i];
                array[i] = array[j];
                array[j] = tmp;
            }

            // efficient permutations generation algorithm
            // modified from: http://stackoverflow.com/a/20906510
            function* permute(arr, pos=0){
                let n = arr.length;
                if (n-pos === 1) {
                    yield arr;
                } else {
                    for (let i = pos; i < n; i++){
                        swap(arr, pos, i);
                        yield* permute(arr, pos+1);
                        swap(arr, pos, i);
                    }
                }
            }

            for (let p of permute(modifiers)) {
                let modified = ModifiableRoute;
                for (let test of p) {
                    modified = test.run(modified);
                }
            }
        });
    });
});
