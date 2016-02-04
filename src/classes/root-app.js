import App from './app';
import Route from './route';
import ctorName from '../utils/ctor-name';
import { is, isnt } from '../utils/is';
import isNumeric from '../utils/is-numeric';
import diffObjects from '../utils/diff-objects';

function finalDiff(paramsDiff, queryParamsDiff) {
    if (is(paramsDiff, 'Null') && is(queryParamsDiff, 'Null')) {
        return null;
    }
    return {
        params: paramsDiff,
        queryParams: queryParamsDiff,
    };
}

class RootApp extends App {
    constructor(opts) {
        if (is(opts, 'Object')) {
            opts.rootApp = true;
            opts.addresses = opts.addresses || [];
            opts.outlets = opts.outlets || {};
            opts.params = [];
        }
        super(opts);
        // the last URL that was navigated to successfully
        this._fullUrl = undefined;
        // the querystring params parsed from the
        // last URL that was navigated to successfully
        this._lastQueryParams = null;
    }

    fullUrl() {
        return this._fullUrl;
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

    start() {
        window.addEventListener('popstate', this.popstate.bind(this), false);
        window.addEventListener('click', this.interceptLinks.bind(this), false);
        let state = window.history.state;
        if (state) {
            // we've loaded the page and it had previous state
            // perform initial routing
            // this should use the same function as this.popstate
        }
    }

    interceptLinks(event) {
        // delegate to all links that have same origin (and basePath?)
        // and descend from this.rootURL, then preventDefault()
        // also should pushState()
    }

    /**
     * Parses a query string.
     * @param {string} queryString A string analogous to window.location.search.
     * @return {object|null} An object containing the query params as the object's keys with values. Null if there were no query params.
     */
    parseQueryString(queryString) {
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
            if (isNumeric(val)) {
                val = Number(val);
            } else if (val === 'true') {
                val = true;
            } else if (val === 'false') {
                val = false;
            }
            memo[key] = val;
            return memo;
        }, {});
    }

    /**
     * @typedef NavigationRequest
     * @type {object}
     * @property {string} address The address of the destination `Route` to navigate to.
     * @property {object} params The params to apply during navigation while traversing each mount in the Ether app's mount tree, as if these params were parsed from the URL.
     * @property {object|undefined} queryParams Any queryParams to apply during each step in the mount traversal.
     */

    /**
     * Navigates to a new URL path on the Ether application. Called manually or, if configured to, on: popstate, page landing, or intercepted links.
     * @param {string|NavigationRequest} destination The navigation destination. Can be a URL string with or without a querystring, or a `NavigationRequest`.
     * @return {Promise} A promise that resolves if navigation succeeded, and rejects if it failed, with the details of the failure (404 or navigation error).
     */
    navigate(destination) {
        // parse queryParams, make diff
        // if (this.fullUrl is the same or URL pathname is same and query params are same but in a diff order (qP diff returns null)) {
        //     // same link was clicked twice
        //     return;
        // }

        // @TODO: adjust when NavigationRequest is implemented
        let [ path, queryString='' ] = destination.split('?');
        let queryParams = this.parseQueryString(queryString);
        let queryParamsDiff = null;

        if (isnt(queryParams, 'Null') || isnt(this._lastQueryParams, 'Null')) {
            queryParamsDiff = diffObjects(this._lastQueryParams || {}, queryParams || {});
        }

        // check if we're navigating to the same URL as the one we're
        // currently on. this can happen if a link was clicked twice
        if (this.fullUrl()) {
            let [ lastPath ] = this.fullUrl().split('?');
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
                // @TODO: make sure this to put the URL string here if navigating by address/params/queryParams
                this._fullUrl = destination;
                this._lastQueryParams = queryParams;
            });
        } else {
            throw new TypeError(`${ctorName(this)}#navigate(): routingTrace had in invalid value: ${JSON.stringify(routingTrace.result)}.`);
        }
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
     * @property {string} crumb The string representing a mount that's mounted on a particular App.
     * @property {App} app The App that holds the mount pointed to by `crumb`.
     * @property {object} params The params in the URL passed to `navigate()` as matched to the params the mount crumb should explicitly parse for, if any.
     * @example
     * {
     *     crumb: 'first/{id=\\d+}/',
     *     params: {id: 1},
     * }
     * @example
     * {
     *     crumb: 'second/{name=\\w+}/',
     *     params: {name: 'Jeff'},
     * }
     * @example
     * {
     *     crumb: 'edit',
     *     params: {},
     * }
     */

    /**
     * @typedef RoutingTrace
     * @private
     * @type {object}
     * @property {string} result `success` or `404`.
     * @property {DivergenceRecord|undefined} diverge An object that describes where the path in the URL diverged when tracing the new navigation path from the URL passed to `navigate()` as compared to the navigation path of current URL. `undefined` if the path was the same as before and only params or query params changed.
     * @property {Array.<NavigationStep>} steps The crumbs, in order from the RootApp to the leaf Route, that we can follow to the navigation destination.
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
     *             crumb: 'user/{id=\\d+}',
     *             params: {id: 1},
     *         },
     *         {
     *             crumb: '{menu=\\w+}',
     *             params: {menu: 'profile'},
     *         },
     *         {
     *             crumb: 'edit',
     *             params: {},
     *         }
     *     ],
     * }
     */

    /**
     * Builds an object representing a trace through the app hierarchy down to the target route found by parsing the URL (querystring included).
     * @private
     * @param {string} path The URL to parse, minus the querystring.
     * @return {RoutingTrace} A routing trace object that can be used to construct app state: successful navigation or 404.
     */
    _buildPath(path) {
        let app = this;
        let steps = [];
        let matchResult, result, diverge;

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
            // `undefined`, because there's no mount nor cMounts that
            // need to be deactivated in that case
            if (!diverge && crumb && currentMountCrumb && crumb !== currentMountCrumb) {
                diverge = {
                    app,
                    from: currentMountCrumb,
                    to: crumb,
                };
            }

            steps.push({app, crumb, params});
            // assign the next mount/node to continue tree traversal
            app = app._mountMapper.mountFor(crumb);
            path = matchResult.rest;

            // if there is no more URL string data to match against,
            // we have reached the end of the navigation path
            if (is(matchResult.rest, 'Null')) {
                // navigation must end on a Route
                if (!(app instanceof Route)) {
                    matchResult = null;
                }
                break;
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
     * Use a promise to call `_prerender` or `_render` on all activating
     * cMounts' routes at each step all at once, then use the promise's
     * .then() to do the same at the next step. The net effect is that
     * all cmounts' `_prerender`/`_render` is called for each step in
     * order, step by step, visiting the next step/node only after all
     * activating cMounts' routes' `_prerender`/`render` are called at
     * that step/node.
     * At the last step, call `_prerender`/`_render` on the leaf mount's Route.
     * @private
     * @param {string} renderType The method to call on the route, either `_prerender` or `_render`.
     * @param {Array.<NavigationData>} steps All the information needed to successfully traverse and navigate Apps to the leaf Route.
     * @param {object|null} queryParams The query params parsed from the URL passed to `navigate()`. Null if there were none.
     * @return {Promise} A promise that resolves when all `_prerender`/`_render` functions have resolved, or rejects if any one of them has rejected.
     */
    _renderStepsAs(renderType, steps, queryParams) {
        if (renderType !== '_prerender' && renderType !== '_render') {
            throw new Error(`Tried to render a step but was not given the right render type: ${renderType}.`);
        }
        return steps.reduce((promise, step) => {
            return promise.then(() => {
                // call all `renderType` fns for all cMounts' routes
                let promises = step.cMountsToRender.map(obj => {
                    let { route, params, diff } = obj;
                    return route[renderType](params, queryParams, diff);
                });
                if (step.mountToRender) {
                    // call `renderType` fn on the leaf mount's route
                    let { route, params, diff } = step.mountToRender;
                    promises.push(route[renderType](params, queryParams, diff));
                }
                // @TODO: set currentMount(s) at app#mm/cmm. need to put at end of promises. Add to NavigationData JsDoc as you add to _rebuildStepsAsRoutes return val.
                // mountMapper#setCurrentMount(crumb, params)
                // cMM#setCurrentMounts(logicsToParams)
                return Promise.all(promises);
            });
        }, Promise.resolve());
    }

    /**
     * @typedef RouteNavigationData
     * @private
     * @type {object}
     * @property {Route} route
     * @property {string} crumb The string representing a mount that's mounted on a particular App.
     * @property {object|null} params
     * @property {object|null} diff
     * @property {object|null} diff.params
     * @property {object|null} diff.queryParams
     * @example
     * {
     *     crumb: 'first/{id=\\d+}/',
     *     params: {id: 1},
     * }
     */

    /**
     * @typedef NavigationData
     * @private
     * @type {object}
     * @property {App} app The App that holds the mounts and conditional mounts in this step data.
     * @property {RouteNavigationData|undefined} mountToRender
     * @property {Array.<RouteNavigationData>} cMountsToRender
     * @property {Array.<string>} cMountsToDeactivate
     * @example
     * {
     *     crumb: 'first/{id=\\d+}/',
     *     params: {id: 1},
     * }
     */

    /**
     * Use the passed in `steps` data to create an array of objects that can be used to perform the navigation process to a new leaf Route.
     * @private
     * @param {Array.<NavigationStep>} steps The crumbs, in order from the RootApp to the leaf Route, that we can follow to the navigation destination.
     * @param {object|null} queryParamsDiff The change in query params since the last call to `navigate()`. Null if no change.
     * @return {Array.<NavigationData>} steps All the information needed to successfully traverse and navigate Apps to the leaf Route.
     */
    _rebuildStepsAsRoutes(steps, queryParamsDiff) {
        let accumulatedParams = {};
        let lastStepIdx = steps.length - 1;
        return steps.map((step, stepIdx) => {
            Object.assign(accumulatedParams, step.params);
            let { app, crumb } = step;
            let mm = app._mountMapper;
            let cmm = app._conditionalMountMapper;
            let cMountsToRender = cmm.match(mm.addressesFor(crumb)) || {};
            let cMountsToDeactivate = (cmm.getCurrentMounts() || []).filter(logic => !cMountsToRender[logic]);

            // create an array of objects that hold cMount render information
            // (params, paramsDiffs) for each Route in the cMount so that
            // calling prerender and then render later on will be easy
            cMountsToRender = Object.keys(cMountsToRender).reduce((memo, logic) => {
                let routes = cmm.routesFor(logic);
                let routesLastParams = cmm.lastParamsFor(logic) || routes.map(() => { return {}; });
                routes.forEach((route, idx) => {
                    let params = route.expectedParams().reduce((memo, paramName) => (memo[paramName] = accumulatedParams[paramName]) && memo, {});
                    let paramsDiff = diffObjects(routesLastParams[idx], params);
                    let diff = finalDiff(paramsDiff, queryParamsDiff);
                    if (!Object.keys(params).length) {
                        params = null;
                    }
                    memo.push({route, params, diff});
                });
                return memo;
            }, []);

            // compile params for leaf mount
            let mountToRender;
            if (stepIdx === lastStepIdx) {
                let route = mm.mountFor(crumb);
                let lastParams = mm.lastParamsFor(crumb) || {};
                let params = route.expectedParams().reduce((memo, param) => (memo[param] = accumulatedParams[param]) && memo, {});
                let paramsDiff = diffObjects(lastParams, params);
                let diff = finalDiff(paramsDiff, queryParamsDiff);
                if (!Object.keys(params).length) {
                    params = null;
                }
                mountToRender = {route, params, diff};
            }

            return {
                mountToRender,
                cMountsToRender,
                cMountsToDeactivate,
            };
        });
    }

    /**
     * Constructs app state by using the routing trace object to prerender, render, and deactivate routes as needed.
     * @private
     * @param {RoutingTrace} routingTrace The routing trace object used to construct the app state.
     * @property {object|null} queryParams The query params parsed from the URL passed to `navigate()`. Null if there were none.
     * @property {object|null} queryParamsDiff The change in query params since the last call to `navigate()`. Null if no change.
     * @return {Promise} A promise that, if rejected, means a user-defined prerender/render/deactivate promise rejected and the Ether app is now in an undefined state.
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
            // deactivate step
            // go through steps backwards, doing Promise.all() on `step.cMountsToDeactivate`
        }).then(() => {
            return this._renderStepsAs('_render', steps, queryParams);
        });
    }
}

export default RootApp;

// Steps:
// 1. nav checks against stored fullUrl in rootApp.
//    if it's the same, do nothing (prerender is safe since in step 1 we make sure at least one param/qP has changed)
//        * need to diff queryParams to make sure the order in URL isn't just switched around
//    else nav calls _buildPath
// 2. build path into steps in an array, building a single object with all params accumulated up to the leaf. note divergence point if any (MM#getCurrentMount())
//        * 404 (no error) if routing ends in an App, or if no match was found by any MountMapper
// 3. if buildPath returns 404, do something, not sure what yet. 404 rules are in notes.md #5
//    compound params on each step with Object.assign(NavigationStep.params)
//    check expectedParams() and only send what is expected to prerender/render for that step/node as follows:
//    call prerender always, whether or not deactivated or active, and whether or not params/qP have changed, on:
//        all cMounts along the path down to leaf, in order (promise.then())
//        the mount at the leaf
//        Promise.all() for cMounts and mount simultaneously. if it fails, don't continue and send an error of some sort to user with previous URL and failed URL
//            * 2 promises for Promise.all(): one for mount, one for cMounts in order
//        set 'prerender' CSS class on all outlets of activating Routes/Apps on mounts/cMounts
//    if new path diverges from the old path:
//        call deactivate on mount at leaf
//        call deactivate on all cMounts from leaf to divergence point making sure cMounts at divergence point are actually to deactivate (not also active on new path)
//            * in order (promise.then())
//        Promise.all() for cMounts and mount simultaneously. if it fails, don't continue and send an error of some sort to user with previous URL and failed URL
//            * 2 promises for Promise.all(): one for mount, one for cMounts in order
//        set _active to false on mount/cMounts (for their Route#isActive())
//        set 'deactivated' CSS class on all outlets of deactivated Routes/Apps
//        unset 'render' CSS class
//    call render always, whether or not deactivated or active, and whether or not params/qP have changed, on:
//        the mount at the leaf
//        all cMounts along the path down to leaf, in order (promise.then())
//        Promise.all() for cMounts and mount simultaneously. if it fails, don't continue and send an error of some sort to user with previous URL and failed URL
//            * 2 promises for Promise.all(): one for mount, one for cMounts in order
//        set _active to true on mount/cMounts (for their Route#isActive())
//        set 'render' CSS class on all outlets of deactivated Routes/Apps
//        unset 'prerender' CSS class on all outlets of activating Routes/Apps on mounts/cMounts
//    on success:
//        set fullUrl in rootApp
//        pushState

