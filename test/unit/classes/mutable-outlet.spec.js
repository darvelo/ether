import MutableOutlet from '../../../src/classes/mutable-outlet.js';
import Outlet from '../../../src/classes/outlet.js';

describe('MutableOutlet', function() {
    describe('Constructor', function() {
        it('creates an instance of Outlet', function () {
            let outlet = new MutableOutlet(new Element());
            expect(outlet).to.be.an.instanceof(Outlet);
        });

        it('throws when passed a non-Element', function() {
            expect(() => new MutableOutlet()).to.throw(TypeError, 'MutableOutlet constructor was not passed an "Element" instance.');
            expect(() => new MutableOutlet({})).to.throw(TypeError, 'MutableOutlet constructor was not passed an "Element" instance.');
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
            expect(() => outlet.hold()).to.throw(TypeError, 'MutableOutlet#hold() was not passed an "Element" instance.');
            expect(() => outlet.hold({})).to.throw(TypeError, 'MutableOutlet#hold() was not passed an "Element" instance.');
        });

        it('clears its element from internal storage', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            expect(outlet.get()).to.equal(element);
            outlet.clear();
            expect(outlet.get()).to.not.be.ok;
        });

        it('clears its element from the DOM', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            let mock = sinon.mock(element.parentNode);
            mock.expects('removeChild').once().withArgs(element);
            outlet.clear();
            mock.verify();
        });

        it('clears its element when made to hold a new one', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            let stub = sinon.stub(outlet, 'clear');
            let newElement = new Element();
            outlet.hold(newElement);
            stub.should.have.been.calledOnce;
        });
    });

    describe('DOM-delegating methods', function() {
        it('throws on append() when not holding an element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.append(new Element())).to.throw(Error, 'MutableOutlet#append() was called but the outlet is not holding an element.');
        });

        it('throws on remove() when not holding an element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.remove(new Element())).to.throw(Error, 'MutableOutlet#remove() was called but the outlet is not holding an element.');
        });

        it('throws on querySelector() when not holding an element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.querySelector(new Element())).to.throw(Error, 'MutableOutlet#querySelector() was called but the outlet is not holding an element.');
        });

        it('throws on querySelectorAll() when not holding an element', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.querySelectorAll(element)).to.throw(Error, 'MutableOutlet#querySelectorAll() was called but the outlet is not holding an element.');
        });

        it('appends a child element', function() {
            let element = new Element();
            let appended = new Element();
            let appended2 = new Element();
            let spy = element.appendChild = sinon.spy();
            let outlet = new MutableOutlet(element);

            expect(() => outlet.append({})).to.throw(TypeError, 'MutableOutlet#append() was not passed an "Element" instance.');
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

            expect(() => outlet.remove({})).to.throw(TypeError, 'MutableOutlet#remove() was not passed an "Element" instance.');
            outlet.remove(appended);
            spy.should.have.been.calledWith(appended);
            outlet.remove(appended2);
            spy.should.have.been.calledWith(appended2);
            spy.should.have.been.calledTwice;
        });

        it('passes through CSS selectors', function() {
            let element = new Element();
            let outlet = new MutableOutlet(element);
            let mock = sinon.mock(element);
            mock.expects('querySelector').once().withArgs('p.even');
            mock.expects('querySelectorAll').once().withArgs('p.odd');
            outlet.querySelector('p.even');
            outlet.querySelectorAll('p.odd');
            mock.verify();
        });
    });
});

