import RootApp from '../../src/classes/root-app';
import MutableOutlet from '../../src/classes/mutable-outlet';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import ctorName from '../../src/utils/ctor-name';

import { navTest } from '../utils/acceptance-test-generator';

// holds Sinon spies that are regenerated for each test
let spies;

function getAllSpies(spies) {
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
    init() {
        let ctorname = ctorName(this);
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

class RootRoute extends SinonSpyRoute { }
class UserIdActionRoute extends SinonSpyRoute {
    expectedParams() {
        return ['userId', 'userAction'];
    }
}

class MyApp extends TestApp {
    mount() {
        return {
            'action/{userAction=\\w+}': UserIdActionRoute,
        };
    }
}

class MyRootApp extends RootApp {
    mount() {
        return {
            '': RootRoute,
            'user/{userId=\\d+}': MyApp,
        };
    }
}

describe.only('Acceptance Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        spies = [
            'UserIdActionRoute',
            'RootRoute'
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
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            '': TestRoute,
                        };
                    }
                }

                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(destination).then(() => {
                    done();
                });
            });

            navTest('Promise rejects on 404', [
                '/nope',
            ], (done, destination) => {
                class MyRootApp extends RootApp {
                    mount() {
                        return {
                            '': TestRoute,
                        };
                    }
                }

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
                getAllSpies(spies).forEach(spy => spy.should.not.have.been.called);
                done();
            });

            navTest('calls prerender/render only on the navigated-to Route', [
                '/',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    spies.RootRoute.prerenderSpy.should.have.been.calledOnce;
                    spies.RootRoute.renderSpy.should.have.been.calledOnce;
                    spies.RootRoute.prerenderSpy.should.have.been.calledBefore(spies.RootRoute.renderSpy);
                    delete spies.RootRoute.prerenderSpy;
                    delete spies.RootRoute.renderSpy;
                    getAllSpies(spies).forEach(spy => spy.should.not.have.been.called);
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
                    spies.UserIdActionRoute.prerenderSpy.should.have.been.calledOnce;
                    spies.UserIdActionRoute.renderSpy.should.have.been.calledOnce;
                    spies.UserIdActionRoute.prerenderSpy.should.have.been.calledBefore(spies.RootRoute.renderSpy);
                    delete spies.UserIdActionRoute.prerenderSpy;
                    delete spies.UserIdActionRoute.renderSpy;
                    getAllSpies(spies).forEach(spy => spy.should.not.have.been.called);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('passes to a mount\'s prerender()/render() fns params equal to its Route\'s expectedParams()', [
                '/user/1/action/go',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    spies.UserIdActionRoute.prerenderSpy.should.have.been.calledOnce;
                    spies.UserIdActionRoute.renderSpy.should.have.been.calledOnce;
                    spies.UserIdActionRoute.prerenderSpy.should.have.been.calledBefore(spies.RootRoute.renderSpy);
                    delete spies.UserIdActionRoute.prerenderSpy;
                    delete spies.UserIdActionRoute.renderSpy;
                    getAllSpies(spies).forEach(spy => spy.should.not.have.been.called);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest.skip('passes to all conditional mounts\' prerender()/render() fns params equal to each Route\'s expectedParams()');
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
