import Modifiable from './modifiable';
import Modified from './modified';
import MutableOutlet from './mutable-outlet';
import Outlet from './outlet';
import Route from './route';
import URLMapper from './url-mapper';
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
        this._urlMapper = new URLMapper();
        // maps paths from mount() to their addresses, if any.
        // used when testing whether mountConditionals() mounts
        // are referencing addresses that weren't created here,
        // and whether on routing conditional mounts need to be
        // rendered or destroyed.
        this._mountAddresses = {};
        // @TODO: make a class that combines URLMapper and NavigationStackMap
        //        so that it's easier to make queries and check for changes.
        //        different classes for handling mounts and conditionalMounts
        //        with a similar API would be nice.
        this._conditionalMapper = {};
        this._instantiateMounts(opts.params);
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

    _instantiateMountInstance(mount, key, params, isConditional) {
        let missingOutlets = [];
        let opts = {
            rootApp: this._rootApp,
            addresses: [],
            outlets: {},
            params,
        };

        this._checkMountInheritance(mount, key, isConditional);

        function assignOptOutlets(name) {
            if (!this.outlets[name]) {
                missingOutlets.push(name);
            }
            opts.outlets[name] = this.outlets[name];
        }

        if (mount instanceof Modified) {
            // the Addressable modifier,
            // if the user invoked it, sets this array
            if (!isConditional && Array.isArray(mount.addresses)) {
                this._mountAddresses[key] = mount.addresses;
            }
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

    // @TODO: split this up into two functions
    _instantiateMounts(params) {
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

        function conditionalMap(logic, params, isConditional) {
            return function(mount) {
                return this._instantiateMountInstance(mount, logic, params, isConditional);
            };
        }

        for (let path in mounts) {
            if (mounts.hasOwnProperty(path)) {
                let isConditional = false;
                let mount = mounts[path];
                let mountParams = this._urlMapper.add(path).paramNames || [];
                let conflictingParams = [];
                for (let mountParam of mountParams) {
                    if (params.indexOf(mountParam) !== -1) {
                        conflictingParams.push(mountParam);
                    }
                }
                // throw if mount's params overlap given params
                if (conflictingParams.length) {
                    throw new Error([
                        ctorName(this),
                        ' mount on "',
                        path.replace('\\', '\\\\'),
                        '" declares parameter(s) that were already declared higher in the App chain: ',
                        JSON.stringify(conflictingParams),
                        '.',
                    ].join(''));
                }
                finalMounts.normal[path] = this._instantiateMountInstance(mount, path, params.concat(mountParams), isConditional);
            }
        }
        // used to check whether conditional mounts are
        // referencing addresses that weren't created in mount()
        let localAddresses = {};
        let failedAddressLookups = {};
        let mountAddresses = this._mountAddresses;
        for (let path in mountAddresses) {
            if (mountAddresses.hasOwnProperty(path)) {
                for (let address of mountAddresses[path]) {
                    localAddresses[address] = true;
                }
            }
        }
        for (let logic in cMounts) {
            if (cMounts.hasOwnProperty(logic)) {
                let isConditional = true;
                let mount = cMounts[logic];
                this._addConditionalMap(logic, localAddresses, failedAddressLookups);
                if (!Array.isArray(mount)) {
                    mount = [mount];
                }
                finalMounts.conditional[logic] = mount.map(conditionalMap(logic, params, isConditional), this);
            }
        }
        failedAddressLookups = Object.keys(failedAddressLookups).sort();
        if (failedAddressLookups.length) {
            let ctorname = ctorName(this);
            throw new Error([
                ctorname,
                '#mountConditionals() requires addresses that are not created in ',
                ctorname,
                '#mount(): ',
                JSON.stringify(failedAddressLookups),
                '.',
            ].join(''));
        }
        this._mounts = finalMounts;
    }

    // @TODO: replace this with a URLMapper type of class
    _addConditionalMap(logic, localAddresses, failedAddressLookups) {
        if (['*', '+', '!'].indexOf(logic[0]) === -1) {
            throw new Error('invalid conditional mount key');
        }
        if (logic === '*') {
            return;
        }
        let requiredAddresses = logic.slice(1).split(',');
        for (let address of requiredAddresses) {
            if (!localAddresses[address]) {
                failedAddressLookups[address] = true;
            }
        }
        // create regex
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
