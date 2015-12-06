import Addressable from './modifiers/addressable';
import OutletsReceivable from './modifiers/outlets-receivable';

class Modified {
    constructor(klass, transformer, ...args) {
        this.klass = klass;
        this._argsTransformFns = [];
        this._transform(transformer, ...args);
    }

    _createInstance(...args) {
        args = this._argsTransformFns.reduce((memo, fn) => fn(...memo), args);
        return new this.klass(...args);
    }

    _transform(transformer, ...args) {
        transformer.transform(this, ...args);
    }

    addresses(...args) {
        this._transform(Addressable, ...args);
        return this;
    }

    outlets(...args) {
        this._transform(OutletsReceivable, ...args);
        return this;
    }
}

export default Modified;
