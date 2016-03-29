import Stateful from './stateful';
import registerAddresses from '../utils/register-addresses';
import ctorName from '../utils/ctor-name';
import { is, isnt } from '../utils/is';

class Route extends Stateful {
    constructor(opts) {
        super(opts);

        if (!opts.rootApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to the Ether RootApp.');
        }
        if (!opts.parentApp) {
            throw new TypeError(ctorName(this) + ' constructor was not given a reference to its parentApp.');
        }

        this._rootApp = opts.rootApp;
        this._parentApp = opts.parentApp;
        this.addresses = opts.addresses;
        registerAddresses(this, this.addresses);
        this.outlets = opts.outlets;
        this._setState('deactivated');
        this._rootApp._inits.push(() => this.init(opts.setup));
    }

    // receives setup result if the .setup() modifier
    // was used to create this instance
    init(setup) { }

    expectedAddresses() {
        return [];
    }

    addressesHandlers() {
        return [];
    }

    expectedParams() {
        // default: don't pass any params to prerender/render on navigation
        return [];
    }

    expectedSetup(setup) {
        // user can throw if `setup` is not as expected
        return;
    }

    navigate(...args) {
        return this._rootApp.navigate(...args);
    }

    canNavigateTo(...args) {
        return this._rootApp.canNavigateTo(...args);
    }

    linkTo(...args) {
        return this._rootApp.linkTo(...args);
    }

    sendTo(...args) {
        return this._rootApp.sendTo(...args);
    }
}

export default Route;
