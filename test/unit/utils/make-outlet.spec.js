import makeOutlet from '../../../src/utils/make-outlet';
import Outlet from '../../../src/classes/outlet';
import MutableOutlet from '../../../src/classes/mutable-outlet';

describe('MakeOutlet Util', () => {
    it('throws if it does not receive an object', () => {
        expect(() => makeOutlet()).to.throw(TypeError, 'makeOutlet(): Did not receive an object.');
    });

    it('throws if it receives neither `el` nor `tagName`', () => {
        expect(() => makeOutlet({})).to.throw(Error, 'makeOutlet(): Needs to receive an object with either of these two properties: el, or tagName.');
    });

    it('throws if it receives both `el` and `tagName`', () => {
        expect(() => makeOutlet({el: document.createElement('div'), tagName: 'div'})).to.throw(Error, 'makeOutlet(): Needs to receive an object with either of these two properties, but the object had both: el, or tagName.');
    });

    it('throws if `el` is not an instance of Element', () => {
        expect(() => makeOutlet({el: 'div'})).to.throw(TypeError, 'makeOutlet(): Property `el` was not an instance of Element.');
    });

    it('throws if `tagName` is not a string', () => {
        expect(() => makeOutlet({tagName: 1})).to.throw(TypeError, 'makeOutlet(): Property `tagName` was not a string.');
    });

    it('makes an Outlet that holds the passed-in element', () => {
        let element = document.createElement('div');
        let outlet = makeOutlet({el: element});
        expect(outlet).to.be.an.instanceof(Outlet);
        expect(outlet._element).to.equal(element);
    });

    it('makes a MutableOutlet that holds the passed-in element', () => {
        let element = document.createElement('div');
        let outlet = makeOutlet({el: element, mutable: true});
        expect(outlet).to.be.an.instanceof(MutableOutlet);
        expect(outlet.get()).to.equal(element);
    });

    it('makes an Outlet that holds the element created from tagName', () => {
        let outlet = makeOutlet({tagName: 'section'});
        expect(outlet).to.be.an.instanceof(Outlet);
        expect(outlet._element).to.be.an.instanceof(Element);
        expect(outlet._element.nodeName).to.equal('SECTION');
    });

    it('makes a MutableOutlet that holds the element created from tagName', () => {
        let outlet = makeOutlet({tagName: 'section', mutable: true});
        expect(outlet).to.be.an.instanceof(MutableOutlet);
        expect(outlet.get()).to.be.an.instanceof(Element);
        expect(outlet.get().nodeName).to.equal('SECTION');
    });

    it('adds CSS classes to its element', () => {
        let element = document.createElement('div');
        makeOutlet({el: element, classNames: ['hello', 'there']});
        expect(element.classList.contains('hello')).to.be.true;
        expect(element.classList.contains('there')).to.be.true;
    });

    describe('Appending Elements', () => {
        it('throws if `append` array receives an instance of neither Element nor Outlet', () => {
            expect(() => {
                 makeOutlet({
                    tagName: 'div',
                    append: null,
                 });
            }).to.throw(TypeError, 'makeOutlet(): Tried to append a value to the outlet\'s element that was neither an Outlet nor another HTML Element.');
        });

        it('throws if `append` non-array receives an instance of neither Element nor Outlet', () => {
            expect(() => {
                 makeOutlet({
                    tagName: 'div',
                    append: [null],
                 });
            }).to.throw(TypeError, 'makeOutlet(): Tried to append a value to the outlet\'s element that was neither an Outlet nor another HTML Element.');
        });

        it('throws if an outlet in `append` array is not holding an element', () => {
            let outlet = new MutableOutlet(document.createElement('div'));
            outlet.clear();
            expect(() => {
                 makeOutlet({
                    tagName: 'div',
                    append: [outlet],
                 });
            }).to.throw(Error, 'makeOutlet(): Tried to append an Outlet that was not holding HTML Element.');
        });

        it('throws if an outlet in `append` non-array is not holding an element', () => {
            let outlet = new MutableOutlet(document.createElement('div'));
            outlet.clear();
            expect(() => {
                 makeOutlet({
                    tagName: 'div',
                    append: outlet,
                 });
            }).to.throw(Error, 'makeOutlet(): Tried to append an Outlet that was not holding HTML Element.');
        });

        it('can take a single value of type Element for `append`', () => {
            let element = document.createElement('div');
            let appendedElement = document.createElement('div');
            let stub = sinon.stub(element, 'appendChild');
            makeOutlet({
                el: element,
                append: appendedElement,
            });
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith(appendedElement);
            stub.restore();
        });

        it('can take a single value of type Outlet for `append`', () => {
            let element = document.createElement('div');
            let appendedElement = document.createElement('div');
            let appendedOutlet = new Outlet(appendedElement);
            let stub = sinon.stub(element, 'appendChild');
            makeOutlet({
                el: element,
                append: appendedOutlet,
            });
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith(appendedElement);
            stub.restore();
        });

        it('can take an array for `append` with mixed types', () => {
            let element = document.createElement('div');
            let appendedElement1 = document.createElement('div');
            let appendedElement2 = document.createElement('div');
            let appendedOutlet = new Outlet(appendedElement1);
            let stub = sinon.stub(element, 'appendChild');
            makeOutlet({
                el: element,
                append: [appendedOutlet, appendedElement2],
            });
            stub.should.have.been.calledTwice;
            stub.should.have.been.calledWith(appendedElement1);
            stub.should.have.been.calledWith(appendedElement2);
            stub.restore();
        });
    });
});
