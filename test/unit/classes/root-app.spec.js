import RootApp from '../../../src/classes/root-app';
import App from '../../../src/classes/app';
import Route from '../../../src/classes/route';
import Expectable from '../../../src/classes/expectable';
import Outlet from '../../../src/classes/outlet';
import MutableOutlet from '../../../src/classes/mutable-outlet';

class TestApp extends App {
    expectedOutlets() {
        return [];
    }
}

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe('RootApp', () => {
    let defaultOpts;
    let childOpts;

    beforeEach(() => {
        defaultOpts = {
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            }
        };

        childOpts = {
            addresses: [],
            outlets: {},
            params: [],
        };
    });

    describe('Constructor', () => {
        it('RootApp is an instance of App', () => {
            expect(new RootApp(defaultOpts)).to.be.an.instanceof(App);
        });

        it('RootApp is an instance of Expectable', () => {
            expect(new RootApp(defaultOpts)).to.be.an.instanceof(Expectable);
        });

        it('runs without an object passed in', () => {
            class MyRootApp extends RootApp {
                expectedOutlets() { return []; }
            }
            let rootApp;
            expect(() => rootApp = new MyRootApp()).to.not.throw();
            expect(rootApp).to.be.an.instanceof(RootApp);
        });

        it('adds itself to the RootApp\'s address registry', () => {
            class RootAppWithAddresses extends RootApp {
                expectedAddresses() {
                    return ['first', 'second'];
                }
                addressesHandlers() {
                    return [function(){},function(){}];
                }
            }
            defaultOpts.addresses = ['first', 'second'];
            let rootApp = new RootAppWithAddresses(defaultOpts);
            defaultOpts.addresses.forEach(name => expect(rootApp._atAddress(name)).to.equal(rootApp));
        });

        it('stores passed-in outlets, allowing MutableOutlets', () => {
            class RootAppWithOutlets extends RootApp {
                expectedOutlets() {
                    return ['first', 'second'];
                }
            }
            let firstOutlet = new MutableOutlet(document.createElement('div'));
            let secondOutlet = new MutableOutlet(document.createElement('div'));
            defaultOpts.outlets = {
                first: firstOutlet,
                second: secondOutlet,
            };
            let rootApp = new RootAppWithOutlets(defaultOpts);
            expect(rootApp).to.have.property('outlets');
            expect(rootApp.outlets).to.be.an('object');
            expect(rootApp.outlets.first).to.equal(firstOutlet);
            expect(rootApp.outlets.second).to.equal(secondOutlet);
        });

        it('takes ownership of outlets returned by createOutlets', () => {
            let mainOutlet = defaultOpts.outlets.main;
            let outlet = new MutableOutlet(document.createElement('div'));
            class RootAppWithOutlets extends RootApp {
                createOutlets(outlets) {
                    outlets.myOutlet = outlet;
                    outlets.myMain = outlets.main;
                    delete outlets.main;
                    return outlets;
                }
            }
            let rootApp = new RootAppWithOutlets(defaultOpts);
            expect(rootApp.outlets).to.be.an('object');
            expect(rootApp.outlets.myOutlet).to.equal(outlet);
            expect(rootApp.outlets.myMain).to.equal(mainOutlet);
            expect(rootApp.outlets.main).to.not.be.ok;
        });

        it('calls init() after outlets are available', () => {
            let outlet = new MutableOutlet(document.createElement('div'));
            let spy = sinon.spy(function(instance) {
                expect(instance.outlets).to.deep.equal({
                    main: defaultOpts.outlets.main,
                    myOutlet: outlet,
                });
            });
            class RootAppWithOutlets extends RootApp {
                createOutlets(outlets) {
                    outlets.myOutlet = outlet;
                    return outlets;
                }
                init() {
                    spy(this);
                }
            }
            let rootApp = new RootAppWithOutlets(defaultOpts);
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(rootApp);
        });

        it('passes options.setup to init()', () => {
            defaultOpts.setup = [1, 2, 3];
            class RootAppWithSetup extends RootApp {
                init(setup) {
                    expect(setup).to.deep.equal([1, 2, 3]);
                }
            }
            let rootApp = new RootAppWithSetup(defaultOpts);
        });
    });

    describe('Registering Addresses', () => {
        it('registers adresses on itself', () => {
            let rootApp = new RootApp(defaultOpts);
            childOpts.rootApp = rootApp;
            childOpts.parentApp = rootApp;
            let route = new TestRoute(childOpts);
            expect(rootApp._atAddress('hello')).to.not.be.ok;
            rootApp._registerAddress('hello', route);
            expect(rootApp._atAddress('hello')).to.equal(route);
        });

        it('throws if an address contains a comma', () => {
            let rootApp = new RootApp(defaultOpts);
            childOpts.rootApp = rootApp;
            childOpts.parentApp = rootApp;
            expect(() => rootApp._registerAddress('hello,', new TestApp(childOpts))).to.throw(Error, 'Addresses cannot contain a comma: "hello,".');
            expect(() => rootApp._registerAddress(',hello', new TestApp(childOpts))).to.throw(Error, 'Addresses cannot contain a comma: ",hello".');
            expect(() => rootApp._registerAddress('he,llo', new TestApp(childOpts))).to.throw(Error, 'Addresses cannot contain a comma: "he,llo".');
        });

        it('throws on registering an address that is already taken', () => {
            let rootApp = new RootApp(defaultOpts);
            childOpts.rootApp = rootApp;
            childOpts.parentApp = rootApp;
            rootApp._registerAddress('hello', new TestApp(childOpts));
            expect(() => rootApp._registerAddress('hello', new TestRoute(childOpts))).to.throw(Error, 'RootApp address "hello" already taken. Could not register the address for TestRoute');
        });

        it('throws on registering an address if the dest is not an App or Route instance', () => {
            let rootApp = new RootApp(defaultOpts);
            childOpts.rootApp = rootApp;
            childOpts.parentApp = rootApp;
            expect(() => rootApp._registerAddress('hello', {})).to.throw(TypeError, 'RootApp cannot register an address for a non-App/non-Route instance, Object.');
            expect(() => rootApp._registerAddress('hello', new TestApp(childOpts))).to.not.throw();
            expect(() => rootApp._registerAddress('hello2', new TestRoute(childOpts))).to.not.throw();
        });
    });

    describe('Parsing Query String', () => {
        it('returns null if there are no query params', () => {
            let rootApp = new RootApp(defaultOpts);
            expect(rootApp._parseQueryString('')).to.equal(null);
            expect(rootApp._parseQueryString('?')).to.equal(null);
        });

        it('parses multiple query params when querystring has a question mark', () => {
            let rootApp = new RootApp(defaultOpts);
            expect(rootApp._parseQueryString('?x=10&y=20&z=hello')).to.deep.equal({
                x: '10',
                y: '20',
                z: 'hello',
            });
        });

        it('parses multiple query params when querystring has no question mark', () => {
            let rootApp = new RootApp(defaultOpts);
            expect(rootApp._parseQueryString('x=10&y=20&z=hello')).to.deep.equal({
                x: '10',
                y: '20',
                z: 'hello',
            });
        });

        it('decodes URI components', () => {
            let rootApp = new RootApp(defaultOpts);
            expect(rootApp._parseQueryString('x=yes%2C%20sir&y=%20&z=%3Chello%3E%20there')).to.deep.equal({
                x: 'yes, sir',
                y: ' ',
                z: '<hello> there',
            });
        });

        it('does not coerce whitespace to the number 0', () => {
            let rootApp = new RootApp(defaultOpts);
            expect(rootApp._parseQueryString('x=%20%09%0D%0A')).to.deep.equal({
                x: ' \t\r\n',
            });
        });

        it('turns strings `true` and `false` into boolean true and false', () => {
            let rootApp = new RootApp(defaultOpts);
            expect(rootApp._parseQueryString('x=true&y=false')).to.deep.equal({
                x: true,
                y: false,
            });
        });
    });

    describe('start()', () => {
        it('returns this', () => {
            let rootApp = new RootApp(defaultOpts).start();
            expect(rootApp).to.be.an.instanceof(RootApp);
        });
    });
});
