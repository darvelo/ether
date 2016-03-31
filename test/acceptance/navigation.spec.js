import RootApp from '../../src/classes/root-app';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import MutableOutlet from '../../src/classes/mutable-outlet';
import diffObjects from '../../src/utils/diff-objects';
import finalDiff from '../../src/utils/final-diff';

import genTest from '../utils/test-generator';
import StateValidator from '../utils/navigation-acceptance-tests/state-validator/';
import MyRootApp from '../utils/navigation-acceptance-tests/app-under-test/root-app';

// holds Sinon spies that are regenerated
// for each test, and sometimes within a test
import {
    mountSpies,
    cMountSpies,
    resetSpies,
    getAllSpyFns,
    onAllSpyFnsBySpyNames,
} from '../utils/navigation-acceptance-tests/sinon-spies';

let freeze = Object.freeze;

class TestRoute extends Route {
    expectedOutlets() { return []; }
}
class TestApp extends App {
    expectedOutlets() { return []; }
}

describe('Navigation Acceptance Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        resetSpies();
        defaultOpts = {
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        };
    });

    describe('canNavigateTo', () => {
        let rootApp;

        beforeEach(() => {
            rootApp = MyRootApp.create(defaultOpts);
        });

        it('succeeds when it maches a path in the app hierarchy', () => {
            expect(rootApp.canNavigateTo('')).to.be.true;
            expect(rootApp.canNavigateTo('/')).to.be.true;
            expect(rootApp.canNavigateTo('/news/story')).to.be.true;
            expect(rootApp.canNavigateTo('news/story')).to.be.true;
            expect(rootApp.canNavigateTo('/todos/1/list')).to.be.true;
            expect(rootApp.canNavigateTo('todos/1/list')).to.be.true;
            expect(rootApp.canNavigateTo('/user/1/action/go')).to.be.true;
            expect(rootApp.canNavigateTo('user/1/action/go')).to.be.true;
        });

        it('fails when a pathway can\'t be found', () => {
            expect(rootApp.canNavigateTo('/nope')).to.be.false;
            expect(rootApp.canNavigateTo('nope')).to.be.false;
            expect(rootApp.canNavigateTo('/news/-')).to.be.false;
            expect(rootApp.canNavigateTo('/newss/story')).to.be.false;
            expect(rootApp.canNavigateTo('news/-')).to.be.false;
            expect(rootApp.canNavigateTo('newss/story')).to.be.false;
            expect(rootApp.canNavigateTo('/todos/hi/list')).to.be.false;
            expect(rootApp.canNavigateTo('/todos/1/-')).to.be.false;
            expect(rootApp.canNavigateTo('todos/hi/list')).to.be.false;
            expect(rootApp.canNavigateTo('todos/1/-')).to.be.false;
            expect(rootApp.canNavigateTo('/user/hi/action/go')).to.be.false;
            expect(rootApp.canNavigateTo('/user/1/actions/go')).to.be.false;
            expect(rootApp.canNavigateTo('/user/1/actions/-')).to.be.false;
            expect(rootApp.canNavigateTo('user/hi/action/go')).to.be.false;
            expect(rootApp.canNavigateTo('user/1/actions/go')).to.be.false;
            expect(rootApp.canNavigateTo('user/1/action/-')).to.be.false;
        });

        it('succeeds with a queryString', () => {
            expect(rootApp.canNavigateTo('?hello=true')).to.be.true;
            expect(rootApp.canNavigateTo('/?hello=true')).to.be.true;
            expect(rootApp.canNavigateTo('/news/story?hello=true')).to.be.true;
            expect(rootApp.canNavigateTo('news/story?hello=true')).to.be.true;
            expect(rootApp.canNavigateTo('/todos/1/list?hello=true')).to.be.true;
            expect(rootApp.canNavigateTo('todos/1/list?hello=true')).to.be.true;
            expect(rootApp.canNavigateTo('/user/1/action/go?hello=true')).to.be.true;
            expect(rootApp.canNavigateTo('user/1/action/go?hello=true')).to.be.true;
        });
    });

    describe('Performing Navigation', () => {
        describe('Basic Tests', () => {
            genTest('resolves a Promise on successful navigation', [
                '/',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            genTest('Promise rejects on 404', [
                // mount doesn't exist
                '/nope',
                // navigation ends on an App, not a Route
                '/user/1',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
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

            genTest('sets return val of fullUrl on the RootApp', [
                '/',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
                expect(rootApp.fullUrl).to.equal(undefined);
                rootApp.navigate(dest).then(() => {
                    expect(rootApp.fullUrl).to.equal('/');
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            genTest('does not set return val of fullUrl on the RootApp on nav failure', [
                '/nope',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
                expect(rootApp.fullUrl).to.equal(undefined);
                rootApp.navigate(dest).then(null, () => {
                    expect(rootApp.fullUrl).to.equal(undefined);
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            genTest('does nothing if navigating to the same URL as the current URL', [
                '/',
                '/?hello=true&goodbye=false',
                '/user/1/action/go?hello=true&goodbye=false',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
                expect(rootApp.fullUrl).to.equal(undefined);
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

            genTest('throws if construction of app state fails', [
                '/',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
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

            genTest('throws if `routingTrace.result` is neither `success` nor `404`', [
                '/',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
                let stub = sinon.stub(rootApp, '_buildPath').returns({result: null});
                expect(() => rootApp.navigate(dest)).to.throw(TypeError, 'MyRootApp#navigate(): routingTrace had in invalid value: null.');
                stub.restore();
                done();
            });

            genTest('App can call navigate', [
                ['/', 'userApp'],
                ['/news/story?xyz=true&option=1', 'userApp'],
                ['/user/1/action/go?option=1', 'userApp'],
            ], (done, dest, address) => {
                let rootApp = MyRootApp.create(defaultOpts);
                let app = rootApp._atAddress(address);
                expect(app).to.be.an.instanceof(App);
                app.navigate(dest).then(() => {
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            genTest('Route can call navigate', [
                ['/', 'userIdAction'],
                ['/news/story?xyz=true&option=1', 'userIdMenuOne'],
                ['/user/1/action/go?option=1', 'rootRoot'],
            ], (done, dest, address) => {
                let rootApp = MyRootApp.create(defaultOpts);
                let route = rootApp._atAddress(address);
                expect(route).to.be.an.instanceof(Route);
                route.navigate(dest).then(() => {
                    done();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    done(err);
                });
            });

            genTest('navigates between routes inside apps with no cMounts', [
                ['a/c', 'd/c']
            ], (done, dest1, dest2) => {
                class SimpleApp extends TestApp {
                    mount() {
                        return {
                            'c': TestRoute,
                        };
                    }
                }
                class SimpleRootApp extends RootApp {
                    mount() {
                        return {
                            'a': SimpleApp,
                            'd': SimpleApp,
                        };
                    }
                }
                let rootApp = new SimpleRootApp(defaultOpts);
                rootApp.navigate(dest1).then(() => {
                    return rootApp.navigate(dest2);
                }).then(done).catch(done);
            });
        });

        describe('Prerender/Deactivate/Render Cycle', () => {
            genTest('does not call any prerender/deactivate/render before calling navigate()', [
                '/',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
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

            genTest('calls prerender/render, in order, only on the RootApp and its navigated-to Route', [
                '/',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    let spies, prerenderSpy, renderSpy;

                    spies = mountSpies.MyRootApp;
                    prerenderSpy = spies.prerenderSpy;
                    renderSpy    = spies.renderSpy;
                    prerenderSpy.should.have.been.calledOnce;
                    renderSpy.should.have.been.calledOnce;
                    prerenderSpy.should.have.been.calledBefore(renderSpy);
                    delete spies.prerenderSpy;
                    delete spies.renderSpy;

                    spies = mountSpies.RootRootRoute;
                    prerenderSpy = spies.prerenderSpy;
                    renderSpy    = spies.renderSpy;
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

            genTest('calls prerender/render, in order, only on the RootApp, sub-App, and its navigated-to Route', [
                '/user/1/action/go',
            ], (done, dest) => {
                let rootApp = MyRootApp.create(defaultOpts);
                rootApp.navigate(dest).then(() => {
                    let spies, prerenderSpy, renderSpy;

                    spies = mountSpies.MyRootApp;
                    prerenderSpy = spies.prerenderSpy;
                    renderSpy    = spies.renderSpy;
                    prerenderSpy.should.have.been.calledOnce;
                    renderSpy.should.have.been.calledOnce;
                    prerenderSpy.should.have.been.calledBefore(renderSpy);
                    delete spies.prerenderSpy;
                    delete spies.renderSpy;

                    spies = mountSpies.UserApp;
                    prerenderSpy = spies.prerenderSpy;
                    renderSpy    = spies.renderSpy;
                    prerenderSpy.should.have.been.calledOnce;
                    renderSpy.should.have.been.calledOnce;
                    prerenderSpy.should.have.been.calledBefore(renderSpy);
                    delete spies.prerenderSpy;
                    delete spies.renderSpy;

                    spies = mountSpies.UserIdActionRoute;
                    prerenderSpy = spies.prerenderSpy;
                    renderSpy    = spies.renderSpy;
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

            genTest('passes to a sub-App\'s mount\'s prerender()/render() fns all queryParams and only the expected params for the Route', [
                '/user/1/action/go?sort=true&sort_type=asc&idx=1',
            ], (done, dest) => {
                let expectedArgs = [
                    {id: '1', action: 'go'},
                    {sort: 'true', sort_type: 'asc', idx: '1'},
                    {
                        params: {id: [undefined, '1'], action: [undefined, 'go']},
                        queryParams: {sort: [undefined, 'true'], sort_type: [undefined, 'asc'], idx: [undefined, '1']},
                    },
                ];
                let rootApp = MyRootApp.create(defaultOpts);
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
                let doneCalled = false;
                function callDone(err) {
                    if (!doneCalled) {
                        doneCalled = true;
                        done(err);
                    }
                }
                let lastIdx = dests.length-1;
                let rootApp = MyRootApp.create(defaultOpts);
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
                    // delete spies that we know were called
                    // and check that no other spies were called
                    for (let [ renderedMountStr ] of expectedRenderedMounts) {
                        if (mountSpies[renderedMountStr]) {
                            delete mountSpies[renderedMountStr].prerenderSpy;
                            delete mountSpies[renderedMountStr].renderSpy;
                        } else if (cMountSpies[renderedMountStr]) {
                            delete cMountSpies[renderedMountStr].prerenderSpy;
                            delete cMountSpies[renderedMountStr].renderSpy;
                        }
                    }
                    onAllSpyFnsBySpyNames(mountSpies, ['prerenderSpy', 'renderSpy'], (routeName, spyName, spy) => {
                        if (spy.called) {
                            callDone(new Error(`Expected mount spy "${routeName}.${spyName}" to not have been called. Perhaps you forgot to add it to the test config? Destinations: ${JSON.stringify(dests)}.`));
                        }
                    });
                    onAllSpyFnsBySpyNames(cMountSpies, ['prerenderSpy', 'renderSpy'], (routeName, spyName, spy) => {
                        if (spy.called) {
                            callDone(new Error(`Expected cMount spy "${routeName}.${spyName}" to not have been called. Perhaps you forgot to add it to the test config? Destinations: ${JSON.stringify(dests)}.`));
                        }
                    });
                    callDone();
                }).catch(err => {
                    // if test fails, pass error to Mocha
                    callDone(err);
                });
            }

            genTest('passes the right params/queryParams/diffs to mounts/conditional mounts\' prerender()/render() fns', [
                // same params and query params isn't tested because same-URL navigation is a noop

                /* Single destination */
                [
                    ['/'],
                    null, null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        // root-based mounts
                        ['RootRootRoute', null, null],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootConditionalRoute', null, null],
                    ],
                ],
                [
                    ['/?sort=true&sort_type=asc&idx=1'],
                    null, freeze({sort: 'true', sort_type: 'asc', idx: '1'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        // root-based mounts
                        ['RootRootRoute', null, null],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootConditionalRoute', null, null],
                    ],
                ],
                [
                    ['/news/story?'],
                    null, null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        // root-based mounts
                        ['RootNewsRoute', null, null],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootNewsConditionalRoute', null, freeze({news: 'story'})],
                    ],
                ],
                [
                    ['/news/story?idx=3'],
                    null, freeze({idx: '3'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        // root-based mounts
                        ['RootNewsRoute', null, null],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootNewsConditionalRoute', null, freeze({news: 'story'})],
                    ],
                ],
                [
                    ['/user/1/action/go?'],
                    null, null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', null, freeze({id: '1'})],
                        // userApp-based mounts
                        ['UserIdActionRoute', null, freeze({id: '1', action: 'go'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: '1'})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: '1'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', null, freeze({id: '1'})],
                        ['UserIdConditionalRouteTwo', null, freeze({id: '1'})],
                        ['UserIdConditionalRouteThree', null, freeze({id: '1'})],
                        ['UserIdActionConditionalRoute', null, freeze({id: '1', action: 'go'})],
                    ],
                ],
                [
                    ['/user/2/menu/stats?'],
                    null, null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', null, freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdMenuRouteOne', null, freeze({id: '2', menu: 'stats'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: '2'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['UserIdConditionalRouteFour', null, freeze({id: '2'})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: '2', menu: 'stats'})],
                    ],
                ],
                [
                    ['/user/2/menu/stats?bestFirst=true&limit=10&order=abc'],
                    null, freeze({bestFirst: 'true', limit: '10', order: 'abc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', null, freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdMenuRouteOne', null, freeze({id: '2', menu: 'stats'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: '2'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['UserIdConditionalRouteFour', null, freeze({id: '2'})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: '2', menu: 'stats'})],
                    ],
                ],
                [
                    ['/user/2/menu/stats/profile'],
                    null, null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', null, freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdMenuRouteTwo', null, freeze({id: '2', menu: 'stats'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: '2'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['UserIdConditionalRouteFour', null, freeze({id: '2'})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: '2', menu: 'stats'})],
                        ['UserIdMenuConditionalRouteTwo', null, freeze({id: '2', menu: 'stats'})],
                    ],
                ],
                [
                    ['/user/2/menu/stats/profile?bestFirst=true&limit=10&order=abc'],
                    null, freeze({bestFirst: 'true', limit: '10', order: 'abc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', null, freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdMenuRouteTwo', null, freeze({id: '2', menu: 'stats'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: '2'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['UserIdConditionalRouteFour', null, freeze({id: '2'})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: '2', menu: 'stats'})],
                        ['UserIdMenuConditionalRouteTwo', null, freeze({id: '2', menu: 'stats'})],
                    ],
                ],

                /* Multiple destinations */
                // different params, same query params
                [
                    ['/todos/1/list?hello=1&sort=asc', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({hello: '1', sort: 'asc'}), freeze({hello: '1', sort: 'asc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['TodoApp', freeze({id: '1'}), freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '2', renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: '1'}), freeze({id: '2'})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '2', renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?', '/user/2/action/stop'],
                    null, null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', freeze({id: '1'}), freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: '1', action: 'go'}), freeze({id: '2', action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '2'})],
                        ['UserIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '2'})],
                        ['UserIdActionConditionalRoute', freeze({id: '1', action: 'go'}), freeze({id: '2', action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: '1'}), freeze({id: '2'})],
                    ],
                ],
                // same params, different query params
                [
                    ['/todos/1/list', '/todos/1/list?sort=asc&hello=1'],
                    null, freeze({hello: '1', sort: 'asc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['TodoApp', freeze({id: '1'}), freeze({id: '1'})],
                        // root-based conditional mount
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '1', renderStyle: 'list'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: '1'}), freeze({id: '1'})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '1', renderStyle: 'list'})],
                    ],
                ],
                [
                    ['/user/1/action/go?sort=true&asc=1', '/user/1/action/go?sort=false&list=yes'],
                    freeze({sort: 'true', asc: '1'}), freeze({sort: 'false', list: 'yes'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', freeze({id: '1'}), freeze({id: '1'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '1'})],
                        ['RootIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '1'})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: '1', action: 'go'}), freeze({id: '1', action: 'go'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '1'})],
                        ['UserIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '1'})],
                        ['UserIdActionConditionalRoute', freeze({id: '1', action: 'go'}), freeze({id: '1', action: 'go'})],
                        ['UserIdConditionalRouteThree', freeze({id: '1'}), freeze({id: '1'})],
                    ],
                ],
                // different params, different query params
                [
                    ['/todos/1/list?sort=desc&index=1', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({index: '1', sort: 'desc'}), freeze({hello: '1', sort: 'asc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['TodoApp', freeze({id: '1'}), freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '2', renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: '1'}), freeze({id: '2'})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '2', renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?sort=true&asc=1', '/user/2/action/stop?'],
                    freeze({sort: 'true', asc: '1'}), null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', freeze({id: '1'}), freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: '1', action: 'go'}), freeze({id: '2', action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '2'})],
                        ['UserIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '2'})],
                        ['UserIdActionConditionalRoute', freeze({id: '1', action: 'go'}), freeze({id: '2', action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: '1'}), freeze({id: '2'})],
                    ],
                ],
            ], checkRenderArgsAfterNavigation);

            genTest('passes to all conditional mounts\' prerender()/render() fns all queryParams and only the expected params for the Route when navigating to it for the first time from a previous destination', [
                // In these scenarios:
                //    • `o` represents a Route or an App
                //    • dashed lines represent the previous navigation destination path
                //    • solid lines represent the current navigation destination path

                // Scenario 1: going from a node to a sibling node
                // ──o--o
                //   └──o
                [
                    ['/?hello=1&sort=asc', '/news/story'],
                    freeze({hello: '1', sort: 'asc'}), null,
                    [
                        // apps
                        ['MyRootApp', null, null],
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
                    null, freeze({hello: 'hi', sort: 'true'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['TodoApp', null, freeze({id: '1'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', null, freeze({id: '1', renderStyle: 'list'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', null, freeze({id: '1'})],
                        ['TodoIdRenderStyleConditionalRoute', null, freeze({id: '1', renderStyle: 'list'})],
                    ],
                ],
                // Scenario 3: going from a deep routing node to a node on a common ancestor node
                // ──o--o--o
                //   └──o
                [
                    ['/user/1/action/go?sort=true&asc=1', '/news/story?list=yes&sort=false'],
                    freeze({sort: 'true', asc: '1'}), freeze({sort: 'false', list: 'yes'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
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
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', null, freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', null, freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdMenuRouteTwo', null, freeze({id: '2', menu: 'stats'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', null, freeze({id: '2'})],
                        ['UserIdConditionalRouteFour', null, freeze({id: '2'})],
                        ['UserIdMenuConditionalRouteOne', null, freeze({id: '2', menu: 'stats'})],
                        ['UserIdMenuConditionalRouteTwo', null, freeze({id: '2', menu: 'stats'})],
                    ],
                ],
            ], checkRenderArgsAfterNavigation);

            genTest('passes to all conditional mounts\' prerender()/render() fns all queryParams and only the expected params for the Route when navigating to it for the second time after being at a previous, different destination', [
                // same params and query params
                [
                    ['/todos/1/list?unused=true', '/?hello=1&sort=asc', '/todos/1/list?sort=asc&hello=1'],
                    freeze({hello: '1', sort: 'asc'}), freeze({hello: '1', sort: 'asc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['TodoApp', freeze({id: '1'}), freeze({id: '1'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '1', renderStyle: 'list'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: '1'}), freeze({id: '1'})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '1', renderStyle: 'list'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/', '/user/1/action/go?'],
                    null, null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', freeze({id: '1'}), freeze({id: '1'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '1'})],
                        ['RootIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '1'})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: '1', action: 'go'}), freeze({id: '1', action: 'go'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '1'})],
                        ['UserIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '1'})],
                        ['UserIdActionConditionalRoute', freeze({id: '1', action: 'go'}), freeze({id: '1', action: 'go'})],
                        ['UserIdConditionalRouteThree', freeze({id: '1'}), freeze({id: '1'})],
                    ],
                ],
                // different params, same query params
                [
                    ['/todos/1/list?unused=true', '/?hello=1&sort=asc', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({hello: '1', sort: 'asc'}), freeze({hello: '1', sort: 'asc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['TodoApp', freeze({id: '1'}), freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '2', renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: '1'}), freeze({id: '2'})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '2', renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/', '/user/2/action/stop'],
                    null, null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', freeze({id: '1'}), freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: '1', action: 'go'}), freeze({id: '2', action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '2'})],
                        ['UserIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '2'})],
                        ['UserIdActionConditionalRoute', freeze({id: '1', action: 'go'}), freeze({id: '2', action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: '1'}), freeze({id: '2'})],
                    ],
                ],
                // same params, different query params
                [
                    ['/todos/1/list?unused=true', '/', '/todos/1/list?sort=asc&hello=1'],
                    null, freeze({hello: '1', sort: 'asc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['TodoApp', freeze({id: '1'}), freeze({id: '1'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '1', renderStyle: 'list'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: '1'}), freeze({id: '1'})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '1', renderStyle: 'list'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/?sort=true&asc=1', '/user/1/action/go?sort=false&list=yes'],
                    freeze({sort: 'true', asc: '1'}), freeze({sort: 'false', list: 'yes'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', freeze({id: '1'}), freeze({id: '1'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '1'})],
                        ['RootIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '1'})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: '1', action: 'go'}), freeze({id: '1', action: 'go'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '1'})],
                        ['UserIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '1'})],
                        ['UserIdActionConditionalRoute', freeze({id: '1', action: 'go'}), freeze({id: '1', action: 'go'})],
                        ['UserIdConditionalRouteThree', freeze({id: '1'}), freeze({id: '1'})],
                    ],
                ],
                // different params, different query params
                [
                    ['/todos/1/list?unused=true', '/?sort=desc&index=1', '/todos/2/chart?sort=asc&hello=1'],
                    freeze({index: '1', sort: 'desc'}), freeze({hello: '1', sort: 'asc'}),
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['TodoApp', freeze({id: '1'}), freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        // todo-based mounts
                        ['TodoIdRenderStyleRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '2', renderStyle: 'chart'})],
                        // todo-based conditional mounts
                        ['TodoIdConditionalRoute', freeze({id: '1'}), freeze({id: '2'})],
                        ['TodoIdRenderStyleConditionalRoute', freeze({id: '1', renderStyle: 'list'}), freeze({id: '2', renderStyle: 'chart'})],
                    ],
                ],
                [
                    ['/user/1/action/go?unused=true', '/?sort=true&asc=1', '/user/2/action/stop?'],
                    freeze({sort: 'true', asc: '1'}), null,
                    [
                        // apps
                        ['MyRootApp', null, null],
                        ['UserApp', freeze({id: '1'}), freeze({id: '2'})],
                        // root-based conditional mounts
                        ['RootAllConditionalRoute', null, null],
                        ['RootIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '2'})],
                        ['RootIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '2'})],
                        // userApp-based mounts
                        ['UserIdActionRoute', freeze({id: '1', action: 'go'}), freeze({id: '2', action: 'stop'})],
                        // userApp-based conditional mounts
                        ['UserIdConditionalRouteOne', freeze({id: '1'}), freeze({id: '2'})],
                        ['UserIdConditionalRouteTwo', freeze({id: '1'}), freeze({id: '2'})],
                        ['UserIdActionConditionalRoute', freeze({id: '1', action: 'go'}), freeze({id: '2', action: 'stop'})],
                        ['UserIdConditionalRouteThree', freeze({id: '1'}), freeze({id: '2'})],
                    ],
                ],
            ], checkRenderArgsAfterNavigation);

            genTest('calls deactivate() when diverging from active mount/conditional mounts between prerender and render of to-be-activated mount/cMounts', [
                // In these scenarios:
                //    • `o` represents a Route or an App
                //    • dashed lines represent the previous navigation destination path
                //    • solid lines represent the current navigation destination path

                // Scenario 1: going from a node to a sibling node
                // ──o--o
                //   └──o
                ['/', '/news/story',
                    [
                        // apps
                        'MyRootApp',
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
                        // apps
                        'TodoApp',
                        'UserApp',
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
                        // apps
                        'MyRootApp',
                        'TodoApp',
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
                        // apps
                        'UserApp',
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
                        // apps
                        'MyRootApp',
                        // root-based mounts
                        'RootNewsRoute',
                        // root-based conditional mounts
                        'RootAllConditionalRoute', 'RootNewsConditionalRoute',
                    ],
                    [
                        // apps
                        'UserApp',
                        // root-based conditional mounts
                        'RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo',
                        // userApp-based mounts
                        'UserIdActionRoute',
                        // userApp-based conditional mounts
                        'UserIdConditionalRouteOne',
                        'UserIdConditionalRouteTwo', 'UserIdConditionalRouteThree', 'UserIdActionConditionalRoute',
                    ],
                    [
                        // apps
                        'TodoApp',
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
                        // apps
                        'MyRootApp',
                        'UserApp',
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
                        // apps
                        'TodoApp',
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
                let rootApp = MyRootApp.create(defaultOpts);
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

            genTest('prerender/render are called for each navigation step in forwards order', [
                [
                    '/user/1/action/go',
                    [
                        ['MyRootApp'],
                        ['RootAllConditionalRoute', 'RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo'],
                        ['UserApp'],
                        ['UserIdConditionalRouteOne', 'UserIdConditionalRouteTwo', 'UserIdActionConditionalRoute', 'UserIdConditionalRouteThree', 'UserIdActionRoute'],
                    ]
                ],
            ], (done, dest, steps) => {
                let len = steps.length;
                let rootApp = MyRootApp.create(defaultOpts);
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

            genTest('deactivate is called for each navigation step in backwards order', [
                [
                    '/user/1/action/go', '/',
                    [
                        ['UserIdConditionalRouteOne', 'UserIdConditionalRouteTwo', 'UserIdActionConditionalRoute', 'UserIdConditionalRouteThree', 'UserIdActionRoute'],
                        ['UserApp'],
                        ['RootIdConditionalRouteOne', 'RootIdConditionalRouteTwo'],
                    ]
                ],
            ], (done, dest1, dest2, steps) => {
                let len = steps.length;
                let rootApp = MyRootApp.create(defaultOpts);
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

            genTest('sets the correct state for Apps and Routes during all transitions', [
                [
                    '/todos/1/list',
                    // same exact Apps/Routes will be rerendered, so
                    // navigating here tests that Apps'/Routes' states and
                    // their outlets' CSS classes are correctly applied
                    '/todos/2/list',

                    '/user/1/menu/stats',
                    '/news/story',
                ]
            ], (done, ...destinations) => {
                let validator = new StateValidator(MyRootApp, {log: false});
                validator.injectAssertions();

                let rootApp = MyRootApp.create(defaultOpts);

                destinations.reduce((promise, dest) => {
                    return promise.then(() => {
                        return rootApp.navigate(dest);
                    });
                }, Promise.resolve()).then(() => {
                    validator.restoreMethods();
                    done();
                }).catch(err => {
                    done(err);
                });
            });

            genTest('navigates successfully even if a route\'s prerender/render/deactivate functions reject', [
                ['a', 'b'],
            ], (done, dest1, dest2) => {
                class FailRoute extends TestRoute {
                    prerender() {
                        return Promise.reject('prerender reject');
                    }
                    render() {
                        throw new Error('render error');
                    }
                    deactivate() {
                        return Promise.reject('deactivate reject');
                    }
                }
                class FailRootApp extends RootApp {
                    mount() {
                        return {
                            'a': FailRoute,
                            'b': TestRoute,
                        };
                    }
                }
                let rootApp = new FailRootApp(defaultOpts);
                rootApp.navigate(dest1).then(() => {
                    expect(rootApp.fullUrl).to.equal(dest1);
                    return rootApp.navigate(dest2);
                }).then(() => {
                    expect(rootApp.fullUrl).to.equal(dest2);
                    done();
                }).catch(done);
            });
        });
    });

    describe('Transition Queueing', () => {
        it('queues transitions', done => {
            // transition spies
            let navBegin = sinon.spy();
            let navRoot  = sinon.spy();
            let navNews  = sinon.spy();
            let navActn  = sinon.spy();
            let navMenu  = sinon.spy();

            let rootApp = MyRootApp.create(defaultOpts);

            // render cycle spies
            let rApp = mountSpies.MyRootApp;
            let uApp = mountSpies.UserApp;
            let tApp = mountSpies.TodoApp;
            let root = mountSpies.RootRootRoute;
            let news = mountSpies.RootNewsRoute;
            let actn = mountSpies.UserIdActionRoute;
            let menu = mountSpies.UserIdMenuRouteOne;
            let todo = mountSpies.TodoIdRenderStyleRoute;

            navBegin();
            rootApp.navigate('/').then(() => {
                rApp.prerenderSpy.should.have.been.calledAfter(navBegin);
                root.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                rApp.renderSpy.should.have.been.calledAfter(root.prerenderSpy);
                root.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                navRoot();
            });
            rootApp.navigate('/news/story').then(() => {
                rApp.prerenderSpy.should.have.been.calledAfter(navRoot);
                news.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                root.deactivateSpy.should.have.been.calledAfter(news.prerenderSpy);
                rApp.renderSpy.should.have.been.calledAfter(root.deactivateSpy);
                news.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                navNews();
            });
            rootApp.navigate('/user/1/action/go').then(() => {
                rApp.prerenderSpy.should.have.been.calledAfter(navNews);
                uApp.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                actn.prerenderSpy.should.have.been.calledAfter(uApp.prerenderSpy);
                news.deactivateSpy.should.have.been.calledAfter(actn.prerenderSpy);
                rApp.renderSpy.should.have.been.calledAfter(news.deactivateSpy);
                uApp.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                actn.renderSpy.should.have.been.calledAfter(uApp.renderSpy);
                navActn();
            });
            rootApp.navigate('/user/1/menu/list').then(() => {
                rApp.prerenderSpy.should.have.been.calledAfter(navActn);
                uApp.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                menu.prerenderSpy.should.have.been.calledAfter(uApp.prerenderSpy);
                actn.deactivateSpy.should.have.been.calledAfter(menu.prerenderSpy);
                // a divergence point (App) deactivate is never called
                // since another branch will be rendered on it
                uApp.deactivateSpy.should.not.have.been.called;
                rApp.renderSpy.should.have.been.calledAfter(actn.deactivateSpy);
                uApp.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                menu.renderSpy.should.have.been.calledAfter(uApp.renderSpy);
                navMenu();
            });
            rootApp.navigate('/todos/1/list').then(() => {
                rApp.prerenderSpy.should.have.been.calledAfter(navMenu);
                tApp.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                todo.prerenderSpy.should.have.been.calledAfter(tApp.prerenderSpy);
                menu.deactivateSpy.should.have.been.calledAfter(todo.prerenderSpy);
                uApp.deactivateSpy.should.have.been.calledAfter(menu.deactivateSpy);
                rApp.renderSpy.should.have.been.calledAfter(uApp.deactivateSpy);
                tApp.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                todo.renderSpy.should.have.been.calledAfter(tApp.renderSpy);

                // app spies
                rApp.prerenderSpy.should.have.callCount(5);
                // RootApp#deactivate() is never called under any circumstance
                rApp.deactivateSpy.should.not.have.been.called;
                rApp.renderSpy.should.have.callCount(5);
                uApp.prerenderSpy.should.have.callCount(2);
                uApp.deactivateSpy.should.have.been.calledOnce;
                uApp.renderSpy.should.have.callCount(2);
                tApp.prerenderSpy.should.have.callCount(1);
                tApp.deactivateSpy.should.not.have.been.called;
                tApp.renderSpy.should.have.callCount(1);

                // all route spies should have been called once
                root.prerenderSpy.should.have.been.calledOnce;
                root.deactivateSpy.should.have.been.calledOnce;
                root.renderSpy.should.have.been.calledOnce;
                news.prerenderSpy.should.have.been.calledOnce;
                news.deactivateSpy.should.have.been.calledOnce;
                news.renderSpy.should.have.been.calledOnce;
                actn.prerenderSpy.should.have.been.calledOnce;
                actn.deactivateSpy.should.have.been.calledOnce;
                actn.renderSpy.should.have.been.calledOnce;
                menu.prerenderSpy.should.have.been.calledOnce;
                menu.deactivateSpy.should.have.been.calledOnce;
                menu.renderSpy.should.have.been.calledOnce;
                todo.prerenderSpy.should.have.been.calledOnce;
                // note: todo.deactivateSpy is never called
                todo.deactivateSpy.should.not.have.been.called;
                todo.renderSpy.should.have.been.calledOnce;

                done();
            }).catch(done);
        });

        it('continues transition queue even if some fail', done => {
            // transition spies
            let navBegin = sinon.spy();
            let navRoot  = sinon.spy();
            let navNews  = sinon.spy();
            let navActn  = sinon.spy();
            let navMenu  = sinon.spy();
            let navBadResolve = sinon.spy();
            let navBadReject  = sinon.spy();
            let navBad2Resolve = sinon.spy();
            let navBad2Reject  = sinon.spy();

            let rootApp = MyRootApp.create(defaultOpts);

            // render cycle spies
            let rApp = mountSpies.MyRootApp;
            let uApp = mountSpies.UserApp;
            let tApp = mountSpies.TodoApp;
            let root = mountSpies.RootRootRoute;
            let news = mountSpies.RootNewsRoute;
            let actn = mountSpies.UserIdActionRoute;
            let menu = mountSpies.UserIdMenuRouteOne;
            let todo = mountSpies.TodoIdRenderStyleRoute;

            navBegin();
            rootApp.navigate('/').then(() => {
                rApp.prerenderSpy.should.have.been.calledAfter(navBegin);
                root.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                rApp.renderSpy.should.have.been.calledAfter(root.prerenderSpy);
                root.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                navRoot();
            });
            rootApp.navigate('/non-existent').then(navBadResolve, navBadReject);
            rootApp.navigate('/news/story').then(() => {
                navBadResolve.should.not.have.been.called;
                navBadReject.should.have.been.calledAfter(navRoot);
                rApp.prerenderSpy.should.have.been.calledAfter(navBadReject);
                news.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                root.deactivateSpy.should.have.been.calledAfter(news.prerenderSpy);
                rApp.renderSpy.should.have.been.calledAfter(root.deactivateSpy);
                news.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                navNews();
            });
            rootApp.navigate('/user/1/action/go').then(() => {
                rApp.prerenderSpy.should.have.been.calledAfter(navNews);
                uApp.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                actn.prerenderSpy.should.have.been.calledAfter(uApp.prerenderSpy);
                news.deactivateSpy.should.have.been.calledAfter(actn.prerenderSpy);
                rApp.renderSpy.should.have.been.calledAfter(news.deactivateSpy);
                uApp.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                actn.renderSpy.should.have.been.calledAfter(uApp.renderSpy);
                navActn();
            });
            rootApp.navigate('/non/existent2').then(navBad2Resolve, navBad2Reject);
            rootApp.navigate('/user/1/menu/list').then(() => {
                navBad2Resolve.should.not.have.been.called;
                navBad2Reject.should.have.been.calledAfter(navActn);
                rApp.prerenderSpy.should.have.been.calledAfter(navBad2Reject);
                uApp.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                menu.prerenderSpy.should.have.been.calledAfter(uApp.prerenderSpy);
                actn.deactivateSpy.should.have.been.calledAfter(menu.prerenderSpy);
                // a divergence point (App) deactivate is never called
                // since another branch will be rendered on it
                uApp.deactivateSpy.should.not.have.been.called;
                rApp.renderSpy.should.have.been.calledAfter(actn.deactivateSpy);
                uApp.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                menu.renderSpy.should.have.been.calledAfter(uApp.renderSpy);
                navMenu();
            });
            rootApp.navigate('/todos/1/list').then(() => {
                rApp.prerenderSpy.should.have.been.calledAfter(navMenu);
                tApp.prerenderSpy.should.have.been.calledAfter(rApp.prerenderSpy);
                todo.prerenderSpy.should.have.been.calledAfter(tApp.prerenderSpy);
                menu.deactivateSpy.should.have.been.calledAfter(todo.prerenderSpy);
                uApp.deactivateSpy.should.have.been.calledAfter(menu.deactivateSpy);
                rApp.renderSpy.should.have.been.calledAfter(uApp.deactivateSpy);
                tApp.renderSpy.should.have.been.calledAfter(rApp.renderSpy);
                todo.renderSpy.should.have.been.calledAfter(tApp.renderSpy);

                // app spies
                rApp.prerenderSpy.should.have.callCount(5);
                // RootApp#deactivate() is never called under any circumstance
                rApp.deactivateSpy.should.not.have.been.called;
                rApp.renderSpy.should.have.callCount(5);
                uApp.prerenderSpy.should.have.callCount(2);
                uApp.deactivateSpy.should.have.been.calledOnce;
                uApp.renderSpy.should.have.callCount(2);
                tApp.prerenderSpy.should.have.callCount(1);
                tApp.deactivateSpy.should.not.have.been.called;
                tApp.renderSpy.should.have.callCount(1);

                // all route spies should have been called once
                root.prerenderSpy.should.have.been.calledOnce;
                root.deactivateSpy.should.have.been.calledOnce;
                root.renderSpy.should.have.been.calledOnce;
                news.prerenderSpy.should.have.been.calledOnce;
                news.deactivateSpy.should.have.been.calledOnce;
                news.renderSpy.should.have.been.calledOnce;
                actn.prerenderSpy.should.have.been.calledOnce;
                actn.deactivateSpy.should.have.been.calledOnce;
                actn.renderSpy.should.have.been.calledOnce;
                menu.prerenderSpy.should.have.been.calledOnce;
                menu.deactivateSpy.should.have.been.calledOnce;
                menu.renderSpy.should.have.been.calledOnce;
                todo.prerenderSpy.should.have.been.calledOnce;
                // note: todo.deactivateSpy is never called
                todo.deactivateSpy.should.not.have.been.called;
                todo.renderSpy.should.have.been.calledOnce;

                done();
            }).catch(done);
        });
    });
});
