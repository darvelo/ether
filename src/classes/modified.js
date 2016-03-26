import Addressable from './modifiers/addressable';
import OutletsReceivable from './modifiers/outlets-receivable';
import Setupable from './modifiers/setupable';

class Modified {
    constructor(klass, transformer, ...args) {
        this.klass = klass;
        this._argsTransformFns = [];
        this._transform(transformer, ...args);
    }

    _transform(transformer, ...args) {
        transformer.transform(this, ...args);
    }

    create(...args) {
        args = this._argsTransformFns.reduce((memo, fn) => fn(memo), args);
        return this.klass.create(...args);
    }

    addresses(...args) {
        this._transform(Addressable, ...args);
        return this;
    }

    outlets(...args) {
        this._transform(OutletsReceivable, ...args);
        return this;
    }

    setup(...args) {
        this._transform(Setupable, ...args);
        return this;
    }
}

export default Modified;
