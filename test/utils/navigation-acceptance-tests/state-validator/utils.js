import App from '../../../../src/classes/app';
import Route from '../../../../src/classes/route';
import Modified from '../../../../src/classes/modified';
import { isnt } from '../../../../src/utils/is';

export function getAllClassesRecursivelyForApp(appClass) {
    if (!(Object.create(appClass.prototype) instanceof App)) {
        throw new Error('getAllClassesRecursivelyForApp(): did not receive an App class.');
    }

    let classes = [appClass];
    let classCounts = {};
    let mounts = appClass.prototype.mount();
    let cMounts = appClass.prototype.mountConditionals();

    function addClass(klass) {
        if (isnt(klass, 'Function') ||
            (!(Object.create(klass.prototype) instanceof Route) &&
             !(Object.create(klass.prototype) instanceof App)))
        {
            throw new Error(`getAllClassesRecursivelyForApp(): ${klass} was not an App or Route class.`);
        }
        let count = classCounts[klass.name];
        let name = klass.name;
        if (!count) {
            classCounts[name] = 1;
        } else {
            throw new Error(`getAllClassesRecursivelyForApp(): There was more than one instance of class "${name}".`);
        }
        classes.push(klass);
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
        routes.map(unwrapModified).forEach(addClass);
    });
    // get all mount's mounts
    let appClasses = [];
    Object.keys(mounts).forEach(crumb => {
        let klass = unwrapModified(mounts[crumb]);
        if (isnt(klass, 'Function')) {
            throw new Error(`getAllClassesRecursivelyForApp(): mount at ${crumb}, "${klass}", was not a class.`);
        }
        let obj = Object.create(klass.prototype);
        if  (obj instanceof App) {
            appClasses.push(klass);
        } else {
            addClass(klass);
        }
    });
    // get Apps/Routes in App recursively
    appClasses.forEach(appClass => {
        getAllClassesRecursivelyForApp(appClass).forEach(addClass);
    });
    return classes;
}
