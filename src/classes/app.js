import Modifiable from './modifiable';

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
    }

    _registerAddresses(addresses) {
        addresses.forEach(name => this._rootApp._registerAddress(name, this));
    }

    setupOutlets() {

    }

    route(urlpath, params) {
        // make sure to compound and forward params in any case below
        // push params onto the stack (now just a recent-params map)
        // if we've got * routes, do those first
        // if urlpath => app
        //     call app to make it use its urlmapper and route method
        // if urlpath => route
        //     call render with params or show if params equal
        //     pushState() if this isn't page load
    }

    routeConditional() {

    }

    expectedAddresses() {
        return [];
    }
}

export default App;
