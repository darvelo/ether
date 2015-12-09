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
        this._mounts = this._instantiateChildren();
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

    _instantiateChildren() {
        // make sure to compound and forward params in any case below
        // push params onto the stack (now just a recent-params map)
        // if we've got * routes, do those first
        // if urlpath => app
        //     call app to make it use its urlmapper and route method
        // if urlpath => route
        //     call render with params or show if params equal
        //     pushState() if this isn't page load

        let mounts = this.route();
        // @TODO: make sure "conditionally" routes are only Routes
        // let cMounts = this.routeConditionally();

        // @TODO: throw error if mounts isn't an object
        for (let path in mounts) {
            if (mounts.hasOwnProperty(path)) {
                // @TODO: throw error if any mount isn't an App or a Route instance
                let mount = mounts[path];
                let opts = {};
                opts.rootApp = this._rootApp;
                opts.outlets = {};
                mounts[path] = mount.create(opts);
            }
        }
        return mounts;
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
