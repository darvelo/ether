class OutletNameIterable {
    constructor(klass, ...names) {
        this.klass = klass;
        this.names = names;
    }

    createInstance(...args) {
        return new this.klass(...args);
    }
}

export default OutletNameIterable;
