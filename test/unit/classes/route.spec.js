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
    });

    describe('DOMEvents', () => {
        describe('DOMListen', () => {
            it('throws when not given an Element instance', () => {
                expect(() => new TestRoute(defaultOpts).DOMListen({}, 'click', function(){})).to.throw(TypeError, 'Route#DOMListen() was not passed an Element instance.');
            });

            it('throws when DOMListen callback is not a function', () => {
                let route = new TestRoute(defaultOpts);
                expect(() => route.DOMListen(document.createElement('div'), 'click')).to.throw(TypeError,  'Route#DOMListen() was not passed a callback that was a function type.');
            });

            it('adds an event callback without a context', () => {
                let route = new TestRoute(defaultOpts);
                let spy = route.handleClick = sinon.spy();
                let element = document.createElement('div');
                route.DOMListen(element, 'click', route.handleClick);
                element.click();
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(undefined);
            });

            it('adds an event callback with a context', () => {
                let route = new TestRoute(defaultOpts);
                let spy = route.handleClick = sinon.spy();
                let element = document.createElement('div');
                route.DOMListen(element, 'click', route.handleClick, route);
                element.click();
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(route);
            });

            it('adds a callback only for the element passed in', () => {
                let route = new TestRoute(defaultOpts);
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                route.DOMListen(element1, 'click', spy1);
                route.DOMListen(element2, 'click', spy2);
                element1.click();
                spy1.should.have.been.calledOnce;
                spy2.should.not.have.been.called;
                element2.click();
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
            });
        });

        describe('DOMUnlisten', () => {
            it('throws when not given an Element instance', () => {
                expect(() => new TestRoute(defaultOpts).DOMUnlisten({}, 'click', function(){})).to.throw(TypeError, 'Route#DOMUnlisten() was not passed an Element instance.');
            });

            it('only removes a callback when the context matches', () => {
                let route = new TestRoute(defaultOpts);
                let spy = route.handleClick = sinon.spy();
                let element = document.createElement('div');
                route.DOMListen(element, 'click', route.handleClick, route);
                route.DOMUnlisten(element, 'click', route.handleClick);
                element.click();
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(route);
                route.DOMUnlisten(element, 'click', route.handleClick, route);
                element.click();
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledOn(route);
            });

            it('removes all callbacks when not passed a specific callback function to remove', () => {
                let route = new TestRoute(defaultOpts);
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                let element = document.createElement('div');
                route.DOMListen(element, 'click', spy1);
                route.DOMListen(element, 'click', spy2, route);
                element.click();
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
                route.DOMUnlisten(element, 'click');
                element.click();
                spy1.should.have.been.calledOnce;
                spy2.should.have.been.calledOnce;
            });

            it('removes a callback only for the element passed in', () => {
                let route = new TestRoute(defaultOpts);
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                route.DOMListen(element1, 'click', spy1);
                route.DOMListen(element2, 'click', spy2);
                route.DOMUnlisten(element1, 'click', spy1);
                element1.click();
                element2.click();
                spy1.should.not.have.been.called;
                spy2.should.have.been.calledOnce;
                route.DOMUnlisten(element2, 'click', spy2);
                element1.click();
                element2.click();
                spy1.should.not.have.been.called;
                spy2.should.have.been.calledOnce;
            });

            it('removes all callbacks only for the element passed in', () => {
                let route = new TestRoute(defaultOpts);
                let element1 = document.createElement('div');
                let element2 = document.createElement('div');
                let spy1 = sinon.spy();
                let spy2 = sinon.spy();
                let spy3 = sinon.spy();
                let spy4 = sinon.spy();
                route.DOMListen(element1, 'click', spy1);
                route.DOMListen(element1, 'click', spy2);
                route.DOMListen(element2, 'click', spy3);
                route.DOMListen(element2, 'click', spy4);
                route.DOMUnlisten(element1, 'click');
                element1.click();
                element2.click();
                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.calledOnce;
                spy4.should.have.been.calledOnce;
                route.DOMUnlisten(element2, 'click');
                element1.click();
                element2.click();
                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.calledOnce;
                spy4.should.have.been.calledOnce;
            });
        });
    });
});
