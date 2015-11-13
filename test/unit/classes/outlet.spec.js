import Outlet from '../../../src/classes/outlet.js';

describe('Outlet', function() {
    describe('Constructor', function() {
        it('throws when passed a non-Element', function() {
            expect(() => new Outlet()).to.throw(TypeError, 'Ether.Outlet constructor was not passed an "Element" instance.');
            expect(() => new Outlet({})).to.throw(TypeError, 'Ether.Outlet constructor was not passed an "Element" instance.');
        });
    });

    describe('DOM-delegating methods', function() {
        it('appends a child element', function() {
            let element = new Element();
            let appended = new Element();
            let appended2 = new Element();
            let spy = element.appendChild = sinon.spy();
            let outlet = new Outlet(element);

            expect(() => outlet.append({})).to.throw(TypeError, 'Ether.Outlet#append() was not passed an "Element" instance.');

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
            let outlet = new Outlet(element);

            expect(() => outlet.remove({})).to.throw(TypeError, 'Ether.Outlet#remove() was not passed an "Element" instance.');

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
            let outlet = new Outlet(element);

            outlet.querySelector('p.even');
            outlet.querySelectorAll('p.odd');
            qs.should.have.been.calledOnce;
            qs.should.have.been.calledWith('p.even');
            qsa.should.have.been.calledOnce;
            qsa.should.have.been.calledWith('p.odd');
        });
    });
});
