import RootApp from '../../../../src/classes/root-app';
import Modified from '../../../../src/classes/modified';
import { isnt } from '../../../../src/utils/is';

import Validator from './validator';
import { getAllClassesRecursivelyForApp } from './utils';

class StateValidator {
    constructor(rootAppClass, opts={}) {
        if (rootAppClass instanceof Modified) {
            rootAppClass = rootAppClass.klass;
        }
        if (isnt(rootAppClass, 'Function') || !(Object.create(rootAppClass.prototype) instanceof RootApp)) {
            throw new Error('StateValidator: value passed into constructor was not a RootApp class.');
        }

        this._log = opts.log === true ? true : false;

        this._validators = getAllClassesRecursivelyForApp(rootAppClass).map(klass => new Validator(klass, opts));
        this._alreadyInjected = false;
    }

    injectAssertions() {
        if (this._alreadyInjected) {
            throw new Error('StateValidator: classes have already been injected with state assertions.');
        } else {
            this._alreadyInjected = true;
        }
        this._validators.forEach(validator => validator.inject());
    }

    restoreMethods() {
        this._validators.forEach(validator => validator.restore());
    }
}

export default StateValidator;
