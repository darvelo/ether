/* ============================================================================
 * Ether: alter-trailing-slash.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

let trailingSlashRegex = /\/+$/;

export function hasTrailingSlash(str) {
    return trailingSlashRegex.test(str);
}

export function addTrailingSlash(str) {
    if (!hasTrailingSlash(str)) {
        return str + '/';
    } else {
        return str;
    }
}

export function removeTrailingSlash(str) {
    if (hasTrailingSlash(str)) {
        return str.replace(trailingSlashRegex, '');
    } else {
        return str;
    }
}
