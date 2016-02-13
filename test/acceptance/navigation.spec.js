import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import MutableOutlet from '../../src/classes/mutable-outlet';
import diffObjects from '../../src/utils/diff-objects';
import finalDiff from '../../src/utils/final-diff';

import { navTest } from '../utils/navigation-acceptance-tests/navigation-test-generator';
import { assertAppState } from '../utils/navigation-acceptance-tests/app-state-validator';
import RoutesStateValidator from '../utils/navigation-acceptance-tests/routes-state-validator/';
import MyRootApp from '../utils/navigation-acceptance-tests/app-under-test/root-app';

// holds Sinon spies that are regenerated
// for each test, and sometimes within a test
import {
    mountSpies,
    cMountSpies,
    resetSpies,
    getAllSpyFns,
} from '../utils/navigation-acceptance-tests/sinon-spies';

// initialize the spies before the first test begins
resetSpies();

let freeze = Object.freeze;

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

            navTest('uses transitions when navigating', [
                ['/', '/todos/1/list', '/user/1/action/go'],
            ], (done, dest1, dest2, dest3) => {
                let doneCalled = false;
                function callDone(err) {
                    if (!doneCalled) {
                        doneCalled = true;
                        done(err);
                    }
                }

                let results = [];
                let rootApp = MyRootApp.create(defaultOpts);
                expect(results).to.have.length(0);

                // this promise should be terminated on next
                // call to navigate(), so then() callback
                // should never run
                rootApp.navigate(dest1).then(() => {
                    results.push(1);
                }).catch(err => callDone(err));

                // this promise should be terminated on next
                // call to navigate(), so then() callback
                // should never run
                rootApp.navigate(dest2).then(() => {
                    results.push(2);
                }).catch(err => callDone(err));

                // this navigate call should terminate the
                // last one, and succeed in calling all
                // then() callbacks
                rootApp.navigate(dest3).then(() => {
                    results.push(3);
                }).then(() => {
                    expect(results).to.deep.equal([3]);
                    callDone();
                }).catch(err => callDone(err));
            });
        });

        describe('Prerender/Deactivate/Render Cycle', () => {
            navTest('does not call any prerender/deactivate/render before calling navigate()', [
                '/',
            ], (done, dest) => {
                let rootApp = new MyRootApp(defaultOpts);
                getAllSpyFns(mountSpies).forEach(spy => spy.should.not.have.been.called);
                getAllSpyFns(cMountSpies).forEach(spy => spy.should.not.have.been.called);
                rootApp.navigate(dest).then(() => {
                    expect(getAllSpyFns(mountSpies).some(spy => spy.called)).to.equal(true);
                    expect(getAllSpyFns(cMountSpies).some(spy => spy.called)).to.equal(true);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
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

            navTest('passes the right params/queryParams/diffs to mounts/conditional mounts\' prerender()/render() fns', [
                // same params and query params isn't tested because same-URL navigation is a noop

                /* Single destination */
                [
                    ['/'],
                    null, null,
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootConditionalRoute', null, null],
                    ],
                ],
                [
                    ['/?sort=true&sort_type=asc&idx=1'],
                    null, freeze({sort: true, sort_type: 'asc', idx: 1}),
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootConditionalRoute', null, null],
                    ],
                ],
                [
                    ['/news/story?'],
                    null, null,
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootNewsConditionalRoute', null, freeze({news: 'story'})],
                    ],
                ],
                [
                    ['/news/story?idx=3'],
                    null, freeze({idx: 3}),
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootNewsConditionalRoute', null, freeze({news: 'story'})],
                    ],
                ],
                [
                    ['/user/1/action/go?'],
                    null, null,
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: 1})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: 1})],
                        ['UserIdConditionalRouteOne', null, freeze({id: 1})],
                        ['UserIdConditionalRouteTwo', null, freeze({id: 1})],
                        ['UserIdConditionalRouteThree', null, freeze({id: 1})],
                        ['UserIdActionConditionalRoute', null, freeze({id: 1, action: 'go'})],
                    ],
                ],
                [
                    ['/user/2/menu/stats?'],
                    null, null,
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: 2})],
                        ['UserIdConditionalRouteOne', null, freeze({id: 2})],
                        ['UserIdConditionalRouteFour', null, freeze({id: 2})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: 2, menu: 'stats'})],
                    ],
                ],
                [
                    ['/user/2/menu/stats?bestFirst=true&limit=10&order=abc'],
                    null, freeze({bestFirst: true, limit: 10, order: 'abc'}),
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: 2})],
                        ['UserIdConditionalRouteOne', null, freeze({id: 2})],
                        ['UserIdConditionalRouteFour', null, freeze({id: 2})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: 2, menu: 'stats'})],
                    ],
                ],
                [
                    ['/user/2/menu/stats/profile'],
                    null, null,
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: 2})],
                        ['UserIdConditionalRouteOne', null, freeze({id: 2})],
                        ['UserIdConditionalRouteFour', null, freeze({id: 2})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: 2, menu: 'stats'})],
                        ['UserIdMenuConditionalRouteTwo', null, freeze({id: 2, menu: 'stats'})],
                    ],
                ],
                [
                    ['/user/2/menu/stats/profile?bestFirst=true&limit=10&order=abc'],
                    null, freeze({bestFirst: true, limit: 10, order: 'abc'}),
                    [
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: 2})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: 2})],
                        ['UserIdConditionalRouteOne', null, freeze({id: 2})],
                        ['UserIdConditionalRouteFour', null, freeze({id: 2})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: 2, menu: 'stats'})],
                        ['UserIdMenuConditionalRouteTwo', null, freeze({id: 2, menu: 'stats'})],
                    ],
                ],

                /* Multiple destinations */
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

            navTest('prerender/render are called for each navigation step in forwards order', [
                [
                    '/user/1/action/go',
                    [
                        ['RootAllConditionalRoute', 'RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo'],
                        ['UserIdConditionalRouteOne', 'UserIdConditionalRouteTwo', 'UserIdActionConditionalRoute', 'UserIdConditionalRouteThree', 'UserIdActionRoute'],
                    ]
                ],
            ], (done, dest, steps) => {
                let len = steps.length;
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    steps.forEach((routesStrs, idx) => {
                        if (idx < len-1) {
                            let nextStepRoutesStrs = steps[idx+1];
                            for (let currRouteStr of routesStrs) {
                                let { prerenderSpy: currPrerenderSpy, renderSpy: currRenderSpy } = (mountSpies[currRouteStr] || cMountSpies[currRouteStr]);
                                for (let nextRouteStr of nextStepRoutesStrs) {
                                    let { prerenderSpy: nextPrerenderSpy, renderSpy: nextRenderSpy } = (mountSpies[nextRouteStr] || cMountSpies[nextRouteStr]);
                                    // all prerender/render fns should only be called once
                                    // we need this because sinon's `calledBefore` construct
                                    // doesn't check whether the spy that is within calledBefore's
                                    // parens was actually ever called.
                                    currPrerenderSpy.should.have.been.calledOnce;
                                    currRenderSpy.should.have.been.calledOnce;
                                    nextPrerenderSpy.should.have.been.calledOnce;
                                    nextRenderSpy.should.have.been.calledOnce;
                                    // verify step execution order
                                    currPrerenderSpy.should.have.been.calledBefore(currRenderSpy);
                                    nextPrerenderSpy.should.have.been.calledBefore(nextRenderSpy);
                                    currPrerenderSpy.should.have.been.calledBefore(nextPrerenderSpy);
                                    nextPrerenderSpy.should.have.been.calledBefore(currRenderSpy);
                                    currRenderSpy.should.have.been.calledBefore(nextRenderSpy);
                                }
                            }
                        }
                    });
                    done();
                }).catch(err => {
                    done(err);
                });
            });

            navTest('deactivate is called for each navigation step in backwards order', [
                [
                    '/user/1/action/go', '/',
                    [
                        ['UserIdConditionalRouteOne', 'UserIdConditionalRouteTwo', 'UserIdActionConditionalRoute', 'UserIdConditionalRouteThree', 'UserIdActionRoute'],
                        ['RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo'],
                    ]
                ],
            ], (done, dest1, dest2, steps) => {
                let len = steps.length;
                let rootApp = new MyRootApp(defaultOpts);
                rootApp.navigate(dest1).then(() => {
                    resetSpies();
                    return rootApp.navigate(dest2);
                }).then(() => {
                    steps.forEach((routesStrs, idx) => {
                        if (idx < len-1) {
                            let nextStepRoutesStrs = steps[idx+1];
                            for (let currRouteStr of routesStrs) {
                                let { deactivateSpy: currDeactivateSpy } = (mountSpies[currRouteStr] || cMountSpies[currRouteStr]);
                                for (let nextRouteStr of nextStepRoutesStrs) {
                                    let { deactivateSpy: nextDeactivateSpy } = (mountSpies[nextRouteStr] || cMountSpies[nextRouteStr]);
                                    // all deactivate fns should only be called once
                                    // we need this because sinon's `calledBefore` construct
                                    // doesn't check whether the spy that is within calledBefore's
                                    // parens was actually ever called.
                                    currDeactivateSpy.should.have.been.calledOnce;
                                    nextDeactivateSpy.should.have.been.calledOnce;
                                    // verify step execution order
                                    currDeactivateSpy.should.have.been.calledBefore(nextDeactivateSpy);
                                }
                            }
                        }
                    });
                    done();
                }).catch(err => {
                    done(err);
                });
            });

            navTest('sets the correct state for Apps and Routes during all transitions', [
                [
                    ['/todos/1/list', { active: ['todoApp'], inactive: ['userApp']}],
                    // same exact Routes will already be rendered, so
                    // tests should check that Route states and their
                    // outlets' CSS classes are correctly applied
                    ['/todos/2/list', { active: ['todoApp'], inactive: ['userApp']}],

                    ['/user/1/menu/stats', { active: ['userApp'], inactive: ['todoApp']}],
                    ['/news/story', { active: [], inactive: ['todoApp', 'userApp']}],
                ]
            ], (done, ...expectations) => {
                let validator = new RoutesStateValidator(MyRootApp, {log: false});
                validator.injectAssertions();

                let rootApp = MyRootApp.create(defaultOpts);

                function checkAppAtAddressHasState(state) {
                    return function(address) {
                        assertAppState(rootApp._atAddress(address), state);
                    };
                }

                // let promise;
                // let first = true;
                // for (let [ dest, appExpectations ] of expectations) {
                //     if (first) {
                //         promise = rootApp.navigate(dest).then(checkAppsState(appExpectations));
                //         first = false;
                //     } else {
                //         promise = promise.then(navigateAndCheckApps(dest, appExpectations));
                //     }
                // }

                expectations.reduce((promise, [ dest, appExpectations ]) => {
                    console.log(promise);
                    return promise.then(() => {
                        return rootApp.navigate(dest).then(() => {
                            for (let state of Object.keys(appExpectations)) {
                                let appAddresses = appExpectations[state];
                                appAddresses.forEach(checkAppAtAddressHasState(state));
                            }
                        });
                    });
                }, Promise.resolve()).then(() => {
                    validator.restoreMethods();
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });
    });
});
