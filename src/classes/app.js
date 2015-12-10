import Modifiable from './modifiable';
import Modified from './modified';
import MutableOutlet from './mutable-outlet';
import Outlet from './outlet';
import Route from './route';
import ctorName from '../utils/ctor-name';
import { isnt } from '../utils/is';

class App extends Modifiable {
    constructor(opts) {
        super(opts);

        if (opts.rootApp === true) {
            opts.rootApp = this;
            if (opts.debug === true) {
                this._debugMode = true;
            }
        }

        if (!opts.rootApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to the Ether RootApp.');
        }

        this._rootApp = opts.rootApp;
        this._registerAddresses(opts.addresses);
        if (this !== this._rootApp) {
            // only the creator of a MutableOutlet
            // should have access to its mutability
            this._makeOutletsImmutable(opts.outlets);
        }
        this.outlets = this.createOutlets(opts.outlets);
        this._mounts = this._instantiateMounts();
    }

    _registerAddresses(addresses) {
        addresses.forEach(name => this._rootApp._registerAddress(name, this));
    }

    _makeOutletsImmutable(outlets) {
        for (let prop in outlets) {
            if (outlets.hasOwnProperty(prop) && outlets[prop] instanceof MutableOutlet) {
                outlets[prop] = new Outlet(outlets[prop].get());
            }
        }
    }

    _checkMountInheritance(mount, key, isConditional) {
        if (mount instanceof Modified) {
            mount = mount.klass;
        }
        let obj = Object.create(mount.prototype);
        if (isConditional && !(obj instanceof Route)) {
            throw new TypeError(`${ctorName(this)} conditional mount "${key}" is not an instance of Route or an array of Route instances.`);
        }
        if (!(obj instanceof App) && !(obj instanceof Route)) {
            throw new TypeError(`${ctorName(this)} mount "${key}" is not an instance of App or Route.`);
        }
    }

    _checkForMissingOutlets(mount, key, isConditional, missingOutlets) {
        let ctor = ctorName(this);
        let conditional = isConditional ? 'conditional ' : '';
        if (missingOutlets.length) {
            throw new Error(`${ctor} ${conditional}mount "${key}" requested these outlets that ${ctor} does not own: ${JSON.stringify(missingOutlets)}.`);
        }
    }

    _instantiateMountInstance(mount, key, isConditional) {
        let self = this;
        let missingOutlets = [];
        let opts = {
            rootApp: this._rootApp,
            addresses: [],
            outlets: {},
            // @TODO: pass params
            params: [],
        };

        this._checkMountInheritance(mount, key, isConditional);

        function assignOptOutlets(name) {
            if (!this.outlets[name]) {
                missingOutlets.push(name);
            }
            opts.outlets[name] = this.outlets[name];
        }

        if (mount instanceof Modified) {
            // the OutletsReceivable modifier,
            // if the user invoked it, sets this array
            if (Array.isArray(mount.outlets)) {
                mount.outlets.forEach(assignOptOutlets, this);
                this._checkForMissingOutlets(mount, key, isConditional, missingOutlets);
            }
            return mount.create(opts);
        } else {
            return new mount(opts);
        }
    }

    _instantiateMounts() {
        // @TODO: make sure to compound and forward params in any case below
        // push params onto the stack (now just a recent-params map)

        let mounts = this.mount();
        let cMounts = this.mountConditionals();
        let finalMounts = {
            normal: {},
            conditional: {},
        };

        if (isnt(mounts, 'Object')) {
            throw new TypeError(ctorName(this) + '#mount() did not return an object.');
        }
        if (isnt(cMounts, 'Object')) {
            throw new TypeError(ctorName(this) + '#mountConditionals() did not return an object.');
        }
        if (this._rootApp._debugMode && Object.keys(mounts).length === 0) {
            console.warn(`${ctorName(this)}#mount() returned an empty object.`);
        }

        function conditionalMap(logic, isConditional) {
            return function(mount) {
                return this._instantiateMountInstance(mount, logic, isConditional);
            };
        }

        for (let path in mounts) {
            if (mounts.hasOwnProperty(path)) {
                let mount = mounts[path];
                let isConditional = false;
                finalMounts.normal[path] = this._instantiateMountInstance(mount, path, isConditional);
            }
        }
        for (let logic in cMounts) {
            if (cMounts.hasOwnProperty(logic)) {
                let mount = cMounts[logic];
                let isConditional = true;
                if (!Array.isArray(mount)) {
                    mount = [mount];
                }
                finalMounts.conditional[logic] = mount.map(conditionalMap(logic, isConditional), this);
            }
        }
        return finalMounts;
    }

    mount() {
        return {};
    }

    mountConditionals() {
        return {};
    }

    createOutlets(outlets) {
        return outlets;
    }

    expectedAddresses() {
        return [];
    }

    expectedParams() {
        return [];
    }
}

export default App;
