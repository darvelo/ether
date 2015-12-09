import Outlet from './outlet';
import ctorName from '../utils/ctor-name';

class MutableOutlet extends Outlet {
    get() {
        return this._element;
    }

    hold(element) {
        if (!(element instanceof Element)) {
            throw new TypeError(ctorName(this) + '#hold() was not passed an "Element" instance.');
        }

        this.clear();
        this._element = element;
    }

    clear() {
        if (this._element) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
    }
}

export default MutableOutlet;
