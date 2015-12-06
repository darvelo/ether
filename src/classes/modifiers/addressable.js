class Addressable {
    static transform(modified, ...names) {
        modified._argsTransformFns.push(this.passAddresses.bind(null, names));
    }

    static passAddresses(names, ...args) {
        let opts = args[0];
        opts.addresses = names;
        return args;
    }
}

export default Addressable;
