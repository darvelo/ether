import Modifiable from './modifiable';
import registerAddresses from '../utils/register-addresses';
import ctorName from '../utils/ctor-name';
import { is, isnt } from '../utils/is';

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

        if (!opts.rootApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to the Ether RootApp.');
        }
        if (!opts.parentApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to its parentApp.');
        }

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

        this._rootApp = opts.rootApp;
        this._parentApp = opts.parentApp;
        registerAddresses(this, opts.addresses);
        this.outlets = opts.outlets;
        this._setState('deactivated');
        this._rootApp._inits.push(() => this.init(opts.setup));
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

    _pushAnyMissingLinkToParams(params, paramNames, missingParams, transformer) {
        if (isnt(paramNames, 'Array')) {
            return;
        }
        paramNames.forEach(name => {
            if (!params.hasOwnProperty(transformer(name))) {
                missingParams.push(name);
            }
        });
    }

    _constructURLCrumb(crumb, params, transformer) {
        return crumb.replace(/\{([^=]+)=[^}]+\}/g, (match, group) => {
            return encodeURIComponent(params[transformer(group)]);
        });
    }

    _joinPath(crumbs) {
        if (isnt(crumbs, 'Array')) {
            throw new TypeError(`${ctorName(this)}#_joinPath(): crumbs was not an array.`);
        }
        let path = crumbs.reduce((finalCrumbs, second) => {
            if (isnt(finalCrumbs, 'Array')) {
                finalCrumbs = [finalCrumbs];
            }
            let arrLen = finalCrumbs.length;
            let lastCrumb = finalCrumbs[arrLen-1];
            // remove connecting slashes if they exist
            // so that we can join all the crumbs in the
            // final array with a slash
            if (lastCrumb[lastCrumb.length-1] === '/') {
                finalCrumbs[arrLen-1] = lastCrumb.slice(0, -1);
            }
            if (second[0] === '/') {
                second = second.slice(1);
            }
            finalCrumbs.push(second);
            return finalCrumbs;
        });
        if (is(path, 'Array')) {
            path = path.join('/');
        }
        return path;
    }

    linkTo(address, params={}, opts={}) {
        if (isnt(address, 'String')) {
            throw new TypeError(`${ctorName(this)}#linkTo(): Address given was not a string.`);
        }
        if (isnt(params, 'Object')) {
            throw new TypeError(`${ctorName(this)}#linkTo(): Params given was not an object.`);
        }

        let destination = this._rootApp._atAddress(address);
        if (is(destination, 'Undefined')) {
            throw new Error(`${ctorName(this)}#linkTo(): Address given was never registered: "${address}".`);
        }
        if (!(destination instanceof Route)) {
            throw new Error(`${ctorName(this)}#linkTo(): Address given does not refer to a Route instance: "${address}".`);
        }

        if (!destination._parentApp._mountMapper._crumbDataFor(destination)) {
            throw new Error(`${ctorName(this)}#linkTo(): Address given does not refer to a non-conditional Route instance: "${address}". Route was: ${ctorName(destination)}.`);
        }

        let stack = [];
        let rootApp = this._rootApp;
        let rootAppReached = false;
        let mount = destination;
        let parentApp;
        // push all mount data onto the stack
        // all the way up the app chain
        while (!rootAppReached) {
            parentApp = mount._parentApp;
            if (parentApp === rootApp) {
                rootAppReached = true;
            }
            let mm = parentApp._mountMapper;
            stack.push(mm._crumbDataFor(mount));
            mount = parentApp;
        }

        let transformer;
        if (is(opts.transformer, 'Function')) {
            transformer = opts.transformer;
        } else {
            transformer = function(paramName) { return paramName; };
        }

        let crumbs = [];
        let missingParams  = [];
        while (stack.length) {
            let { crumb, paramNames } = stack.pop();
            this._pushAnyMissingLinkToParams(params, paramNames, missingParams, transformer);
            if (!missingParams.length) {
                crumbs.push(this._constructURLCrumb(crumb, params, transformer));
            }
        }

        if (missingParams.length) {
            missingParams = JSON.stringify(missingParams.sort());
            throw new Error(`${ctorName(this)}#linkTo(): Missing params for destination "${ctorName(destination)}" at address "${address}": ${missingParams}.`);
        }

        let constructedURL = this._joinPath(crumbs);
        if (!rootApp.canNavigateTo(constructedURL)) {
            throw new Error(`${ctorName(this)}#linkTo(): Navigation to "${ctorName(destination)}" at address "${address}" will fail for constructed URL: "${constructedURL}".`);
        }

        if (opts.basePath === false) {
            return this._joinPath(['/', constructedURL]);
        } else {
            return this._joinPath([rootApp._config.basePath, constructedURL]);
        }
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
    render(params, queryParams, diffs) { }
}

export default Route;
