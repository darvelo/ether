class OutletsReceivable {
    static transform(modified, ...names) {
        modified.outlets = names;
        modified._argsTransformFns.push(this.filterOutlets.bind(null, modified));
    }

    static filterOutlets(modified, opts, ...args) {
        let names = modified.outlets;
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
                throw new Error([
                    'Route expected outlets ',
                        JSON.stringify(names),
                    ' but received ',
                        JSON.stringify(Object.keys(outlets).sort()),
                    '.'
                ].join(''));
            }
        }

        return [newOpts, ...args];
    }
}

export default OutletsReceivable;
