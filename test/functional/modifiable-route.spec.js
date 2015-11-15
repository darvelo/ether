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

let transformTests = {
    address: {
        klass: Addressable,
        prop: 'address',
        arg: 'addy',
        run: function(addressable) {
            let modified = addressable[this.prop](this.arg);
            expect(modified._address).to.equal(this.arg);
            return modified;
        },
    },
    outlet: {
        klass: OutletsReceivable,
        prop: 'outlets',
        args: ['one', 'three'],
        instanceArgs: [{
            outlets: {
                one: 1,
                two: 2,
                three: 3,
            },
        }, 4, 5, 6],
        run: function(outletable) {
            let modified = outletable[this.prop](...this.args);
            let stub = sinon.stub(modified, 'klass');
            modified._createInstance(...this.instanceArgs);
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
            let route = ModifiableRoute.address('addy');
            route.should.be.an.instanceof(ModifiedRoute);
        });

        it('static fn calls transform', () => {
            let stub = sinon.stub(Addressable, 'transform');
            let route = ModifiableRoute.address('addy');
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith(route, 'addy');
            stub.restore();
        });

        it('instance fn returns a ModifiedRoute', () => {
            let modified = new ModifiedRoute(null, IdentityModifier);
            modified.address('addy').should.be.an.instanceof(ModifiedRoute);
        });

        it('instance fn calls transform', () => {
            let mock = sinon.mock(Addressable);
            let modified = new ModifiedRoute(null, IdentityModifier);
            mock.expects('transform').once().withArgs(modified, 'addy');
            modified.address('addy');
            mock.verify();
        });

        it('applies the proper transformation', () => {
            transformTests.address.run(ModifiableRoute);
        });

        it('creates an instance of ModifiableRoute with args passed', () => {
            let modified = TestRoute.address('addy');
            let route = modified._createInstance('mic', 'check');
            route.should.be.an.instanceof(TestRoute);
            expect(route.args).to.deep.equal(['mic', 'check']);
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
            let mock = sinon.mock(OutletsReceivable);
            let modified = new ModifiedRoute(null, IdentityModifier);
            mock.expects('transform').once().withArgs(modified, 'one', 'two');
            modified.outlets('one', 'two');
            mock.verify();
        });

        it('applies the proper transformation', () => {
            transformTests.outlet.run(ModifiableRoute);
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
            function* permute(arr, pos){
                let n = arr.length;
                if (n-pos === 1) {
                    yield arr;
                } else {
                    for (var i = pos; i < n; i++){
                        swap(arr, pos, i);
                        yield* permute(arr, pos+1);
                        swap(arr, pos, i);
                    }
                }
            }

            for (let p of permute(modifiers, 0)) {
                let modified = ModifiableRoute;
                for (let test of p) {
                    modified = test.run(modified);
                }
            }
        });
    });
});
