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
        // user can throw if `setup` is not as expected
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
        // delegate to all links that have same origin
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
     * Navigates to a new URL path on the Ether application using either a URL string or a special `NavigationRequest`
     * Is called on popstate if configured to, page landing if configured to, intercepted links if configured to, or manually.
     * @param {string|NavigationRequest} destination The destination `Route` to navigate to. Can be a URL string with or without a querystring, or a `NavigationRequest`.
     */
    navigate(destination) {
        // make sure to compound and forward params in any case below
        // push params onto the stack (now just a recent-params map)
        // if we've got * routes, do those first
        // if urlpath => app
        //     call app to make it use its mountmapper and route method
        // if urlpath => route
        //     call render with params or show if params equal
        //     pushState() if this isn't page load
        //
        // @TODO: write a test that makes sure passed params match expectedParams() during navigation
        // @TODO: parse queryParams
        //
        // if no param diffs do nothing: link was clicked twice
        //
        // if during a push, the paths and params are exactly the same as on all stacks, do nothing. we're navigating to a page we're already on.
        // we could actually just store the current path on the root app after a successful route and save ourselves the recursive search by checking against it.
        // we can't store the path on the root until the routing succeeds because we have to be careful the routing won't end in a 404.
        //
        // find mount point of divergence


        // fullURL can be from popstate event, window.load event, link interception, or manual
        //
        // if (this.fullUrl is the same or URL pathname is same and query params are same but in a diff order (qP diff returns null)) {
        //     // same link was clicked twice
        //     return;
        // }
        // let routingTrace = this._buildPath();
        // if (routingTrace.is404) {
        //     // notify user of 404 and let them handle it their way
        // } else {
        //     this._constructState(routingTrace).catch(err => {;
        //         // notify user how this happened
        //     });
        // }
    }

    /**
     * @typedef NavigationStep
     * @type {object}
     * @property {string} breadcrumb The string representing a mount that's mounted on a particular app.
     * @property {object} params The params required by the mount.
     */

    /**
     * @typedef RoutingTrace
     * @type {object}
     * @property {string} result `success` or `404`.
     * @property {object|undefined} diverge An object that describes where the path in the URL diverged when tracing the new navigation destination from the URL as compared to the previous URL. `undefined` if the URL path was the same and only params or query params changed.
     * @property {App} diverge.app The app where the path diverged.
     * @property {object} diverge.params The new params from the URL at the point where the path diverged.
     * @property {Array.<NavigationStep>} steps The mounts, in order from the root to the leaf route, that we can follow to the navigation route destination.
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

//  hide when paths diverge
//  destroy when params diverge
//  render occurs at the same point as divergence.
//
//  show when all lastState params on the stack for each app/route recursively were the same as what's being navigated to after a pop or during a push (EXCEPTION BELOW)
//  if during a push, the paths and params are exactly the same as on all stacks, do nothing. we're navigating to a page we're already on. (we could actually just store the current path on the root app after a successful route and save ourselves the recursive search by checking against it. we can't store the path on the root until the routing succeeds because we have to be careful the routing won't end in a 404).

var routingRecord =  {
    fullUrl: 'full URL from popstate event or window.load event',
    // if found, proceed with routing after hiding/destroying as necessary.
    // if 404, push 404 onto the stack and pass it this object or a subset,
    // just enough of a consistent interface for the user to do something
    // useful with it.
    //
    // with history.state, this property will actually be out of sync if
    // the route mappings are updated, so history.state should not have
    // this property.
    type: 'found or 404',
    // holds the point where the path diverged, so that recursive hide/destroy
    // can take place before a recursive render does.
    // if false, both path and params are exactly the same, so do nothing.
    diverge: {
        // route: AppInstance,
        // path = destroy, params = hide
        type: 'params or path',
        url: 'not needed, should be on top of stack already (?)'
    },
    // if a link is clicked, we need to do a pushState on success (or 404)
    doPushState: true,
    // all routes potentially need querystring params
    //     ?sortAsc=true&column=3&title=Count
    queryParams: {
        sortAsc: true,
        column: 3,
        title: 'Count',
    },
    // the Route path to be followed to render a url completely
    // the params will be compounded on each step, so the third route
    // will receive: {
    //    id: 1,
    //    name: 'Jeff',
    // }
    steps: [
        {
            urlpath: 'first/{id}/',
            params: {id: 1},
        },
        {
            urlpath: 'second/{name}/',
            params: {name: 'Jeff'},
        },
        {
            urlpath: 'edit',
            params: {},
        }
    ]
};
