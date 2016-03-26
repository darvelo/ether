class Addressable {
    static transform(modified, ...names) {
        modified._argsTransformFns.push(args => {
            let opts = args[0];
            opts.addresses = names;
            return args;
        });
        return modified;
    }
}

export default Addressable;
