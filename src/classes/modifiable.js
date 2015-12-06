import Modified from './modified';
import Expectable from './expectable';
import Addressable from './modifiers/addressable';
import OutletsReceivable from './modifiers/outlets-receivable';

class Modifiable extends Expectable {
    static addresses(...args) {
        return new Modified(this, Addressable, ...args);
    }

    static outlets(...args) {
        return new Modified(this, OutletsReceivable, ...args);
    }
}

export default Modifiable;
