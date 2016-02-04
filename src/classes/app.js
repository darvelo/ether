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
        this._setDeactivatedClassOnOutlets();
        this._mountMapper = new MountMapper();
        this._conditionalMountMapper = new ConditionalMountMapper();
        let mountsMetadata = this._instantiateMounts(opts.params);
        this._instantiateConditionalMounts(opts.params, mountsMetadata);
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

    _setDeactivatedClassOnOutlets() {
        Object.keys(this.outlets).forEach(name => {
            this.outlets[name]._element.classList.add('ether-deactivated');
        });
    }

    _instantiateMounts(params) {
        let mounts = this.mount();

        if (isnt(mounts, 'Object')) {
            throw new TypeError(ctorName(this) + '#mount() did not return an object.');
        }

        if (this._rootApp._debugMode) {
            let empty = true;
            for (let crumb in mounts) {
                if (mounts.hasOwnProperty(crumb)) {
                    empty = false;
                    break;
                }
            }
            if (empty) {
                console.warn(`${ctorName(this)}#mount() returned an empty object.`);
            }
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
        return this._mountMapper.add(mounts, data);
    }

    _instantiateConditionalMounts(params, mountsMetadata) {
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
            mountMapper: this._mountMapper,
            params,
            mountsMetadata,
        };

        // create conditional mount instances
        this._conditionalMountMapper.add(cMounts, data);
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

    navigate(...args) {
        return this._rootApp.navigate(...args);
    }
}

export default App;
