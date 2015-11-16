class Outlet {
    constructor(element) {
        if (!(element instanceof Element)) {
            throw new TypeError(this.constructor.name + ' constructor was not passed an "Element" instance.');
        }

        this._element = element;
    }

    append(child) {
        if (!(child instanceof Element)) {
            throw new TypeError(this.constructor.name + '#append() was not passed an "Element" instance.');
        }
        if (!this._element) {
            throw new Error(this.constructor.name + '#append() was called but the outlet is not holding an element.');
        }
        this._element.appendChild(child);
    }

    remove(child) {
        if (!(child instanceof Element)) {
            throw new TypeError(this.constructor.name + '#remove() was not passed an "Element" instance.');
        }
        if (!this._element) {
            throw new Error(this.constructor.name + '#remove() was called but the outlet is not holding an element.');
        }
        this._element.removeChild(child);
    }

    querySelector(selector) {
        if (!this._element) {
            throw new Error(this.constructor.name + '#querySelector() was called but the outlet is not holding an element.');
        }
        return this._element.querySelector(selector);
    }

    querySelectorAll(selector) {
        if (!this._element) {
            throw new Error(this.constructor.name + '#querySelectorAll() was called but the outlet is not holding an element.');
        }
        return this._element.querySelectorAll(selector);
    }
}

export default Outlet;
