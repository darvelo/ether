import Outlet from './outlet';

class MutableOutlet extends Outlet {
    get() {
        return this._element;
    }

    hold(element) {
        if (!(element instanceof Element)) {
            throw new TypeError(Object.getPrototypeOf(this).constructor.name + '#hold() was not passed an "Element" instance.');
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
