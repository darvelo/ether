import Modifiable from './modifiable';
import MutableOutlet from './mutable-outlet';
import Outlet from './outlet';
import MountMapper from './mount-mapper';
import ConditionalMountMapper from './conditional-mount-mapper';
import registerAddresses from '../utils/register-addresses';
import ctorName from '../utils/ctor-name';
import { isnt } from '../utils/is';

const possibleAppStates = Object.freeze(['active', 'inactive']);

class App extends Modifiable {
    constructor(opts) {
        super(opts);

        if (opts.rootApp === true) {
            opts.rootApp = this;
            this._config = Object.freeze({
                stripTrailingSlash: !!opts.stripTrailingSlash || false,
                addTrailingSlash: !!opts.addTrailingSlash || false,
                basePath: opts.basePath,
                windowLoad: opts.windowLoad || false,
                history: opts.history || false,
                interceptLinks: opts.interceptLinks || 'none',
                debugMode: opts.debug === true,
            });
        }

        if (!opts.rootApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to the Ether RootApp.');
        }
        if (opts.rootApp !== this && !opts.parentApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to its parentApp.');
        }

        Object.defineProperty(this, 'state', {
            value: {},
            configurable: false,
            enumerable: true,
        });
        Object.defineProperties(this.state, possibleAppStates.reduce((memo, state) => {
            // create descriptor for each property on this.state
            memo[state] = {
                value: false,
                writable: true,
                enumerable: true,
            };
            return memo;
        }, {}));
        Object.seal(this.state);
        this._setState('inactive');

        this._rootApp = opts.rootApp;
        this._parentApp = opts.parentApp;
        registerAddresses(this, opts.addresses);
        if (this !== this._rootApp) {
            // only the creator of a MutableOutlet
            // should have control over its mutability
            this._makeOutletsImmutable(opts.outlets);
        }
        this.outlets = this.createOutlets(opts.outlets);
        this._mountMapper = new MountMapper();
        this._conditionalMountMapper = new ConditionalMountMapper();
        let mountsMetadata = this._instantiateMounts(opts.params);
        this._instantiateConditionalMounts(opts.params, mountsMetadata);
        this.init(opts.setup);
    }

    mount() {
        return {};
    }

    mountConditionals() {
        return {};
    }

    navigate(...args) {
        return this._rootApp.navigate(...args);
    }

    sendTo(...args) {
        return this._rootApp.sendTo(...args);
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

    _makeOutletsImmutable(outlets) {
        for (let prop in outlets) {
            if (outlets.hasOwnProperty(prop) && outlets[prop] instanceof MutableOutlet) {
                outlets[prop] = new Outlet(outlets[prop].get());
            }
        }
    }

    _setState(state) {
        if (!this.state.hasOwnProperty(state)) {
            throw new Error(`${ctorName(this)}#_setState(): Tried to set app state to an unsupported value: ${JSON.stringify(state)}.`);
        }
        possibleAppStates.forEach(possibleState => {
            if (state === possibleState) {
                this.state[possibleState] = true;
            } else {
                this.state[possibleState] = false;
            }
        });
    }

    _instantiateMounts(params) {
        let mounts = this.mount();

        if (isnt(mounts, 'Object')) {
            throw new TypeError(ctorName(this) + '#mount() did not return an object.');
        }

        if (this._rootApp._config.debugMode) {
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
}

export default App;
