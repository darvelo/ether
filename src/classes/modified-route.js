import Addressable from './modifiers/addressable';
import Outletable from './modifiers/outletable';

class ModifiedRoute {
    constructor(klass, transformer, ...args) {
        this.klass = klass;
        this._transform(transformer, ...args);
        this._argsTransformFns = [];
    }

    _createInstance(...args) {
        return new this.klass(...args);
    }

    _transform(transformer, ...args) {
        transformer.transform(this, ...args);
    }

    outlets(...args) {
        this._transform(Outletable, ...args);
        return this;
    }

    address(...args) {
        this._transform(Addressable, ...args);
        return this;
    }
}

export default ModifiedRoute;
