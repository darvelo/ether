import ModifiedRoute from './modified-route';
import Addressable from './modifiers/addressable';

class ModifiableRoute {
    static address(...args) {
        return new ModifiedRoute(this, Addressable, ...args);
    }
}

export default ModifiableRoute;
