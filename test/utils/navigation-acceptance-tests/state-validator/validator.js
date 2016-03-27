import App from '../../../../src/classes/app';
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

// keeps track of classes that have had state assertions injected
// so that we throw if we try to inject these assertions again before
// restoring the original behavior
const injectedClasses = {};

class Validator {
    constructor(klass, opts={}) {
        if (isnt(klass, 'Function') ||
            (!(Object.create(klass.prototype) instanceof Route) &&
             !(Object.create(klass.prototype) instanceof App)))
        {
            throw new Error('Validator: value passed into constructor was not an App or Route class.');
        }

        this._log = opts.log === true ? true : false;

        this._klass = klass;
        this._origCreateMethod = this._klass.create;
        this._restoreMethodsFns = [];
        // the klass instance is saved here if/when
        // the wrapped klass.create() is called
        this._instance = null;
        // the last state of the klass is saved here on klass creation
        // and every time one of the klass's wrapped methods is called
        this._lastState = null;
    }

    _storeLastState(currentState) {
        let state = Object.assign({}, currentState);
        this._lastState = Object.freeze(state);
    }

    _checkState(stage, validator) {
        let lastState = this._lastState;
        let currentState = Object.assign({}, this._instance.state);

        if (this._log) {
            console.log();
            console.log(`${this._klass.name}#${validator.name.split('V')[0]} ${stage}`);
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

        expect(validator.validate(stage, lastState, currentState)).to.be.true;

        let outlets = this._instance.outlets;
        let outletsNames = Object.keys(outlets);
        // for all outlets, assert the only state-related
        // CSS classes that exist are for the given state
        if (this._log) {
            console.log(`${this._klass.name} outlets CSS classes:`);
        }
        outletsNames.forEach(name => {
            let classes = outlets[name]._element.className;
            if (this._log) {
                console.log(`    ${name}: ${classes}`);
            }
            expect(validator.validateCSSClasses(stage, lastState, currentState, classes)).to.be.true;
        });

        this._storeLastState(currentState);
    }

    _wrapMethodPreAndPost(oldMethod, validator, ...args) {
        this._checkState('pre', validator);
        return oldMethod.apply(this._instance, args).then(result => {
            this._checkState('post', validator);
            return result;
        });
    }

    _wrapMethodIn(oldMethod, validator, ...args) {
        this._checkState('in', validator);
        return oldMethod.apply(this._instance, args);
    }

    _wrapMethod(methodName, validator) {
        let [ privateName, publicName ]   = [`_${methodName}`,   methodName];
        let [ oldPrivateMethod, oldPublicMethod ] = [this._instance[privateName], this._instance[publicName]] ;

        this._instance[privateName] = this._wrapMethodPreAndPost.bind(this, oldPrivateMethod, validator);
        this._instance[publicName] = this._wrapMethodIn.bind(this, oldPublicMethod, validator);

        this._restoreMethodsFns.push(() => {
            // remove injected methods that are hasOwn on instance
            // and allow the original prototype methods to work
            delete this._instance[privateName];
            delete this._instance[publicName];
        });
    }

    inject() {
        if (injectedClasses.hasOwnProperty(this._klass.name)) {
            throw new Error(`Validator#inject(): class ${this._klass.name} has already had assertions injected.`);
        } else {
            injectedClasses[this._klass.name] = true;
        }

        this._klass.create = (...args) => {
            this._instance = this._origCreateMethod.apply(this._klass, args);
            for (let methodName of methodNames) {
                let validator = validators[methodName];
                if (!validator) {
                    throw new Error(`Validator#inject(): unsupported methodName "${methodName}".`);
                }
                this._wrapMethod(methodName, validator);
            }
            this._storeLastState(this._instance.state);
            return this._instance;
        };
    }

    restore() {
        // remove class from list of classes
        // that have had assertions injected
        delete injectedClasses[this._klass.name];
        // restore original klass.prototype.create() method
        delete this._klass.create;
        // remove injected methods that are hasOwn on instance
        // and allow the original prototype methods to work
        this._restoreMethodsFns.forEach(fn => fn());
    }
}

export default Validator;
