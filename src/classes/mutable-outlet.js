import Outlet from './outlet';

class MutableOutlet extends Outlet {
    constructor(element) {
        if (!(element instanceof Element)) {
            throw new TypeError('Ether.MutableOutlet constructor was not passed an "Element" instance.');
        }

        super(element);
        this.__name__ = 'Ether.MutableOutlet';
    }

    get() {
        return this._element;
    }

    hold(element) {
        if (!(element instanceof Element)) {
            throw new TypeError(this.__name__ + '#hold() was not passed an "Element" instance.');
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
