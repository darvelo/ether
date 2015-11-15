import Route from '../../../src/classes/route';

describe('Route', () => {
    describe('DOMEvent Listener', () => {
        it('can be added and removed', () => {
            let route = new Route();
            let spy = route.handleClick = sinon.spy();
            let element = new Element();
            route.DOMListen(element, 'click', route.handleClick);
            element.fire('click');
            spy.should.have.been.calledOnce;
            route.DOMUnlisten(element, 'click', route.handleClick);
            element.fire('click');
            spy.should.have.been.calledOnce;
        });
    });
});
