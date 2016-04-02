import MutableOutlet from '../../../src/classes/mutable-outlet';
import Outlet from '../../../src/classes/outlet';

describe('MutableOutlet', () => {
    describe('Constructor', () => {
        it('creates an instance of Outlet', () => {
            let outlet = new MutableOutlet(document.createElement('div'));
            expect(outlet).to.be.an.instanceof(Outlet);
        });

        it('throws when passed a non-Element', () => {
            expect(() => new MutableOutlet()).to.throw(TypeError, 'MutableOutlet constructor was not passed an "Element" instance.');
            expect(() => new MutableOutlet({})).to.throw(TypeError, 'MutableOutlet constructor was not passed an "Element" instance.');
        });

        it('accepts a html string to construct an empty element', () => {
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
            expect(() => outlet = new MutableOutlet(html)).to.not.throw();
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith('div');
            expect(surrogate.innerHTML).to.equal(html);
            expect(outlet._element).to.equal(surrogate.children[0]);
            expect(outlet._element.innerHTML).to.equal(inner);
            stub.restore();
        });
    });

    describe('Non-mutating methods', () => {
        it('returns its element', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            expect(outlet.el).to.equal(element);
        });
    });

    describe('Mutating methods', () => {
        it('only allows holding an Element', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            expect(() => outlet.el = 1).to.throw(TypeError, 'MutableOutlet.el setter was not passed an "Element" instance.');
            expect(() => outlet.el = {}).to.throw(TypeError, 'MutableOutlet.el setter was not passed an "Element" instance.');
        });

        it('can set its element', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            expect(outlet.el).to.equal(element);
            let newElement = document.createElement('div');
            outlet.el = newElement;
            expect(outlet.el).to.equal(newElement);
        });
    });

    describe('DOM-delegating methods', () => {
        it('gets innerHTML', () => {
            let html = '<span></span>';
            let element = document.createElement('div');
            element.innerHTML = html;
            let outlet = new MutableOutlet(element);
            expect(outlet.innerHTML).to.equal(html);
        });

        it('sets innerHTML', () => {
            let html = '<span></span>';
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            expect(element.innerHTML).to.equal('');
            outlet.innerHTML = html;
            expect(element.innerHTML).to.equal(html);
        });

        it('appends a child element', () => {
            let element = document.createElement('div');
            let appended = document.createElement('div');
            let appended2 = document.createElement('div');
            let spy = element.appendChild = sinon.spy();
            let outlet = new MutableOutlet(element);

            expect(() => outlet.appendChild({})).to.throw(TypeError, 'MutableOutlet#appendChild() was not passed an "Element" instance.');
            outlet.appendChild(appended);
            spy.should.have.been.calledWith(appended);
            outlet.appendChild(appended2);
            spy.should.have.been.calledWith(appended2);
            spy.should.have.been.calledTwice;
        });

        it('removes a child element', () => {
            let element = document.createElement('div');
            let appended = document.createElement('div');
            let appended2 = document.createElement('div');
            let spy = element.removeChild = sinon.spy();
            let outlet = new MutableOutlet(element);

            expect(() => outlet.removeChild({})).to.throw(TypeError, 'MutableOutlet#removeChild() was not passed an "Element" instance.');
            outlet.removeChild(appended);
            spy.should.have.been.calledWith(appended);
            outlet.removeChild(appended2);
            spy.should.have.been.calledWith(appended2);
            spy.should.have.been.calledTwice;
        });

        it('passes through CSS selectors', () => {
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
