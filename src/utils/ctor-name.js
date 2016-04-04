/* ============================================================================
 * Ether: ctor-name.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

export default function ctorName(obj) {
    return Object.getPrototypeOf(obj).constructor.name;
}
