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

        it('clears its element from internal storage', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            expect(outlet.el).to.equal(element);
            outlet.clear();
            expect(outlet.el).to.not.be.ok;
        });

        it('clears its element from the DOM', () => {
            let parent = document.createElement('div');
            let element = document.createElement('div');
            parent.appendChild(element);
            let outlet = new MutableOutlet(element);
            let mock = sinon.mock(parent);
            mock.expects('removeChild').once().withArgs(element);
            outlet.clear();
            mock.verify();
        });

        it('clears its element when made to hold a new one', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            let stub = sinon.stub(outlet, 'clear');
            let newElement = document.createElement('div');
            outlet.el = newElement;
            stub.should.have.been.calledOnce;
            stub.restore();
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

        it('cannot get innerHTML if outlet is is cleared', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.innerHTML).to.throw(Error, 'MutableOutlet.innerHTML was being retrieved but the outlet is not holding an element.');
        });

        it('cannot set innerHTML if outlet is is cleared', () => {
            let html = '<span></span>';
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.innerHTML = html).to.throw(Error, 'MutableOutlet.innerHTML was being set but the outlet is not holding an element.');
            expect(element.innerHTML).to.equal('');
        });

        it('throws on appendChild() when not holding an element', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.appendChild(document.createElement('div'))).to.throw(Error, 'MutableOutlet#appendChild() was called but the outlet is not holding an element.');
        });

        it('throws on removeChild() when not holding an element', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.removeChild(document.createElement('div'))).to.throw(Error, 'MutableOutlet#removeChild() was called but the outlet is not holding an element.');
        });

        it('throws on querySelector() when not holding an element', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.querySelector(document.createElement('div'))).to.throw(Error, 'MutableOutlet#querySelector() was called but the outlet is not holding an element.');
        });

        it('throws on querySelectorAll() when not holding an element', () => {
            let element = document.createElement('div');
            let outlet = new MutableOutlet(element);
            outlet.clear();
            expect(() => outlet.querySelectorAll(element)).to.throw(Error, 'MutableOutlet#querySelectorAll() was called but the outlet is not holding an element.');
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
