/* ============================================================================
 * Ether: stateful.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

import Modifiable from './modifiable';
import ctorName from '../utils/ctor-name';

const possibleStates = Object.freeze([
    'deactivating',
    'deactivated',
    'prerendering',
    'prerendered',
    'rendering',
    'rendered',
]);

class Stateful extends Modifiable {
    constructor(opts) {
        super(opts);

        Object.defineProperty(this, 'state', {
            value: {},
            configurable: false,
            enumerable: true,
        });

        Object.defineProperties(this.state, possibleStates.reduce((memo, state) => {
            // create descriptor for each property on this.state
            memo[state] = {
                value: false,
                writable: true,
                enumerable: true,
            };
            return memo;
        }, {}));
        Object.seal(this.state);
    }

    _setOutletsState(state, keepRendered) {
        if (!this.state.hasOwnProperty(state)) {
            throw new Error(`${ctorName(this)}#_setOutletsState(): Tried to set outlets state to an unsupported value: ${JSON.stringify(state)}.`);
        }
        let outlets = this.outlets;
        let classPrefix = 'ether-';
        let statesToRemove = possibleStates
            .filter(stateName => {
                if (keepRendered && stateName === 'rendered') {
                    return false;
                }
                return stateName !== state;
            })
            .map(stateName => classPrefix + stateName);
        state = classPrefix + state;
        Object.keys(outlets).forEach(name => {
            outlets[name]._element.classList.add(state);
            outlets[name]._element.classList.remove(...statesToRemove);
        });
    }

    _setState(state) {
        if (!this.state.hasOwnProperty(state)) {
            throw new Error(`${ctorName(this)}#_setState(): Tried to set state to an unsupported value: ${JSON.stringify(state)}.`);
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
        possibleStates.forEach(possibleState => {
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

    _deactivate() {
        return Promise.resolve().then(() => {
            this._setState('deactivating');
            return this.deactivate();
        }).then(() => {
            this._setState('deactivated');
        }, err => {
            this._setState('deactivated');
            if (this._rootApp._config.debugMode) {
                console.warn(`${ctorName(this)}#deactivate() triggered an error:`);
                console.warn(err);
            }
        });
    }

    _prerender(params, queryParams, diffs) {
        return Promise.resolve().then(() => {
            this._setState('prerendering');
            return this.prerender(params, queryParams, diffs);
        }).then(() => {
            this._setState('prerendered');
        }, err => {
            this._setState('prerendered');
            if (this._rootApp._config.debugMode) {
                console.warn(`${ctorName(this)}#prerender() triggered an error:`);
                console.warn(err);
            }
        });
    }

    _render(params, queryParams, diffs) {
        return Promise.resolve().then(() => {
            this._setState('rendering');
            return this.render(params, queryParams, diffs);
        }).then(() => {
            this._setState('rendered');
        }, err => {
            this._setState('rendered');
            if (this._rootApp._config.debugMode) {
                console.warn(`${ctorName(this)}#render() triggered an error:`);
                console.warn(err);
            }
        });
    }

    /**
     * A user-defined function that's called when the URL has changed and another, different mount is to be rendered instead. This is a good opportunity to use CSS to hide all outlets or views in use by this mount, as outlets are exclusive to a single mount.
     * @return {Promise} A promise that, when resolved, means all deactivate actions (e.g. sending data to the server, data cleanup for GC, hiding outlets, views, or UI components, etc.) have finished and navigation can continue toward rendering the new mount destination. If the promise is rejected, the Ether app will be in an undefined state.
     */
    deactivate() { }

    /**
     * User-defined function meant to perform any data-gathering or rendering when this mount is navigated to, *before* the previously-navigated-to mounts are deactivated.
     * @param {?object} params All parameters parsed from the URL that are only also listed in this mount's `expectedParams()` method. `null` if either no params are expected by this mount or if no mount up to this point had any params to be parsed.
     * @param {?object} queryParams All querystring parameters parsed from the URL or `null` if there weren't any.
     * @param {?object} diffs By property, the calculated difference between the params/queryParams passed when the mount was last rendered vs. those being passed from the current URL. `null` if there were no differences, signifying that the mount was deactivated and is now being navigated to via the exact same URL as before (common when the user clicks the Back button, for example).
     * @param {object} diffs.params An object where each property is an `Array` with two values: the value of the param when this mount was last rendered, and the value of the param parsed from the current URL. If there is no difference between the two, the property for that param won't be present here, as this object only shows differences between past and present params.
     * @param {object} diffs.queryParams The same as `diffs.params` but for querystring parameters parsed from the URL. If a query param was added since last render, the previous value (array index 0) will be `undefined`. If a query param was removed since last render, the new value (array index 1) will be `undefined`.
     * @return {Promise} A promise that, when resolved, means all prerender actions (e.g. AJAX data retrieval/storage, populating/showing views, etc.) have finished and further navigation operations can continue. If the promise is rejected, the Ether app will be in an undefined state.
     */
    prerender(params, queryParams, diffs) { }

    /**
     * User-defined function meant to perform any data-gathering or rendering when this mount is navigated to, *after* the previously-navigated-to mounts were deactivated.
     * @param {?object} params All parameters parsed from the URL that are only also listed in this mount's `expectedParams()` method. `null` if either no params are expected by this mount or if no mount up to this point had any params to be parsed.
     * @param {?object} queryParams All querystring parameters parsed from the URL or `null` if there weren't any.
     * @param {?object} diffs By property, the calculated difference between the params/queryParams passed when the mount was last rendered vs. those being passed from the current URL. `null` if there were no differences, signifying that the mount was deactivated and is now being navigated to via the exact same URL as before (common when the user clicks the Back button, for example).
     * @param {object} diffs.params An object where each property is an `Array` with two values: the value of the param when this mount was last rendered, and the value of the param parsed from the current URL. If there is no difference between the two, the property for that param won't be present here, as this object only shows differences between past and present params.
     * @param {object} diffs.queryParams The same as `diffs.params` but for querystring parameters parsed from the URL. If a query param was added since last render, the previous value (array index 0) will be `undefined`. If a query param was removed since last render, the new value (array index 1) will be `undefined`.
     * @return {Promise} A promise that, when resolved, means all render actions (e.g. AJAX data retrieval/storage, populating/showing views, etc.) have finished and navigation can continue on to completion. If the promise is rejected, the Ether app will be in an undefined state.
     */
    render(params, queryParams, diffs) { }
}

export default Stateful;
