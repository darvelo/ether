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
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            rootApp: new RootApp({
                outlets: {
                    main: new MutableOutlet(document.createElement('div')),
                },
            }),
            addresses: [],
            outlets: {},
            params: [],
        };
    });

    describe('Constructor', () => {
        it('Route is an instance of Expectable', () => {
            expect(new TestRoute(defaultOpts)).to.be.an.instanceof(Expectable);
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

        it('calls init() after outlets are available', () => {
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
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(route);
        });

        it('passes options.setup to init()', () => {
            defaultOpts.setup = [1, 2, 3];
            let spy = sinon.spy();
            class RouteWithSetup extends TestRoute {
                init(setup) {
                    expect(setup).to.deep.equal([1, 2, 3]);
                    spy();
                }
            }
            let route = new RouteWithSetup(defaultOpts);
            spy.should.have.been.calledOnce;
        });
    });
});
