class OutletsReceivable {
    static transform(modified, ...names) {
        modified._argsTransformFns.push(this.filterOutlets.bind(null, names));
    }

    static filterOutlets(names, opts, ...args) {
        let outlets = opts.outlets || {};
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
            } else {
                let quote = function(s) { return '"' + s + '"'; };
                throw new Error([
                    'Route expected outlets [',
                        names.map(quote),
                    '] but received [',
                        Object.keys(outlets).sort().map(quote),
                    '].'
                ].join(''));
            }
        }

        return [newOpts, ...args];
    }
}

export default OutletsReceivable;
