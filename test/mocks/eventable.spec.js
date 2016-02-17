import { Eventable } from '../mocks';

describe('Eventable mock helper', () => {
    let eventable;

    beforeEach(() => {
        eventable = new Eventable();
    });

    describe('addEventListener', () => {
        it('throws when not passed a callback function', () => {
            expect(() => eventable.addEventListener('click')).to.throw();
        });

        it('fires callback on eventable.fire(evtName)', () => {
            let spy = sinon.spy();
            eventable.addEventListener('click', spy);
            spy.should.not.have.been.called;
            eventable.fire('click');
            spy.should.have.been.calledOnce;
        });

        it('fires event callbacks in order', () => {
            let spy = sinon.spy();
            let spy2 = sinon.spy();
            eventable.addEventListener('click', spy);
            eventable.addEventListener('click', spy2);
            eventable.fire('click');
            spy.should.have.been.called;
            spy2.should.have.been.called;
            spy.should.have.been.calledBefore(spy2);
        });
    });

    describe('removeEventListener', () => {
        it('throws when not passed a callback function', () => {
            expect(() => eventable.removeEventListener('click')).to.throw();
        });

        it('removeEventListener removes the passed-in callback', () => {
            let spy = sinon.spy();
            let spy2 = sinon.spy();
            eventable.addEventListener('click', spy);
            eventable.addEventListener('click', spy2);
            eventable.removeEventListener('click', spy);
            eventable.fire('click');
            spy.should.not.have.been.called;
            spy2.should.have.been.calledOnce;
        });
    });

    describe('clearListeners', () => {
        it('fires callback on eventable.fire(evtName)', () => {
            let spy = sinon.spy();
            eventable.addEventListener('click', spy);
            spy.should.not.have.been.called;
            eventable.fire('click');
            spy.should.have.been.calledOnce;
            eventable.clearListeners();
            eventable.fire('click');
            spy.should.have.been.calledOnce;
        });
    });
});
