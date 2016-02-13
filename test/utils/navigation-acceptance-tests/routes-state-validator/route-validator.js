import Route from '../../../../src/classes/route';
import { isnt } from '../../../../src/utils/is';

import DeactivateValidator from './deactivate-validator';
import PrerenderValidator from './prerender-validator';
import RenderValidator from './render-validator';

// method names to inject assertions into
const methodNames = ['deactivate', 'prerender', 'render'];

const validators = {
    deactivate: DeactivateValidator,
    prerender:  PrerenderValidator,
    render:     RenderValidator,
};

// keeps track of Route classes that have had state assertions injected
// so that we throw if we try to inject these assertions again before
// restoring the original Route behavior
const injectedRouteClasses = {};

class RouteValidator {
    constructor(routeClass, opts={}) {
        if (isnt(routeClass, 'Function') || !(Object.create(routeClass.prototype) instanceof Route)) {
            throw new Error('RouteValidator: value passed into constructor was not a Route class.');
        }

        this._log = opts.log === true ? true : false;

        this._routeClass = routeClass;
        this._origCreateMethod = this._routeClass.create;
        this._restoreMethodsFns = [];
        // the route instance is saved here if/when
        // the wrapped routeClass.create() is called
        this._route = null;
        // the last state of the route is saved here on route creation
        // and every time one of the route's wrapped methods is called
        this._lastState = null;
    }

    _storeLastState(currentState) {
        let state = Object.assign({}, currentState);
        this._lastState = Object.freeze(state);
    }

    _checkRouteState(stage, validator) {
        let lastState = this._lastState;
        let currentState = Object.assign({}, this._route.state);

        if (this._log) {
            console.log();
            console.log(`${this._routeClass.name}#${validator.name.split('V')[0]} ${stage}`);
            console.log(Object.keys(currentState).map(key => {
                let prefix = key + ':';
                if (prefix.length < 13) {
                    prefix = prefix + ' '.repeat(12 - key.length);
                }
                let lastVal = lastState[key];
                let currVal = currentState[key];
                // pad true value to match false length
                if (lastVal === true) {
                    lastVal = 'true ';
                }
                if (currVal === true) {
                    currVal = 'true ';
                }
                return `    ${prefix} ${lastVal} => ${currVal}`;
            }).join('\n'));
        }

        expect(validator.validate(stage, lastState, currentState)).to.equal(true);

        let outlets = this._route.outlets;
        let outletsNames = Object.keys(outlets);
        // for all outlets, assert the only state-related
        // CSS classes that exist are for the given state
        if (this._log) {
            console.log(`${this._routeClass.name} outlets CSS classes:`);
        }
        outletsNames.forEach(name => {
            let classes = outlets[name]._element.className;
            if (this._log) {
                console.log(`    ${name}: ${classes}`);
            }
            expect(validator.validateCSSClasses(stage, lastState, currentState, classes)).to.equal(true);
        });

        this._storeLastState(currentState);
    }

    _wrapMethodPreAndPost(oldMethod, validator, ...args) {
        this._checkRouteState('pre', validator);
        return oldMethod.apply(this._route, args).then(result => {
            this._checkRouteState('post', validator);
            return result;
        });
    }
    _wrapMethodIn(oldMethod, validator, ...args) {
        this._checkRouteState('in', validator);
        return oldMethod.apply(this._route, args);
    }

    _wrapMethod(methodName, validator) {
        let [ privateName, publicName ]   = [`_${methodName}`,   methodName];
        let [ oldPrivateMethod, oldPublicMethod ] = [this._route[privateName], this._route[publicName]] ;

        this._route[privateName] = this._wrapMethodPreAndPost.bind(this, oldPrivateMethod, validator);
        this._route[publicName] = this._wrapMethodIn.bind(this, oldPublicMethod, validator);

        this._restoreMethodsFns.push(() => {
            // remove injected methods that are hasOwn on route
            // and allow the original prototype methods to work
            delete this._route[privateName];
            delete this._route[publicName];
        });
    }

    inject() {
        if (injectedRouteClasses.hasOwnProperty(this._routeClass.name)) {
            throw new Error(`RouteValidator#inject(): Route class ${this._routeClass.name} has already had assertions injected.`);
        } else {
            injectedRouteClasses[this._routeClass.name] = true;
        }

        this._routeClass.create = (...args) => {
            this._route = this._origCreateMethod.apply(this._routeClass, args);
            for (let methodName of methodNames) {
                let validator = validators[methodName];
                if (!validator) {
                    throw new Error(`checkRouteState(): unsupported methodName "${methodName}".`);
                }
                this._wrapMethod(methodName, validator);
            }

            this._storeLastState(this._route.state);

            return this._route;
        };
    }

    restore() {
        // remove Route class from list of Route classes
        // that have had assertions injected
        delete injectedRouteClasses[this._routeClass.name];
        // restore original routeClass.prototype.create() method
        delete this._routeClass.create;
        // remove injected methods that are hasOwn on route
        // and allow the original prototype methods to work
        this._restoreMethodsFns.forEach(fn => fn());
    }
}

export default RouteValidator;
