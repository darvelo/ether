import App from './app';
import Route from './route';
import ctorName from '../utils/ctor-name';
import is from '../utils/is';
import isNumeric from '../utils/is-numeric';

class RootApp extends App {
    constructor(opts) {
        if (is(opts, 'Object')) {
            opts.rootApp = true;
            opts.addresses = opts.addresses || [];
            opts.outlets = opts.outlets || {};
            opts.params = [];
        }
        super(opts);
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
     * @return {object} An object containing the query parameters as the object's keys with values.
     */
    parseQueryString(queryString) {
        if (queryString[0] === '?') {
            queryString = queryString.slice(1);
        }
        let queryParams = queryString.split('&').reduce((memo, pairStr) => {
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
        return queryParams;
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
     * @return
     */
    navigate(destination) {
        // @TODO: write a test that makes sure passed params match expectedParams() during navigation
        // @TODO: parse queryParams

        // parse queryParams, make diff

        // if (this.fullUrl is the same or URL pathname is same and query params are same but in a diff order (qP diff returns null)) {
        //     // same link was clicked twice
        //     return;
        // }
        // let routingTrace = this._buildPath(queryParams);
        // if (routingTrace.result === '404') {
        //     // notify user of 404 and pass routingTrace; let them handle the 404 their way
        // } else {
        //     this._constructState(routingTrace).catch(err => {
        //         // notify user how this happened
        //     });
        // }
    }

    /**
     * @typedef DivergenceRecord
     * @type {object}
     * @property {App} app The App where the divergence is taking place.
     * @property {string} from The crumb on the `app` of the to-be-deactivated mount that is currently activated based on the current URL.
     * @property {string} to   The crumb on the `app` of the to-be-activated mount (based on the destination passed to `navigate()`) that is currently deactivated.
     */

    /**
     * @typedef NavigationStep
     * @type {object}
     * @property {string} crumb The string representing a mount that's mounted on a particular App.
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
     * @type {object}
     * @property {string} result `success` or `404`.
     * @property {DivergenceRecord|undefined} diverge An object that describes where the path in the URL diverged when tracing the new navigation path from the URL passed to `navigate()` as compared to the navigation path of current URL. `undefined` if the path was the same as before and only params or query params changed.
     * @property {Array.<NavigationStep>} steps The crumbs, in order from the RootApp to the leaf Route, that we can follow to the navigation destination.
     * @property {object} queryParams The query params parsed from the URL passed to `navigate()`.
     * @example
     * // when navigating from '/info' to `/user/1/profile/edit?sort=true&sort_type=asc&page=1`:
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
     *     // query params will be passed to prerender/render on
     *     // all activated conditional mounts in each navigation step,
     *     // and finally to the activated leaf mount
     *     queryParams: {
     *         sort: true,
     *         sort_type: 'asc',
     *         page: 1,
     *     },
     * }
     */

    /**
     * Builds an object representing a trace through the app hierarchy down to the target route found by parsing the URL (querystring included).
     * @private
     * @param {string} url The URL to parse with querystring, if any, included.
     * @return {RoutingTrace} A routing trace object that can be used to construct app state: successful navigation or 404.
     */
    _buildPath(url) {
        // test this fn by stubbing out _constructState()
    }

    /**
     * Constructs app state by using the routing trace object to prerender, render, and deactivate routes as needed.
     * @private
     * @param {RoutingTrace} routingTrace The routing trace object used to construct the app state.
     * @return {Promise} A promise that, if rejected, means a user-defined prerender/render/deactivate promise rejected and the Ether app is now in an undefined state.
     */
    _constructState(routingTrace) {
        // perform recursive prerender/deactivate/render for mounts and cMounts.
        // has handles to all apps/routes in path, uses them to send the approp. signals from leaf to divergence point w/ diff in params for that node & expectedParams.
        // sends queryParams diff to every route on the navigation path.
        // promise-based stuff happens here.
    }
}

export default RootApp;

// Steps:
// 1. nav checks against stored fullUrl in rootApp.
//    if it's the same, do nothing (prerender is safe since in step 1 we make sure at least one param/qP has changed)
//        * need to diff queryParams to make sure the order in URL isn't just switched around
//    else nav calls _buildPath
// 2. build path into steps in an array, building a single object with all params accumulated up to the leaf. note divergence point if any (MM#getCurrentMount())
//        * 404 if routing ends in an App, or if no match was found by any MountMapper
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
//        set 'deactivated' CSS class on all outlets of deactivated Routes/Apps
//        unset 'render' CSS class
//    call render always, whether or not deactivated or active, and whether or not params/qP have changed, on:
//        the mount at the leaf
//        all cMounts along the path down to leaf, in order (promise.then())
//        Promise.all() for cMounts and mount simultaneously. if it fails, don't continue and send an error of some sort to user with previous URL and failed URL
//            * 2 promises for Promise.all(): one for mount, one for cMounts in order
//        set 'render' CSS class on all outlets of deactivated Routes/Apps
//        unset 'prerender' CSS class on all outlets of activating Routes/Apps on mounts/cMounts
//    on success:
//        set fullUrl in rootApp
//        pushState

