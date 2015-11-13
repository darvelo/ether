class Outlet {
    constructor(owner) {
        if (typeof owner !== 'object') {
            throw new TypeError('Ether.Outlet requires an object for an owner.');
        }

        this._owner = owner;
        this._element = null;
    }

    get(owner) {
        if (owner !== this._owner) {
            throw new Error('Ether.Outlet#get() was called without the right reference to its owner.');
        }

        return this._element;
    }

    hold(element, owner) {
        if (!(element instanceof Element)) {
            throw new TypeError('Ether.Outlet#hold() was called with an object that was not of type "Element".');
        }

        if (owner !== this._owner) {
            throw new Error('Ether.Outlet#hold() was called without the right reference to its owner.');
        }

        this._element = element;
    }

    clear(owner) {
        if (owner !== this._owner) {
            throw new Error('Ether.Outlet#clear() was called without the right reference to its owner.');
        }

        if (this._element) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
    }

    append(child) {
        if (!(child instanceof Element)) {
            throw new TypeError('Ether.Outlet#append() was called with an object that was not of type "Element".');
        }
        if (!this._element) {
            throw new Error('Ether.Outlet#append() was called but the outlet is not holding an element.');
        }
        this._element.appendChild(child);
    }

    remove(child) {
        if (!(child instanceof Element)) {
            throw new TypeError('Ether.Outlet#remove() was called with an object that was not of type "Element".');
        }
        if (!this._element) {
            throw new Error('Ether.Outlet#remove() was called but the outlet is not holding an element.');
        }
        this._element.removeChild(child);
    }

    querySelector(selector) {
        if (!this._element) {
            throw new Error('Ether.Outlet#querySelector() was called but the outlet is not holding an element.');
        }
        return this._element.querySelector(selector);
    }

    querySelectorAll(selector) {
        if (!this._element) {
            throw new Error('Ether.Outlet#querySelectorAll() was called but the outlet is not holding an element.');
        }
        return this._element.querySelectorAll(selector);
    }
}

export default Outlet;
