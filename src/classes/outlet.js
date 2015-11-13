class Outlet {
    constructor(element) {
        if (!(element instanceof Element)) {
            throw new TypeError('Ether.Outlet constructor was not passed an "Element" instance.');
        }

        this.__name__ = 'Ether.Outlet';
        this._element = element;
    }

    append(child) {
        if (!(child instanceof Element)) {
            throw new TypeError(this.__name__ + '#append() was not passed an "Element" instance.');
        }
        if (!this._element) {
            throw new Error(this.__name__ + '#append() was called but the outlet is not holding an element.');
        }
        this._element.appendChild(child);
    }

    remove(child) {
        if (!(child instanceof Element)) {
            throw new TypeError(this.__name__ + '#remove() was not passed an "Element" instance.');
        }
        if (!this._element) {
            throw new Error(this.__name__ + '#remove() was called but the outlet is not holding an element.');
        }
        this._element.removeChild(child);
    }

    querySelector(selector) {
        if (!this._element) {
            throw new Error(this.__name__ + '#querySelector() was called but the outlet is not holding an element.');
        }
        return this._element.querySelector(selector);
    }

    querySelectorAll(selector) {
        if (!this._element) {
            throw new Error(this.__name__ + '#querySelectorAll() was called but the outlet is not holding an element.');
        }
        return this._element.querySelectorAll(selector);
    }
}

export default Outlet;
