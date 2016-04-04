/* ============================================================================
 * Ether: mutable-outlet.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

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

        this._element = element;
    }

    get innerHTML() {
        return this._element.innerHTML;
    }

    set innerHTML(html) {
        this._element.innerHTML = html;
    }
}

export default MutableOutlet;
