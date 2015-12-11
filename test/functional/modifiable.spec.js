import Modifiable from '../../src/classes/modifiable';
import Modified from '../../src/classes/modified';
import Addressable from '../../src/classes/modifiers/addressable';
import OutletsReceivable from '../../src/classes/modifiers/outlets-receivable';

class IdentityModifier {
    static transform(modifiedRoute) {
        return modifiedRoute;
    }
}

let transformTestsArgs = [
    {
        addresses: ['should-be-overwritten'],
        outlets: {
            one: 1,
            two: 2,
        },
        params: [],
    },
    4, 5, 6,
];

let transformTests = {
    address: {
        prop: 'addresses',
        args: ['addy1', 'addy2'],
        run: function(addressable) {
            let modified = addressable[this.prop](...this.args);
            // this allows us to bypass Expectable expected*() functions
            // and just check that the arguments are transformed correctly
            let stub = sinon.stub(modified, 'klass');
            expect(modified.addresses).to.deep.equal(this.args);
            modified.create(...transformTestsArgs);
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWithNew;
            let callArgs = stub.getCall(0).args;
            callArgs.should.have.length(transformTestsArgs.length);
            callArgs.slice(1).should.deep.equal(transformTestsArgs.slice(1));
            callArgs[0].should.have.property('addresses');
            callArgs[0].addresses.should.deep.equal(this.args);
            stub.restore();
            return modified;
        }
    },
    outlets: {
        prop: 'outlets',
        args: ['one', 'two'],
        run: function(outletable) {
            let modified = outletable[this.prop](...this.args);
            // this allows us to bypass Expectable expected*() functions
            // and just check that the arguments are transformed correctly
            let stub = sinon.stub(modified, 'klass');
            expect(modified.outlets).to.deep.equal(this.args);
            modified.create(...transformTestsArgs);
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWithNew;
            let callArgs = stub.getCall(0).args;
            callArgs.should.have.length(transformTestsArgs.length);
            callArgs.slice(1).should.deep.equal(transformTestsArgs.slice(1));
            callArgs[0].should.have.property('outlets');
            callArgs[0].outlets.should.deep.equal({one: 1, two: 2});
            stub.restore();
            return modified;
        }
    },
};

describe('Modifiable Functional Tests', () => {
    describe('Modifiers', () => {
        describe('Addressable', () => {
            it('static fn returns a Modified', () => {
                let route = Modifiable.addresses('addy');
                route.should.be.an.instanceof(Modified);
            });

            it('static fn calls transform', () => {
                let stub = sinon.stub(Addressable, 'transform');
                let route = Modifiable.addresses('addy');
                stub.should.have.been.calledOnce;
                stub.should.have.been.calledWith(route, 'addy');
                stub.restore();
            });

            it('instance fn returns a Modified', () => {
                let modified = new Modified(null, IdentityModifier);
                modified.addresses('addy').should.be.an.instanceof(Modified);
            });

            it('instance fn calls transform', () => {
                let modified = new Modified(null, IdentityModifier);
                let mock = sinon.mock(Addressable);
                mock.expects('transform').once().withArgs(modified, 'addy');
                modified.addresses('addy');
                mock.verify();
            });

            it('applies the proper transformation', () => {
                transformTests.address.run(Modifiable);
            });
        });

        describe('OutletsReceivable', () => {
            it('static fn returns a Modified', () => {
                let route = Modifiable.outlets('one', 'two');
                route.should.be.an.instanceof(Modified);
            });

            it('static fn calls transform', () => {
                let stub = sinon.stub(OutletsReceivable, 'transform');
                let route = Modifiable.outlets('one', 'two');
                stub.should.have.been.calledOnce;
                stub.should.have.been.calledWith(route, 'one', 'two');
                stub.restore();
            });

            it('instance fn returns a Modified', () => {
                let modified = new Modified(null, IdentityModifier);
                modified = modified.outlets('one', 'two');
                modified.should.be.an.instanceof(Modified);
            });

            it('instance fn calls transform', () => {
                let modified = new Modified(null, IdentityModifier);
                let mock = sinon.mock(OutletsReceivable);
                mock.expects('transform').once().withArgs(modified, 'one', 'two');
                modified.outlets('one', 'two');
                mock.verify();
            });

            it('applies the proper transformation', () => {
                transformTests.outlets.run(Modifiable);
            });
        });
    });

    describe('Chaining Modifiers', () => {
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
                let modified = Modifiable;
                for (let test of p) {
                    modified = test.run(modified);
                }
            }
        });
    });
});
