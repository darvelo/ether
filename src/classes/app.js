class App {
    constructor(options) {
        if (typeof options !== 'object') {
            throw new TypeError(this.constructor.name + ' was not given an options object.');
        }

        if (options.rootApp === true) {
            options.rootApp = this;
        }

        if (!options.rootApp) {
            throw new TypeError(this.constructor.name + ' was not given a reference to the Ether RootApp.');
        }

        if (!(options.rootApp instanceof App)) {
            throw new TypeError(this.constructor.name + ' was given an options object whose rootApp property was not an App instance.');
        }

        this._rootApp = options.rootApp;
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
}

export default App;
