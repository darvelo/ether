import ModifiedRoute from './modified-route';
import Addressable from './modifiers/addressable';
import OutletsReceivable from './modifiers/outlets-receivable';

class ModifiableRoute {
    static addresses(...args) {
        return new ModifiedRoute(this, Addressable, ...args);
    }

    static outlets(...args) {
        return new ModifiedRoute(this, OutletsReceivable, ...args);
    }
}

export default ModifiableRoute;
