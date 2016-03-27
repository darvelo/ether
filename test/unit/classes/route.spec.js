import Route from '../../../src/classes/route';
import RootApp from '../../../src/classes/root-app';
import Expectable from '../../../src/classes/expectable';
import Outlet from '../../../src/classes/outlet';
import MutableOutlet from '../../../src/classes/mutable-outlet';

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe('Route', () => {
    let rootApp, defaultOpts;

    beforeEach(() => {
        rootApp = new RootApp({
            _pauseInitRunner: true,
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        });
        defaultOpts = {
            rootApp,
            parentApp: rootApp,
            addresses: [],
            outlets: {},
            params: [],
        };
    });

    describe('Constructor', () => {
        it('Route is an instance of Expectable', () => {
            expect(new TestRoute(defaultOpts)).to.be.an.instanceof(Expectable);
        });

        it('throws if not given a rootApp', () => {
            delete defaultOpts.rootApp;
            expect(() => new TestRoute(defaultOpts)).to.throw(TypeError, 'TestRoute constructor was not given a reference to the Ether RootApp.');
        });

        it('throws if not given a parentApp', () => {
            delete defaultOpts.parentApp;
            expect(() => new TestRoute(defaultOpts)).to.throw(TypeError, 'TestRoute constructor was not given a reference to its parentApp.');
        });

        it('adds itself to the RootApp\'s address registry', () => {
            class RouteWithAddresses extends Route {
                expectedAddresses() {
                    return ['first', 'second'];
                }
                addressesHandlers() {
                    return [function(){},function(){}];
                }
                expectedOutlets() {
                    return [];
                }
            }
            let rootApp = defaultOpts.rootApp;
            let addresses = defaultOpts.addresses = ['first', 'second'];
            addresses.forEach(name => expect(rootApp._atAddress(name)).to.not.be.ok);
            let route = new RouteWithAddresses(defaultOpts);
            addresses.forEach(name => expect(rootApp._atAddress(name)).to.equal(route));
        });

        it('stores passed-in outlets', () => {
            class RouteWithOutlets extends Route {
                expectedOutlets() {
                    return ['first', 'second'];
                }
            }
            let firstOutlet = new Outlet(document.createElement('div'));
            let secondOutlet = new Outlet(document.createElement('div'));
            defaultOpts.outlets = {
                first: firstOutlet,
                second: secondOutlet,
            };
            let route = new RouteWithOutlets(defaultOpts);
            expect(route).to.have.property('outlets');
            expect(route.outlets).to.be.an('object');
            expect(route.outlets.first).to.equal(firstOutlet);
            expect(route.outlets.second).to.equal(secondOutlet);
        });

        it('calls init() after outlets are available', done => {
            let outlet = new MutableOutlet(document.createElement('div'));
            defaultOpts.outlets.myOutlet = outlet;
            let spy = sinon.spy(function(instance) {
                expect(instance.outlets).to.deep.equal({
                    myOutlet: outlet,
                });
            });
            class RouteWithOutlets extends TestRoute {
                expectedOutlets() {
                    return ['myOutlet'];
                }
                init() {
                    spy(this);
                }
            }
            let route = new RouteWithOutlets(defaultOpts);
            rootApp._inits.play();
            rootApp._inits.then(() => {
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledWith(route);
                done();
            }).catch(done);
        });

        it('passes options.setup to init()', done => {
            defaultOpts.setup = [1, 2, 3];
            let spy = sinon.spy();
            class RouteWithSetup extends TestRoute {
                init(setup) {
                    expect(setup).to.deep.equal([1, 2, 3]);
                    spy();
                }
            }
            let route = new RouteWithSetup(defaultOpts);
            rootApp._inits.play();
            rootApp._inits.then(() => {
                spy.should.have.been.calledOnce;
                done();
            }).catch(done);
        });

        it('initializes the state object', () => {
            let route = new TestRoute(defaultOpts);
            expect(route.state).to.be.an('object');
            expect(Object.keys(route.state).sort()).to.deep.equal([
                'deactivating',
                'deactivated',
                'prerendering',
                'prerendered',
                'rendering',
                'rendered',
            ].sort());
        });

        it('sets the state object descriptor properly', () => {
            let route = new TestRoute(defaultOpts);
            expect(Object.getOwnPropertyDescriptor(route, 'state').configurable).to.equal(false);
            expect(() => delete route.state).to.throw();
            expect(() => route.state = {}).to.throw();
        });

        it('sets the state object\'s properties\' descriptors properly', () => {
            let route = new TestRoute(defaultOpts);
            for (let key of Object.keys(route.state)) {
                expect(Object.getOwnPropertyDescriptor(route.state, key).configurable).to.equal(false);
            }
        });

        it('seals the state object', () => {
            let route = new TestRoute(defaultOpts);
            expect(Object.isSealed(route.state)).to.equal(true);
        });

        it('sets state to "deactivated"', () => {
            let route = new TestRoute(defaultOpts);
            expect(route.state).to.deep.equal({
                deactivating: false,
                deactivated: true,
                prerendering: false,
                prerendered: false,
                rendering: false,
                rendered: false,
            });
        });

        it('adds only the CSS class "ether-deactivated" to all outlets to signify route state', () => {
            let deactivatedClass = 'ether-deactivated';
            let element1 = document.createElement('div');
            let element2 = document.createElement('div');
            defaultOpts.outlets = {
                first: new MutableOutlet(element1),
                second: new Outlet(element2),
            };
            class RouteWithOutlets extends Route {
                expectedOutlets() {
                    return ['first', 'second'];
                }
            }
            let route = new RouteWithOutlets(defaultOpts);
            expect(element1.className).to.equal(deactivatedClass);
            expect(element2.className).to.equal(deactivatedClass);
        });
    });

    describe('State', () => {
        it('throws when setting state to an unsupported value', () => {
            let state = 'nope';
            let route = new TestRoute(defaultOpts);
            expect(() => route._setState(state)).to.throw(Error, `TestRoute#_setState(): Tried to set state to an unsupported value: ${JSON.stringify(state)}.`);
        });

        it('throws when setting state CSS class to an unsupported value', () => {
            let state = 'nope';
            let route = new TestRoute(defaultOpts);
            expect(() => route._setOutletsState(state)).to.throw(Error, `TestRoute#_setOutletsState(): Tried to set outlets state to an unsupported value: ${JSON.stringify(state)}.`);
        });
    });
});
