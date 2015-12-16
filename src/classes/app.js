import Modifiable from './modifiable';
import MutableOutlet from './mutable-outlet';
import Outlet from './outlet';
import MountMapper from './mount-mapper';
import ConditionalMountMapper from './conditional-mount-mapper';
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
            // should have control over its mutability
            this._makeOutletsImmutable(opts.outlets);
        }
        this.outlets = this.createOutlets(opts.outlets);
        this._mountMapper = new MountMapper();
        this._conditionalMountMapper = new ConditionalMountMapper();
        this._instantiateMounts(opts.params);
        this._instantiateConditionalMounts(opts.params);
        this.init(opts.setup);
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

    _instantiateMounts(params) {
        let mounts = this.mount();

        if (isnt(mounts, 'Object')) {
            throw new TypeError(ctorName(this) + '#mount() did not return an object.');
        }

        let crumbs = Object.keys(mounts);

        if (this._rootApp._debugMode && crumbs.length === 0) {
            console.warn(`${ctorName(this)}#mount() returned an empty object.`);
        }

        // data the MountMapper uses in
        // the creation of the mount instance
        let data = {
            rootApp: this._rootApp,
            parentApp: this,
            outlets: this.outlets,
            params,
        };

        // create mount instances
        for (let crumb of crumbs) {
            let mount = mounts[crumb];
            this._mountMapper.add(crumb, mount, data);
        }
    }

    _instantiateConditionalMounts(params) {
        let cMounts = this.mountConditionals();

        if (isnt(cMounts, 'Object')) {
            throw new TypeError(ctorName(this) + '#mountConditionals() did not return an object.');
        }

        // data the ConditionalMountMapper uses in
        // the creation of the conditional mount instance
        let data = {
            rootApp: this._rootApp,
            parentApp: this,
            outlets: this.outlets,
            params,
        };

        // an immutable list of addresses created locally on this App;
        // a whitelist of addresses a conditional mount can reference
        this._conditionalMountMapper.setAddresses(this._mountMapper.allAddresses());

        // create conditional mount instances
        for (let logic in cMounts) {
            if (cMounts.hasOwnProperty(logic)) {
                let mounts = cMounts[logic];
                if (!Array.isArray(mounts)) {
                    mounts = [mounts];
                }
                this._conditionalMountMapper.add(logic, mounts, data);
            }
        }
    }

    mount() {
        return {};
    }

    mountConditionals() {
        return {};
    }

    // receives setup result if the .setup() modifier
    // was used to create this instance
    init(setup) { }

    createOutlets(outlets) {
        return outlets;
    }

    expectedAddresses() {
        return [];
    }

    addressesHandlers() {
        return [];
    }

    expectedParams() {
        return [];
    }

    expectedSetup(setup) {
        // user can throw if `setup` is not as expected
        return;
    }
}

export default App;
