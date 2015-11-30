import Outlet from '../../../src/classes/outlet.js';

describe('Outlet', function() {
    describe('Constructor', function() {
        it('throws when passed a non-Element', function() {
            expect(() => new Outlet()).to.throw(TypeError, 'Outlet constructor was not passed an "Element" instance.');
            expect(() => new Outlet({})).to.throw(TypeError, 'Outlet constructor was not passed an "Element" instance.');
        });
    });

    describe('DOM-delegating methods', function() {
        it('appends a child element', function() {
            let element = new Element();
            let appended = new Element();
            let appended2 = new Element();
            let stub = sinon.stub(element, 'appendChild');
            let outlet = new Outlet(element);

            expect(() => outlet.append({})).to.throw(TypeError, 'Outlet#append() was not passed an "Element" instance.');

            outlet.append(appended);
            stub.should.have.been.calledWith(appended);
            outlet.append(appended2);
            stub.should.have.been.calledWith(appended2);
            stub.should.have.been.calledTwice;
        });

        it('removes a child element', function() {
            let element = new Element();
            let appended = new Element();
            let appended2 = new Element();
            let stub = sinon.stub(element, 'removeChild');
            let outlet = new Outlet(element);

            expect(() => outlet.remove({})).to.throw(TypeError, 'Outlet#remove() was not passed an "Element" instance.');

            outlet.remove(appended);
            stub.should.have.been.calledWith(appended);
            outlet.remove(appended2);
            stub.should.have.been.calledWith(appended2);
            stub.should.have.been.calledTwice;
        });

        it('passes through CSS selectors', function() {
            let element = new Element();
            let outlet = new Outlet(element);
            let mock = sinon.mock(element);
            mock.expects('querySelector').once().withArgs('p.even');
            mock.expects('querySelectorAll').once().withArgs('p.odd');
            outlet.querySelector('p.even');
            outlet.querySelectorAll('p.odd');
            mock.verify();
        });
    });
});
