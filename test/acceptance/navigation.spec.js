import RootApp from '../../src/classes/root-app';
import MutableOutlet from '../../src/classes/mutable-outlet';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import ctorName from '../../src/utils/ctor-name';
import { is, isnt } from '../../src/utils/is';
import diffObjects from '../../src/utils/diff-objects';
import finalDiff from '../../src/utils/final-diff';

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

function resetSpies() {
    // don't replace the spies object or its inner spy objects if they
    // exist since Routes will always reference the originally passed
    // in objects.
    mountSpies = [
        'RootRootRoute',
        'RootNewsRoute',
        'TodoIdRenderStyleRoute',
        'UserIdActionRoute',
        'UserIdMenuRouteOne',
        'UserIdMenuRouteTwo',
    ].reduce((memo, key) => {
        memo[key] = memo[key] || {};
        memo[key].prerenderSpy = sinon.spy();
        memo[key].renderSpy = sinon.spy();
        memo[key].deactivateSpy = sinon.spy();
        return memo;
    }, mountSpies || {});

    // don't replace the spies object or its inner spy objects if they
    // exist since Routes will always reference the originally passed
    // in objects.
    cMountSpies = [
        'RootAllConditionalRoute',
        'RootNewsConditionalRoute',
        'RootConditionalRoute',

        'RootIdConditionalRouteOne',
        'RootIdConditionalRouteTwo',

        'TodoIdConditionalRoute',
        'TodoIdRenderStyleConditionalRoute',

        'UserIdConditionalRouteOne',
        'UserIdConditionalRouteTwo',
        'UserIdConditionalRouteThree',
        'UserIdConditionalRouteFour',
        'UserIdActionConditionalRoute',
        'UserIdMenuConditionalRouteOne',
        'UserIdMenuConditionalRouteTwo',
    ].reduce((memo, key) => {
        memo[key] = memo[key] || {};
        memo[key].prerenderSpy = sinon.spy();
        memo[key].renderSpy = sinon.spy();
        memo[key].deactivateSpy = sinon.spy();
        return memo;
    }, cMountSpies || {});
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
class RootNewsRoute extends SinonSpyRoute { }
class TodoIdRenderStyleRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'renderStyle'];
    }
    expectedAddresses() {
        return ['todoIdRenderStyle'];
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
class RootAllConditionalRoute  extends SinonSpyRoute { }
class RootConditionalRoute     extends SinonSpyRoute { }
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
class TodoIdConditionalRoute       extends IdRoute { }
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
class TodoIdRenderStyleConditionalRoute extends IdRoute {
    expectedParams() {
        return ['id', 'renderStyle'];
    }
}

// the actual Ether App structure
class TodoApp extends TestApp {
    expectedAddresses() {
        return ['todoApp'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    mount() {
        return {
            '{renderStyle=\\w+}': TodoIdRenderStyleRoute.addresses('todoIdRenderStyle').setup(() => mountSpies),
        };
    }
    mountConditionals() {
        return {
            '*': TodoIdConditionalRoute.setup(() => cMountSpies),
            '+todoIdRenderStyle': TodoIdRenderStyleConditionalRoute.setup(() => cMountSpies),
        };
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
            'news/{news=\\w+}': RootNewsRoute.setup(() => mountSpies),
            'todos/{id=\\d+}': TodoApp.addresses('todoApp'),
            'user/{id=\\d+}': UserApp.addresses('userApp'),
        };
    }
    mountConditionals() {
        return {
            '*': RootAllConditionalRoute.setup(() => cMountSpies),
            '!todoApp,userApp,rootRoot': RootNewsConditionalRoute.setup(() => cMountSpies),
            '+userApp': [
                RootIdConditionalRouteOne.setup(() => cMountSpies),
                RootIdConditionalRouteTwo.setup(() => cMountSpies),
            ],
            '+rootRoot': RootConditionalRoute.setup(() => cMountSpies),
        };
    }
}

describe.only('Acceptance Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        resetSpies();
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

            navTest('throws if construction of app state fails', [
                '/',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                let stub = sinon.stub(rootApp, '_constructState').returns(Promise.reject(new Error('fail!')));
                rootApp.navigate(dest).then(null, err => {
                    expect(err.message).to.equal('fail!');
                    stub.restore();
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    stub.restore();
                    done(err);
                });
            });

            navTest('throws if `routingTrace.result` is neither `success` nor `404`', [
                '/',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                let stub = sinon.stub(rootApp, '_buildPath').returns({result: null});
                expect(() => rootApp.navigate(dest)).to.throw(TypeError, 'MyRootApp#navigate(): routingTrace had in invalid value: null.');
                stub.restore();
                done();
            });

            navTest('App can call navigate', [
                ['/', 'userApp'],
                ['/news/story?xyz=true&option=1', 'userApp'],
                ['/user/1/action/go?option=1', 'userApp'],
            ], (done, dest, address) => {
                let rootApp = new MyRootApp(defaultOpts);
                let app = rootApp._atAddress(address);
                expect(app).to.be.an.instanceof(App);
                app.navigate(dest).then(() => {
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('Route can call navigate', [
                ['/', 'userIdAction'],
                ['/news/story?xyz=true&option=1', 'userIdMenuOne'],
                ['/user/1/action/go?option=1', 'rootRoot'],
            ], (done, dest, address) => {
                let rootApp = new MyRootApp(defaultOpts);
                let route = rootApp._atAddress(address);
                expect(route).to.be.an.instanceof(Route);
                route.navigate(dest).then(() => {
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
                ['/', null, null, [RootAllConditionalRoute, RootConditionalRoute]],
                ['/?sort=true&sort_type=asc&idx=1', null, freeze({sort: true, sort_type: 'asc', idx: 1}), [RootAllConditionalRoute, RootConditionalRoute]],
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
                ['/user/2/menu/stats?bestFirst=true&limit=10&order=abc', freeze({id: 2, menu: 'stats'}), freeze({bestFirst: true, limit: 10, order: 'abc'}),
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
                ['/user/2/menu/stats/profile?bestFirst=true&limit=10&order=abc', freeze({id: 2, menu: 'stats'}), freeze({bestFirst: true, limit: 10, order: 'abc'}),
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
                            finalDiff(paramsDiff, queryParamsDiff),
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

            function checkRenderArgsAfterNavigation(done, dests, prevQueryParams, queryParams, expectedRenderedMounts) {
                let lastIdx = dests.length-1;
                let rootApp = new MyRootApp(defaultOpts);
                dests.reduce((memo, dest, idx) => {
                    return memo.then(() => {
                        // only test spy calls after the
                        // last call to navigate()
                        if (idx === lastIdx) {
                            resetSpies();
                        }
                        return rootApp.navigate(dest);
                    });
                }, Promise.resolve()).then(() => {
                    for (let [ renderedMountStr, prevParams, params ] of expectedRenderedMounts) {
                        let { prerenderSpy, renderSpy } = (mountSpies[renderedMountStr] || cMountSpies[renderedMountStr]);
                        let expectedArgs = [
                            params,
                            queryParams,
                            finalDiff(
                                diffObjects(prevParams      || {}, params      || {}),
                                diffObjects(prevQueryParams || {}, queryParams || {})
                            ),
                        ];
                        prerenderSpy.should.have.been.calledOnce;
                        renderSpy.should.have.been.calledOnce;
                        prerenderSpy.should.have.been.calledWith(...expectedArgs);
                        renderSpy.should.have.been.calledWith(...expectedArgs);
                    }
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            }

            navTest('passes the right params/queryParams/diffs to mounts/conditional mounts\' prerender()/render() fns on two consecutive visits', [
                // same params and query params isn't tested because same-URL navigation is a noop

                // different params, same query params
                [
                    ['/todos/1/list?hello=1&sort=asc', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({hello: 1, sort: 'asc'}), freeze({hello: 1, sort: 'asc'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: 1}), freeze({id: 2})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?', '/user/2/action/stop'],
                    null, null,
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdActionConditionalRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: 1}), freeze({id: 2})],
                    ],
                ],
                // same params, different query params
                [
                    ['/todos/1/list', '/todos/1/list?sort=asc&hello=1'],
                    null, freeze({hello: 1, sort: 'asc'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 1, renderStyle: 'list'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: 1}), freeze({id: 1})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 1, renderStyle: 'list'})],
                    ],
                ],
                [
                    ['/user/1/action/go?sort=true&asc=1', '/user/1/action/go?sort=false&list=yes'],
                    freeze({sort: true, asc: 1}), freeze({sort: false, list: 'yes'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: 1}), freeze({id: 1})],
                        ['RootIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 1})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: 1, action: 'go'}), freeze({id: 1, action: 'go'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: 1}), freeze({id: 1})],
                        ['UserIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 1})],
                        ['UserIdActionConditionalRoute', freeze({id: 1, action: 'go'}), freeze({id: 1, action: 'go'})],
                        ['UserIdConditionalRouteThree', freeze({id: 1}), freeze({id: 1})],
                    ],
                ],
                // different params, different query params
                [
                    ['/todos/1/list?sort=desc&index=1', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({index: 1, sort: 'desc'}), freeze({hello: 1, sort: 'asc'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: 1}), freeze({id: 2})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?sort=true&asc=1', '/user/2/action/stop?'],
                    freeze({sort: true, asc: 1}), null,
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdActionConditionalRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: 1}), freeze({id: 2})],
                    ],
                ],
            ], checkRenderArgsAfterNavigation);

            navTest('passes to all conditional mounts\' prerender()/render() fns all queryParams and only the expected params for the Route when navigating to it for the first time from a previous destination', [
                // In these scenarios:
                //    • `o` represents a Route or an App
                //    • dashed lines represent the previous navigation destination path
                //    • solid lines represent the current navigation destination path

                // Scenario 1: going from a node to a sibling node
                // ──o--o
                //   └──o
                [
                    ['/?hello=1&sort=asc', '/news/story'],
                    freeze({hello: 1, sort: 'asc'}), null,
                    [
                        // root-based mounts
                        ['RootNewsRoute', null, null],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootNewsConditionalRoute', null, freeze({news: 'story'})],
                    ],
                ],
                // Scenario 2: going from a node to a deeper branch on a sibling node
                // ──o--o
                //   └──o──o
                [
                    ['/', '/todos/1/list?hello=hi&sort=true'],
                    null, freeze({hello: 'hi', sort: true}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', null, freeze({id: 1, renderStyle: 'list'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', null, freeze({id: 1})],
                        ['TodoIdRenderStyleConditionalRoute', null, freeze({id: 1, renderStyle: 'list'})],
                    ],
                ],
                // Scenario 3: going from a deep routing node to a node on a common ancestor node
                // ──o--o--o
                //   └──o
                [
                    ['/user/1/action/go?sort=true&asc=1', '/news/story?list=yes&sort=false'],
                    freeze({sort: true, asc: 1}), freeze({sort: false, list: 'yes'}),
                    [
                        // root-based mounts
                        ['RootNewsRoute', null, null],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootNewsConditionalRoute', null, freeze({news: 'story'})],
                    ],
                ],
                // Scenario 4: going from a deep branch within a node to a deep branch on a sibling node
                // ──o--o--o
                //   └──o──o
                [
                    ['/todos/1/list?', '/user/2/menu/stats/profile'],
                    null, null,
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: 2})],
                        // userApp-based mounts
                        ['UserIdMenuRouteTwo', null, freeze({id: 2, menu: 'stats'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', null, freeze({id: 2})],
                        ['UserIdConditionalRouteFour', null, freeze({id: 2})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: 2, menu: 'stats'})],
                        ['UserIdMenuConditionalRouteTwo', null, freeze({id: 2, menu: 'stats'})],
                    ],
                ],
            ], checkRenderArgsAfterNavigation);

            navTest('passes to all conditional mounts\' prerender()/render() fns all queryParams and only the expected params for the Route when navigating to it for the second time after being at a previous, different destination', [
                // same params and query params
                [
                    ['/todos/1/list?unused=true', '/?hello=1&sort=asc', '/todos/1/list?sort=asc&hello=1'],
                    freeze({hello: 1, sort: 'asc'}), freeze({hello: 1, sort: 'asc'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 1, renderStyle: 'list'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: 1}), freeze({id: 1})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 1, renderStyle: 'list'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/', '/user/1/action/go?'],
                    null, null,
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: 1}), freeze({id: 1})],
                        ['RootIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 1})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: 1, action: 'go'}), freeze({id: 1, action: 'go'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: 1}), freeze({id: 1})],
                        ['UserIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 1})],
                        ['UserIdActionConditionalRoute', freeze({id: 1, action: 'go'}), freeze({id: 1, action: 'go'})],
                        ['UserIdConditionalRouteThree', freeze({id: 1}), freeze({id: 1})],
                    ],
                ],
                // different params, same query params
                [
                    ['/todos/1/list?unused=true', '/?hello=1&sort=asc', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({hello: 1, sort: 'asc'}), freeze({hello: 1, sort: 'asc'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: 1}), freeze({id: 2})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/', '/user/2/action/stop'],
                    null, null,
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdActionConditionalRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: 1}), freeze({id: 2})],
                    ],
                ],
                // different params, same query params
                [
                    ['/todos/1/list?unused=true', '/?hello=1&sort=asc', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({hello: 1, sort: 'asc'}), freeze({hello: 1, sort: 'asc'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: 1}), freeze({id: 2})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/', '/user/2/action/stop'],
                    null, null,
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdActionConditionalRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: 1}), freeze({id: 2})],
                    ],
                ],
                // same params, different query params
                [
                    ['/todos/1/list?unused=true', '/', '/todos/1/list?sort=asc&hello=1'],
                    null, freeze({hello: 1, sort: 'asc'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 1, renderStyle: 'list'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: 1}), freeze({id: 1})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 1, renderStyle: 'list'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/?sort=true&asc=1', '/user/1/action/go?sort=false&list=yes'],
                    freeze({sort: true, asc: 1}), freeze({sort: false, list: 'yes'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: 1}), freeze({id: 1})],
                        ['RootIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 1})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: 1, action: 'go'}), freeze({id: 1, action: 'go'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: 1}), freeze({id: 1})],
                        ['UserIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 1})],
                        ['UserIdActionConditionalRoute', freeze({id: 1, action: 'go'}), freeze({id: 1, action: 'go'})],
                        ['UserIdConditionalRouteThree', freeze({id: 1}), freeze({id: 1})],
                    ],
                ],
                // different params, different query params
                [
                    ['/todos/1/list?unused=true', '/?sort=desc&index=1', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({index: 1, sort: 'desc'}), freeze({hello: 1, sort: 'asc'}),
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: 1}), freeze({id: 2})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: 1, renderStyle: 'list'}), freeze({id: 2, renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/?sort=true&asc=1', '/user/2/action/stop?'],
                    freeze({sort: true, asc: 1}), null,
                    [
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdConditionalRouteTwo', freeze({id: 1}), freeze({id: 2})],
                        ['UserIdActionConditionalRoute', freeze({id: 1, action: 'go'}), freeze({id: 2, action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: 1}), freeze({id: 2})],
                    ],
                ],
            ], checkRenderArgsAfterNavigation);

            navTest('calls deactivate() when diverging from active mount/conditional mounts between prerender and render of to-be-activated mount/cMounts', [
                // In these scenarios:
                //    • `o` represents a Route or an App
                //    • dashed lines represent the previous navigation destination path
                //    • solid lines represent the current navigation destination path

                // Scenario 1: going from a node to a sibling node
                // ──o--o
                //   └──o
                ['/', '/news/story',
                    [
                        // root-based mounts
                        'RootNewsRoute',
                        // root-based conditional mounts
                        'RootAllConditionalRoute', 'RootNewsConditionalRoute',
                    ],
                    [
                        // root-based mounts
                        'RootRootRoute',
                        // root-based conditional mounts
                        'RootConditionalRoute',
                    ],
                    [
                        // root-based conditional mounts
                        'RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo',
                        // todo-based mounts
                        'TodoIdRenderStyleRoute',
                        // todo-based conditional mounts
                        'TodoIdConditionalRoute', 'TodoIdRenderStyleConditionalRoute',
                        // userApp-based mounts
                        'UserIdActionRoute', 'UserIdMenuRouteOne', 'UserIdMenuRouteTwo',
                        // userApp-based conditional mounts
                        'UserIdConditionalRouteOne',
                        'UserIdConditionalRouteTwo', 'UserIdConditionalRouteThree', 'UserIdActionConditionalRoute',
                        'UserIdConditionalRouteFour', 'UserIdMenuConditionalRouteOne',
                        'UserIdMenuConditionalRouteTwo',
                    ],
                ],
                // Scenario 2: going from a node to a deeper branch on a sibling node
                // ──o--o
                //   └──o──o
                ['/', '/todos/1/list',
                    [
                        // root-based conditional mounts
                        'RootAllConditionalRoute',
                        // todo-based mounts
                        'TodoIdRenderStyleRoute',
                        // todo-based conditional mounts
                        'TodoIdConditionalRoute', 'TodoIdRenderStyleConditionalRoute',
                    ],
                    [
                        // root-based mounts
                        'RootRootRoute',
                        // root-based conditional mounts
                        'RootConditionalRoute',
                    ],
                    [
                        // root-based mounts
                        'RootNewsRoute',
                        // root-based conditional mounts
                        'RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo', 'RootNewsConditionalRoute',
                        // userApp-based mounts
                        'UserIdActionRoute', 'UserIdMenuRouteOne', 'UserIdMenuRouteTwo',
                        // userApp-based conditional mounts
                        'UserIdConditionalRouteOne',
                        'UserIdConditionalRouteTwo', 'UserIdConditionalRouteThree', 'UserIdActionConditionalRoute',
                        'UserIdConditionalRouteFour', 'UserIdMenuConditionalRouteOne',
                        'UserIdMenuConditionalRouteTwo',
                    ],
                ],
                // Scenario 3: going from a deep routing node to a node on a common ancestor node
                // ──o--o--o
                //   └──o
                ['/user/1/action/go', '/news/story',
                    [
                        // root-based mounts
                        'RootNewsRoute',
                        // root-based conditional mounts
                        'RootAllConditionalRoute', 'RootNewsConditionalRoute',
                    ],
                    [
                        // root-based conditional mounts
                        'RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo',
                        // userApp-based mounts
                        'UserIdActionRoute',
                        // userApp-based conditional mounts
                        'UserIdConditionalRouteOne',
                        'UserIdConditionalRouteTwo', 'UserIdConditionalRouteThree', 'UserIdActionConditionalRoute',
                    ],
                    [
                        // root-based mounts
                        'RootRootRoute',
                        // root-based conditional mounts
                        'RootConditionalRoute',
                        // todoApp-based mounts
                        'TodoIdRenderStyleRoute',
                        // todoApp-based conditional mounts
                        'TodoIdConditionalRoute', 'TodoIdRenderStyleConditionalRoute',
                        // userApp-based mounts
                        'UserIdMenuRouteOne', 'UserIdMenuRouteTwo',
                        // userApp-based conditional mounts
                        'UserIdConditionalRouteFour', 'UserIdMenuConditionalRouteOne',
                        'UserIdMenuConditionalRouteTwo',
                    ],
                ],
                // Scenario 4: going from a deep branch within a node to a deep branch on a sibling node
                // ──o--o--o
                //   └──o──o
                ['/todos/1/list', '/user/1/menu/stats/profile',
                    [
                        // root-based conditional mounts
                        'RootAllConditionalRoute', 'RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo',
                        // userApp-based mounts
                        'UserIdMenuRouteTwo',
                        // userApp-based conditional mounts
                        'UserIdConditionalRouteOne',
                        'UserIdConditionalRouteFour', 'UserIdMenuConditionalRouteOne',
                        'UserIdMenuConditionalRouteTwo',
                    ],
                    [
                        // todo-based mounts
                        'TodoIdRenderStyleRoute',
                        // todo-based conditional mounts
                        'TodoIdConditionalRoute', 'TodoIdRenderStyleConditionalRoute',
                    ],
                    [
                        // root-based mounts
                        'RootRootRoute', 'RootNewsRoute',
                        // root-based conditional mounts
                        'RootConditionalRoute', 'RootNewsConditionalRoute',
                        // userApp-based mounts
                        'UserIdActionRoute', 'UserIdMenuRouteOne',
                        // userApp-based conditional mounts
                        'UserIdConditionalRouteTwo', 'UserIdConditionalRouteThree', 'UserIdActionConditionalRoute',
                    ],
                ],
            ], (done, dest1, dest2, expectedRenderedMounts, expectedDeactivatedRoutes, expectedUnaffectedRoutes) => {
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest1).then(() => {
                    // only test spy calls after the
                    // second call to navigate()
                    resetSpies();
                    return rootApp.navigate(dest2);
                }).then(() => {
                    for (let renderedMountStr of expectedRenderedMounts) {
                        let { prerenderSpy, renderSpy } = (mountSpies[renderedMountStr] || cMountSpies[renderedMountStr]);
                        for (let deactivatedMountStr of expectedDeactivatedRoutes) {
                            let { deactivateSpy } = (mountSpies[deactivatedMountStr] || cMountSpies[deactivatedMountStr]);
                            deactivateSpy.should.have.been.calledOnce;
                            prerenderSpy.should.have.been.calledOnce;
                            renderSpy.should.have.been.calledOnce;
                            prerenderSpy.should.have.been.calledBefore(deactivateSpy);
                            renderSpy.should.have.been.calledAfter(deactivateSpy);
                        }
                    }
                    for (let unaffectedRouteStr of expectedUnaffectedRoutes) {
                        let { prerenderSpy, deactivateSpy, renderSpy } = (mountSpies[unaffectedRouteStr] || cMountSpies[unaffectedRouteStr]);
                        prerenderSpy.should.not.have.been.called;
                        deactivateSpy.should.not.have.been.called;
                        renderSpy.should.not.have.been.called;
                    }
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            navTest('prerender/render are called for each navigation step in forwards order');
            navTest('deactivate is called for each navigation step in backwards order');
            // test that all routes get _active true or false at the right times
            navTest('sets the correct value for isActive() on the proper mounts/cMounts');
            // test that all classes happen at the right times, e.g. ether-prerendering vs. ether-prerendered
            navTest('sets the correct CSS class for all outlets on the proper mounts/cMounts');
        });
    });
});
