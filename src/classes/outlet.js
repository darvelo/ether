/* ============================================================================
 * Ether: outlet.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

import is from '../utils/is';
import ctorName from '../utils/ctor-name';

class Outlet {
    constructor(element) {
        // parse HTML string and extract its root element
        if (is(element, 'String')) {
            let surrogate = document.createElement('div');
            surrogate.innerHTML = element;
            element = surrogate.children[0];
        }

        if (!(element instanceof Element)) {
            throw new TypeError(ctorName(this) + ' constructor was not passed an "Element" instance.');
        }

        this._element = element;
    }

    get innerHTML() {
        return this._element.innerHTML;
    }

    set innerHTML(html) {
        throw new Error(ctorName(this) + '.innerHTML cannot be set. Try using a MutableOutlet instead.');
    }

    appendChild(child) {
        if (!(child instanceof Element)) {
            throw new TypeError(ctorName(this) + '#appendChild() was not passed an "Element" instance.');
        }
        if (!this._element) {
            throw new Error(ctorName(this) + '#appendChild() was called but the outlet is not holding an element.');
        }
        this._element.appendChild(child);
    }

    removeChild(child) {
        if (!(child instanceof Element)) {
            throw new TypeError(ctorName(this) + '#removeChild() was not passed an "Element" instance.');
        }
        if (!this._element) {
            throw new Error(ctorName(this) + '#removeChild() was called but the outlet is not holding an element.');
        }
        this._element.removeChild(child);
    }

    querySelector(selector) {
        if (!this._element) {
            throw new Error(ctorName(this) + '#querySelector() was called but the outlet is not holding an element.');
        }
        return this._element.querySelector(selector);
    }

    querySelectorAll(selector) {
        if (!this._element) {
            throw new Error(ctorName(this) + '#querySelectorAll() was called but the outlet is not holding an element.');
        }
        return this._element.querySelectorAll(selector);
    }
}

export default Outlet;
