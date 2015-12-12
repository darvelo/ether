import Modified from './modified';
import Expectable from './expectable';
import Addressable from './modifiers/addressable';
import OutletsReceivable from './modifiers/outlets-receivable';
import Setupable from './modifiers/setupable';

class Modifiable extends Expectable {
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
