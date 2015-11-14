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

describe('ModifiableRoute Class Static Modifiers', () => {
    describe('Addressable', () => {
        it('static fn returns a ModifiedRoute', () => {
            let route = ModifiableRoute.address('addy');
            route.should.be.an.instanceof(ModifiedRoute);
        });

        it('static fn calls transform', () => {
            let spy = sinon.spy(Addressable, 'transform');
            let route = ModifiableRoute.address('addy');
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(route, 'addy');
            spy.restore();
        });

        it('instance fn returns a ModifiedRoute', () => {
            let modified = new ModifiedRoute(null, IdentityModifier);
            modified = modified.address('addy');
            modified.should.be.an.instanceof(ModifiedRoute);
        });

        it('instance fn calls transform', () => {
            let spy = sinon.spy(Addressable, 'transform');
            let modified = new ModifiedRoute(null, IdentityModifier);
            spy.should.not.have.been.called;
            modified.address('addy');
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(modified, 'addy');
            spy.restore();
        });

        it('applies the proper transformation', () => {
            let modified = ModifiableRoute.address('addy');
            expect(modified._address).to.equal('addy');
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
            let spy = sinon.spy(OutletsReceivable, 'transform');
            let route = ModifiableRoute.outlets('one', 'two');
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(route, 'one', 'two');
            spy.restore();
        });

        it('instance fn returns a ModifiedRoute', () => {
            let modified = new ModifiedRoute(null, IdentityModifier);
            modified = modified.outlets('one', 'two');
            modified.should.be.an.instanceof(ModifiedRoute);
        });

        it('instance fn calls transform', () => {
            let spy = sinon.spy(OutletsReceivable, 'transform');
            let modified = new ModifiedRoute(null, IdentityModifier);
            spy.should.not.have.been.called;
            modified.outlets('one', 'two');
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(modified, 'one', 'two');
            spy.restore();
        });

        it('applies the proper transformation', () => {
            let args = [{
                outlets: {
                    one: 1,
                    two: 2,
                    three: 3,
                }
            }, 4, 5, 6];
            let modified = TestRoute.outlets('one', 'three');
            let route = modified._createInstance(...args);
            expect(route.args).to.have.length.above(0);
            expect(route.args[0]).to.deep.equal({outlets: {one: 1, three: 3}});
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
            let modifiers = [
                { prop: 'address', klass: Addressable },
                { prop: 'outlets', klass: OutletsReceivable },
            ];

            if (modifiers.length > 7)  {
                throw new Error('Number of permutations will be too high.');
            }

            function swap(array, i, j) {
                let tmp = array[i];
                array[i] = array[j];
                array[j] = tmp;
            }

            // my own implementation of the Steinhaus–Johnson–Trotter algorithm
            function* permute(array) {
                let permutations;
                if (array.length < 2) {
                    yield array;
                    permutations = [];
                } else {
                    permutations = permute(array.slice(0, -1));
                }

                let n = array.length;
                let direction = -1;
                let j = n-1;
                let bound;

                for (let p of permutations) {
                    if (direction === -1) {
                        p.push(array[n-1]);
                        bound = -1;
                    } else {
                        p.unshift(array[n-1]);
                        bound = n;
                    }

                    yield p.slice();
                    while (j+direction !== bound) {
                        swap(p, j, j+direction);
                        yield p.slice();
                        j += direction;
                    }
                    direction *= -1;
                }
            }

            for (let p of permute(modifiers)) {
                let modified = ModifiableRoute;
                for (let {prop, klass} of p) {
                    let spy = sinon.spy(klass, 'transform');
                    modified = modified[prop]();
                    spy.should.have.been.calledOnce;
                    spy.should.have.been.calledWith(modified);
                    spy.restore();
                }
                let instance = modified._createInstance({outlets: {one: 1}});
                instance.should.be.an.instanceof(ModifiableRoute);
            }
        });
    });
});
