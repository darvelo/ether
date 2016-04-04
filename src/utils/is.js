/* ============================================================================
 * Ether: is.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

export function is(obj, guess) {
    if ((guess === 'Undefined' || typeof guess === 'undefined') && typeof obj === 'undefined') {
        return true;
    }

    if ((guess === 'Null' || guess === null) && obj === null) {
        return true;
    }

    return ({}).toString.call(obj).slice(8, -1) === guess;
}

export function isnt(obj, guess) {
    return !is(obj, guess);
}

export default is;
