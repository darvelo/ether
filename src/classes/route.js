import Modifiable from './modifiable';
import registerAddresses from '../utils/register-addresses';
import ctorName from '../utils/ctor-name';

const possibleRouteStates = Object.freeze([
    'deactivating',
    'deactivated',
    'prerendering',
    'prerendered',
    'rendering',
    'rendered',
]);

class Route extends Modifiable {
    constructor(opts) {
        super(opts);
        this._rootApp = opts.rootApp;
        registerAddresses(this, opts.addresses);
        this.outlets = opts.outlets;

        Object.defineProperty(this, 'state', {
            value: {},
            configurable: false,
            enumerable: true,
        });
        Object.defineProperties(this.state, possibleRouteStates.reduce((memo, state) => {
            // create descriptor for each property on this.state
            memo[state] = {
                value: false,
                writable: true,
                enumerable: true,
            };
            return memo;
        }, {}));
        Object.seal(this.state);
        this._setState('deactivated');

        this.init(opts.setup);
    }

    // receives setup result if the .setup() modifier
    // was used to create this instance
    init(setup) { }

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

    _setOutletsState(state, keepRendered) {
        if (!this.state.hasOwnProperty(state)) {
            throw new Error(`${ctorName(this)}#_setOutletsState(): Tried to set outlets state to an unsupported value: ${JSON.stringify(state)}.`);
        }
        let outlets = this.outlets;
        let classPrefix = 'ether-';
        let statesToRemove = possibleRouteStates
            .filter(stateName => {
                if (keepRendered && stateName === 'rendered') {
                    return false;
                }
                return stateName !== state;
            })
            .map(stateName => classPrefix + stateName);
        state = classPrefix + state;
        Object.keys(this.outlets).forEach(name => {
            outlets[name]._element.classList.add(state);
            outlets[name]._element.classList.remove(...statesToRemove);
        });
    }

    _setState(state) {
        if (!this.state.hasOwnProperty(state)) {
            throw new Error(`${ctorName(this)}#_setState(): Tried to set route state to an unsupported value: ${JSON.stringify(state)}.`);
        }
        let keepRendered;
        switch(state) {
        case 'prerendering':
        case 'prerendered':
        case 'rendering':
            if (this.state.rendered === true) {
                keepRendered = true;
            }
            break;
        default:
            break;
        }
        possibleRouteStates.forEach(possibleState => {
            if (state === possibleState) {
                this.state[possibleState] = true;
            } else {
                this.state[possibleState] = false;
            }
        });
        if (keepRendered) {
            this.state.rendered = true;
        }
        this._setOutletsState(state, keepRendered);
    }

    navigate(...args) {
        return this._rootApp.navigate(...args);
    }

    sendTo(...args) {
        return this._rootApp.sendTo(...args);
    }

    _deactivate() {
        return Promise.resolve().then(() => {
            this._setState('deactivating');
            return this.deactivate();
        }).then(() => this._setState('deactivated'));
    }

    _prerender(params, queryParams, diffs) {
        return Promise.resolve().then(() => {
            this._setState('prerendering');
            return this.prerender(params, queryParams, diffs);
        }).then(() => this._setState('prerendered'));
    }

    _render(params, queryParams, diffs) {
        return Promise.resolve().then(() => {
            this._setState('rendering');
            return this.render(params, queryParams, diffs);
        }).then(() => this._setState('rendered'));
    }

    /**
     * A user-defined function that's called when the URL has changed and another, different route is to be rendered instead. This is a good opportunity to use CSS to hide all outlets or views in use by this route, as outlets are exclusive to a single route.
     * @return {Promise} A promise that, when resolved, means all deactivate actions (e.g. sending data to the server, data cleanup for GC, hiding outlets, views, or UI components, etc.) have finished and navigation can continue toward rendering the new route destination. If the promise is rejected, the Ether app will be in an undefined state.
     */
    deactivate() { }

    /**
     * User-defined function meant to perform any data-gathering or rendering when this route is navigated to, *before* the previously-navigated-to route is deactivated.
     * @param {?object} params All parameters parsed from the URL that are only also listed in this route's `expectedParams()` method. `null` if either no params are expected by this route or if no mount up to this point had any params to be parsed.
     * @param {?object} queryParams All querystring parameters parsed from the URL or `null` if there weren't any.
     * @param {?object} diffs By property, the calculated difference between the params/queryParams passed when the route was last rendered vs. those being passed from the current URL. `null` if there were no differences, signifying that the route was deactivated and is now being navigated to via the exact same URL as before (common when the user clicks the Back button, for example).
     * @param {object} diffs.params An object where each property is an `Array` with two values: the value of the param when this route was last rendered, and the value of the param parsed from the current URL. If there is no difference between the two, the property for that param won't be present here, as this object only shows differences between past and present params.
     * @param {object} diffs.queryParams The same as `diffs.params` but for querystring parameters parsed from the URL. If a query param was added since last render, the previous value (array index 0) will be `undefined`. If a query param was removed since last render, the new value (array index 1) will be `undefined`.
     * @return {Promise} A promise that, when resolved, means all prerender actions (e.g. AJAX data retrieval/storage, populating/showing views, etc.) have finished and further navigation operations can continue. If the promise is rejected, the Ether app will be in an undefined state.
     */
    prerender(params, queryParams, diffs) { }

    /**
     * User-defined function meant to perform any data-gathering or rendering when this route is navigated to, *after* the previously-navigated-to route is deactivated.
     * @param {?object} params All parameters parsed from the URL that are only also listed in this route's `expectedParams()` method. `null` if either no params are expected by this route or if no mount up to this point had any params to be parsed.
     * @param {?object} queryParams All querystring parameters parsed from the URL or `null` if there weren't any.
     * @param {?object} diffs By property, the calculated difference between the params/queryParams passed when the route was last rendered vs. those being passed from the current URL. `null` if there were no differences, signifying that the route was deactivated and is now being navigated to via the exact same URL as before (common when the user clicks the Back button, for example).
     * @param {object} diffs.params An object where each property is an `Array` with two values: the value of the param when this route was last rendered, and the value of the param parsed from the current URL. If there is no difference between the two, the property for that param won't be present here, as this object only shows differences between past and present params.
     * @param {object} diffs.queryParams The same as `diffs.params` but for querystring parameters parsed from the URL. If a query param was added since last render, the previous value (array index 0) will be `undefined`. If a query param was removed since last render, the new value (array index 1) will be `undefined`.
     * @return {Promise} A promise that, when resolved, means all render actions (e.g. AJAX data retrieval/storage, populating/showing views, etc.) have finished and navigation can continue on to completion. If the promise is rejected, the Ether app will be in an undefined state.
     */
    render() { }
}

export default Route;
