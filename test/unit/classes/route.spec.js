import Route from '../../../src/classes/route';

describe('Route', () => {
    describe('DOM Event Listener', () => {
        it('can be added and removed', () => {
            let route = new Route();
            let element = new Element();
            let spy = route.handleClick = sinon.spy();
            route.DOMListen(element, 'click', route.handleClick);
            element.fire('click');
            spy.should.have.been.calledOnce;
            route.DOMUnlisten(element, 'click', route.handleClick);
            element.fire('click');
            spy.should.have.been.calledOnce;
        });
    });
});
