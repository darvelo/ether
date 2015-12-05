import ModifiedRoute from './modified-route';
import Expectable from './expectable';
import Addressable from './modifiers/addressable';
import OutletsReceivable from './modifiers/outlets-receivable';

class ModifiableRoute extends Expectable {
    static addresses(...args) {
        return new ModifiedRoute(this, Addressable, ...args);
    }

    static outlets(...args) {
        return new ModifiedRoute(this, OutletsReceivable, ...args);
    }
}

export default ModifiableRoute;
