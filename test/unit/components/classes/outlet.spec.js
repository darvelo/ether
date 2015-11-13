import Outlet from '../../../../src/classes/outlet.js';

class Owner { }

describe('Outlet', function() {
    var owner, outlet;

    before(function() {
        owner = new Owner();
    });

    describe('Owner methods', function() {
        beforeEach(function() {
            outlet = new Outlet(owner);
        });

        it('requires a reference to the owner', function() {
            expect(() => new Outlet()).to.throw(TypeError, 'Ether.Outlet requires an object for an owner.');
            expect(() => outlet.get(new Element())).to.throw(Error, 'Ether.Outlet#get() was called without the right reference to its owner.');
            expect(() => outlet.get(new Element(), {})).to.throw(Error, 'Ether.Outlet#get() was called without the right reference to its owner.');
            expect(() => outlet.hold(new Element())).to.throw(Error, 'Ether.Outlet#hold() was called without the right reference to its owner.');
            expect(() => outlet.hold(new Element(), {})).to.throw(Error, 'Ether.Outlet#hold() was called without the right reference to its owner.');
            expect(() => outlet.clear()).to.throw(Error, 'Ether.Outlet#clear() was called without the right reference to its owner.');
            expect(() => outlet.clear({})).to.throw(Error, 'Ether.Outlet#clear() was called without the right reference to its owner.');
        });

        it('actually stores an element', function () {
            var element = new Element();
            outlet = new Outlet(owner);
            expect(outlet.get(owner)).to.not.be.ok;
            outlet.hold(element, owner);
            expect(outlet.get(owner)).to.equal(element);
        });

        it('only allows holding an Element', function() {
            outlet = new Outlet(owner);
            outlet.hold(new Element(), owner);
            expect(() => outlet.hold({}, owner)).to.throw(TypeError, 'Ether.Outlet#hold() was called with an object that was not of type "Element".');
        });

        it('clears its element', function() {
            var element = new Element();
            var spy = sinon.spy();
            element.parentNode = {removeChild: spy};
            outlet = new Outlet(owner);
            outlet.hold(element, owner);
            expect(outlet.get(owner)).to.equal(element);
            outlet.clear(owner);
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(element);
            expect(outlet.get(owner)).to.not.be.ok;
        });
    });

    describe('DOM-delegating methods', function() {
        beforeEach(function() {
            outlet = new Outlet(owner);
        });

        it('appends a child element', function() {
            var element = new Element();
            var appended = new Element();
            var appended2 = new Element();
            var spy = element.appendChild = sinon.spy();

            expect(() => outlet.append({})).to.throw(TypeError, 'Ether.Outlet#append() was called with an object that was not of type "Element".');
            expect(() => outlet.append(element)).to.throw(Error, 'Ether.Outlet#append() was called but the outlet is not holding an element.');
            outlet.hold(element, owner);
            outlet.append(appended);
            spy.should.have.been.calledWith(appended);
            outlet.append(appended2);
            spy.should.have.been.calledWith(appended2);
            spy.should.have.been.calledTwice;
        });

        it('removes a child element', function() {
            var element = new Element();
            var appended = new Element();
            var appended2 = new Element();
            var spy = element.removeChild = sinon.spy();

            expect(() => outlet.remove({})).to.throw(TypeError, 'Ether.Outlet#remove() was called with an object that was not of type "Element".');
            expect(() => outlet.remove(element)).to.throw(Error, 'Ether.Outlet#remove() was called but the outlet is not holding an element.');
            outlet.hold(element, owner);
            outlet.remove(appended);
            spy.should.have.been.calledWith(appended);
            outlet.remove(appended2);
            spy.should.have.been.calledWith(appended2);
            spy.should.have.been.calledTwice;
        });

        it('passes through CSS selectors', function() {
            var element = new Element();
            var qs = element.querySelector = sinon.spy();
            var qsa = element.querySelectorAll = sinon.spy();

            expect(() => outlet.querySelector(element)).to.throw(Error, 'Ether.Outlet#querySelector() was called but the outlet is not holding an element.');
            expect(() => outlet.querySelectorAll(element)).to.throw(Error, 'Ether.Outlet#querySelectorAll() was called but the outlet is not holding an element.');
            outlet.hold(element, owner);
            outlet.querySelector('p.even');
            outlet.querySelectorAll('p.even');
            qs.should.have.been.calledOnce;
            qs.should.have.been.calledWith('p.even');
            qsa.should.have.been.calledOnce;
            qsa.should.have.been.calledWith('p.even');
        });
    });
});
