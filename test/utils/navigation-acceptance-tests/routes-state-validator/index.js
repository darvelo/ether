import RootApp from '../../../../src/classes/root-app';
import { isnt } from '../../../../src/utils/is';

import RouteValidator from './route-validator';
import { getAllRouteClassesRecursivelyForApp } from './utils';

class RoutesStateValidator {
    constructor(rootAppClass, opts={}) {
        if (isnt(rootAppClass, 'Function') || !(Object.create(rootAppClass.prototype) instanceof RootApp)) {
            throw new Error('RoutesStateValidator: value passed into constructor was not a RootApp class.');
        }

        this._log = opts.log === true ? true : false;

        this._routeValidators = getAllRouteClassesRecursivelyForApp(rootAppClass).map(routeClass => new RouteValidator(routeClass, opts));
        this._alreadyInjected = false;
    }

    injectAssertions() {
        if (this._alreadyInjected) {
            throw new Error('RoutesStateValidator: routes have already been injected with state assertions.');
        } else {
            this._alreadyInjected = true;
        }
        this._routeValidators.forEach(validator => validator.inject());
    }

    restoreMethods() {
        this._routeValidators.forEach(validator => validator.restore());
    }
}

export default RoutesStateValidator;
