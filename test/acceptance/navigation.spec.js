import RootApp from '../../src/classes/root-app';
import MutableOutlet from '../../src/classes/mutable-outlet';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import ctorName from '../../src/utils/ctor-name';

import { navTest } from '../utils/acceptance-test-generator';

// holds Sinon spies that are regenerated for each test
let mountSpies;
let cMountSpies;

function getAllSpyFns(spies) {
    let allSpies = Object.keys(spies).reduce((memo, key) => {
        let spiesForKey = Object.keys(spies[key]).map(spyName => spies[key][spyName]);
        memo.push(...spiesForKey);
        return memo;
    }, []);
    return allSpies;
}

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

class SinonSpyRoute extends TestRoute {
    init(spies) {
        let ctorname = ctorName(this);
        if (typeof spies !== 'object') {
            throw new Error(`Sinon spies were not passed into ${ctorname}#init().`);
        }
        let mySpies = spies[ctorname];
        if (!mySpies) {
            throw new Error(`Sinon spies were not attached to ${ctorname}.`);
        }
        this.spies = mySpies;
    }
    prerender(params, queryParams, diff) {
        this.spies.prerenderSpy(params, queryParams, diff);
    }
    deactivate() {
        this.spies.deactivateSpy();
    }
    render(params, queryParams, diff) {
        this.spies.renderSpy(params, queryParams, diff);
    }
}

// normal routes
// need to make sure to mount each exactly once,
// to ensure spy call counts are correct
class RootRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['root'];
    }
    addressesHandlers() {
        return [function(){}];
    }
}
class UserIdActionRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'action'];
    }
    expectedAddresses() {
        return ['userIdAction'];
    }
    addressesHandlers() {
        return [function(){}];
    }
}
class UserIdMenuRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'menu'];
    }
    expectedAddresses() {
        return ['userIdMenu'];
    }
    addressesHandlers() {
        return [function(){}];
    }
}

// conditional routes
// need to make sure to mount each exactly once,
// to ensure spy call counts are correct
class RootConditionalRoute    extends SinonSpyRoute { }
class IdRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id'];
    }
}
class RootIdConditionalRouteOne    extends IdRoute { }
class RootIdConditionalRouteTwo    extends IdRoute { }
class UserIdConditionalRouteOne    extends IdRoute { }
class UserIdConditionalRouteTwo    extends IdRoute { }
class UserIdConditionalRouteThree  extends IdRoute { }
class UserIdActionConditionalRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'action'];
    }
}
class UserIdMenuConditionalRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'menu'];
    }
}

class UserApp extends TestApp {
    expectedAddresses() {
        return ['userApp'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    mount() {
        return {
            'action/{action=\\w+}': UserIdActionRoute.addresses('userIdAction').setup(() => mountSpies),
            'menu/{menu=\\w+}': UserIdMenuRoute.addresses('userIdMenu').setup(() => mountSpies),
        };
    }
    mountConditionals() {
        return {
            '*': [UserIdConditionalRouteOne.setup(()  => cMountSpies)],
            '+userIdAction': [
                UserIdConditionalRouteTwo.setup(()    => cMountSpies),
                UserIdConditionalRouteThree.setup(()  => cMountSpies),
                UserIdActionConditionalRoute.setup(() => cMountSpies),
            ],
            '!userIdAction': UserIdMenuConditionalRoute.setup(() => cMountSpies),
        };
    }
}

class MyRootApp extends RootApp {
    mount() {
        return {
            '': RootRoute.addresses('root').setup(() => mountSpies),
            'user/{id=\\d+}': UserApp.addresses('userApp'),
        };
    }
    mountConditionals() {
        return {
            '*': RootConditionalRoute.setup(() => cMountSpies),
            '+userApp': [
                RootIdConditionalRouteOne.setup(() => cMountSpies),
                RootIdConditionalRouteTwo.setup(() => cMountSpies),
            ],
        };
    }
}

describe.only('Acceptance Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        mountSpies = [
            'UserIdActionRoute',
            'UserIdMenuRoute',
            'RootRoute'
        ].reduce((memo, key) => {
            memo[key] = {
                prerenderSpy:  sinon.spy(),
                deactivateSpy: sinon.spy(),
                renderSpy:     sinon.spy(),
            };
            return memo;
        }, {});
        cMountSpies = [
            'RootConditionalRoute',
            'RootIdConditionalRouteOne',
            'RootIdConditionalRouteTwo',
            'UserIdConditionalRouteOne',
            'UserIdConditionalRouteTwo',
            'UserIdActionConditionalRoute',
            'UserIdMenuConditionalRoute',
            'UserIdConditionalRouteThree',
        ].reduce((memo, key) => {
            memo[key] = {
                prerenderSpy:  sinon.spy(),
                deactivateSpy: sinon.spy(),
                renderSpy:     sinon.spy(),
            };
            return memo;
        }, {});

        defaultOpts = {
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        };
    });

    describe('Navigation', () => {
        describe('Basic Tests', () => {
            navTest('resolves a Promise on successful navigation', [
                '/',
            ], (done, destination) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(destination).then(() => {
                    done();
                });
            });

            navTest('Promise rejects on 404', [
                '/nope',
            ], (done, destination) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(destination).then(null, err => {
                    expect(err).to.be.instanceof(Error);
                    err.message.should.equal(`404 for path: "${destination}".`);
                    expect(err.routingTrace).to.be.an('object');
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('sets return val of fullUrl() on the RootApp', [
                '/',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                expect(rootApp.fullUrl()).to.equal(undefined);
                rootApp.navigate(dest).then(() => {
                    expect(rootApp.fullUrl()).to.equal('/');
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('does not set return val of fullUrl() on the RootApp on nav failure', [
                '/nope',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                expect(rootApp.fullUrl()).to.equal(undefined);
                rootApp.navigate(dest).then(null, () => {
                    expect(rootApp.fullUrl()).to.equal(undefined);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

        });

        describe('Prerender/Deactivate/Render Cycle', () => {
            navTest('does not call any prerender/deactivate/render before calling navigate()', [
                '/',
            ], (done) => {
                let rootApp = new MyRootApp(defaultOpts);
                getAllSpyFns(mountSpies).forEach(spy => spy.should.not.have.been.called);
                done();
            });

            navTest('calls prerender/render only on the navigated-to Route', [
                '/',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    mountSpies.RootRoute.prerenderSpy.should.have.been.calledOnce;
                    mountSpies.RootRoute.renderSpy.should.have.been.calledOnce;
                    mountSpies.RootRoute.prerenderSpy.should.have.been.calledBefore(mountSpies.RootRoute.renderSpy);
                    delete mountSpies.RootRoute.prerenderSpy;
                    delete mountSpies.RootRoute.renderSpy;
                    getAllSpyFns(mountSpies).forEach(spy => spy.should.not.have.been.called);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('calls prerender/render only on the navigated-to Route that is within a sub-App', [
                '/user/1/action/go',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    mountSpies.UserIdActionRoute.prerenderSpy.should.have.been.calledOnce;
                    mountSpies.UserIdActionRoute.renderSpy.should.have.been.calledOnce;
                    mountSpies.UserIdActionRoute.prerenderSpy.should.have.been.calledBefore(mountSpies.RootRoute.renderSpy);
                    delete mountSpies.UserIdActionRoute.prerenderSpy;
                    delete mountSpies.UserIdActionRoute.renderSpy;
                    getAllSpyFns(mountSpies).forEach(spy => spy.should.not.have.been.called);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('passes to a sub-App\'s mount\'s prerender()/render() fns params equal to its Route\'s expectedParams()', [
                '/user/1/action/go',
            ], (done, dest) => {
                let expectedArgs = [
                    {id: 1, action: 'go'},
                    {},
                    {
                        params: {id: [undefined, 1], action: [undefined, 'go']},
                        queryParams: null,
                    },
                ];
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    mountSpies.UserIdActionRoute.prerenderSpy.should.have.been.calledWith(...expectedArgs);
                    mountSpies.UserIdActionRoute.renderSpy.should.have.been.calledWith(...expectedArgs);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest.skip('passes to all conditional mounts\' prerender()/render() fns params equal to each Route\'s expectedParams()', [
                '/user/1/action/go',
            ], (done, dest) => {
                let expectedArgs = [
                    {id: 1, action: 'go'},
                    {},
                    {
                        params: {id: [undefined, 1], action: [undefined, 'go']},
                        queryParams: null,
                    },
                ];
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    mountSpies.UserIdActionRoute.prerenderSpy.should.have.been.calledWith(...expectedArgs);
                    mountSpies.UserIdActionRoute.renderSpy.should.have.been.calledWith(...expectedArgs);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });
            navTest.skip('passes to a mount\'s prerender()/render() fns the proper query params');
            navTest.skip('passes to all conditional mounts\' prerender()/render() fns the proper query params');
            navTest.skip('does nothing if navigating to the same URL as the current URL');
            navTest.skip('throws if `routingTrace.result` is neither `success` nor `404`');

            // gotta be careful with this one.. don't wanna duplicate tests because they may eventually become out of sync
            // @TODO: use navTest() for this instead of writing individual tests
            // it.skip('navigates using an address passed with params and queryParams');
        });
    });
});
