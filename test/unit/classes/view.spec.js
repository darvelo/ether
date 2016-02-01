import View from '../../../src/classes/view';

describe('View', () => {
    describe('DOMEvents', () => {
        describe('DOMListen', () => {
            it('throws when not given an Element instance', () => {
                expect(() => new View().DOMListen({}, 'click', function(){})).to.throw(TypeError, 'View#DOMListen() was not passed an Element instance.');
            });

            it('throws when DOMListen callback is not a function', () => {
                let view = new View();
                expect(() => view.DOMListen(document.createElement('div'), 'click')).to.throw(TypeError,  'View#DOMListen() was not passed a callback that was a function type.');
            });

            it('adds an event callback without a context', () => {
                let view = new View();
                let spy = view.handleClick = sinon.spy();
                let element = document.createElement('div');
                view.DOMListen(element, 'click', view.handleClick);
                element.click();
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(undefined);
            });

            it('adds an event callback with a context', () => {
                let view = new View();
                let spy = view.handleClick = sinon.spy();
                let element = document.createElement('div');
                view.DOMListen(element, 'click', view.handleClick, view);
                element.click();
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(view);
            });

            it('adds a callback only for the element passed in', () => {
                let view = new View();
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                view.DOMListen(element1, 'click', spy1);
                view.DOMListen(element2, 'click', spy2);
                element1.click();
                spy1.should.have.been.calledOnce;
                spy2.should.not.have.been.called;
                element2.click();
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
            });
        });

        describe('DOMUnlisten', () => {
            it('throws when not given an Element instance', () => {
                expect(() => new View().DOMUnlisten({}, 'click', function(){})).to.throw(TypeError, 'View#DOMUnlisten() was not passed an Element instance.');
            });

            it('only removes a callback when the context matches', () => {
                let view = new View();
                let spy = view.handleClick = sinon.spy();
                let element = document.createElement('div');
                view.DOMListen(element, 'click', view.handleClick, view);
                view.DOMUnlisten(element, 'click', view.handleClick);
                element.click();
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(view);
                view.DOMUnlisten(element, 'click', view.handleClick, view);
                element.click();
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(view);
            });

            it('removes all callbacks when not passed a specific callback function to remove', () => {
                let view = new View();
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                let element = document.createElement('div');
                view.DOMListen(element, 'click', spy1);
                view.DOMListen(element, 'click', spy2, view);
                element.click();
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
                view.DOMUnlisten(element, 'click');
                element.click();
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
            });

            it('removes a callback only for the element passed in', () => {
                let view = new View();
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                view.DOMListen(element1, 'click', spy1);
                view.DOMListen(element2, 'click', spy2);
                view.DOMUnlisten(element1, 'click', spy1);
                element1.click();
                element2.click();
                spy1.should.not.have.been.called;
                spy2.should.have.been.calledOnce;
                view.DOMUnlisten(element2, 'click', spy2);
                element1.click();
                element2.click();
                spy1.should.not.have.been.called;
                spy2.should.have.been.calledOnce;
            });

            it('removes all callbacks only for the element passed in', () => {
                let view = new View();
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                let spy3 = sinon.spy();
                let spy4 = sinon.spy();
                view.DOMListen(element1, 'click', spy1);
                view.DOMListen(element1, 'click', spy2);
                view.DOMListen(element2, 'click', spy3);
                view.DOMListen(element2, 'click', spy4);
                view.DOMUnlisten(element1, 'click');
                element1.click();
                element2.click();
                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.calledOnce;
                spy4.should.have.been.calledOnce;
                view.DOMUnlisten(element2, 'click');
                element1.click();
                element2.click();
                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.calledOnce;
                spy4.should.have.been.calledOnce;
            });
        });
    });
});
