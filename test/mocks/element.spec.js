import { Element } from '../mocks';

describe('Element Mock', () => {
    let element;

    beforeEach(() => {
        element = new Element();
    });

    it('fires "click" event listeners on click()', () => {
        let spy = sinon.spy(element, 'fire');
        element.click();
        spy.should.have.been.calledOnce;
        spy.should.have.been.calledWith('click');
        spy.restore();
    });

    it('creates a fake parent node that holds it', () => {
        expect(element.parentNode).to.equal(element.parentNode);
    });

    describe('classList', () => {
        it('exists', () => {
            expect(element.classList).to.be.ok;
        });

        it('contains/add', () => {
            expect(element.classList.contains('cls')).to.equal(false);
            element.classList.add('cls');
            expect(element.classList.contains('cls')).to.equal(true);
        });

        it('adds multiple', () => {
            expect(element.classList.contains('cls1')).to.equal(false);
            expect(element.classList.contains('cls2')).to.equal(false);
            expect(element.classList.contains('cls3')).to.equal(false);
            element.classList.add('cls1', 'cls2', 'cls3');
            expect(element.classList.contains('cls1')).to.equal(true);
            expect(element.classList.contains('cls2')).to.equal(true);
            expect(element.classList.contains('cls3')).to.equal(true);
        });

        it('remove', () => {
            element.classList.add('cls');
            expect(element.classList.contains('cls')).to.equal(true);
            element.classList.remove('cls');
            expect(element.classList.contains('cls')).to.equal(false);
        });

        it('removes multiple', () => {
            element.classList.add('cls1', 'cls2', 'cls3');
            expect(element.classList.contains('cls1')).to.equal(true);
            expect(element.classList.contains('cls2')).to.equal(true);
            expect(element.classList.contains('cls3')).to.equal(true);
            element.classList.remove('cls1', 'cls2', 'cls3');
            expect(element.classList.contains('cls1')).to.equal(false);
            expect(element.classList.contains('cls2')).to.equal(false);
            expect(element.classList.contains('cls3')).to.equal(false);
        });
    });

    describe('className', () => {
        it('gets className property', () => {
            element.classList.add('cls1', 'cls2', 'cls3');
            expect(element.className).to.be.a('string');
            expect(element.className.split(/\s+/).sort()).to.deep.equal([
                'cls1',
                'cls2',
                'cls3',
            ]);
        });
    });

    describe('innerHTML', () => {
        it('can set innerHTML when element has no children', () => {
            let html = '<div class="mydiv"></div>';
            element.innerHTML = html;
        });

        it('can set innerHTML to empty string to clear children', () => {
            element.children.should.have.length(0);
            element.appendChild(new Element());
            element.appendChild(new Element());
            element.children.should.have.length(2);
            element.innerHTML = '';
            element.children.should.have.length(0);
        });

        it('throws when setting innerHTML when element has children', () => {
            element.appendChild(new Element());
            expect(() => element.innerHTML = '<div></div>').to.throw(Error, 'Element#innerHTML set not implemented for when element has children and the string is not empty.');
        });

        it ('can get innerHTML when element has no children', () => {
            element.innerHTML.should.equal('');
            let html = '<div class="mydiv"></div>';
            element.innerHTML = html;
            element.innerHTML.should.equal(html);
        });

        it('throws when getting innerHTML when element has children', () => {
            element.appendChild(new Element());
            expect(() => element.innerHTML).to.throw('Element#innerHTML get not implemented for when element has children.');
        });
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

        it('when appending, sets child.parentNode to itself', () => {
            let child = new Element();
            expect(child.parentNode).to.not.equal(element);
            element.appendChild(child);
            expect(child.parentNode).to.equal(element);
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
