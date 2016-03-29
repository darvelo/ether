import Outlet from './outlet';
import ctorName from '../utils/ctor-name';

class MutableOutlet extends Outlet {
    get el() {
        return this._element;
    }

    set el(element) {
        if (!(element instanceof Element)) {
            throw new TypeError(ctorName(this) + '.el setter was not passed an "Element" instance.');
        }

        this.clear();
        this._element = element;
    }

    clear() {
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
    }

    get innerHTML() {
        if (!this._element) {
            throw new Error(ctorName(this) + '.innerHTML was being retrieved but the outlet is not holding an element.');
        }
        return this._element.innerHTML;
    }

    set innerHTML(html) {
        if (!this._element) {
            throw new Error(ctorName(this) + '.innerHTML was being set but the outlet is not holding an element.');
        }
        this._element.innerHTML = html;
    }

}

export default MutableOutlet;
