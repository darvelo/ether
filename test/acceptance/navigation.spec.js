import RootApp from '../../src/classes/root-app';
import MutableOutlet from '../../src/classes/mutable-outlet';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import ctorName from '../../src/utils/ctor-name';
import { is, isnt } from '../../src/utils/is';

import { navTest } from '../utils/acceptance-test-generator';

let freeze = Object.freeze;

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
        if (isnt(spies, 'Object')) {
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
class RootRootRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['rootRoot'];
    }
    addressesHandlers() {
        return [function(){}];
    }
}
class RootNewsRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['rootNews'];
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
    addressesHandlers() {
        return [function(){}];
    }
}
class UserIdMenuRouteOne extends UserIdMenuRoute {
    expectedAddresses() {
        return ['userIdMenuOne'];
    }
}
class UserIdMenuRouteTwo extends UserIdMenuRoute {
    expectedAddresses() {
        return ['userIdMenuTwo'];
    }
}

// conditional routes
// need to make sure to mount each exactly once,
// to ensure spy call counts are correct
class RootAllConditionalRoute    extends SinonSpyRoute { }
class RootNewsConditionalRoute extends SinonSpyRoute {
    expectedParams() {
        return ['news'];
    }
}
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
class UserIdConditionalRouteFour   extends IdRoute { }
class UserIdActionConditionalRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'action'];
    }
}
class IdMenuRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'menu'];
    }
}
class UserIdMenuConditionalRouteOne extends IdMenuRoute { }
class UserIdMenuConditionalRouteTwo extends IdMenuRoute { }

// the actual Ether App structure
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
            'menu/{menu=\\w+}': UserIdMenuRouteOne.addresses('userIdMenuOne').setup(() => mountSpies),
            'menu/{menu=\\w+}/profile': UserIdMenuRouteTwo.addresses('userIdMenuTwo').setup(() => mountSpies),
        };
    }
    mountConditionals() {
        return {
            '*': [UserIdConditionalRouteOne.setup(()  => cMountSpies)],
            // these two cMounts have the same logical result
            '+userIdAction': [
                UserIdConditionalRouteTwo.setup(()    => cMountSpies),
                UserIdActionConditionalRoute.setup(() => cMountSpies),
            ],
            '!userIdMenuOne,userIdMenuTwo': UserIdConditionalRouteThree.setup(() => cMountSpies),
            // these two cMounts have the same logical result
            '+userIdMenuOne,userIdMenuTwo': UserIdConditionalRouteFour.setup(() => cMountSpies),
            '!userIdAction': UserIdMenuConditionalRouteOne.setup(() => cMountSpies),
            // cMount just for "profile" route
            '+userIdMenuTwo': UserIdMenuConditionalRouteTwo.setup(() => cMountSpies),
        };
    }
}
class MyRootApp extends RootApp {
    mount() {
        return {
            '': RootRootRoute.addresses('rootRoot').setup(() => mountSpies),
            'news/{news=\\w+}': RootNewsRoute.addresses('rootNews').setup(() => mountSpies),
            'user/{id=\\d+}': UserApp.addresses('userApp'),
        };
    }
    mountConditionals() {
        return {
            '*': RootAllConditionalRoute.setup(() => cMountSpies),
            '!userApp,rootRoot': RootNewsConditionalRoute.setup(() => cMountSpies),
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
            'RootRootRoute',
            'RootNewsRoute',
            'UserIdActionRoute',
            'UserIdMenuRouteOne',
            'UserIdMenuRouteTwo',
        ].reduce((memo, key) => {
            memo[key] = {
                prerenderSpy:  sinon.spy(),
                deactivateSpy: sinon.spy(),
                renderSpy:     sinon.spy(),
            };
            return memo;
        }, {});
        cMountSpies = [
            'RootAllConditionalRoute',
            'RootNewsConditionalRoute',

            'RootIdConditionalRouteOne',
            'RootIdConditionalRouteTwo',

            'UserIdConditionalRouteOne',
            'UserIdConditionalRouteTwo',
            'UserIdConditionalRouteThree',
            'UserIdConditionalRouteFour',
            'UserIdActionConditionalRoute',
            'UserIdMenuConditionalRouteOne',
            'UserIdMenuConditionalRouteTwo',
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
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('Promise rejects on 404', [
                // mount doesn't exist
                '/nope',
                // navigation ends on an App, not a Route
                '/user/1',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(null, err => {
                    expect(err).to.be.instanceof(Error);
                    err.message.should.equal(`404 for path: "${dest}".`);
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

            navTest('does nothing if navigating to the same URL as the current URL', [
                '/',
                '/?hello=true&goodbye=false',
                '/user/1/action/go?hello=true&goodbye=false',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                expect(rootApp.fullUrl()).to.equal(undefined);
                rootApp.navigate(dest).then(() => {
                    let queryParams;
                    [ dest, queryParams ] = dest.split('?');
                    // switch around query params to make sure it
                    // still recognizes the URL as being the same
                    if (queryParams) {
                        queryParams = '?goodbye=false&hello=true';
                        dest += queryParams;
                    }
                    return rootApp.navigate(dest);
                }).then(msg => {
                    expect(msg).to.deep.equal({sameUrl: true});
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
                getAllSpyFns(cMountSpies).forEach(spy => spy.should.not.have.been.called);
                done();
            });

            navTest('calls prerender/render, in order, only on the navigated-to mount\'s Route', [
                '/',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    let spies = mountSpies.RootRootRoute;
                    let { prerenderSpy, renderSpy } = spies;
                    prerenderSpy.should.have.been.calledOnce;
                    renderSpy.should.have.been.calledOnce;
                    prerenderSpy.should.have.been.calledBefore(renderSpy);
                    delete spies.prerenderSpy;
                    delete spies.renderSpy;
                    getAllSpyFns(mountSpies).forEach(spy => spy.should.not.have.been.called);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('calls prerender/render, in order, only on the navigated-to mount\'s Route that is within a sub-App', [
                '/user/1/action/go',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    let spies = mountSpies.UserIdActionRoute;
                    let { prerenderSpy, renderSpy } = spies;
                    prerenderSpy.should.have.been.calledOnce;
                    renderSpy.should.have.been.calledOnce;
                    prerenderSpy.should.have.been.calledBefore(renderSpy);
                    delete spies.prerenderSpy;
                    delete spies.renderSpy;
                    getAllSpyFns(mountSpies).forEach(spy => spy.should.not.have.been.called);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('passes to a sub-App\'s mount\'s prerender()/render() fns all queryParams and only the expected params for the Route', [
                '/user/1/action/go?sort=true&sort_type=asc&idx=1',
            ], (done, dest) => {
                let expectedArgs = [
                    {id: 1, action: 'go'},
                    {sort: true, sort_type: 'asc', idx: 1},
                    {
                        params: {id: [undefined, 1], action: [undefined, 'go']},
                        queryParams: {sort: [undefined, true], sort_type: [undefined, 'asc'], idx: [undefined, 1]},
                    },
                ];
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    let spies = mountSpies.UserIdActionRoute;
                    let { prerenderSpy, renderSpy } = spies;
                    prerenderSpy.should.have.been.calledWith(...expectedArgs);
                    renderSpy.should.have.been.calledWith(...expectedArgs);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('passes to all conditional mounts\' prerender()/render() fns all queryParams and only the expected params for the Route', [
                // @TODO: add destinations, here and in other navTests, that navigate by address and given params/queryParams
                ['/', null, null, [RootAllConditionalRoute]],
                ['/?sort=true&sort_type=asc&idx=1', null, freeze({sort: true, sort_type: 'asc', idx: 1}), [RootAllConditionalRoute]],
                ['/news/story?', freeze({news: 'story'}), null, [RootAllConditionalRoute, RootNewsConditionalRoute]],
                ['/news/story?idx=3', freeze({news: 'story'}), freeze({idx: 3}), [RootAllConditionalRoute, RootNewsConditionalRoute]],
                ['/user/1/action/go?', freeze({id: 1, action: 'go'}), null,
                    [
                        RootAllConditionalRoute, RootIdConditionalRouteOne, RootIdConditionalRouteTwo,
                        UserIdConditionalRouteOne, UserIdConditionalRouteTwo, UserIdConditionalRouteThree, UserIdActionConditionalRoute,
                    ]
                ],
                ['/user/2/menu/stats?', freeze({id: 2, menu: 'stats'}), null,
                    [
                        RootAllConditionalRoute, RootIdConditionalRouteOne, RootIdConditionalRouteTwo,
                        UserIdConditionalRouteOne, UserIdConditionalRouteFour, UserIdMenuConditionalRouteOne,
                    ]
                ],
                ['/user/2/menu/stats?bestFirst=true&limit=10&order=abc', freeze({id: 2, menu: 'stats'}), {bestFirst: true, limit: 10, order: 'abc'},
                    [
                        RootAllConditionalRoute, RootIdConditionalRouteOne, RootIdConditionalRouteTwo,
                        UserIdConditionalRouteOne, UserIdConditionalRouteFour, UserIdMenuConditionalRouteOne,
                    ]
                ],
                ['/user/2/menu/stats/profile', freeze({id: 2, menu: 'stats'}), null,
                    [
                        RootAllConditionalRoute, RootIdConditionalRouteOne, RootIdConditionalRouteTwo,
                        UserIdConditionalRouteOne, UserIdConditionalRouteFour, UserIdMenuConditionalRouteOne, UserIdMenuConditionalRouteTwo,
                    ]
                ],
                ['/user/2/menu/stats/profile?bestFirst=true&limit=10&order=abc', freeze({id: 2, menu: 'stats'}), {bestFirst: true, limit: 10, order: 'abc'},
                    [
                        RootAllConditionalRoute, RootIdConditionalRouteOne, RootIdConditionalRouteTwo,
                        UserIdConditionalRouteOne, UserIdConditionalRouteFour, UserIdMenuConditionalRouteOne, UserIdMenuConditionalRouteTwo,
                    ]
                ],
                // ['/user/1/action/go', freeze({news: 'story', action: 'go'}), null, [RootAllConditionalRoute]],
            ], (done, dest, allParams, queryParams, expectedCondRoutesRendered) => {
                let queryParamsDiff;
                if (is(queryParams, 'Null')) {
                    queryParamsDiff = null;
                } else {
                    queryParamsDiff = freeze(Object.keys(queryParams).reduce((memo, qp) => {
                        // since we're navigating from a fresh state,
                        // all queryParam previous values should be `undefined`,
                        // and all expected values should be equal to the
                        // expected values passed in from the test function
                        memo[qp] = [undefined, queryParams[qp]];
                        return memo;
                    }, {}));
                }

                // builds the expected params and paramsDiff values to test
                // against by mapping from a route's expectedParams()
                function buildParamsData(params, paramsDiff) {
                    return function(expectedParam) {
                        params[expectedParam] = allParams[expectedParam];
                        paramsDiff[expectedParam] = [undefined, allParams[expectedParam]];
                    };
                }

                function finalDiff(paramsDiff) {
                    if (is(paramsDiff, 'Null') && is(queryParamsDiff, 'Null')) {
                        return null;
                    }
                    return {
                        params: paramsDiff,
                        queryParams: queryParamsDiff,
                    };
                }

                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    for (let route of expectedCondRoutesRendered) {
                        let { expectedParams, constructor: { name: ctorname } } = route.prototype;
                        let spies = cMountSpies[ctorname];
                        let { prerenderSpy, renderSpy } = spies;
                        let params, paramsDiff;
                        // if we have explicitly stated in the args that
                        // no params should exist, test that both params
                        // and paramsDiff in prerender/ender are null.
                        // they should also be null if the route is not
                        // expecting any params.
                        if (is(allParams, 'Null') || !expectedParams().length) {
                            params = null;
                            paramsDiff = null;
                        } else {
                            // build a list of params that should be passed
                            // into prerender/render based on the route's
                            // expected params
                            params = {};
                            paramsDiff = {};
                            expectedParams().forEach(buildParamsData(params, paramsDiff));
                        }
                        let expectedArgs = [
                            params,
                            queryParams,
                            finalDiff(paramsDiff),
                        ];
                        prerenderSpy.should.have.been.calledWith(...expectedArgs);
                        renderSpy.should.have.been.calledWith(...expectedArgs);
                        // remove spies from hashtable of all spies so that
                        // we can test that the rest have not been called
                        delete spies.prerenderSpy;
                        delete spies.renderSpy;
                    }
                    // test that all spies not explicitly
                    // tested above have not been called
                    getAllSpyFns(cMountSpies).forEach(spy => spy.should.not.have.been.called);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            // stub out _constructState for this one to return rejected promise
            navTest.skip('throws if construction fails');
            // stub out _buildPath for this one to return {result: null}
            navTest.skip('throws if `routingTrace.result` is neither `success` nor `404`');
        });
    });
});
