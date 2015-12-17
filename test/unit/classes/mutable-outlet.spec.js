import MutableOutlet from '../../../src/classes/mutable-outlet';
import Outlet from '../../../src/classes/outlet';

describe('MutableOutlet', function() {
    describe('Constructor', function() {
        it('creates an instance of Outlet', function () {
            let outlet = new MutableOutlet(document.createElement('div'));
            expect(outlet).to.be.an.instanceof(Outlet);
        });

        it('throws when passed a non-Element', function() {
            expect(() => new MutableOutlet()).to.throw(TypeError, 'MutableOutlet constructor was not passed an "Element" instance.');
            expect(() => new MutableOutlet({})).to.throw(TypeError, 'MutableOutlet constructor was not passed an "Element" instance.');
        });

        it('accepts a CSS selector', () => {
            let selector = '#myElement';
            let spy = sinon.spy(document, 'querySelector');
            expect(() => new MutableOutlet(selector)).to.throw();
            spy.should.have.been.calledOnce;
            spy.should.have.thrown;
            spy.restore();
            let element = document.createElement('div');
            let stub = sinon.stub(document, 'querySelector').returns(element);
            let outlet;
            expect(() => outlet = new MutableOutlet(selector)).to.not.throw();
            expect(outlet.get()).to.equal(element);
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith(selector);
            stub.restore();
        });
    });

    describe('Non-mutating methods', function() {
        it('returns its element', function() {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            expect(outlet.get()).to.equal(element);
        });
    });

    describe('Mutating methods', function() {
        it('only allows holding an Element', function() {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            expect(() => outlet.hold()).to.throw(TypeError, 'MutableOutlet#hold() was not passed an "Element" instance.');
            expect(() => outlet.hold({})).to.throw(TypeError, 'MutableOutlet#hold() was not passed an "Element" instance.');
        });

        it('clears its element from internal storage', function() {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            expect(outlet.get()).to.equal(element);
            outlet.clear();
            expect(outlet.get()).to.not.be.ok;
        });

        it('clears its element from the DOM', function() {
            let parent = document.createElement('div');
            let element = document.createElement('div');
            parent.appendChild(element);
            let outlet = new MutableOutlet(element);
            let mock = sinon.mock(parent);
            mock.expects('removeChild').once().withArgs(element);
            outlet.clear();
            mock.verify();
        });

        it('clears its element when made to hold a new one', function() {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            let stub = sinon.stub(outlet, 'clear');
            let newElement = document.createElement('div');
            outlet.hold(newElement);
            stub.should.have.been.calledOnce;
        });
    });

    describe('DOM-delegating methods', function() {
        it('throws on append() when not holding an element', function() {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.append(document.createElement('div'))).to.throw(Error, 'MutableOutlet#append() was called but the outlet is not holding an element.');
        });

        it('throws on remove() when not holding an element', function() {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.remove(document.createElement('div'))).to.throw(Error, 'MutableOutlet#remove() was called but the outlet is not holding an element.');
        });

        it('throws on querySelector() when not holding an element', function() {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.querySelector(document.createElement('div'))).to.throw(Error, 'MutableOutlet#querySelector() was called but the outlet is not holding an element.');
        });

        it('throws on querySelectorAll() when not holding an element', function() {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.querySelectorAll(element)).to.throw(Error, 'MutableOutlet#querySelectorAll() was called but the outlet is not holding an element.');
        });

        it('appends a child element', function() {
            let element = document.createElement('div');
            let appended = document.createElement('div');
            let appended2 = document.createElement('div');
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
            let element = document.createElement('div');
            let appended = document.createElement('div');
            let appended2 = document.createElement('div');
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
            let element = document.createElement('div');
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

