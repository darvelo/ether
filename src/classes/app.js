import Modifiable from './modifiable';
import Modified from './modified';
import MutableOutlet from './mutable-outlet';
import Outlet from './outlet';

class App extends Modifiable {
    constructor(opts) {
        super(opts);

        if (opts.rootApp === true) {
            opts.rootApp = this;
        }

        if (!opts.rootApp) {
            throw new TypeError(Object.getPrototypeOf(this).constructor.name + ' constructor was not given a reference to the Ether RootApp.');
        }

        this._rootApp = opts.rootApp;
        this._registerAddresses(opts.addresses);
        if (this !== this._rootApp) {
            // only the creator of a MutableOutlet
            // should have access to its mutability
            this._makeOutletsImmutable(opts.outlets);
        }
        this._outlets = this.createOutlets(opts.outlets);
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

    _instantiateMountInstance(mount) {
        let opts = {
            rootApp: this._rootApp,
            outlets: {},
            // @TODO: pass params
        };

        if (mount instanceof Modified) {
            // @TODO: make sure "conditionally" routes are only Routes

            // the OutletsReceivable modifier,
            // if the user invoked it, sets this array
            if (Array.isArray(mount.outlets)) {
                // @TODO: check if it's asking for an outlet we don't have
                mount.outlets.forEach(outletName => opts.outlets[outletName] = this._outlets[outletName]);
            }
            return mount.create(opts);
        } else {
            // @TODO: throw error if any mount isn't an App or a Route instance
            return new mount(opts);
        }
    }

    _instantiateMounts() {
        // @TODO: make sure to compound and forward params in any case below
        // push params onto the stack (now just a recent-params map)

        let mounts = this.route();
        let cMounts = this.routeConditionally();
        let finalMounts = {
            normal: {},
            conditional: {},
        };

        // @TODO: throw error if mounts isn't an object
        // @TODO: throw error if cMounts isn't an object

        for (let path in mounts) {
            if (mounts.hasOwnProperty(path)) {
                finalMounts.normal[path] = this._instantiateMountInstance(mounts[path]);
            }
        }
        for (let path in cMounts) {
            if (cMounts.hasOwnProperty(path)) {
                // @TODO: validate conditional path
                finalMounts.conditional[path] = this._instantiateMountInstance(cMounts[path]);
            }
        }
        return finalMounts;
    }

    route() {
        console.warn();
        return {};
    }

    routeConditionally() {
        return {};
    }

    createOutlets(outlets) {
        return outlets;
    }

    expectedAddresses() {
        return [];
    }
}

export default App;
