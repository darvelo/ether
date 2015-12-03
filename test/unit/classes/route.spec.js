import Route from '../../../src/classes/route';

describe('Route', () => {
    describe('DOMEvents', () => {
        describe('DOMListen', () => {
            it('throws when not given an Element instance', () => {
                expect(() => new Route().DOMListen({}, 'click', function(){})).to.throw(TypeError, 'Route#DOMListen() was not passed an Element instance.');
            });

            it('throws when DOMListen callback is not a function', () => {
                let route = new Route();
                expect(() => route.DOMListen(document.createElement('div'), 'click')).to.throw(TypeError,  'Route#DOMListen() was not passed a callback that was a function type.');
            });

            it('adds an event callback without a context', () => {
                let route = new Route();
                let spy = route.handleClick = sinon.spy();
                let element = document.createElement('div');
                route.DOMListen(element, 'click', route.handleClick);
                element.fire('click');
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(undefined);
            });

            it('adds an event callback with a context', () => {
                let route = new Route();
                let spy = route.handleClick = sinon.spy();
                let element = document.createElement('div');
                route.DOMListen(element, 'click', route.handleClick, route);
                element.fire('click');
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(route);
            });

            it('adds a callback only for the element passed in', () => {
                let route = new Route();
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                route.DOMListen(element1, 'click', spy1);
                route.DOMListen(element2, 'click', spy2);
                element1.fire('click');
                spy1.should.have.been.calledOnce;
                spy2.should.not.have.been.called;
                element2.fire('click');
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
            });
        });

        describe('DOMUnlisten', () => {
            it('throws when not given an Element instance', () => {
                expect(() => new Route().DOMUnlisten({}, 'click', function(){})).to.throw(TypeError, 'Route#DOMUnlisten() was not passed an Element instance.');
            });

            it('only removes a callback when the context matches', () => {
                let route = new Route();
                let spy = route.handleClick = sinon.spy();
                let element = document.createElement('div');
                route.DOMListen(element, 'click', route.handleClick, route);
                route.DOMUnlisten(element, 'click', route.handleClick);
                element.fire('click');
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(route);
                route.DOMUnlisten(element, 'click', route.handleClick, route);
                element.fire('click');
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(route);
            });

            it('removes all callbacks when not passed a specific callback function to remove', () => {
                let route = new Route();
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                let element = document.createElement('div');
                route.DOMListen(element, 'click', spy1);
                route.DOMListen(element, 'click', spy2, route);
                element.fire('click');
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
                route.DOMUnlisten(element, 'click');
                element.fire('click');
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
            });

            it('removes a callback only for the element passed in', () => {
                let route = new Route();
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                route.DOMListen(element1, 'click', spy1);
                route.DOMListen(element2, 'click', spy2);
                route.DOMUnlisten(element1, 'click', spy1);
                element1.fire('click');
                element2.fire('click');
                spy1.should.not.have.been.called;
                spy2.should.have.been.calledOnce;
                route.DOMUnlisten(element2, 'click', spy2);
                element1.fire('click');
                element2.fire('click');
                spy1.should.not.have.been.called;
                spy2.should.have.been.calledOnce;
            });

            it('removes all callbacks only for the element passed in', () => {
                let route = new Route();
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                let spy3 = sinon.spy();
                let spy4 = sinon.spy();
                route.DOMListen(element1, 'click', spy1);
                route.DOMListen(element1, 'click', spy2);
                route.DOMListen(element2, 'click', spy3);
                route.DOMListen(element2, 'click', spy4);
                route.DOMUnlisten(element1, 'click');
                element1.fire('click');
                element2.fire('click');
                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.calledOnce;
                spy4.should.have.been.calledOnce;
                route.DOMUnlisten(element2, 'click');
                element1.fire('click');
                element2.fire('click');
                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.calledOnce;
                spy4.should.have.been.calledOnce;
            });
        });
    });
});
