import Outlet from '../../../src/classes/outlet';

describe('Outlet', () => {
    describe('Constructor', () => {
        it('throws when passed a non-Element', () => {
            expect(() => new Outlet()).to.throw(TypeError, 'Outlet constructor was not passed an "Element" instance.');
            expect(() => new Outlet({})).to.throw(TypeError, 'Outlet constructor was not passed an "Element" instance.');
        });

        it('accepts a html string to construct an element', () => {
            let inner = '<a href="go.html">Hello!</a>';
            let html = `<span>${inner}</span>`;
            let surrogate = document.createElement('div');
            var span;

            // for mocked browser environment
            // we have to mock the parsing and extraction process
            if (window.EtherTestEnvironment) {
                span = document.createElement('span');
                Object.defineProperties(span, {
                    'innerHTML': {
                        get() {
                            return inner;
                        },
                    }
                });
                Object.defineProperties(surrogate, {
                    'innerHTML': {
                        get() {
                            return this._innerHTML;
                        },
                        set() {
                            // Outlet internal code should clear
                            // the innerHTML of the child element.
                            // though it's not done on setting
                            // surrogate.innerHTML in a browser env,
                            // we do it here for simplicity's sake.
                            this._innerHTML = html;
                            this._children = [span];
                        }
                    },
                });
            }

            let stub = sinon.stub(document, 'createElement').returns(surrogate);
            let outlet;
            expect(() => outlet = new Outlet(html)).to.not.throw();
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith('div');
            expect(surrogate.innerHTML).to.equal(html);
            expect(outlet._element).to.equal(surrogate.children[0]);
            expect(outlet._element.innerHTML).to.equal(inner);
            stub.restore();
        });
    });

    it('empties its HTML', () => {
        let element = document.createElement('div');
        let outlet = new Outlet(element);
        outlet.append(document.createElement('div'));
        outlet.append(document.createElement('div'));
        outlet.empty();
        element.innerHTML.should.equal('');
    });

    describe('DOM-delegating methods', () => {
        it('gets innerHTML', () => {
            let html = '<span></span>';
            let element = document.createElement('div');
            element.innerHTML = html;
            let outlet = new Outlet(element);
            expect(outlet.innerHTML).to.equal(html);
        });

        it('cannot set innerHTML', () => {
            let html = '<span></span>';
            let element = document.createElement('div');
            let outlet = new Outlet(element);
            expect(element.innerHTML).to.equal('');
            expect(() => outlet.innerHTML = html).to.throw(Error, 'Outlet.innerHTML cannot be set. Try using a MutableOutlet instead.');
            expect(element.innerHTML).to.equal('');
        });

        it('appends a child element', () => {
            let element = document.createElement('div');
            let appended = document.createElement('div');
            let appended2 = document.createElement('div');
            let stub = sinon.stub(element, 'appendChild');
            let outlet = new Outlet(element);

            expect(() => outlet.append({})).to.throw(TypeError, 'Outlet#append() was not passed an "Element" instance.');

            outlet.append(appended);
            stub.should.have.been.calledWith(appended);
            outlet.append(appended2);
            stub.should.have.been.calledWith(appended2);
            stub.should.have.been.calledTwice;
            stub.restore();
        });

        it('removes a child element', () => {
            let element = document.createElement('div');
            let appended = document.createElement('div');
            let appended2 = document.createElement('div');
            let stub = sinon.stub(element, 'removeChild');
            let outlet = new Outlet(element);

            expect(() => outlet.remove({})).to.throw(TypeError, 'Outlet#remove() was not passed an "Element" instance.');

            outlet.remove(appended);
            stub.should.have.been.calledWith(appended);
            outlet.remove(appended2);
            stub.should.have.been.calledWith(appended2);
            stub.should.have.been.calledTwice;
            stub.restore();
        });

        it('passes through CSS selectors', () => {
            let element = document.createElement('div');
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
