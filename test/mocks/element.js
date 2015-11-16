import { Element } from '../mocks';

describe('Element Mock', () => {
    let element;

    beforeEach(() => {
        element = new Element();
    });

    it('creates a fake parent node that holds it', () => {
        expect(element.parentNode).to.equal(element.parentNode);
    });

    describe('appendChild', () => {
        it('throws when not given an element', () => {
            expect(() => element.appendChild()).to.throw(TypeError);
        });

        it('appends a child element', () => {
            let child = new Element();
            element.appendChild(child);
            expect(element.children).to.deep.equal([child]);
        });
    });

    describe('removeChild', () => {
        it('throws when not given an element', () => {
            expect(() => element.removeChild()).to.throw(TypeError);
        });

        it('throws when child is not found', () => {
            expect(() => element.removeChild(new Element())).to.throw();
        });

        it('removes a child element', () => {
            let child = new Element();
            element.appendChild(child);
            expect(element.children).to.deep.equal([child]);
            element.removeChild(child);
            expect(element.children).to.be.empty;
        });
    });

    describe('addEventListener', () => {
        it('throws when not passed a callback function', () => {
            expect(() => element.addEventListener('click')).to.throw();
        });

        it('fires callback on element.fire(evtName)', () => {
            let spy = sinon.spy();
            element.addEventListener('click', spy);
            spy.should.not.have.been.called;
            element.fire('click');
            spy.should.have.been.calledOnce;
        });

        it('fires event callbacks in order', () => {
            let spy = sinon.spy();
            let spy2 = sinon.spy();
            element.addEventListener('click', spy);
            element.addEventListener('click', spy2);
            element.fire('click');
            spy.should.have.been.called;
            spy2.should.have.been.called;
            spy.should.have.been.calledBefore(spy2);
        });
    });

    describe('removeEventListener', () => {
        it('throws when not passed a callback function', () => {
            expect(() => element.removeEventListener('click')).to.throw();
        });

        it('removeEventListener removes the passed-in callback', () => {
            let spy = sinon.spy();
            let spy2 = sinon.spy();
            element.addEventListener('click', spy);
            element.addEventListener('click', spy2);
            element.removeEventListener('click', spy);
            element.fire('click');
            spy.should.not.have.been.called;
            spy2.should.have.been.calledOnce;
        });
    });
});
