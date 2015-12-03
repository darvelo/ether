import { Element } from '../mocks';

describe('Element Mock', () => {
    let element;

    beforeEach(() => {
        element = new Element();
    });

    it('creates a fake parent node that holds it', () => {
        expect(element.parentNode).to.equal(element.parentNode);
    });

    it ('can get innerHTML when element has no children', () => {
        element.innerHTML.should.equal('');
    });

    it('throws when getting innerHTML when element has children', () => {
        element.appendChild(new Element());
        expect(() => element.innerHTML).to.throw();
    });

    it('can set innerHTML to empty string to clear children', () => {
        element.children.should.have.length(0);
        element.appendChild(new Element());
        element.appendChild(new Element());
        element.children.should.have.length(2);
        element.innerHTML = '';
        element.children.should.have.length(0);
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
});
