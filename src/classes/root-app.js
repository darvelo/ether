import App from './app';
import Route from './route';
import Transition from './transition';
import InitRunner from '../utils/init-runner';
import ctorName from '../utils/ctor-name';
import { is, isnt } from '../utils/is';
import diffObjects from '../utils/diff-objects';
import finalDiff from '../utils/final-diff';

class RootApp extends App {
    constructor(opts) {
        if (isnt(opts, 'Object')) {
            opts = {};
        }
        opts.rootApp = true;
        opts.parentApp = true;
        opts.addresses = opts.addresses || [];
        opts.outlets = opts.outlets || {};
        opts.params = [];

        super(opts);
        opts.rootApp = this;

        // enclose basePath between slashes
        if (is(opts.basePath, 'String') && opts.basePath.length) {
            let len = opts.basePath.length;
            let finalBasePath = [];
            if (opts.basePath[0] !== '/') {
                finalBasePath.push('/');
            }
            finalBasePath.push(opts.basePath);
            if (len !== 1 && opts.basePath[len-1] !== '/') {
                finalBasePath.push('/');
            }
            opts.basePath = finalBasePath.join('');
        } else {
            opts.basePath = '/';
        }
        opts.basePath = encodeURI(opts.basePath);

        this._rootApp = this;
        this._parentApp = null;
        // runs the init() method for all Apps/Routes only
        // after all their constructors have returned
        this._inits = new InitRunner();
        // this is used when unit testing Apps/Routes
        if (opts._pauseInitRunner === true) {
            this._inits.pause();
        }
        this._config = Object.freeze({
            stripTrailingSlash: !!opts.stripTrailingSlash || false,
            addTrailingSlash: !!opts.addTrailingSlash || false,
            basePath: opts.basePath,
            windowLoad: opts.windowLoad || false,
            history: opts.history || false,
            interceptLinks: opts.interceptLinks || 'none',
            debugMode: opts.debug === true,
        });

        // the last URL that was navigated to successfully
        this._fullUrl = undefined;
        // the params for the RootApp's render methods,
        // parsed from the last URL that was navigated to successfully
        this._lastParams = null;
        // the querystring params parsed from the
        // last URL that was navigated to successfully
        this._lastQueryParams = null;
        // transition-related data
        this._transitionQueue = [];
        this._currentTransition = null;

        // construct the App hierarchy
        this._buildAppTree(opts);
        this._inits.run();
    }

    get fullUrl() {
        return this._fullUrl;
    }

    getCurrentTransition() {
        return this._currentTransition;
    }

    expectedAddresses() {
        return [];
    }

    addressesHandlers() {
        return [];
    }

    expectedOutlets() {
        return ['main'];
    }

    expectedParams() {
        return [];
    }

    expectedSetup(setup) {
        // user/3rd-party library author can throw if `setup` is not as expected
        return;
    }

    sendTo(address, ...args) {
        return this._inits.then(() => {
            let recipient = this._atAddress(address);
            let handler = recipient._addressHandlers[address];
            return handler.apply(recipient, args);
        });
    }

    _registerAddress(name, dest) {
        this._addresses = this._addresses || (this._addresses = {});

        if (/,/.test(name)) {
            throw new Error(`Addresses cannot contain a comma: "${name}".`);
        }

        if (!(dest instanceof App) && !(dest instanceof Route)) {
            throw new TypeError([
                ctorName(this),
                ' cannot register an address for a non-App/non-Route instance, ',
                ctorName(dest),
                '.',
            ].join(''));
        }

        if (name in this._addresses) {
            throw new Error([
                ctorName(this),
                ' address "',
                name,
                '" already taken. Could not register the address for ',
                ctorName(dest),
                '.',
            ].join(''));
        }

        this._addresses[name] = dest;
    }

    _atAddress(name) {
        this._addresses = this._addresses || (this._addresses = {});
        return this._addresses[name];
    }

    _getBasepathHref() {
        return window.location.origin + this._config.basePath;
    }

    _joinBasepathTo(destination) {
        if (destination[0] === '/') {
            destination = destination.slice(1);
        }
        return this._config.basePath + destination;
    }

    _splitDestination(destination) {
        let [ path, queryString='' ] = destination.split('?');
        return {path, queryString};
    }

    /**
     * Determine if the URL passed in has the same origin and its pathname matches the RootApp's configured `basePath`.
     * @private
     * @param {string} url The complete URL to be tested.
     * @return {?string} The path in the URL that can be used for navigation: `url` minus the origin and RootApp's `basePath`. `Null` if the origin and basePath didn't match the URL.
     */
    _getNavigationPath(url) {
        let base = this._getBasepathHref(url);
        if (url.indexOf(base) === 0) {
            // slice base.length-1 so we can keep the leading slash
            return url.slice(base.length-1);
        } else {
            return null;
        }
    }

    _popstate(event) {
        let path = this._getNavigationPath(window.location.href);
        if (path) {
            let promise = this.navigate(path, {pushState: false});
            let handler = this._config.history;
            if (is(handler, 'Function')) {
                handler.call(this, event, promise);
            }
        }
    }

    _linksClickDelegatedHandler(event) {
        if (event.button !== 0) {
            return;
        }
        let target = event.target;
        while (target && target.nodeName !== 'A') {
            target = target.parentNode;
        }
        if (!target) {
            return;
        }
        if (target.getAttribute('target') !== null) {
            return;
        }
        let path = this._getNavigationPath(target.href);
        if (path) {
            event.stopPropagation();
            event.preventDefault();
            let promise = this.navigate(path);
            let handler = this._config.interceptLinks;
            if (is(handler, 'Function')) {
                handler.call(this, event, promise);
            }
        }
    }

    /**
     * Add a delegated link click handler function on all outlets for all Apps recursively.
     * @private
     * @param {App} app The app on whose outlets the click handler will be bound.
     * @param {Function} clickHandler The click handler whose `this` has already been bound to the RootApp.
     */
    _interceptOutletsLinks(app, clickHandler) {
        let rootApp = app._rootApp;
        let mountMapper = app._mountMapper;
        let apps = mountMapper.allMounts().filter(mount => mount instanceof App);

        apps.forEach(app => rootApp._interceptOutletsLinks(app, clickHandler));

        let outlets = app.outlets;
        Object.keys(outlets).forEach(name => {
            let element = outlets[name]._element;
            element.addEventListener('click', clickHandler, false);
        });
    }

    start() {
        if (this._config.windowLoad) {
            let path = this._getNavigationPath(window.location.href);
            if (path) {
                window.addEventListener('load', event => {
                    let promise = this.navigate(path, {pushState: false});
                    let handler = this._config.windowLoad;
                    if (is(handler, 'Function')) {
                        handler.call(this, event, promise);
                    }
                }, false);
            }
        }

        if (this._config.history) {
            window.addEventListener('popstate', this._popstate.bind(this), false);
        }

        let clickHandler = this._linksClickDelegatedHandler.bind(this);
        let type = this._config.interceptLinks;
        if (is(type, 'Function')) {
            type = type.name;
        }
        if (type === 'all') {
            document.addEventListener('click', clickHandler, false);
        } else if (type === 'outlets') {
            this._interceptOutletsLinks(this, clickHandler);
        }

        return this;
    }

    /**
     * Parses a query string.
     * @private
     * @param {string} queryString A string analogous to window.location.search.
     * @return {?object} An object containing the query params as the object's keys with values. Null if there were no query params.
     */
    _parseQueryString(queryString) {
        if (queryString[0] === '?') {
            queryString = queryString.slice(1);
        }
        if (!queryString.length) {
            return null;
        }

        return queryString.split('&').reduce((memo, pairStr) => {
            let [ key, val ] = pairStr.split('=');
            val = decodeURIComponent(val);
            // isNaN will coerce empty string or all spaces to 0
            // so we need to guard against that case with regex
            if (val === 'true') {
                val = true;
            } else if (val === 'false') {
                val = false;
            }
            memo[key] = val;
            return memo;
        }, {});
    }

    _triggerNextTransition() {
        if (!this._transitionQueue.length) {
            this._currentTransition = null;
        } else {
            this._currentTransition = this._transitionQueue.shift();
            this._currentTransition.start().then(
                this._triggerNextTransition.bind(this),
                this._triggerNextTransition.bind(this)
            );
        }
    }

    /**
     * Navigates to a new URL path on the Ether application. Called manually or, if configured to, on: popstate, page landing, or intercepted links.
     * @param {string} destination The navigation destination. Can be a URL string with or without a querystring.
     * @param {object} opts Options for navigation, such as whether to perform a pushState or replaceState on success.
     * @return {Promise} A promise that resolves if navigation succeeded, and rejects if it failed, with the details of the failure (404 or navigation error).
     */
    navigate(destination, opts={pushState: true}) {
        let newTransition = new Transition(destination, opts, this._navigate.bind(this));
        if (this.getCurrentTransition()) {
            this._transitionQueue.push(newTransition);
        } else {
            this._currentTransition = newTransition;
            this._currentTransition.start().then(
                this._triggerNextTransition.bind(this),
                this._triggerNextTransition.bind(this)
            );
        }
        return newTransition.promise;
    }

    /**
     * Performs the navigation that was scheduled with a call to the non-private version of this function, `navigate()`.
     * @private
     * @param {string} destination The navigation destination. A URL path with or without a querystring.
     * @param {object} opts Options for navigation, such as whether to perform a pushState or replaceState on success.
     * @return {Promise} A promise that resolves if navigation succeeded, and rejects if it failed, with the details of the failure (404 or navigation error).
     */
    _navigate(destination, opts) {
        let { path, queryString } = this._splitDestination(destination);
        let queryParams = this._parseQueryString(queryString);
        let queryParamsDiff = null;
        let trailingSlashRegex = /\/+$/;

        if (this._config.stripTrailingSlash === true) {
            if (trailingSlashRegex.test(path)) {
                path = path.replace(trailingSlashRegex, '');
            }
        }

        if (this._config.addTrailingSlash === true) {
            if (!trailingSlashRegex.test(path)) {
                path += '/';
            }
        }

        if (isnt(queryParams, 'Null') || isnt(this._lastQueryParams, 'Null')) {
            queryParamsDiff = diffObjects(this._lastQueryParams || {}, queryParams || {});
        }

        // check if we're navigating to the same URL as the one we're
        // currently on. this can happen if a link was clicked twice
        if (this.fullUrl) {
            let [ lastPath ] = this.fullUrl.split('?');
            if (path === lastPath && is(queryParamsDiff, 'Null')) {
                return Promise.resolve({sameUrl: true});
            }
        }

        let routingTrace = this._buildPath(path);
        if (routingTrace.result === '404') {
            // notify user of 404 and pass routingTrace;
            // let them handle the 404 the way they find best
            let err = new Error(`404 for path: "${destination}".`);
            err.routingTrace = routingTrace;
            return Promise.reject(err);
        } else if (routingTrace.result === 'success'){
            return this._constructState(routingTrace, queryParams, queryParamsDiff).then(() => {
                this._fullUrl = destination;
                if (this._config.history) {
                    destination = this._joinBasepathTo(destination);
                    if (opts.replaceState === true) {
                        window.history.replaceState({}, '', destination);
                    } else if (opts.pushState === true) {
                        window.history.pushState({}, '', destination);
                    }
                }
            });
        } else {
            throw new TypeError(`${ctorName(this)}#navigate(): routingTrace had in invalid value: ${JSON.stringify(routingTrace.result)}.`);
        }
    }

    /**
     * Returns whether the path given results in a successful trace
     * through the app hierarchy down to the target route, found by
     * parsing the URL.
     * @param {string} destination The navigation destination. A URL path with or without a querystring.
     * @return {boolean} Whether the navigation would be successful or result in a 404.
     */
    canNavigateTo(destination) {
        let { path } = this._splitDestination(destination);
        return this._buildPath(path).result === 'success';
    }

    _routeFor(destination) {
        let { path } = this._splitDestination(destination);
        let routingTrace = this._buildPath(path);
        let steps = routingTrace.steps;
        let { app, crumb } = steps[steps.length-1];
        return app._mountMapper.mountFor(crumb);
    }

    /**
     * @typedef DivergenceRecord
     * @private
     * @type {object}
     * @property {App} app The App where the divergence is taking place.
     * @property {string} from The crumb on the `app` of the to-be-deactivated mount that is currently activated based on the current URL.
     * @property {string} to   The crumb on the `app` of the to-be-activated mount (based on the destination passed to `navigate()`) that is currently deactivated.
     */

    /**
     * @typedef NavigationStep
     * @private
     * @type {object}
     * @property {App} app The App that has mounted the mount pointed to by `crumb`.
     * @property {string} crumb The string representing a mount that's mounted on `app`.
     * @property {object} params The params in the URL passed to `navigate()` as matched to the params the mount at `crumb` should explicitly parse for, if any.
     * @example
     * {
     * //  app: an App instance
     *     crumb: 'first/{id=\\d+}/',
     *     params: {id: 1},
     * }
     * @example
     * {
     * //  app: an App instance
     *     crumb: 'second/{name=\\w+}/',
     *     params: {name: 'Jeff'},
     * }
     * @example
     * {
     * //  app: an App instance
     *     crumb: 'edit',
     *     params: {},
     * }
     */

    /**
     * @typedef RoutingTrace
     * @private
     * @type {object}
     * @property {string} result `success` or `404`.
     * @property {?DivergenceRecord} diverge An object that describes where the path in the URL diverged when tracing the new navigation path from the URL passed to `navigate()` as compared to the navigation path of current URL. `Null` if the path was the same as before and only params or query params changed.
     * @property {Array.<NavigationStep>} steps The steps, in order from the RootApp to the leaf Route, that we can follow to the navigation destination.
     * @example
     * // when navigating from '/info' to `/user/1/profile/edit`:
     * {
     *     result: 'success',
     *     diverge: {
     *         // the `app` in this example is the RootApp instance that
     *         // the user constructed, but may be any App instance
     *         // along the path to the destination
     *         app: rootApp,
     *         from: 'info',
     *         to:   'user/{id=\\d+}',
     *     },
     *     steps: [
     *         // params will accumulate on each step and be passed to
     *         // prerender/render on activated conditional mounts
     *         // along the way, and finally to the activated leaf mount
     *         {
     *         //  app: an app instance
     *             crumb: 'user/{id=\\d+}',
     *             params: {id: 1},
     *         },
     *         {
     *         //  app: an app instance
     *             crumb: '{menu=\\w+}',
     *             params: {menu: 'profile'},
     *         },
     *         {
     *         //  app: an app instance
     *             crumb: 'edit',
     *             params: {},
     *         }
     *     ],
     * }
     */

    /**
     * Builds an object representing a trace through the app hierarchy down to the target route found by parsing the URL (querystring not included).
     * @private
     * @param {string} path The URL to parse, minus the querystring.
     * @return {RoutingTrace} An object that can be used to construct app state. Informs whether the navigation would be successful or result in a 404.
     */
    _buildPath(path) {
        let app = this;
        let steps = [];
        let diverge = null;
        let matchResult, result;

        // traverse the App tree, picking up mounts and parsing for
        // params along the way. detect any divergence from current
        // navigation path.
        //
        // intentional assignment
        while (matchResult = app._mountMapper.match(path)) {
            let { crumb, params } = matchResult;
            let currentMountCrumb = app._mountMapper.getCurrentMount();

            // get divergence, if any.
            // we don't mark divergence when currentMountCrumb is
            // not a string (representing a mount), because there's no
            // mount nor cMounts that need to be deactivated in that case
            if (is(diverge, 'Null') && is(currentMountCrumb, 'String') && crumb !== currentMountCrumb) {
                diverge = {
                    app,
                    from: currentMountCrumb,
                    to: crumb,
                };
            }

            steps.push({app, crumb, params});
            // get the next mount/node to continue tree traversal
            app = app._mountMapper.mountFor(crumb);

            // if there is no more URL string data to match against,
            // we have reached the end of the original full path
            if (is(matchResult.rest, 'Null')) {
                // navigation must end on a Route;
                // if we're at an App, determine on the next pass
                // whether it has a mount on the index path
                if (app instanceof Route) {
                    break;
                } else {
                    path = '';
                }
            } else {
                // continue onto the next pass with the
                // matched portion of the path chopped out
                path = matchResult.rest;
            }
        }

        if (is(matchResult, 'Null')) {
            // 404, last step was an App or some part of the path
            // couldn't be matched to a mount somewhere along the way
            result = '404';
        } else {
            // last step ended in a Route and the URL path was completely matched
            result = 'success';
        }

        let routingTrace = {
            result,
            diverge,
            steps,
        };
        return routingTrace;
    }

    /**
     * @typedef Diff
     * @type {object}
     * @property {?object} params A diff of the current params in the URL parsed against a App/Route's expected params, vs. the params sent to the App/Route on the last successful navigation. `Null` if they are no different than what they were on last navigation.
     * @property {?object} queryParams A diff of the current querystring parameters in the URL vs. the querystring params available in the URL of the last successful navigation. `Null` if they are no different than what they were on last navigation.
     */

    /**
     * @typedef MountNavigationData
     * @private
     * @type {object}
     * @property {string} crumb The string representing a mount that's mounted on a particular App.
     * @property {App|Route} mount The mount pointed to by `crumb`.
     * @property {?object} params The params that will be sent to `mount._prerender()` and `mount._render()`. `Null` if they were no different than what they were on last navigation.
     * @property {?Diff} diff The diff of params for this route and the diff of the global queryParams since the last successful navigation. `Null` if neither params nor queryParams were different than what they were on last navigation.
     * @example
     * {
     *     crumb: 'first/{id=\\d+}/',
     * //  mount:  instance of App or Route
     *     params: {id: 1},
     *     diff: {
     *         params: {id: [20, 1]},
     *         queryParams: {sort: [undefined, 'ascending']},
     *     },
     * }
     */

    /**
     * @typedef ConditionalMountNavigationData
     * @private
     * @type {object}
     * @property {Route} route A route that is mounted on a particular conditional mount. Though conditional mounts can hold many routes, this is just one of them, since this record pertains only to the params etc. that should be sent to this route in particular.
     * @property {?object} params The params that will be sent to `route._prerender()` and `route._render()`. `Null` if they were no different than what they were on last navigation.
     * @property {?Diff} diff The diff of params for this route and the diff of the global queryParams since the last successful navigation. `Null` if neither params nor queryParams were different than what they were on last navigation.
     * @example
     * {
     * //  route:  instance of Route
     *     params: {id: 1},
     *     diff: {
     *         params: {id: [20, 1]},
     *         queryParams: {sort: [undefined, 'ascending']},
     *     },
     * }
     */

    /**
     * @typedef NavigationData
     * @private
     * @type {object}
     * @property {App} app The App that holds the mount and conditional mounts in this object.
     * @property {MountNavigationData} mountData All the information needed to prerender/render the mount.
     * @property {Object.<string, Array.<ConditionalMountNavigationData>>} cMountsRenderData All the information needed to prerender/render the conditional mounts that correspond to the mount in `mountData`.
     */

    /**
     * Filters all the params expected for a RootApp/App from its to-be-rendered mount's
     * available params, as well as creates a diff of the aforementioned
     * filtered params against the last params sent to the RootApp/App on
     * the last successful navigation. This diff is combined with the
     * mount's diff of the queryParams to make a single object holding
     * both diffs.
     * @private
     * @property {App} app The RootApp/App to compile data for in order to have it rendered.
     * @property {MountNavigationData} mountData All the information from the RootApp/App's mount needed to prerender/render the RootApp/App.
     * @return {crumb: string, lastParams: object, params: object, diff: Diff} The combination of: the crumb of the App on its parent App if it's not a RootApp; the params used when last rendering this RootApp/App; the params to use when rendering this RootApp/App; and a combination of both the diff for both the params for this RootApp/App vs. those sent in the last navigation, and the diff of the global querystring params in the URL vs. those in the last successful navigation. `Null` if neither the params nor queryParams diffs were different than what they were on last navigation.
     */
    _buildAppRenderDataFromMountRenderData(app, mountData) {
        let crumb;
        let lastParams;

        if (app instanceof RootApp) {
            lastParams = app._lastParams;
        } else {
            let mm = app._parentApp._mountMapper;
            let crumbData = mm._crumbDataFor(app);
            crumb = crumbData.crumb;
            lastParams = mm.lastParamsFor(crumbData.crumb);
        }

        lastParams = lastParams || {};

        let { params, diff } = this._buildRenderData(
            // this will also contain the mount's own params,
            // but the expectedParams for the app won't be
            // allowed to access them unless *all* of its mounts'
            // crumbs contain the same param name. so although we're
            // passing more params here than necessary, it's safe.
            mountData.params,
            app.expectedParams(),
            lastParams,
            // if diff is null, that means the queryParams haven't changed
            // (as well as the mount's params, but that part's not important here)
            mountData.diff ? mountData.diff.queryParams : mountData.diff
        );

        return {
            crumb,
            lastParams,
            params,
            diff,
        };
    }

    /**
     * Call `_prerender` or `_render` on all activating cMounts' routes
     * at each step all at once, then use a promise's .then() to do the
     * same at the next step. The net effect is that all cMounts'
     * `_prerender`/`_render` are called for each step in order, step by
     * step, visiting the next step/node only after all activating
     * cMounts' routes' `_prerender`/`render` are called at that step/node.
     * At the last step, also call `_prerender`/`_render` on the leaf Route.
     * @private
     * @param {string} renderType The method to call on the mount, either `_prerender` or `_render`.
     * @param {Array.<NavigationData>} steps All the information needed to successfully traverse and navigate Apps to the leaf Route.
     * @param {?object} queryParams The query params parsed from the URL passed to `navigate()`. Null if there were none.
     * @return {Promise} A promise that resolves when all `_prerender`/`_render` functions at every step have resolved, or rejects if any one of them has rejected.
     */
    _renderStepsAs(renderType, steps, queryParams) {
        if (renderType !== '_prerender' && renderType !== '_render') {
            throw new Error(`Tried to render a step but was not given the right render type: ${renderType}.`);
        }
        return steps.reduce((promise, step) => {
            return promise.then(() => {
                let { app, cMountsRenderData, mountData } = step;
                let { crumb, mount, params, diff } = mountData;
                let appData = this._buildAppRenderDataFromMountRenderData(app, mountData);
                return app[renderType](appData.params, queryParams, appData.diff).then(() =>  {
                    let cMountsRenderDataLogics = Object.keys(cMountsRenderData);
                    // call all `renderType` fns for all cMounts' routes
                    let promises = cMountsRenderDataLogics.reduce((memo, logic) => {
                        let cMountsNavData = cMountsRenderData[logic];
                        cMountsNavData.forEach(data => {
                            let { route, params, diff } = data;
                            memo.push(route[renderType](params, queryParams, diff));
                        });
                        return memo;
                    }, []);

                    // call `renderType` fn on the leaf route
                    if (mount instanceof Route) {
                        promises.push(mount[renderType](params, queryParams, diff));
                    }

                    // resolve when all `renderType` fns resolve for this step
                    return Promise.all(promises).then(() => {
                        if (renderType === '_render') {
                            // on the App in this step, store its current params
                            if (app instanceof RootApp) {
                                app._lastParams = appData.params;
                                app._lastQueryParams = queryParams;
                            } else if (app instanceof App) {
                                app._parentApp._mountMapper.setCurrentMount(appData.crumb, appData.params);
                            }

                            // on the App in this step, set its MountMapper's currentMounts
                            if (mount instanceof Route) {
                                app._mountMapper.setCurrentMount(crumb, params);
                            }

                            // on the App in this step, set ConditionalMountMapper's currentMounts
                            if (cMountsRenderDataLogics.length) {
                                let currentCondMounts = cMountsRenderDataLogics.reduce((memo, logic) => {
                                    memo[logic] = cMountsRenderData[logic].map(data => data.params || {});
                                    return memo;
                                }, {});
                                app._conditionalMountMapper.setCurrentMounts(currentCondMounts);
                            } else {
                                app._conditionalMountMapper.setCurrentMounts(null);
                            }
                        }
                    });
                });
            });
        }, Promise.resolve());
    }

    /**
     * Filters all the params expected for a Route/App from all the
     * params available, as well as creates a diff of the aforementioned
     * filtered params against the last params sent to the Route/App on
     * the last successful navigation. This diff is combined with the
     * passed-in diff of the queryParams to make a single object holding
     * both diffs.
     * @private
     * @param {object} accumulatedParams An object matching param names (keys of the object) to their values (values of the object).
     * @param {array} expectedParams A list of all the param names expected by the App/Route that need to be plucked from the `accumulatedParams`.
     * @param {object} lastParams The params sent to the App/Route on the last successful navigation.
     * @param {object} queryParamsDiff A diff of the current querystring parameters in the URL against the querystring params available in the URL of the last successful navigation.
     * @return {params: object, diff: Diff} The combination of: the params for this App/Route; and a combination of both the diff for both the params for this App/Route vs. those sent in the last navigation, and the diff of the global querystring params in the URL vs. those in the last successful navigation. `Null` if neither the params nor queryParams diffs were different than what they were on last navigation.
     */
    _buildRenderData(accumulatedParams, expectedParams, lastParams, queryParamsDiff) {
        let params = expectedParams.reduce((memo, paramName) => {
            memo[paramName] = accumulatedParams[paramName];
            return memo;
        }, {});
        let paramsDiff = diffObjects(lastParams, params);
        let diff = finalDiff(paramsDiff, queryParamsDiff);
        if (!Object.keys(params).length) {
            params = null;
        }
        return {params, diff};
    }

    /**
     * Create the data used when navigating to a new leaf Route.
     * @private
     * @param {Array.<NavigationStep>} steps The steps, in order from the RootApp to the leaf Route, that we can follow to the navigation destination.
     * @param {?object} queryParamsDiff The change in query params since the last call to `navigate()`. Null if no change.
     * @return {Array.<NavigationData>} All the information needed to successfully traverse and navigate Apps to the leaf Route.
     */
    _rebuildStepsAsRoutes(steps, queryParamsDiff) {
        let accumulatedParams = {};
        return steps.map(step => {
            let { app, crumb, params } = step;
            let mm = app._mountMapper;
            let cmm = app._conditionalMountMapper;

            // accumulate the params from this step
            // into those from previous steps
            Object.assign(accumulatedParams, params);

            // filter params for mount
            let mount = mm.mountFor(crumb);
            let lastParams = mm.lastParamsFor(crumb) || {};
            let mountData = this._buildRenderData(accumulatedParams, mount.expectedParams(), lastParams, queryParamsDiff);
            mountData.crumb = crumb;
            mountData.mount = mount;

            // create an object that holds render information
            // for each Route in each conditional mount
            let cMountsRenderData = Object.keys(cmm.match(mm.addressesFor(crumb)) || {}).reduce((memo, logic) => {
                let routes = cmm.routesFor(logic);
                let routesLastParams = cmm.lastParamsFor(logic) || routes.map(() => ({}));
                memo[logic] = routes.map((route, idx) => {
                    let data = this._buildRenderData(accumulatedParams, route.expectedParams(), routesLastParams[idx], queryParamsDiff);
                    data.route = route;
                    return data;
                });
                return memo;
            }, {});

            return {
                app,
                mountData,
                cMountsRenderData,
            };
        });
    }

    /**
     * Takes a ConditionalMountMapper and a list of strings representing the logic strings of conditional mounts on the ConditionalMountMapper, and returns all the conditional mounts' Routes in a single array.
     * @private
     * @param {ConditionalMountMapper} cmm The ConditionalMountMapper to grab routes from by their logic string(s).
     * @param {Array.<string>} logics The logic strings that can be used to get the routes mounted on different mountpoints of the ConditionalMountMapper `cmm`.
     * @return {Array.<Route>} The aggregation of all the routes mounted on each mountpoint represented by each string in `logics`.
     */
    _flattenDeactivationData(cmm, logics=[]) {
        return logics
            .map(logic => cmm.routesFor(logic))
            .reduce((memo, routes) => {
                routes.forEach(route => memo.push(route));
                return memo;
            }, []);
    }

    /**
     * @typedef DeactivationStep
     * @type {object}
     * @property {App} app The app whose mounts and conditional mounts are to be deactivated.
     * @property {Array.<Route>} routesToDeactivate All mounts on the app, conditional or not, to be deactivated.
     */

    /**
     * Get all the mounts to be deactivated, in steps/nodes of the navigation branch to be deactivated, from the divergence point through to the leaf route of the to-be-deactivated branch.
     * @private
     * @param {DivergenceRecord} diverge An object that describes where the path in the URL diverged when tracing the new navigation path from the URL passed to `navigate()` as compared to the navigation path of current URL. `undefined` if the path was the same as before and only params or query params changed.
     * @return {Array.<DeactivationStep>} All the information needed to successfully deactivate all to-be-deactivated conditional mounts, as well as the current leaf route, from the divergence point onwards through the to-be-deactivated branch.
     */
    _buildDeactivationSteps(diverge) {
        let steps = [];
        let app = diverge.app;
        let mm = app._mountMapper;
        let cmm = app._conditionalMountMapper;
        // in the first diverge step, we need to make sure
        // only to deactivate those cMounts that are not
        // also activated by the new navigation destination
        let cMountsToRender = cmm.match(mm.addressesFor(diverge.to)) || {};
        // all routes at this step to be deactivated
        let logics = Object.keys(cmm.match(mm.addressesFor(diverge.from)) || {})
            .filter(logic => !cMountsToRender[logic]);
        let routesToDeactivate = this._flattenDeactivationData(cmm, logics);
        steps.push({ app, routesToDeactivate });

        let crumb = diverge.from;
        // now push all rendered cMounts at each node/step
        // in the to-be-deactivated branch into `steps`, since
        // none of the routes on the to-be-deactivated branch
        // should be rendered after navigation is completed.
        //
        // once we hit a Route, we're at the last App holding the leaf route
        while (mm.mountFor(crumb) instanceof App) {
            app = mm.mountFor(crumb);
            mm = app._mountMapper;
            cmm = app._conditionalMountMapper;
            routesToDeactivate = this._flattenDeactivationData(cmm, cmm.getCurrentMounts() || []);
            steps.push({ app, routesToDeactivate });
            // continue with the next mount
            crumb = mm.getCurrentMount();
        }
        // we're at the last App that holds the leaf route, so
        // push the leaf route into the last step's routes-to-be-deactivated
        routesToDeactivate.push(mm.mountFor(crumb));
        return steps;
    }

    /**
     * Call `_deactivate` on all cMounts' routes at each step all at
     * once, then use a promise's .then() to do the same at the next
     * step. The net effect is that all cMounts' `_deactivate` is
     * called for each step in reverse order, step by step, from the
     * leaf to the divergence point, visiting the next step/node only
     * after all deactivating cMounts' routes' `_deactivate` are called
     * at that step/node.
     * At the last step, executed first, also call `_deactivate` on the
     * leaf Route.
     * @private
     * @param {Array.<DeactivationStep>} divergenceData All the information needed to successfully deactivate all to-be-deactivated conditional mounts, as well as the current leaf route, from the divergence point onwards through the to-be-deactivated branch.
     * @return {Promise} A promise that resolves when all `_deactivate` functions at every step have resolved, or rejects if any one of them has rejected.
     */
    _deactivateDivergentBranch(divergenceData) {
        let lastStepIdx = divergenceData.length - 1;
        // go through steps backwards, from the leaf up to and including the divergence point
        return divergenceData.reduceRight((promise, {app, routesToDeactivate}, idx) => {
            return promise.then(() => {
                let mm = app._mountMapper;
                let cmm = app._conditionalMountMapper;
                // call all `_deactivate` fns
                let promises = routesToDeactivate.map(route => route._deactivate());
                // resolve when all `_deactivate` fns resolve for this step
                return Promise.all(promises).then(() => {
                    // for all Apps on the branch from the leaf
                    // through to the divergence point, set the
                    // currentMounts on the ConditionalMountMapper to null
                    cmm.setCurrentMounts(null);
                    // for the App holding the leaf mount,
                    // set the currentMount on the MountMapper to null
                    if (idx === lastStepIdx) {
                        mm.setCurrentMount(null);
                    }
                    // don't deactivate the divergence point (App)
                    // since another branch will be rendered on it
                    if (idx !== 0) {
                        return app._deactivate();
                    }
                });
            });
        }, Promise.resolve());
    }

    /**
     * Constructs app state by using the routing trace object to prerender, render, and deactivate routes as needed.
     * @private
     * @param {RoutingTrace} routingTrace The routing trace object used to construct the app state based on the current URL vs. the URL used in the last successful navigation.
     * @property {?object} queryParams The query params parsed from the URL passed to `navigate()`. `Null` if there were none.
     * @property {?object} queryParamsDiff The change in query params since the last successful navigation. `Null` if the query params didn't change.
     * @return {Promise} A promise that, if rejected, means a user-defined prerender()/render()/deactivate() function's promise rejected and the Ether app is now in an undefined state.
     * @example
     * // when navigating from '/info?page=2' to `/user/1/profile/edit?sort=true&sort_type=asc&page=1`:
     * // query params will be passed to prerender/render on
     * // all activated conditional mounts in each navigation step,
     * // and finally to the activated leaf mount
     * // queryParams:
     * {
     *     sort: true,
     *     sort_type: 'asc',
     *     page: 1,
     * }
     * // queryParamsDiff:
     * // note the array layout:
     * // [
     * //     previously-parsed value (undefined if non-existent),
     * //     current value parsed from URL,
     * // ]
     * {
     *     sort: [undefined, true],
     *     sort_type: [undefined, 'asc'],
     *     page: [2, 1],
     * }
     */
    _constructState(routingTrace, queryParams, queryParamsDiff) {
        let steps = this._rebuildStepsAsRoutes(routingTrace.steps, queryParamsDiff);

        return Promise.resolve().then(() => {
            return this._renderStepsAs('_prerender', steps, queryParams);
        }).then(() => {
            // handle deactivation of previous navigation path if
            // there's a divergence in navigation (different URL
            // from the URL used in the last successful navigation)
            if (routingTrace.diverge) {
                let deactivationSteps = this._buildDeactivationSteps(routingTrace.diverge);
                return this._deactivateDivergentBranch(deactivationSteps);
            } else {
                return;
            }
        }).then(() => {
            return this._renderStepsAs('_render', steps, queryParams);
        });
    }
}

export default RootApp;
