import Stateful from './stateful';
import registerAddresses from '../utils/register-addresses';
import ctorName from '../utils/ctor-name';
import { is, isnt } from '../utils/is';

class Route extends Stateful {
    constructor(opts) {
        super(opts);

        if (!opts.rootApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to the Ether RootApp.');
        }
        if (!opts.parentApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to its parentApp.');
        }

        this._rootApp = opts.rootApp;
        this._parentApp = opts.parentApp;
        this.addresses = opts.addresses;
        registerAddresses(this, this.addresses);
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

    navigate(...args) {
        return this._rootApp.navigate(...args);
    }

    sendTo(...args) {
        return this._rootApp.sendTo(...args);
    }
}

export default Route;
