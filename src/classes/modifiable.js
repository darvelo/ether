import Modified from './modified';
import Expectable from './expectable';
import Addressable from './modifiers/addressable';
import OutletsReceivable from './modifiers/outlets-receivable';
import Setupable from './modifiers/setupable';
import inherits from '../utils/inherits';

class Modifiable extends Expectable {
    static create(...args) {
        return new this(...args);
    }

    static extend(protoProps, staticProps) {
        return inherits(null, this, protoProps, staticProps);
    }

    static addresses(...args) {
        return new Modified(this, Addressable, ...args);
    }

    static outlets(...args) {
        return new Modified(this, OutletsReceivable, ...args);
    }

    static setup(...args) {
        return new Modified(this, Setupable, ...args);
    }
}

export default Modifiable;
