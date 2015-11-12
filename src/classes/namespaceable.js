import Outletable from './outletable';

class Namespaceable {
    constructor(klass, namespaceName) {
        this.klass = klass;
        this.namespaceName = namespaceName;
    }

    createInstance(...args) {
        return new this.klass(...args);
    }

    outlets(...names) {
        let outletable = new Outletable(this.klass, ...names);
        this.klass = (...args) => outletable.createInstance(...args);
    }
}

export default Namespaceable;
