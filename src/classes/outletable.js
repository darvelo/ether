class Outletable {
    constructor(klass, ...names) {
        this.klass = klass;
        this.names = names;
    }

    createInstance(opts) {
        let outlets = opts.outlets;
        let names = this.names;
        let newOpts = {};

        for (let prop in opts) {
            if (opts.hasOwnProperty(prop)) {
                newOpts[prop] = opts[prop];
            }
        }

        newOpts.outlets = {};

        for (let name of names) {
            if (outlets.hasOwnProperty(name)) {
                newOpts.outlets[name] = outlets[name];
            }
        }

        return new this.klass(newOpts);
    }
}

export default Outletable;
