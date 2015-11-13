import MutableOutlet from '../../../src/classes/mutable-outlet.js';
import Outlet from '../../../src/classes/outlet.js';

describe('MutableOutlet', function() {
    describe('Constructor', function() {
        it('creates an instance of Outlet', function () {
            let outlet = new MutableOutlet(new Element());
            expect(outlet).to.be.an.instanceof(Outlet);
        });

        it('throws when passed a non-Element', function() {
            expect(() => new MutableOutlet()).to.throw(TypeError, 'Ether.MutableOutlet constructor was not passed an "Element" instance.');
            expect(() => new MutableOutlet({})).to.throw(TypeError, 'Ether.MutableOutlet constructor was not passed an "Element" instance.');
        });
    });

    describe('Non-mutating methods', function() {
        it('returns its element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            expect(outlet.get()).to.equal(element);
        });
    });

    describe('Mutating methods', function() {
        it('only allows holding an Element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            expect(() => outlet.hold()).to.throw(TypeError, 'Ether.MutableOutlet#hold() was not passed an "Element" instance.');
            expect(() => outlet.hold({})).to.throw(TypeError, 'Ether.MutableOutlet#hold() was not passed an "Element" instance.');
        });

        it('clears its element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            let spy = sinon.spy();
            element.parentNode = {removeChild: spy};
            expect(outlet.get()).to.equal(element);
            outlet.clear();
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(element);
            expect(outlet.get()).to.not.be.ok;
        });

        it('clears its element when made to hold a new one', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            let spy = sinon.spy(outlet, 'clear');
            let newElement = new Element();
            outlet.hold(newElement);
            spy.should.have.been.calledOnce;
            expect(outlet.get()).to.equal(newElement);
        });
    });

    describe('DOM-delegating methods', function() {
        it('throws on append() when not holding an element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.append(new Element())).to.throw(Error, 'Ether.MutableOutlet#append() was called but the outlet is not holding an element.');
        });

        it('throws on remove() when not holding an element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.remove(new Element())).to.throw(Error, 'Ether.MutableOutlet#remove() was called but the outlet is not holding an element.');
        });

        it('throws on querySelector() when not holding an element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.querySelector(new Element())).to.throw(Error, 'Ether.MutableOutlet#querySelector() was called but the outlet is not holding an element.');
        });

        it('throws on querySelectorAll() when not holding an element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.querySelectorAll(element)).to.throw(Error, 'Ether.MutableOutlet#querySelectorAll() was called but the outlet is not holding an element.');
        });

        it('appends a child element', function() {
            let element = new Element();
            let appended = new Element();
            let appended2 = new Element();
            let spy = element.appendChild = sinon.spy();
            let outlet = new MutableOutlet(element);

            expect(() => outlet.append({})).to.throw(TypeError, 'Ether.MutableOutlet#append() was not passed an "Element" instance.');
            outlet.append(appended);
            spy.should.have.been.calledWith(appended);
            outlet.append(appended2);
            spy.should.have.been.calledWith(appended2);
            spy.should.have.been.calledTwice;
        });

        it('removes a child element', function() {
            let element = new Element();
            let appended = new Element();
            let appended2 = new Element();
            let spy = element.removeChild = sinon.spy();
            let outlet = new MutableOutlet(element);

            expect(() => outlet.remove({})).to.throw(TypeError, 'Ether.MutableOutlet#remove() was not passed an "Element" instance.');
            outlet.remove(appended);
            spy.should.have.been.calledWith(appended);
            outlet.remove(appended2);
            spy.should.have.been.calledWith(appended2);
            spy.should.have.been.calledTwice;
        });

        it('passes through CSS selectors', function() {
            let element = new Element();
            let qs = element.querySelector = sinon.spy();
            let qsa = element.querySelectorAll = sinon.spy();
            let outlet = new MutableOutlet(element);

            outlet.hold(element);
            outlet.querySelector('p.even');
            outlet.querySelectorAll('p.odd');
            qs.should.have.been.calledOnce;
            qs.should.have.been.calledWith('p.even');
            qsa.should.have.been.calledOnce;
            qsa.should.have.been.calledWith('p.odd');
        });
    });
});

