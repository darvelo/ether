import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import Modified from '../../src/classes/modified';
import { is, isnt } from '../../src/utils/is';

function doTest(testFn, ...args) {
    return function(done) {
        testFn(done, ...args);
    };
}

export function navTest(testName, destinations, testFn, testType=null) {
    let testStarter;
    let argLen = arguments.length;
    let isTestAStub = false;

    if (argLen < 3) {
        // test only has name string, possibly with `skip` or `only`
        testType = arguments[1];
        isTestAStub = true;
    }

    if (testType) {
        testStarter = it[testType];
    } else {
        testStarter = it;
    }

    if (isTestAStub) {
        // test has no body (but is not lonely :)
        testStarter(testName);
        return;
    }

    if (!destinations.length) {
        throw new Error(`Navigation Test Generator: No destinations listed: "${testName}".`);
    }
    for (let args of destinations) {
        if (is(args, 'String')) {
            args = [args];
        }
        testStarter(testName, doTest(testFn, ...args));
    }
}

navTest.skip = function(...args) {
    navTest(...args, 'skip');
};

navTest.only = function(...args) {
    navTest(...args, 'only');
};

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

