import ModifiableRoute from '../../src/classes/modifiable-route';
import ModifiedRoute from '../../src/classes/modified-route';
import Addressable from '../../src/classes/modifiers/addressable';

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

    describe('Outletable', () => {
        it('yay', () => {
        });
    });

    describe('Chaining', () => {
        it('yay', () => {
        });
    });
});
