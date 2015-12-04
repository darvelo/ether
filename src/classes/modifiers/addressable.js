class Addressable {
    static transform(modified, ...names) {
        modified._argsTransformFns.push(this.passAddresses.bind(null, names));
    }

    static passAddresses(names, opts, ...args) {
        opts.addresses = names;
        return [opts, ...args];
    }
}

export default Addressable;
