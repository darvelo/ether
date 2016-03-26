class Setupable {
    static transform(modified, ...setupFns) {
        modified._argsTransformFns.push(args => {
            let opts = args[0];
            opts.setup = setupFns.reduce((memo, fn) => fn(memo), undefined);
            return args;
        });
        return modified;
    }
}

export default Setupable;
