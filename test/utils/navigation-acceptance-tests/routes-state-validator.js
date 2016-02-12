import App from '../../../src/classes/app';
import Route from '../../../src/classes/route';
import Modified from '../../../src/classes/modified';
import { is, isnt } from '../../../src/utils/is';

export function getAllRouteClassesRecursivelyForApp(appClass) {
    if (!(Object.create(appClass.prototype) instanceof App)) {
        throw new Error('getAllRoutesRecursivelyForApp(): did not receive an App class.');
    }

    let routeClasses = [];
    let routeClassCounts = {};
    let mounts = appClass.prototype.mount();
    let cMounts = appClass.prototype.mountConditionals();

    function addRouteClass(klass) {
        if (isnt(klass, 'Function') || !(Object.create(klass.prototype) instanceof Route)) {
            throw new Error(`getAllRouteClassesRecursivelyForApp(): ${klass} was not an App or Route class.`);
        }
        let count = routeClassCounts[klass.name];
        let name = klass.name;
        if (is(count, 'Undefined')) {
            routeClassCounts[name] = 1;
        } else if (count > 0) {
            throw new Error(`getAllRouteClassesRecursivelyForApp(): There was more than one instance of class "${name}".`);
        } else {
            routeClassCounts[name]++;
        }
        routeClasses.push(klass);
    }

    function unwrapModified(klass) {
        if (klass instanceof Modified) {
            klass = klass.klass;
        }
        return klass;
    }

    // get all cMounts' routes
    Object.keys(cMounts).forEach(logic => {
        let routes = cMounts[logic];
        if (!Array.isArray(routes)) {
            routes = [routes];
        }
        routes.map(unwrapModified).forEach(addRouteClass);
    });
    // get all mount's routes
    let appClasses = [];
    Object.keys(mounts).forEach(crumb => {
        let klass = unwrapModified(mounts[crumb]);
        if (isnt(klass, 'Function')) {
            throw new Error(`getAllRouteClassesRecursivelyForApp(): mount at ${crumb}, "${klass}", was not a class.`);
        }
        let obj = Object.create(klass.prototype);
        if  (obj instanceof App) {
            appClasses.push(klass);
        } else {
            addRouteClass(klass);
        }
    });
    // get routes in App mounts recursively
    appClasses.forEach(appClass => {
        getAllRouteClassesRecursivelyForApp(appClass, routeClassCounts).forEach(addRouteClass);
    });
    return routeClasses;
}

function xor(b) {
    return function(a) {
        /* jshint bitwise: false */
        return !!(a ^ b);
    };
}

export class DeactivateValidator {
    static validate(stage, state) {
        for (let key of Object.keys(state)) {
            switch (stage) {
            case 'pre':
                if (key === 'rendered') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'in':
                if (key === 'deactivating') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'post':
                if (key === 'deactivated') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            default:
                throw new Error('DeactivateValidator#validate() bad stage: ' + stage);
            }
        }
        return true;
    }

    /**
     * Check whether the existing CSS classes on the element are as expected.
     * @param {string} stage The stage of calling the render() function on the route, one of `pre`, `in`, or `post`.
     * @param {string} DOMclassName The result of getting `element.className` on a DOM element.
     * @return {bool} Whether the existing CSS classes on the element are as expected.
     */
    static validateCSSClasses(stage, DOMclassName) {
        return true;
        let classes = DOMclassName.split(/s+/).reduce((memo, name) => {
            memo[name] = true;
        }, {});
    }
}

export class PrerenderValidator {
    static validate(stage, state) {
        for (let key of Object.keys(state)) {
            switch (stage) {
            case 'pre':
                if (key === 'deactivated') {
                    // only one of `deactivated` or `rendered` can be true
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.satisfy(xor(state.rendered));
                } else if (key === 'rendered') {
                    if (state[key] === true) {
                    }
                    // only one of `deactivated` or `rendered` can be true
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.satisfy(xor(state.deactivated));
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'in':
                if (key === 'prerendering') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                // 'rendered' key may be true or false
                // all others should be false
                } else if (key === 'rendered'){
                    if (state[key] === true) {
                    }
                    expect(state[key], `expected state prop to be boolean: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.a('boolean');
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'post':
                if (key === 'prerendered') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                // 'rendered' key may be true or false
                // all others should be false
                } else if (key === 'rendered'){
                    expect(state[key], `expected state prop to be boolean: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.a('boolean');
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            default:
                throw new Error('DeactivateValidator#validate() bad stage: ' + stage);
            }
        }
        return true;
    }

    /**
     * Check whether the existing CSS classes on the element are as expected.
     * @param {string} stage The stage of calling the render() function on the route, one of `pre`, `in`, or `post`.
     * @param {string} DOMclassName The result of getting `element.className` on a DOM element.
     * @return {bool} Whether the existing CSS classes on the element are as expected.
     */
    static validateCSSClasses(stage, DOMclassName) {
        return true;
    }
}

export class RenderValidator {
    static validate(stage, state) {
        for (let key of Object.keys(state)) {
            switch (stage) {
            case 'pre':
                if (key === 'prerendered') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                // 'rendered' key may be true or false
                // all others should be false
                } else if (key === 'rendered'){
                    if (state[key] === true) {
                    }
                    expect(state[key], `expected state prop to be boolean: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.a('boolean');
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'in':
                if (key === 'rendering') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                // 'rendered' key may be true or false
                // all others should be false
                } else if (key === 'rendered'){
                    if (state[key] === true) {
                    }
                    expect(state[key], `expected state prop to be boolean: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.a('boolean');
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'post':
                if (key === 'rendered') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            default:
                throw new Error('DeactivateValidator#validate() bad stage: ' + stage);
            }
        }
        return true;
    }

    /**
     * Check whether the existing CSS classes on the element are as expected.
     * @param {string} stage The stage of calling the render() function on the route, one of `pre`, `in`, or `post`.
     * @param {string} DOMclassName The result of getting `element.className` on a DOM element.
     * @return {bool} Whether the existing CSS classes on the element are as expected.
     */
    static validateCSSClasses(stage, DOMclassName) {
        return true;
    }
}

function checkRouteState(route, stage, methodName) {
    let validator;
    switch (methodName) {
    case 'deactivate':
        validator = DeactivateValidator;
        break;
    case 'prerender':
        validator = PrerenderValidator;
        break;
    case 'render':
        validator = RenderValidator;
        break;
    default:
        throw new Error(`checkRouteState(): unsupported methodName "${methodName}".`);
    }

    let state = Object.assign({}, route.state);
    // console.log();
    // console.log(`${ctorName(route)}#${methodName} ${stage}`);
    expect(validator.validate(stage, state)).to.equal(true);

    let outlets = route.outlets;
    let outletsNames = Object.keys(outlets);
    // for all outlets, assert the only state-related
    // CSS class that exists is for the given state
    outletsNames.forEach(name => {
        let classes = outlets[name]._element.className;
        expect(validator.validateCSSClasses(stage, classes)).to.equal(true);
    });
}

function inject(route, methodName) {
    let [ privateName, publicName ]   = [`_${methodName}`,   methodName];
    let [ oldPrivateFn, oldPublicFn ] = [route[privateName], route[publicName]] ;

    route[privateName] = function(...args) {
        checkRouteState(route, 'pre', methodName);
        return oldPrivateFn.apply(route, args).then(result => {
            checkRouteState(route, 'post', methodName);
            return result;
        });
    };

    route[publicName] = function(...args) {
        checkRouteState(route, 'in', methodName);
        return oldPublicFn.apply(route, args);
    };

    return function restore() {
        // remove injected methods that are hasOwn on route
        // and allow the original prototype methods to work
        delete route[privateName];
        delete route[publicName];
    };
}

export function injectRouteStateAssertions(routeClass, ...methodNames) {
    let oldCreate = routeClass.create;

    if (!methodNames.length) {
        methodNames = ['deactivate', 'prerender', 'render'];
    }

    let restoreMethodsFns = [];
    routeClass.create = function(...args) {
        let route = oldCreate.apply(routeClass, args);
        for (let name of methodNames) {
            restoreMethodsFns.push(inject(route, name));
        }
        return route;
    };

    return function restore() {
        // restore original routeClass.prototype.create() method
        delete routeClass.create;
        // remove injected methods that are hasOwn on route
        // and allow the original prototype methods to work
        restoreMethodsFns.forEach(fn => fn());
    };
}
