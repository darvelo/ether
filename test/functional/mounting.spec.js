import App from '../../src/classes/app';
import RootApp from '../../src/classes/root-app';
import Route from '../../src/classes/route';
import Outlet from '../../src/classes/outlet';
import MutableOutlet from '../../src/classes/mutable-outlet';

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

class OneAddressApp extends TestApp {
    addressesHandlers() {
        return [function(){}];
    }
}

class OneAddressRoute extends TestRoute {
    addressesHandlers() {
        return [function(){}];
    }
}

class TwoAddressApp extends TestApp {
    addressesHandlers() {
        return [function(){},function(){}];
    }
}

class TwoAddressRoute extends TestRoute {
    addressesHandlers() {
        return [function(){},function(){}];
    }
}

describe('Mounting Functional Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            rootApp: true,
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        };
    });

    describe('Child Instantiation', () => {
        describe('Addresses', () => {
            it('provides no addresses to child routes and apps that haven\'t used the Addressable modifier', () => {
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            'abc': TestApp,
                            'xyz': TestRoute,
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': TestRoute,
                        };
                    }
                }
                let spy = sinon.spy(MyRootApp.prototype, '_registerAddress');
                let rootApp = new MyRootApp(defaultOpts);
                spy.should.not.have.been.called;
                spy.restore();
            });

            it('registers addresses of child routes and apps', () => {
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            '123': AddressApp.addresses('addressApp'),
                            '456': AddressRoute.addresses('addressRoute'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': AddressConditionalRoute.addresses('addressConditionalRoute'),
                        };
                    }
                }
                class AddressApp extends OneAddressApp {
                    expectedAddresses() {
                        return ['addressApp'];
                    }
                    mount() {
                        return {
                            'abc': ChildApp.addresses('anApp', 'sameApp'),
                            'xyz': ChildRoute.addresses('aRoute', 'sameRoute'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': ChildConditionalRoute.addresses('conditional', 'starRoute'),
                        };
                    }
                }
                class AddressRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['addressRoute'];
                    }
                }
                class AddressConditionalRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['addressConditionalRoute'];
                    }
                }
                class ChildApp extends TwoAddressApp {
                    expectedAddresses() {
                        return ['sameApp', 'anApp'];
                    }
                }
                class ChildRoute extends TwoAddressRoute {
                    expectedAddresses() {
                        return ['sameRoute', 'aRoute'];
                    }
                }
                class ChildConditionalRoute extends TwoAddressRoute {
                    expectedAddresses() {
                        return ['starRoute', 'conditional'];
                    }
                }
                let rootApp = new MyRootApp(defaultOpts);
                expect(rootApp._atAddress('addressApp')).to.be.an.instanceof(AddressApp);
                expect(rootApp._atAddress('addressRoute')).to.be.an.instanceof(AddressRoute);
                expect(rootApp._atAddress('addressConditionalRoute')).to.be.an.instanceof(AddressConditionalRoute);
                expect(rootApp._atAddress('anApp')).to.equal(rootApp._atAddress('sameApp'));
                expect(rootApp._atAddress('anApp')).to.be.an.instanceof(ChildApp);
                expect(rootApp._atAddress('aRoute')).to.equal(rootApp._atAddress('sameRoute'));
                expect(rootApp._atAddress('aRoute')).to.be.an.instanceof(ChildRoute);
                expect(rootApp._atAddress('conditional')).to.equal(rootApp._atAddress('starRoute'));
                expect(rootApp._atAddress('conditional')).to.be.an.instanceof(ChildConditionalRoute);
            });
        });

        describe('Outlets', () => {
            it('passes outlets to child routes and apps', () => {
                // we'll need to use addresses to get
                // references to the actual App/Route instances
                //
                // we'll also need references to the outlets to
                // check that they're assigned to the right Apps/Routes
                let outlet1_1 = new Outlet(document.createElement('div'));
                let outlet1_2 = new Outlet(document.createElement('div'));
                let outlet2_1 = new Outlet(document.createElement('div'));
                let outlet2_2 = new Outlet(document.createElement('div'));
                let outlet3_1 = new Outlet(document.createElement('div'));
                let outlet3_2 = new Outlet(document.createElement('div'));
                let outlet4_1 = new Outlet(document.createElement('div'));
                let outlet4_2 = new Outlet(document.createElement('div'));
                let outlet5_1 = new Outlet(document.createElement('div'));
                let outlet5_2 = new Outlet(document.createElement('div'));
                let outlet6_1 = new Outlet(document.createElement('div'));
                let outlet6_2 = new Outlet(document.createElement('div'));
                defaultOpts.outlets['1_1'] = outlet1_1;

                class MyRootApp extends RootApp {
                    expectedOutlets() {
                        return ['main', '1_1'];
                    }
                    createOutlets(outlets) {
                        expect(outlets['1_1']).to.equal(outlet1_1);
                        outlets['1_2'] = outlet1_2;
                        outlets['2_1'] = outlet2_1;
                        outlets['2_2'] = outlet2_2;
                        outlets['3_1'] = outlet3_1;
                        outlets['3_2'] = outlet3_2;
                        outlets['4_1'] = outlet4_1;
                        outlets['4_2'] = outlet4_2;
                        outlets['5_1'] = outlet5_1;
                        outlets['5_2'] = outlet5_2;
                        outlets['6_1'] = outlet6_1;
                        outlets['6_2'] = outlet6_2;
                        return outlets;
                    }
                    mount() {
                        return {
                            '123': OutletApp.addresses('1').outlets('1_1', '1_2', '4_1', '4_2', '5_1', '5_2', '6_1', '6_2'),
                            '456': OutletRoute.addresses('2').outlets('2_1', '2_2'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': OutletConditionalRoute.addresses('3').outlets('3_1', '3_2'),
                        };
                    }
                }
                class OutletApp extends OneAddressApp {
                    expectedAddresses() {
                        return ['1'];
                    }
                    expectedOutlets() {
                        return ['1_1', '1_2', '4_1', '4_2', '5_1', '5_2', '6_1', '6_2'];
                    }
                    createOutlets(outlets) {
                        // outlets are inherited from parent app
                        // so we don't need to do anything here
                        return outlets;
                    }
                    mount() {
                        return {
                            'abc': ChildApp.addresses('4').outlets('4_1', '4_2'),
                            'xyz': ChildRoute.addresses('5').outlets('5_1', '5_2'),
                            // these will throw errors if any outlets are passed to them,
                            // for added insurance that outlets are being passed properly
                            'alpha': TestApp,
                            'omega': TestRoute,
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': ChildConditionalRoute.addresses('6').outlets('6_1', '6_2'),
                        };
                    }
                }
                // createOutlets() defaults to returning the inherited outlets,
                // so for the rest of these, no explicit outlet assignments need to be done
                class OutletRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['2'];
                    }
                    expectedOutlets() {
                        return ['2_1', '2_2'];
                    }
                }
                class OutletConditionalRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['3'];
                    }
                    expectedOutlets() {
                        return ['3_1', '3_2'];
                    }
                }
                class ChildApp extends OneAddressApp {
                    expectedAddresses() {
                        return ['4'];
                    }
                    expectedOutlets() {
                        return ['4_1', '4_2'];
                    }
                }
                class ChildRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['5'];
                    }
                    expectedOutlets() {
                        return ['5_1', '5_2'];
                    }
                }
                class ChildConditionalRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['6'];
                    }
                    expectedOutlets() {
                        return ['6_1', '6_2'];
                    }
                }
                let rootApp = new MyRootApp(defaultOpts);
                expect(rootApp._atAddress('1')).to.be.an.instanceof(OutletApp);
                expect(rootApp._atAddress('1').outlets).to.deep.equal({
                    '1_1': outlet1_1,
                    '1_2': outlet1_2,
                    '4_1': outlet4_1,
                    '4_2': outlet4_2,
                    '5_1': outlet5_1,
                    '5_2': outlet5_2,
                    '6_1': outlet6_1,
                    '6_2': outlet6_2,
                });
                expect(rootApp._atAddress('2')).to.be.an.instanceof(OutletRoute);
                expect(rootApp._atAddress('2').outlets).to.deep.equal({
                    '2_1': outlet2_1,
                    '2_2': outlet2_2,
                });
                expect(rootApp._atAddress('3')).to.be.an.instanceof(OutletConditionalRoute);
                expect(rootApp._atAddress('3').outlets).to.deep.equal({
                    '3_1': outlet3_1,
                    '3_2': outlet3_2,
                });
                expect(rootApp._atAddress('4')).to.be.an.instanceof(ChildApp);
                expect(rootApp._atAddress('4').outlets).to.deep.equal({
                    '4_1': outlet4_1,
                    '4_2': outlet4_2,
                });
                expect(rootApp._atAddress('5')).to.be.an.instanceof(ChildRoute);
                expect(rootApp._atAddress('5').outlets).to.deep.equal({
                    '5_1': outlet5_1,
                    '5_2': outlet5_2,
                });
                expect(rootApp._atAddress('6')).to.be.an.instanceof(ChildConditionalRoute);
                expect(rootApp._atAddress('6').outlets).to.deep.equal({
                    '6_1': outlet6_1,
                    '6_2': outlet6_2,
                });
            });

            it('throws if two mounts are sent the same outlet', () => {
                class TwoOutletsRoute extends TestRoute {
                    expectedOutlets() {
                        return ['first', 'second'];
                    }
                }
                class ThreeOutletsRoute extends TestRoute {
                    expectedOutlets() {
                        return ['first', 'second', 'third'];
                    }
                }
                class MyRootApp extends RootApp {
                    createOutlets() {
                        return {
                            first:  new Outlet(document.createElement('div')),
                            second: new Outlet(document.createElement('div')),
                            third:  new Outlet(document.createElement('div')),
                        };
                    }
                    mount() {
                        return {
                            'abc': TwoOutletsRoute.outlets('first', 'second'),
                            'xyz': ThreeOutletsRoute.outlets('first', 'second', 'third'),
                        };
                    }
                }
                expect(() => new MyRootApp(defaultOpts)).to.throw('MyRootApp tried to send these outlets to more than one mount: ["first","second"].');
            });

            it('throws if two conditional mounts are sent the same outlet', () => {
                class TwoOutletsRoute extends TestRoute {
                    expectedOutlets() {
                        return ['first', 'second'];
                    }
                }
                class ThreeOutletsRoute extends TestRoute {
                    expectedOutlets() {
                        return ['first', 'second', 'third'];
                    }
                }
                class FirstAddressRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['first'];
                    }
                }
                class SecondAddressRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['second'];
                    }
                }
                class MyRootApp extends RootApp {
                    createOutlets() {
                        return {
                            first:  new Outlet(document.createElement('div')),
                            second: new Outlet(document.createElement('div')),
                            third:  new Outlet(document.createElement('div')),
                        };
                    }
                    mount() {
                        return {
                            'abc': FirstAddressRoute.addresses('first'),
                            'xyz': SecondAddressRoute.addresses('second'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '+first': TwoOutletsRoute.outlets('first', 'second'),
                            '+second': [ThreeOutletsRoute.outlets('first', 'second', 'third')],
                        };
                    }
                }
                expect(() => new MyRootApp(defaultOpts)).to.throw('MyRootApp tried to send these outlets to more than one mount: ["first","second"].');
            });

            it('throws if a mount and conditional mount are sent the same outlet', () => {
                class FirstAddressRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['first'];
                    }
                    expectedOutlets() {
                        return ['first'];
                    }
                }
                class SecondAddressRoute extends OneAddressRoute {
                    expectedAddresses() {
                        return ['second'];
                    }
                    expectedOutlets() {
                        return ['second'];
                    }
                }
                class BothOutletsRoute extends TestRoute {
                    expectedOutlets() {
                        return ['first', 'second'];
                    }
                }
                class MyRootApp extends RootApp {
                    createOutlets() {
                        return {
                            first:  new Outlet(document.createElement('div')),
                            second: new Outlet(document.createElement('div')),
                        };
                    }
                    mount() {
                        return {
                            'abc': FirstAddressRoute.addresses('first').outlets('first'),
                            'xyz': SecondAddressRoute.addresses('second').outlets('second'),
                        };
                    }
                    mountConditionals() {
                        return {
                            '+first': BothOutletsRoute.outlets('first', 'second'),
                        };
                    }
                }
                expect(() => new MyRootApp(defaultOpts)).to.throw('MyRootApp tried to send these outlets to more than one mount: ["first","second"].');
            });
        });

        describe('Params', () => {
            it('compounds params before passing them to child routes and apps', () => {
                class ParamRoute extends TestRoute { expectedParams() { return ['id']; } }
                class ParamConditionalRoute extends TestRoute { expectedParams() { return []; } }
                class ChildRoute extends TestRoute {
                    expectedParams() {
                        return ['name', 'action'];
                    }
                }
                class ChildConditionalRoute extends TestRoute {
                    expectedParams() {
                        return ['name'];
                    }
                }
                class ParamApp extends TestApp {
                    expectedParams() {
                        return ['name'];
                    }
                    mount() {
                        return {
                            '/xyz/{action=\\w+}': ChildRoute,
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': ChildConditionalRoute,
                        };
                    }
                }
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            '/abc/{name=\\w+}': ParamApp,
                            '/abc/{id=\\d+}': ParamRoute,
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': ParamConditionalRoute,
                        };
                    }
                }
                expect(() => new MyRootApp(defaultOpts)).to.not.throw();
            });
        });

        describe('User-Defined Setup', () => {
            it('calls setupFns in order', () => {
                let appSpy1 = sinon.spy();
                let appSpy2 = sinon.spy();
                let routeSpy1 = sinon.spy();
                let routeSpy2 = sinon.spy();
                let conditionalRoute1Spy1 = sinon.spy();
                let conditionalRoute1Spy2 = sinon.spy();
                let conditionalRoute2Spy1 = sinon.spy();
                let conditionalRoute2Spy2 = sinon.spy();
                class SetupApp extends TestApp { }
                class SetupRoute extends TestRoute { }
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            'abc': SetupApp.setup(appSpy1, appSpy2),
                            'xyz': SetupRoute.setup(routeSpy1, routeSpy2),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': [
                                SetupRoute.setup(conditionalRoute1Spy1, conditionalRoute1Spy2),
                                SetupRoute.setup(conditionalRoute2Spy1, conditionalRoute2Spy2),
                            ],
                        };
                    }
                }
                let rootApp = new MyRootApp(defaultOpts);
                appSpy2.should.have.been.calledAfter(appSpy1);
                routeSpy2.should.have.been.calledAfter(routeSpy1);
                conditionalRoute1Spy2.should.have.been.calledAfter(conditionalRoute1Spy1);
                conditionalRoute2Spy2.should.have.been.calledAfter(conditionalRoute2Spy1);
            });

            it('passes the cumulative result of the return values of all setupFns to expectedSetup() and init()', () => {
                let appFns = [
                    function() { return 1; },
                    function(num) { return {app: num+1}; },
                ];
                let routeFns = [
                    function() { return 1; },
                    function(num) { return {route: num+1}; },
                ];
                let conditionalRoute1Fns = [
                    function() { return 1; },
                    function(num) { return {cond1: num+1}; },
                ];
                let conditionalRoute2Fns = [
                    function() { return 1; },
                    function(num) { return {cond2: num+1}; },
                ];
                let childAppFns = [
                    function() { return 1; },
                    function(num) { return {childApp: num+1}; },
                ];
                let childRouteFns = [
                    function() { return 1; },
                    function(num) { return {childRoute: num+1}; },
                ];
                let childConditionalRoute1Fns = [
                    function() { return 1; },
                    function(num) { return {childCond1: num+1}; },
                ];
                let childConditionalRoute2Fns = [
                    function() { return 1; },
                    function(num) { return {childCond2: num+1}; },
                ];
                class ChildApp extends TestApp {
                    expectedSetup() { }
                    init() { }
                }
                class ChildRoute extends TestRoute {
                    expectedSetup() { }
                    init() { }
                }
                class SetupApp extends TestApp {
                    expectedSetup() { }
                    init() { }
                    mount() {
                        return {
                            'abc': ChildApp.setup(...childAppFns),
                            'xyz': ChildRoute.setup(...childRouteFns),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': [
                                ChildRoute.setup(...childConditionalRoute1Fns),
                                ChildRoute.setup(...childConditionalRoute2Fns),
                            ],
                        };
                    }
                }
                class SetupRoute extends TestRoute {
                    expectedSetup() { }
                    init() { }
                }
                class MyRootApp extends RootApp {
                    expectedSetup() { }
                    init() { }
                    mount() {
                        return {
                            'abc': SetupApp.setup(...appFns),
                            'xyz': SetupRoute.setup(...routeFns),
                        };
                    }
                    mountConditionals() {
                        return {
                            '*': [
                                SetupRoute.setup(...conditionalRoute1Fns),
                                SetupRoute.setup(...conditionalRoute2Fns),
                            ],
                        };
                    }
                }
                let appExpectedSpy = sinon.spy(SetupApp.prototype, 'expectedSetup');
                let routeExpectedSpy = sinon.spy(SetupRoute.prototype, 'expectedSetup');

                let appInitSpy = sinon.spy(SetupApp.prototype, 'init');
                let routeInitSpy = sinon.spy(SetupRoute.prototype, 'init');

                let childAppExpectedSpy = sinon.spy(ChildApp.prototype, 'expectedSetup');
                let childRouteExpectedSpy = sinon.spy(ChildRoute.prototype, 'expectedSetup');

                let childAppInitSpy = sinon.spy(ChildApp.prototype, 'init');
                let childRouteInitSpy = sinon.spy(ChildRoute.prototype, 'init');

                let rootApp = new MyRootApp(defaultOpts);

                appExpectedSpy.should.have.been.calledOnce;
                appExpectedSpy.should.have.been.calledWith({app: 2});
                routeExpectedSpy.should.have.been.callThrice;
                routeExpectedSpy.should.have.been.calledWith({route: 2});
                routeExpectedSpy.should.have.been.calledWith({cond1: 2});
                routeExpectedSpy.should.have.been.calledWith({cond2: 2});

                appInitSpy.should.have.been.calledOnce;
                appInitSpy.should.have.been.calledWith({app: 2});
                routeInitSpy.should.have.been.callThrice;
                routeInitSpy.should.have.been.calledWith({route: 2});
                routeInitSpy.should.have.been.calledWith({cond1: 2});
                routeInitSpy.should.have.been.calledWith({cond2: 2});

                childAppExpectedSpy.should.have.been.calledOnce;
                childAppExpectedSpy.should.have.been.calledWith({childApp: 2});
                childRouteExpectedSpy.should.have.been.callThrice;
                childRouteExpectedSpy.should.have.been.calledWith({childRoute: 2});
                childRouteExpectedSpy.should.have.been.calledWith({childCond1: 2});
                childRouteExpectedSpy.should.have.been.calledWith({childCond2: 2});

                childAppInitSpy.should.have.been.calledOnce;
                childAppInitSpy.should.have.been.calledWith({childApp: 2});
                childRouteInitSpy.should.have.been.callThrice;
                childRouteInitSpy.should.have.been.calledWith({childRoute: 2});
                childRouteInitSpy.should.have.been.calledWith({childCond1: 2});
                childRouteInitSpy.should.have.been.calledWith({childCond2: 2});

                appExpectedSpy.restore();
                routeExpectedSpy.restore();
                appInitSpy.restore();
                routeInitSpy.restore();
                childAppExpectedSpy.restore();
                childRouteExpectedSpy.restore();
                childAppInitSpy.restore();
                childRouteInitSpy.restore();
            });
        });
    });
});
