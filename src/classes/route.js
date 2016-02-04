import Modifiable from './modifiable';

class Route extends Modifiable {
    constructor(opts) {
        super(opts);
        this._rootApp = opts.rootApp;
        this._registerAddresses(opts.addresses);
        this.outlets = opts.outlets;
        this.init(opts.setup);
    }

    _registerAddresses(addresses) {
        addresses.forEach(name => this._rootApp._registerAddress(name, this));
    }

    // receives setup result if the .setup() modifier
    // was used to create this instance
    init(setup) { }

    // user-overridable methods

    expectedAddresses() {
        return [];
    }

    addressesHandlers() {
        return [];
    }

    expectedParams() {
        // default: don't pass any params to prerender/render on navigation
        return [];
    }

    expectedSetup(setup) {
        // user can throw if `setup` is not as expected
        return;
    }

    navigate(...args) {
        return this._rootApp.navigate(...args);
    }

    _prerender(params, queryParams, diff) {
        return Promise.resolve().then(() => {
            return this.prerender(params, queryParams, diff);
        });
    }

    _deactivate() {
        return Promise.resolve().then(() => {
            return this.deactivate();
        });
    }

    _render(params, queryParams, diff) {
        return Promise.resolve().then(() => {
            return this.render(params, queryParams, diff);
        });
    }

    /**
     * User-defined function meant to perform any data-gathering or rendering when this route is navigated to, *before* the previously-navigated-to route is deactivated.
     * @param {object|null} params All parameters parsed from the URL that are only also listed in this route's `expectedParams()` method. `null` if either no params are expected by this route or if no mount up to this point had any params to be parsed.
     * @param {object|null} queryParams All querystring parameters parsed from the URL or `null` if there weren't any.
     * @param {object|null} diffs By property, the calculated difference between the params/queryParams passed when the route was last rendered vs. those being passed from the current URL. `null` if there were no differences, signifying that the route was deactivated and is now being navigated to via the exact same URL as before (common when the user clicks the Back button, for example).
     * @param {object} diffs.params An object where each property is an `Array` with two values: the value of the param when this route was last rendered, and the value of the param parsed from the current URL. If there is no difference between the two, the property for that param won't be present here, as this object only shows differences between past and present params.
     * @param {object} diffs.queryParams The same as `diffs.params` but for querystring parameters parsed from the URL. If a query param was added since last render, the previous value (array index 0) will be `undefined`. If a query param was removed since last render, the new value (array index 1) will be `undefined`.
     * @return {Promise} A promise that, when resolved, means all prerender actions (e.g. AJAX data retrieval/storage, populating/showing views, etc.) have finished and further navigation operations can continue. If the promise is rejected, the Ether app will be in an undefined state.
     */
    prerender(params, queryParams, diffs) { }

    /**
     * User-defined function meant to perform any data-gathering or rendering when this route is navigated to, *after* the previously-navigated-to route is deactivated.
     * @param {object|null} params All parameters parsed from the URL that are only also listed in this route's `expectedParams()` method. `null` if either no params are expected by this route or if no mount up to this point had any params to be parsed.
     * @param {object|null} queryParams All querystring parameters parsed from the URL or `null` if there weren't any.
     * @param {object|null} diffs By property, the calculated difference between the params/queryParams passed when the route was last rendered vs. those being passed from the current URL. `null` if there were no differences, signifying that the route was deactivated and is now being navigated to via the exact same URL as before (common when the user clicks the Back button, for example).
     * @param {object} diffs.params An object where each property is an `Array` with two values: the value of the param when this route was last rendered, and the value of the param parsed from the current URL. If there is no difference between the two, the property for that param won't be present here, as this object only shows differences between past and present params.
     * @param {object} diffs.queryParams The same as `diffs.params` but for querystring parameters parsed from the URL. If a query param was added since last render, the previous value (array index 0) will be `undefined`. If a query param was removed since last render, the new value (array index 1) will be `undefined`.
     * @return {Promise} A promise that, when resolved, means all render actions (e.g. AJAX data retrieval/storage, populating/showing views, etc.) have finished and navigation can continue on to completion. If the promise is rejected, the Ether app will be in an undefined state.
     */
    render() { }

    /**
     * A user-defined function that's called when the URL has changed and another, different route is to be rendered instead. This is a good opportunity to use CSS to hide all outlets or views in use by this route, as outlets are exclusive to a single route.
     * @return {Promise} A promise that, when resolved, means all deactivate actions (e.g. sending data to the server, data cleanup for GC, hiding outlets, views, or UI components, etc.) have finished and navigation can continue toward rendering the new route destination. If the promise is rejected, the Ether app will be in an undefined state.
     */
    deactivate() { }
}

export default Route;
